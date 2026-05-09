"""Detector `ORPHAN_GA` (Iter 24 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.3.
Erkennt Whitelist-Eintraege, die im Auswertezeitraum kein einziges
Telegramm gesehen haben — "im Projekt, aber stumm".

Severity: info (siehe §9.3 — Aufraeum-Hinweis, kein Bug).
Evidence: `{period_from, period_to}`.
"""

from __future__ import annotations

from datetime import datetime
from typing import Final

from . import Finding, FindingSeverity

_ORPHAN_GA_SEVERITY: Final[FindingSeverity] = "info"
_ORPHAN_GA_VERSION: Final[str] = "ORPHAN_GA/v1"


def detect_orphan_ga(
    *,
    ga: str,
    telegram_count: int,
    period_from: str,
    period_to: str,
    now: datetime,
) -> Finding | None:
    """Liefert Finding, wenn `telegram_count` exakt 0 ist.

    Negative Counts (z. B. fehlerhafte Repo-Aggregate) werden defensiv
    als "unklar" behandelt und liefern KEIN Finding — wir wollen keine
    Faelle durch Datenfehler stillschweigend nach `info` schieben.
    """
    if telegram_count != 0:
        return None
    return Finding(
        code="ORPHAN_GA",
        schema_version=1,
        severity=_ORPHAN_GA_SEVERITY,
        ga=ga,
        source=None,
        evidence={
            "period_from": period_from,
            "period_to": period_to,
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_ORPHAN_GA_VERSION,
    )


__all__ = ["detect_orphan_ga"]
