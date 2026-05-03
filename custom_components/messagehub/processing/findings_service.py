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


__all__ = [
    "DEFAULT_LIMIT",
    "HARD_CAP_LIMIT",
    "ack_finding_response",
    "list_findings_response",
    "unack_finding_response",
]
