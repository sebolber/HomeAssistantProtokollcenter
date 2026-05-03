"""Repository fuer `knx_findings` (Iter 2 / knx-findings).

Append-only-Log mit Dedup-Schluessel `(code, ga, evidence_hash,
schema_version)`. Wiederholte Detector-Laeufe mit identischer Evidence
aktualisieren `last_seen` + `occurrence_count`; identischer Code mit
veraenderter Evidence (z. B. Confidence steigt) erzeugt einen neuen
Row, weil der Hash auseinanderlaeuft.

Vertrag: `Finding` aus `processing/findings.py`. title/description sind
in der DB nicht persistiert (UI rendert via translations/).
"""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

from ..const import DEFAULT_KNX_ACK_EXPIRY_DAYS
from ..processing.findings import (
    FINDING_SEVERITIES,
    Finding,
    FindingSeverity,
)

if TYPE_CHECKING:
    from .database import Database


def _canonical_evidence_json(evidence: dict[str, Any]) -> str:
    """Stabile Repraesentation der Evidence fuer den Dedup-Hash.

    `sort_keys=True` macht das Hashing reihenfolgen-unabhaengig. Werte
    werden via `default=str` serialisiert, damit datetime-Felder im
    Evidence-Dict nicht zur Laufzeit explodieren.
    """
    return json.dumps(evidence, sort_keys=True, default=str, separators=(",", ":"))


def _evidence_hash(evidence: dict[str, Any]) -> str:
    """SHA-256 ueber die kanonische Evidence-Repraesentation."""
    payload = _canonical_evidence_json(evidence).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


class FindingsRepository:
    """Persistiert `Finding`-Instanzen, dedupliziert per `evidence_hash`."""

    def __init__(self, database: Database) -> None:
        self._db = database

    async def record(self, finding: Finding) -> None:
        """Schreibt einen Finding oder erhoeht `occurrence_count` bei Dedup-Treffer.

        Verlauf:
        1. Hash der Evidence berechnen.
        2. INSERT versuchen — UNIQUE-Constraint kollidiert bei Dedup.
        3. Bei Konflikt: UPDATE last_seen + occurrence_count (Append-only-
           Semantik bleibt: kein DELETE, keine Verlust von first_seen).
        """
        h = _evidence_hash(finding.evidence)
        evidence_json = _canonical_evidence_json(finding.evidence)
        now = datetime.now().isoformat(timespec="seconds")
        await self._db.execute(
            """
            INSERT INTO knx_findings (
                code, schema_version, severity, ga, source,
                evidence_json, evidence_hash,
                first_seen, last_seen, occurrence_count,
                detector_version, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (code, COALESCE(ga, ''), evidence_hash, schema_version)
            DO UPDATE SET
                last_seen = excluded.last_seen,
                occurrence_count = knx_findings.occurrence_count + 1,
                severity = excluded.severity,
                source = excluded.source,
                detector_version = excluded.detector_version,
                updated_at = excluded.updated_at
            """,
            (
                finding.code,
                finding.schema_version,
                finding.severity,
                finding.ga,
                finding.source,
                evidence_json,
                h,
                finding.first_seen.isoformat(),
                finding.last_seen.isoformat(),
                finding.occurrence_count,
                finding.detector_version,
                now,
                now,
            ),
        )

    async def list_findings(
        self,
        *,
        code: str | None = None,
        ga: str | None = None,
        severity: FindingSeverity | None = None,
        source: str | None = None,
        limit: int = 200,
    ) -> list[Finding]:
        """Liefert Findings, sortiert nach last_seen DESC.

        Filter sind alle optional und kombinieren AND-verknuepft.
        """
        if severity is not None and severity not in FINDING_SEVERITIES:
            raise ValueError(
                f"Invalid severity {severity!r}; expected one of {FINDING_SEVERITIES}"
            )
        sql, params = _build_list_query(code=code, ga=ga, severity=severity, source=source)
        sql += " ORDER BY last_seen DESC, id DESC LIMIT ?"
        params = (*params, limit)
        rows = await self._db.fetch_all(sql, params)
        return [_row_to_finding(dict(r)) for r in rows]

    # ------------------------------------------------------------------
    # Iter 3: Acknowledgements (siehe §9.4)
    # ------------------------------------------------------------------

    async def acknowledge(
        self,
        *,
        ga: str,
        code: str,
        actor: str,
        note: str | None = None,
        expires_at: datetime | None = None,
        sticky: bool = False,
    ) -> None:
        """Markiert ein Finding pro `(ga, code)` als bekannt/akzeptiert.

        Default: laeuft nach `DEFAULT_KNX_ACK_EXPIRY_DAYS` Tagen ab.
        Mit `sticky=True` permanent (expires_at IS NULL); mit explizitem
        `expires_at` benutzerdefiniert.

        Schreibt einen `audit_log`-Eintrag mit `action='ack-finding'`.
        """
        ack_at = datetime.now(UTC).isoformat(timespec="seconds")
        expires = _resolve_expires_at(expires_at, sticky=sticky)
        await self._db.execute(
            """
            INSERT INTO knx_finding_acknowledgements
                (ga, finding_code, acknowledged_at, expires_at, note, schema_version)
            VALUES (?, ?, ?, ?, ?, 1)
            ON CONFLICT (ga, finding_code) DO UPDATE SET
                acknowledged_at = excluded.acknowledged_at,
                expires_at = excluded.expires_at,
                note = excluded.note
            """,
            (ga, code, ack_at, expires, note),
        )
        await self._write_ack_audit(
            actor=actor,
            action="ack-finding",
            ga=ga,
            code=code,
            note=note,
            expires_at=expires,
            sticky=sticky,
        )

    async def unacknowledge(self, *, ga: str, code: str, actor: str) -> None:
        """Entfernt einen Ack und schreibt einen Audit-Log-Eintrag.

        Idempotent: das DELETE ist auch bei nicht existierendem Row OK.
        Audit-Eintrag wird trotzdem geschrieben — er dokumentiert den
        Versuch, was bei UI-Doppelklicks und Race-Conditions hilfreich ist.
        """
        await self._db.execute(
            "DELETE FROM knx_finding_acknowledgements "
            "WHERE ga = ? AND finding_code = ?",
            (ga, code),
        )
        await self._write_ack_audit(
            actor=actor,
            action="unack-finding",
            ga=ga,
            code=code,
            note=None,
            expires_at=None,
            sticky=False,
        )

    async def is_acknowledged(
        self,
        *,
        ga: str,
        code: str,
        now: datetime | None = None,
    ) -> bool:
        """True, wenn ein gueltiger (nicht abgelaufener) Ack existiert.

        Sticky-Acks (expires_at IS NULL) sind immer aktiv.
        """
        ts = (now or datetime.now(UTC)).isoformat(timespec="seconds")
        row = await self._db.fetch_one(
            "SELECT expires_at FROM knx_finding_acknowledgements "
            "WHERE ga = ? AND finding_code = ? "
            "AND (expires_at IS NULL OR expires_at > ?)",
            (ga, code, ts),
        )
        return row is not None

    async def list_acknowledgements(self) -> list[dict[str, Any]]:
        """UI-Sicht: alle Acks, sortiert nach acknowledged_at DESC."""
        rows = await self._db.fetch_all(
            "SELECT ga, finding_code, acknowledged_at, expires_at, note, "
            "schema_version "
            "FROM knx_finding_acknowledgements "
            "ORDER BY acknowledged_at DESC"
        )
        return [
            {
                "ga": str(r["ga"]),
                "finding_code": str(r["finding_code"]),
                "acknowledged_at": str(r["acknowledged_at"]),
                "expires_at": r["expires_at"],
                "note": r["note"],
                "schema_version": int(r["schema_version"]),
            }
            for r in rows
        ]

    async def _write_ack_audit(
        self,
        *,
        actor: str,
        action: str,
        ga: str,
        code: str,
        note: str | None,
        expires_at: str | None,
        sticky: bool,
    ) -> None:
        """Schreibt einen Audit-Log-Eintrag fuer eine Ack/Unack-Operation."""
        details = {
            "ga": ga,
            "code": code,
            "note": note,
            "expires_at": expires_at,
            "sticky": sticky,
        }
        await self._db.execute(
            "INSERT INTO audit_log "
            "(timestamp, actor, action, target_type, target_id, details) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                datetime.now(UTC).isoformat(timespec="seconds"),
                actor,
                action,
                "knx_finding_ack",
                f"{ga}:{code}",
                json.dumps(details),
            ),
        )


def _resolve_expires_at(
    explicit: datetime | None,
    *,
    sticky: bool,
) -> str | None:
    """Bestimmt den expires_at-Wert nach Auswahl (sticky | explicit | default).

    Reihenfolge: sticky -> NULL; explicit -> dessen ISO-String; sonst
    `now() + DEFAULT_KNX_ACK_EXPIRY_DAYS`.
    """
    if sticky:
        return None
    if explicit is not None:
        return explicit.isoformat(timespec="seconds")
    default_expires = datetime.now(UTC) + timedelta(days=DEFAULT_KNX_ACK_EXPIRY_DAYS)
    return default_expires.isoformat(timespec="seconds")


def _build_list_query(
    *,
    code: str | None,
    ga: str | None,
    severity: FindingSeverity | None,
    source: str | None,
) -> tuple[str, tuple[Any, ...]]:
    """Baut die WHERE-Klausel modular zusammen.

    Helfer, weil die Bedingungen optional kombinierbar sind und sonst
    die `list_findings`-Methode kognitive Komplexitaet > 15 ueberschreitet.
    """
    where: list[str] = []
    params: list[Any] = []
    if code is not None:
        where.append("code = ?")
        params.append(code)
    if ga is not None:
        where.append("ga = ?")
        params.append(ga)
    if severity is not None:
        where.append("severity = ?")
        params.append(severity)
    if source is not None:
        where.append("source = ?")
        params.append(source)
    sql = (
        "SELECT id, code, schema_version, severity, ga, source, "
        "       evidence_json, first_seen, last_seen, occurrence_count, "
        "       detector_version "
        "FROM knx_findings"
    )
    if where:
        sql += " WHERE " + " AND ".join(where)
    return sql, tuple(params)


def _row_to_finding(row: dict[str, Any]) -> Finding:
    """Mappt eine DB-Row zur Finding-Dataclass.

    title/description bleiben leer — UI fuellt sie aus translations/.
    """
    evidence: dict[str, Any] = json.loads(row["evidence_json"]) if row["evidence_json"] else {}
    return Finding(
        code=str(row["code"]),
        schema_version=int(row["schema_version"]),
        severity=row["severity"],
        ga=row["ga"],
        source=row["source"],
        title="",
        description="",
        evidence=evidence,
        first_seen=datetime.fromisoformat(row["first_seen"]),
        last_seen=datetime.fromisoformat(row["last_seen"]),
        occurrence_count=int(row["occurrence_count"]),
        detector_version=str(row["detector_version"]),
    )


__all__ = ["FindingsRepository"]
