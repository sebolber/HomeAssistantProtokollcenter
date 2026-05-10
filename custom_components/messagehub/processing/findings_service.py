"""Service-Layer fuer den Findings-API-Endpoint (Iter 6+).

Trennt die Aufruf-Logik vom aiohttp-View — der View ruft hier nur
`list_findings_response` auf. Damit ist der Endpoint-Vertrag in
einem HA-frei testbaren Modul gebuendelt.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from ..const import KNX_FINDING_DEFAULT_SEVERITIES
from .findings import FINDING_SEVERITIES, Finding, FindingSeverity
from .findings_markdown import format_findings_markdown

# Default- und Hard-Cap-Limits fuer die Pagination. UI darf ein
# kleineres Limit setzen; Hard-Cap schuetzt vor versehentlichen
# `?limit=99999`-Aufrufen.
DEFAULT_LIMIT: int = 50
HARD_CAP_LIMIT: int = 500


async def list_findings_response(
    repo: Any,
    *,
    code: str | None = None,
    ga: str | None = None,
    severity: FindingSeverity | None = None,
    source: str | None = None,
    limit: int = DEFAULT_LIMIT,
    offset: int = 0,
) -> dict[str, Any]:
    """Ruft `list_findings` + `count_findings` auf und baut die Response.

    Validiert:
    - severity gegen FINDING_SEVERITIES
    - limit/offset >= 0, limit <= HARD_CAP_LIMIT

    F-004: Pro Item wird ein `acknowledged: bool`-Feld eingefuegt, damit
    die UI einen Unack-Button rendern kann. Implementation als O(1)-
    Lookup ueber ein Set aller `(ga, code)`-Acks — vermeidet N+1-Queries.

    Liefert ein dict mit:
        items: list[dict] — serialisierte Findings (inkl. `acknowledged`)
        total: int        — Gesamtzahl unter dem Filter
        limit: int        — angewandtes Limit (ggf. geclamped)
        offset: int       — angewandtes Offset
    """
    if severity is not None and severity not in FINDING_SEVERITIES:
        raise ValueError(f"Invalid severity {severity!r}; expected one of {FINDING_SEVERITIES}")
    capped_limit = max(1, min(limit, HARD_CAP_LIMIT))
    safe_offset = max(0, offset)
    items: list[Finding] = await repo.list_findings(
        code=code,
        ga=ga,
        severity=severity,
        source=source,
        limit=capped_limit,
        offset=safe_offset,
    )
    total: int = await repo.count_findings(
        code=code,
        ga=ga,
        severity=severity,
        source=source,
    )
    # F-004: Single-Query Ack-Lookup. Set-Membership ist O(1) pro Item.
    acked_pairs: set[tuple[str, str]] = await _fetch_acked_pairs(repo)
    # Iter B4: Severity wird zur Laufzeit aus ``resolve_severity``
    # gezogen — User-Overrides + Default-Wechsel greifen damit AUCH
    # auf alten DB-Rows. Wir cachen pro Code, damit ein Code-Repeat
    # nicht jedes Mal die DB belastet.
    severity_cache: dict[str, str] = {}
    serialized: list[dict[str, Any]] = []
    for item in items:
        item_dict = item.to_dict()
        item_dict["severity"] = await _resolve_item_severity(repo, item, severity_cache)
        # Bus-weite Findings (ga=None) haben keine eindeutige (ga,code)-
        # Identitaet im Ack-Schema; wir melden sie konsistent als nicht-acked.
        item_dict["acknowledged"] = bool(
            item.ga is not None and (item.ga, item.code) in acked_pairs
        )
        serialized.append(item_dict)
    return {
        "items": serialized,
        "total": total,
        "limit": capped_limit,
        "offset": safe_offset,
    }


async def _resolve_item_severity(repo: Any, item: Finding, cache: dict[str, str]) -> str:
    """Iter B4: Severity zur Laufzeit aus ``resolve_severity`` ziehen.

    Pro Code wird die Aufloesung gecacht (User-Override + Default).
    Defensiv: bei einem unbekannten Code (sollte nicht vorkommen, aber
    Bestand-DBs koennten Code-Reste haben) faellt die Aufloesung auf
    den Wert aus der Row zurueck.
    """
    if item.code in cache:
        return cache[item.code]
    sev: FindingSeverity
    try:
        sev = await repo.resolve_severity(item.code)
    except (KeyError, AttributeError):
        sev = item.severity
    cache[item.code] = sev
    return sev


async def _fetch_acked_pairs(repo: Any) -> set[tuple[str, str]]:
    """Liefert Set aller aktuell gueltigen (ga, code)-Acks.

    F-004: Defensiv gegen aeltere Repos, die `list_acknowledgements`
    noch nicht haben — wir geben in dem Fall ein leeres Set zurueck,
    sodass der Endpoint nicht hart abbricht (acknowledged=False fuer
    alle Items, keine Regression).
    """
    if not hasattr(repo, "list_acknowledgements"):
        return set()
    rows = await repo.list_acknowledgements()
    return {(str(r["ga"]), str(r["finding_code"])) for r in rows}


_GA_PATTERN = re.compile(r"^\d+/\d+/\d+$")


def _validate_ga(ga: str) -> None:
    """Akzeptiert nur das KNX-3-Ebenen-Format `M/L/G`."""
    if not ga or not _GA_PATTERN.match(ga):
        raise ValueError(f"Invalid ga {ga!r}; expected format M/L/G")


def _validate_code(code: str) -> None:
    """Code muss in `KNX_FINDING_DEFAULT_SEVERITIES` registriert sein.

    Schuetzt vor Tippfehlern und vor Acks fuer "leere" Codes.
    """
    if code not in KNX_FINDING_DEFAULT_SEVERITIES:
        raise ValueError(
            f"Unknown finding code {code!r}; "
            f"expected one of {sorted(KNX_FINDING_DEFAULT_SEVERITIES)}"
        )


async def ack_finding_response(
    repo: Any,
    *,
    ga: str,
    code: str,
    actor: str,
    note: str | None = None,
    sticky: bool = False,
    expires_at: datetime | None = None,
) -> dict[str, Any]:
    """Setzt einen Ack via Repo + liefert eine API-Response.

    Validiert GA-Format + Code-Bekanntheit, ruft `repo.acknowledge` auf
    (das schreibt den Audit-Log-Eintrag) und liefert eine schlanke
    Bestaetigung.
    """
    _validate_ga(ga)
    _validate_code(code)
    await repo.acknowledge(
        ga=ga,
        code=code,
        actor=actor,
        note=note,
        sticky=sticky,
        expires_at=expires_at,
    )
    return {
        "acknowledged": True,
        "ga": ga,
        "code": code,
        "sticky": sticky,
    }


async def unack_finding_response(
    repo: Any,
    *,
    ga: str,
    code: str,
    actor: str,
) -> dict[str, Any]:
    """Entfernt einen Ack via Repo + liefert eine API-Response.

    Idempotent: kein Fehler, wenn der Ack nicht existiert (siehe
    `FindingsRepository.unacknowledge`).
    """
    _validate_ga(ga)
    _validate_code(code)
    await repo.unacknowledge(ga=ga, code=code, actor=actor)
    return {
        "acknowledged": False,
        "ga": ga,
        "code": code,
    }


async def list_severity_overrides_response(repo: Any) -> dict[str, Any]:
    """Liefert eine Tabelle Code | Default | Override fuer die UI.

    Enthaelt jeden bekannten Code aus `KNX_FINDING_DEFAULT_SEVERITIES`,
    angereichert mit dem Override (oder None) und der ggf. vorhandenen
    Note + Update-Zeit. Damit kann die UI eine vollstaendige Liste
    rendern, ohne separat den Default-Lookup zu kennen.
    """
    rows = await repo.list_severity_overrides()
    by_code: dict[str, dict[str, Any]] = {row["finding_code"]: row for row in rows}
    items: list[dict[str, Any]] = []
    for code in sorted(KNX_FINDING_DEFAULT_SEVERITIES):
        override_row = by_code.get(code)
        items.append(
            {
                "code": code,
                "default_severity": KNX_FINDING_DEFAULT_SEVERITIES[code],
                "override_severity": (override_row["severity"] if override_row else None),
                "note": override_row["note"] if override_row else None,
                "updated_at": (override_row["updated_at"] if override_row else None),
            }
        )
    return {"items": items, "total": len(items)}


async def set_severity_override_response(
    repo: Any,
    *,
    code: str,
    severity: FindingSeverity,
    actor: str,
    note: str | None = None,
) -> dict[str, Any]:
    """Setzt einen Override + liefert eine API-Response."""
    _validate_code(code)
    if severity not in FINDING_SEVERITIES:
        raise ValueError(f"Invalid severity {severity!r}; expected one of {FINDING_SEVERITIES}")
    await repo.set_severity_override(
        code=code,
        severity=severity,
        actor=actor,
        note=note,
    )
    return {"code": code, "severity": severity, "note": note}


async def clear_severity_override_response(
    repo: Any,
    *,
    code: str,
    actor: str,
) -> dict[str, Any]:
    """Loescht den Override fuer einen Code (idempotent)."""
    _validate_code(code)
    await repo.clear_severity_override(code=code, actor=actor)
    return {"code": code, "cleared": True}


async def findings_markdown_response(repo: Any) -> str:
    """Liefert eine Markdown-Tabelle aller aktuellen Findings (Iter 29).

    Default-Limit 200 spiegelt die UI; das ist genug fuer eine ETS-
    Notiz-Vorlage und schuetzt vor versehentlich grossen Exports.
    """
    findings: list[Finding] = await repo.list_findings(limit=200)
    return format_findings_markdown(findings)


async def aggregate_finding_total(repo: Any) -> dict[tuple[str, str], int]:
    """SQL-Aggregation `(code, severity) -> count` aus `knx_findings`.

    Iter 29c: Wird vom MetricsView konsumiert und an
    `format_prometheus_metrics(finding_total=...)` weitergereicht — vorher
    wurde der Param in der Produktiv-Code nie gefuettert (siehe Wiring-
    Audit, Iter 28 partial wired).
    """
    rows = await repo._db.fetch_all(
        "SELECT code, severity, COUNT(*) AS c FROM knx_findings GROUP BY code, severity"
    )
    return {(str(r["code"]), str(r["severity"])): int(r["c"]) for r in rows}


# Iter 29a: Refresh-Endpoint fuer per-GA-Detector-Runner (on-demand).
DEFAULT_REFRESH_PERIOD_DAYS: int = 7
MIN_REFRESH_PERIOD_DAYS: int = 1
MAX_REFRESH_PERIOD_DAYS: int = 30


async def refresh_findings_response(
    repo: Any,
    *,
    ga: str,
    period_days: int = DEFAULT_REFRESH_PERIOD_DAYS,
    address_repo: Any,
    stats_repo: Any,
    now: datetime,
) -> dict[str, Any]:
    """Triggert `run_per_ga_detectors` fuer eine GA und liefert die Anzahl.

    Validiert GA-Format + Period; ruft den Runner auf, der die elf
    GA-bezogenen Detektoren ausfuehrt und Findings ueber `record(...)`
    persistiert. UI ruft das ueber den 'Aktualisieren'-Button auf.

    Lazy-Import: `findings_runner` zieht die Detektor-Module nach;
    wenn der Service ohne Runner gebraucht wird (Tests), bleibt das
    leichtgewichtig.
    """
    from .findings_runner import run_per_ga_detectors  # noqa: PLC0415

    _validate_ga(ga)
    days = max(MIN_REFRESH_PERIOD_DAYS, min(int(period_days), MAX_REFRESH_PERIOD_DAYS))
    from datetime import timedelta as _td  # noqa: PLC0415

    period_to_dt = now
    period_from_dt = now - _td(days=days)
    count = await run_per_ga_detectors(
        ga=ga,
        findings_repo=repo,
        address_repo=address_repo,
        stats_repo=stats_repo,
        period_from=period_from_dt.isoformat(timespec="seconds"),
        period_to=period_to_dt.isoformat(timespec="seconds"),
        now=now,
    )
    return {
        "ga": ga,
        "period_days": days,
        "findings_recorded": count,
    }


__all__ = [
    "DEFAULT_LIMIT",
    "DEFAULT_REFRESH_PERIOD_DAYS",
    "HARD_CAP_LIMIT",
    "MAX_REFRESH_PERIOD_DAYS",
    "MIN_REFRESH_PERIOD_DAYS",
    "ack_finding_response",
    "aggregate_finding_total",
    "clear_severity_override_response",
    "findings_markdown_response",
    "list_findings_response",
    "list_severity_overrides_response",
    "refresh_findings_response",
    "set_severity_override_response",
    "unack_finding_response",
]
