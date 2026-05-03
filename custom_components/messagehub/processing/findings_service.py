"""Service-Layer fuer den Findings-API-Endpoint (Iter 6+).

Trennt die Aufruf-Logik vom aiohttp-View — der View ruft hier nur
`list_findings_response` auf. Damit ist der Endpoint-Vertrag in
einem HA-frei testbaren Modul gebuendelt.
"""

from __future__ import annotations

from typing import Any

from .findings import FINDING_SEVERITIES, Finding, FindingSeverity

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

    Liefert ein dict mit:
        items: list[dict] — serialisierte Findings
        total: int        — Gesamtzahl unter dem Filter
        limit: int        — angewandtes Limit (ggf. geclamped)
        offset: int       — angewandtes Offset
    """
    if severity is not None and severity not in FINDING_SEVERITIES:
        raise ValueError(
            f"Invalid severity {severity!r}; expected one of {FINDING_SEVERITIES}"
        )
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
    return {
        "items": [item.to_dict() for item in items],
        "total": total,
        "limit": capped_limit,
        "offset": safe_offset,
    }


__all__ = ["DEFAULT_LIMIT", "HARD_CAP_LIMIT", "list_findings_response"]
