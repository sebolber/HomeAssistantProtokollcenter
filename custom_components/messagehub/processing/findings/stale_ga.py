"""Detector `STALE_GA` (Iter 25 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.3.
Erkennt: GA war frueher aktiv, ist seit X Tagen tot. Im Gegensatz zu
ORPHAN_GA hatte sie schon mal Telegramme gesehen.

Severity: info (siehe §9.3 — Beobachtungs-Hinweis, kein Bug).
Evidence: `{last_seen, days_silent}`.
"""

from __future__ import annotations

from datetime import datetime
from typing import Final

from . import Finding, FindingSeverity

STALE_GA_DEFAULT_THRESHOLD_DAYS: Final[int] = 30
"""Default-Schwelle: GA, die seit >= 30 Tagen nichts gesendet hat,
gilt als "stale". Begruendung: Tages-/Wochen-Pausen passieren oft
(Gartenbeleuchtung im Winter, Wetterstation bei Defekt) — 30 Tage
ist eine pragmatische Grenze, ab der man bewusst hinschaut."""

_STALE_GA_SEVERITY: Final[FindingSeverity] = "info"
_STALE_GA_VERSION: Final[str] = "STALE_GA/v1"


def detect_stale_ga(
    *,
    ga: str,
    last_seen: datetime | None,
    now: datetime,
    threshold_days: int = STALE_GA_DEFAULT_THRESHOLD_DAYS,
) -> Finding | None:
    """Liefert Finding, wenn `last_seen` vor mehr als `threshold_days`."""
    if last_seen is None:
        return None
    delta = now - last_seen
    days_silent = int(delta.total_seconds() / 86400)
    if days_silent < threshold_days:
        return None
    return Finding(
        code="STALE_GA",
        schema_version=1,
        severity=_STALE_GA_SEVERITY,
        ga=ga,
        source=None,
        title="",
        description="",
        evidence={
            "last_seen": last_seen.isoformat(),
            "days_silent": days_silent,
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_STALE_GA_VERSION,
    )


__all__ = [
    "STALE_GA_DEFAULT_THRESHOLD_DAYS",
    "detect_stale_ga",
]
