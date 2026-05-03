"""KNX-Gruppenadress-Repository (Iter 48 — UI-Variante mit Logging-Whitelist).

Verwaltung erfolgt komplett ueber das Panel-UI, optional mit ETS-CSV-Bulk-Import.
Pro GA wird konfiguriert, ob sie ueberhaupt geloggt werden soll und mit welcher
Severity (inkl. Boolean-True/False-Mapping fuer Stoer-/Ok-Bits).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from ..storage import Severity

if TYPE_CHECKING:
    from ..storage import Database


_GA_PATTERN = re.compile(r"^\d{1,2}/\d{1,2}/\d{1,3}$")
# v0.10 (W4): Severity-Werte aus dem zentralen Enum holen, statt hier
# parallele Tabellen zu pflegen.
_VALID_SEVERITIES = Severity.values()
_VALID_LOG_SEVERITIES = _VALID_SEVERITIES | frozenset({"auto"})

# Iter 56: Sentinel fuer "Feld unveraendert lassen" in bulk_patch.
# None bedeutet "auf SQL-NULL setzen" (gueltiger Severity-Wert), hier
# brauchen wir ein drittes Signal: "Feld nicht aendern".
_SENTINEL_KEEP: object = object()


@dataclass(slots=True)
class KnxAddress:
    address: str
    label: str
    dpt: str | None = None
    description: str | None = None
    log_enabled: bool = False
    log_severity: str = "info"
    severity_on_true: str | None = None
    severity_on_false: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Einheitliche JSON-Serialisierung fuer API-Antworten.

        Eine Quelle der Wahrheit verhindert Drift zwischen GET/POST-Handlern
        (vgl. Bugfix 1a4349b: GET hatte log_enabled-Felder weggelassen, was
        den UI-Filter 'nur aktive' brach).
        """
        return {
            "address": self.address,
            "label": self.label,
            "dpt": self.dpt,
            "description": self.description,
            "log_enabled": bool(self.log_enabled),
            "log_severity": self.log_severity,
            "severity_on_true": self.severity_on_true,
            "severity_on_false": self.severity_on_false,
        }


def validate_address(value: str) -> str:
    if not _GA_PATTERN.fullmatch(value):
        raise ValueError(f"invalid KNX group address {value!r}: must match N/N/N (1-2/1-2/1-3)")
    return value


def _validate_severity(value: str | None, allow_auto: bool = False) -> str | None:
    if value is None:
        return None
    valid = _VALID_LOG_SEVERITIES if allow_auto else _VALID_SEVERITIES
    if value not in valid:
        raise ValueError(f"invalid severity {value!r}; expected one of {sorted(valid)}")
    return value


class KnxAddressRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def upsert(self, item: KnxAddress) -> None:
        validate_address(item.address)
        if not item.label.strip():
            raise ValueError("label must not be empty")
        _validate_severity(item.log_severity, allow_auto=True)
        _validate_severity(item.severity_on_true)
        _validate_severity(item.severity_on_false)
        now = datetime.now(UTC).isoformat(timespec="seconds")
        await self._db.execute(
            "INSERT INTO knx_group_addresses "
            "(address, label, dpt, description, created_at, updated_at, "
            " log_enabled, log_severity, severity_on_true, severity_on_false) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(address) DO UPDATE SET "
            "label = excluded.label, "
            "dpt = excluded.dpt, "
            "description = excluded.description, "
            "log_enabled = excluded.log_enabled, "
            "log_severity = excluded.log_severity, "
            "severity_on_true = excluded.severity_on_true, "
            "severity_on_false = excluded.severity_on_false, "
            "updated_at = excluded.updated_at",
            (
                item.address,
                item.label.strip(),
                item.dpt,
                item.description,
                now,
                now,
                1 if item.log_enabled else 0,
                item.log_severity,
                item.severity_on_true,
                item.severity_on_false,
            ),
        )

    # ------------------------------------------------------------------
    # Iter 11 (knx-findings): DPT-Inferenz-Persistenz (siehe §9.2)
    # ------------------------------------------------------------------

    async def set_dpt_inferred(
        self,
        *,
        address: str,
        dpt_inferred: str,
        confidence: float,
        at: str,
    ) -> None:
        """Persistiert das Ist-Ergebnis des Auto-Erkenners.

        Legt einen Row mit Default-Label an, wenn die GA noch nicht in
        der Whitelist ist — der Auto-Erkenner sieht GAs aus
        `knx_raw_telegrams`, die nicht zwingend in `knx_group_addresses`
        gepflegt sind.
        """
        validate_address(address)
        if not 0.0 <= confidence <= 1.0:
            raise ValueError(
                f"confidence must be in [0.0, 1.0], got {confidence!r}"
            )
        now = datetime.now(UTC).isoformat(timespec="seconds")
        await self._db.execute(
            "INSERT INTO knx_group_addresses "
            "(address, label, created_at, updated_at, "
            " dpt_inferred, dpt_inferred_confidence, dpt_inferred_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(address) DO UPDATE SET "
            "dpt_inferred = excluded.dpt_inferred, "
            "dpt_inferred_confidence = excluded.dpt_inferred_confidence, "
            "dpt_inferred_at = excluded.dpt_inferred_at, "
            "updated_at = excluded.updated_at",
            (address, address, now, now, dpt_inferred, confidence, at),
        )

    async def get_dpt_inferred(
        self, address: str
    ) -> tuple[str, float, str] | None:
        """Liefert (dpt_inferred, confidence, at) oder None."""
        row = await self._db.fetch_one(
            "SELECT dpt_inferred, dpt_inferred_confidence, dpt_inferred_at "
            "FROM knx_group_addresses WHERE address = ?",
            (address,),
        )
        if row is None or row["dpt_inferred"] is None:
            return None
        return (
            str(row["dpt_inferred"]),
            float(row["dpt_inferred_confidence"]),
            str(row["dpt_inferred_at"]),
        )

    async def delete(self, address: str) -> bool:
        cursor = await self._db.connection.execute(
            "DELETE FROM knx_group_addresses WHERE address = ?", (address,)
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount > 0
        await cursor.close()
        return bool(deleted)

    async def list_all(self) -> list[KnxAddress]:
        rows = await self._db.fetch_all("SELECT * FROM knx_group_addresses ORDER BY address")
        return [_row_to_address(row) for row in rows]

    async def get(self, address: str) -> KnxAddress | None:
        row = await self._db.fetch_one(
            "SELECT * FROM knx_group_addresses WHERE address = ?", (address,)
        )
        return _row_to_address(row) if row is not None else None

    async def lookup(self, address: str) -> str | None:
        """Beim Webhook-Anreichern: nur Label."""
        row = await self._db.fetch_one(
            "SELECT label FROM knx_group_addresses WHERE address = ?", (address,)
        )
        return str(row["label"]) if row is not None else None

    async def list_logged(self) -> dict[str, KnxAddress]:
        """Iter 48 KNX-Bus: alle GAs mit log_enabled=1 als dict address -> KnxAddress."""
        rows = await self._db.fetch_all("SELECT * FROM knx_group_addresses WHERE log_enabled = 1")
        return {str(row["address"]): _row_to_address(row) for row in rows}

    async def bulk_import_csv(self, csv_content: str) -> dict[str, int]:
        """Importiert ETS-CSV (label-only, log_enabled bleibt 0)."""
        from .knx import load_ets_csv  # noqa: PLC0415

        mapping = load_ets_csv(csv_content)
        imported = 0
        skipped = 0
        errors = 0
        for address, label in mapping.items():
            try:
                await self.upsert(KnxAddress(address=address, label=label))
                imported += 1
            except ValueError:
                errors += 1
            except RuntimeError:
                skipped += 1
        return {"imported": imported, "skipped": skipped, "errors": errors}

    # --- Bulk-Edit (Iter 56) ------------------------------------------------

    async def bulk_patch(
        self,
        addresses: list[str],
        *,
        log_enabled: bool | None = None,
        log_severity: str | None = None,
        severity_on_true: str | None | object = _SENTINEL_KEEP,
        severity_on_false: str | None | object = _SENTINEL_KEEP,
    ) -> int:
        """Wendet ein Patch auf eine Liste von GAs an.

        Nur Felder, die nicht None sind, werden aktualisiert. severity_on_true
        und severity_on_false haben einen separaten Sentinel _SENTINEL_KEEP,
        damit der Caller unterscheiden kann zwischen "auf NULL setzen" und
        "unangetastet lassen".

        Liefert die Anzahl tatsaechlich aktualisierter Zeilen.
        """
        if not addresses:
            return 0
        # Validate all addresses up front, sonst koennten Teil-Updates
        # zurueckbleiben. Severity-Validierung ebenfalls vorab.
        for addr in addresses:
            validate_address(addr)
        if log_severity is not None:
            _validate_severity(log_severity, allow_auto=True)
        if severity_on_true is not _SENTINEL_KEEP:
            _validate_severity(severity_on_true)  # type: ignore[arg-type]
        if severity_on_false is not _SENTINEL_KEEP:
            _validate_severity(severity_on_false)  # type: ignore[arg-type]

        sets: list[str] = []
        params: list[Any] = []
        if log_enabled is not None:
            sets.append("log_enabled = ?")
            params.append(1 if log_enabled else 0)
        if log_severity is not None:
            sets.append("log_severity = ?")
            params.append(log_severity)
        if severity_on_true is not _SENTINEL_KEEP:
            sets.append("severity_on_true = ?")
            params.append(severity_on_true)
        if severity_on_false is not _SENTINEL_KEEP:
            sets.append("severity_on_false = ?")
            params.append(severity_on_false)
        if not sets:
            # Nichts zu patchen — kein Datenbank-Hit.
            return 0
        now = datetime.now(UTC).isoformat(timespec="seconds")
        sets.append("updated_at = ?")
        params.append(now)
        placeholders = ",".join("?" * len(addresses))
        sql = f"UPDATE knx_group_addresses SET {', '.join(sets)} WHERE address IN ({placeholders})"
        cursor = await self._db.connection.execute(sql, [*params, *addresses])
        await self._db.connection.commit()
        updated = int(cursor.rowcount or 0)
        await cursor.close()
        return updated

    # --- ETS-Sync (Iter 46, N4) ---------------------------------------------

    async def apply_etssync_plan(self, plan: dict[str, Any]) -> dict[str, int]:
        """Wendet einen vorher berechneten Sync-Plan an.

        Verhalten pro Bucket:
        - add: INSERT mit Defaults (log_enabled=False, severity=warning).
        - update: ETS-Felder (label, dpt) setzen UND User-Config zuruecksetzen
          — die Semantik der GA hat sich geaendert, alte Severities gelten
          nicht mehr.
        - delete: Zeile entfernen.
        - keep: nichts tun, User-Config bleibt unveraendert.

        Liefert {added, updated, deleted}-Counts fuer Audit-Log und Toast.
        """
        now = datetime.now(UTC).isoformat(timespec="seconds")
        counts = {"added": 0, "updated": 0, "deleted": 0}

        for item in plan.get("add", []):
            await self.upsert(
                KnxAddress(
                    address=str(item["address"]),
                    label=str(item.get("label") or item["address"]),
                    dpt=item.get("dpt"),
                    log_enabled=False,
                    log_severity="warning",
                )
            )
            counts["added"] += 1

        for item in plan.get("update", []):
            address = validate_address(str(item["address"]))
            label = str(item.get("label") or address).strip()
            if not label:
                raise ValueError(f"label must not be empty for {address}")
            await self._db.execute(
                "UPDATE knx_group_addresses SET "
                "label = ?, dpt = ?, "
                "log_enabled = 0, log_severity = 'warning', "
                "severity_on_true = NULL, severity_on_false = NULL, "
                "updated_at = ? "
                "WHERE address = ?",
                (label, item.get("dpt"), now, address),
            )
            counts["updated"] += 1

        for item in plan.get("delete", []):
            address = validate_address(str(item["address"]))
            cursor = await self._db.connection.execute(
                "DELETE FROM knx_group_addresses WHERE address = ?", (address,)
            )
            if cursor.rowcount:
                counts["deleted"] += 1
            await cursor.close()

        await self._db.connection.commit()
        return counts


def compute_etssync_plan(
    *,
    db_addresses: list[dict[str, Any]],
    ets_items: list[dict[str, Any]],
) -> dict[str, list[Any]]:
    """Reine Diff-Funktion: vergleicht DB-Stand mit neuer ETS-Liste.

    Liefert vier Buckets:
    - add: ETS-Eintrag, der in der DB fehlt → wird angelegt.
    - update: Adresse vorhanden, aber label oder dpt unterschiedlich →
      wird aktualisiert UND die User-Config zurueckgesetzt.
    - delete: DB-Eintrag, der nicht mehr in der ETS-Liste steht → wird
      geloescht (inkl. dem Lausch-Flag).
    - keep: identischer Eintrag (label + dpt unveraendert) → bleibt
      vollstaendig erhalten, User-Config inklusive.

    Pure: Keine IO-Calls; testbar mit beliebigen Eingangs-Listen.
    """
    db_by_addr = {str(a["address"]): a for a in db_addresses}
    ets_by_addr = {str(e["address"]): e for e in ets_items}

    add: list[dict[str, Any]] = []
    update: list[dict[str, Any]] = []
    delete: list[dict[str, Any]] = []
    keep: list[str] = []

    for addr, ets in ets_by_addr.items():
        ets_label = str(ets.get("name") or "")
        ets_dpt = ets.get("dpt") or None
        db = db_by_addr.get(addr)
        if db is None:
            add.append({"address": addr, "label": ets_label, "dpt": ets_dpt})
            continue
        db_label = str(db.get("label") or "")
        db_dpt = db.get("dpt") or None
        if db_label == ets_label and (db_dpt or "") == (ets_dpt or ""):
            keep.append(addr)
        else:
            update.append(
                {
                    "address": addr,
                    "label": ets_label,
                    "dpt": ets_dpt,
                    "old_label": db_label,
                    "old_dpt": db_dpt,
                }
            )

    for addr, db in db_by_addr.items():
        if addr not in ets_by_addr:
            delete.append({"address": addr, "label": str(db.get("label") or "")})

    return {"add": add, "update": update, "delete": delete, "keep": keep}


def _row_to_address(row: Any) -> KnxAddress:
    return KnxAddress(
        address=str(row["address"]),
        label=str(row["label"]),
        dpt=row["dpt"],
        description=row["description"],
        log_enabled=bool(row["log_enabled"]),
        log_severity=str(row["log_severity"] or "info"),
        severity_on_true=row["severity_on_true"],
        severity_on_false=row["severity_on_false"],
    )


def resolve_severity(cfg: KnxAddress, value: Any) -> str:
    """Iter 48: bestimmt die Severity fuer einen KNX-Telegrammwert basierend auf der GA-Konfig.

    - log_severity == 'auto' und value ist Boolean-artig: True -> severity_on_true,
      False -> severity_on_false (Default 'info' falls nicht gesetzt)
    - sonst: log_severity (Default 'info')
    """
    if cfg.log_severity == "auto":
        if value is True or (isinstance(value, str) and value.lower() in {"true", "on", "1"}):
            return cfg.severity_on_true or "warning"
        if value is False or (isinstance(value, str) and value.lower() in {"false", "off", "0"}):
            return cfg.severity_on_false or "info"
        if isinstance(value, int | float):
            return cfg.severity_on_true or "warning" if value else (cfg.severity_on_false or "info")
        return "info"
    return cfg.log_severity if cfg.log_severity in _VALID_SEVERITIES else "info"


def build_text(cfg: KnxAddress, value: Any, telegramtype: str | None = None) -> str:
    """Erzeugt den Nachrichtentext: Label + Wert (+ optional Telegramtyp)."""
    label = cfg.label
    val_str = "" if value is None else f" = {value}"
    if telegramtype and telegramtype != "GroupValueWrite":
        return f"{label} ({telegramtype}){val_str}"
    return f"{label}{val_str}"
