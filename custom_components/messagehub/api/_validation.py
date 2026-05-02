"""Pure-Python-Validatoren fuer API-Query-Parameter.

Bewusst HA-frei (nur aiohttp), damit Unit-Tests ohne HA-Stack laufen
koennen. Wird von api/_helpers.py re-exportiert.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from typing import Any, Final

from aiohttp import web

# Maximaler Auswertezeitraum fuer Stats-Endpoints (DoS-Schutz).
MAX_PERIOD_DAYS: Final[int] = 90

_KNX_GA_RE: Final = re.compile(r"^\d{1,2}/\d{1,2}/\d{1,3}$")
_KNX_INDIVIDUAL_RE: Final = re.compile(r"^\d{1,2}\.\d{1,2}\.\d{1,3}$")


def parse_iso_period(params: Any, *, default_days: int = 7) -> tuple[str, str]:
    """Parst `from`/`to` aus Query-Params.

    Beide leer → letzte default_days Tage bis jetzt.
    Nur `to` → from = to - default_days.
    Nur `from` → to = jetzt.
    Beide gesetzt → uebernehmen.

    Wirft web.HTTPBadRequest bei
    - ungueltigem ISO-Format,
    - to <= from,
    - Periode > MAX_PERIOD_DAYS.
    """
    raw_from = params.get("from")
    raw_to = params.get("to")
    now = datetime.now(UTC)

    to_dt = _parse_iso_or_default(raw_to, default=now, field="to")
    from_dt = _parse_iso_or_default(
        raw_from,
        default=to_dt - timedelta(days=default_days),
        field="from",
    )

    if to_dt <= from_dt:
        raise web.HTTPBadRequest(reason="`to` must be greater than `from`")

    if (to_dt - from_dt) > timedelta(days=MAX_PERIOD_DAYS):
        raise web.HTTPBadRequest(reason=f"period exceeds maximum {MAX_PERIOD_DAYS} days")

    return (
        from_dt.isoformat(timespec="seconds"),
        to_dt.isoformat(timespec="seconds"),
    )


def _parse_iso_or_default(raw: str | None, *, default: datetime, field: str) -> datetime:
    if not raw:
        return default
    try:
        return datetime.fromisoformat(raw)
    except ValueError as err:
        raise web.HTTPBadRequest(reason=f"invalid `{field}` timestamp: {err}") from err


def validate_knx_ga(ga: str) -> str:
    """Validiert das GA-Format `N/N/N`. Wirft HTTPBadRequest bei Verstoss."""
    if not isinstance(ga, str) or not _KNX_GA_RE.match(ga):
        raise web.HTTPBadRequest(reason="invalid KNX group address format")
    return ga


def validate_knx_individual_address(addr: str) -> str:
    """Validiert das Individualadress-Format `B.L.G` (z. B. 1.1.220).

    Wirft HTTPBadRequest bei Verstoss. Wird fuer Bulk-Endpoints
    verwendet, die nach Source-Adresse aggregieren.
    """
    if not isinstance(addr, str) or not _KNX_INDIVIDUAL_RE.match(addr):
        raise web.HTTPBadRequest(reason="invalid KNX individual address format (expected B.L.G)")
    return addr


def validate_note(note: object, *, max_length: int = 1000) -> str | None:
    """Iter 19 Security-Fix: validiert User-Notiz-Felder.

    - Nicht-Strings werden zu None.
    - Zu lange Strings werfen HTTPBadRequest.
    """
    if not isinstance(note, str):
        return None
    if len(note) > max_length:
        raise web.HTTPBadRequest(reason=f"note exceeds {max_length} chars")
    return note
