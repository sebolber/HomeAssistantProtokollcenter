"""Detector `RECONNECT_STORM` (Iter 20 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F13.
Erkennt: nach einer Stille >= 60 s feuert eine `knx_source` einen Burst
(>= 10x normaler 30-s-Schnitt). Typisch fuer Reconnect-Floods nach
Bus-Spannungsausfall.

Severity: warning (siehe §9.3 — Symptom, kein Bug; kann normal sein
nach Spannungsausfall). Evidence:
`{silence_until, burst_count, normal_avg, factor}`.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime, timedelta
from itertools import pairwise
from typing import Final

from ..knx_stats import TelegramSample
from . import Finding, FindingSeverity

RECONNECT_STORM_SILENCE_SEC: Final[float] = 60.0
"""Mindestlaenge der Stille vor dem Burst (siehe §3.1 F13)."""

RECONNECT_STORM_BURST_WINDOW_SEC: Final[float] = 30.0
"""Fenster nach Ende der Stille, in dem der Burst gemessen wird."""

RECONNECT_STORM_BURST_FACTOR: Final[float] = 10.0
"""Faktor ueber dem `normal_avg_per_30s`, ab dem der Burst auffaellig wird."""

_RECONNECT_STORM_SEVERITY: Final[FindingSeverity] = "warning"
_RECONNECT_STORM_VERSION: Final[str] = "RECONNECT_STORM/v1"
_MIN_SAMPLES: Final[int] = 2


def detect_reconnect_storm(
    *,
    source: str,
    samples: Sequence[TelegramSample],
    now: datetime,
    normal_avg_per_30s: float,
) -> Finding | None:
    """Liefert Finding, wenn auf eine Stille ein Burst folgt.

    Bedingungen:
    - Mindestens zwei Telegramme von `source`.
    - Es existiert ein Gap (>=`RECONNECT_STORM_SILENCE_SEC`) zwischen
      zwei aufeinanderfolgenden Telegrammen.
    - Im Fenster von `RECONNECT_STORM_BURST_WINDOW_SEC` ab dem Ende
      der Stille kommen >= `RECONNECT_STORM_BURST_FACTOR * normal_avg_per_30s`
      Telegramme.
    - `normal_avg_per_30s` > 0 (sonst keine Baseline).
    """
    if normal_avg_per_30s <= 0.0:
        return None
    sorted_samples = sorted(
        (s for s in samples if s.source == source),
        key=lambda s: s.ts,
    )
    if len(sorted_samples) < _MIN_SAMPLES:
        return None
    gap_end = _find_silence_end(sorted_samples)
    if gap_end is None:
        return None
    burst_count = _count_in_window(
        sorted_samples,
        start=gap_end,
        window=timedelta(seconds=RECONNECT_STORM_BURST_WINDOW_SEC),
    )
    threshold = RECONNECT_STORM_BURST_FACTOR * normal_avg_per_30s
    if burst_count < threshold:
        return None
    return Finding(
        code="RECONNECT_STORM",
        schema_version=1,
        severity=_RECONNECT_STORM_SEVERITY,
        ga=None,  # Source-bezogenes Finding, nicht GA-bezogen
        source=source,
        title="",
        description="",
        evidence={
            "silence_until": gap_end.isoformat(),
            "burst_count": burst_count,
            "normal_avg": normal_avg_per_30s,
            "factor": round(burst_count / normal_avg_per_30s, 2),
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_RECONNECT_STORM_VERSION,
    )


def _find_silence_end(samples: Sequence[TelegramSample]) -> datetime | None:
    """Liefert den Zeitpunkt, an dem die laengste Stille endet.

    "Stille" = Luecke >= RECONNECT_STORM_SILENCE_SEC zwischen zwei
    aufeinanderfolgenden Telegrammen. Gibt es mehrere, waehlen wir die
    letzte (wahrscheinlichster Reconnect-Kandidat in einem laufenden
    Detektor).
    """
    silence_threshold = timedelta(seconds=RECONNECT_STORM_SILENCE_SEC)
    last_gap_end: datetime | None = None
    for prev, curr in pairwise(samples):
        gap = curr.ts - prev.ts
        if gap >= silence_threshold:
            last_gap_end = curr.ts
    return last_gap_end


def _count_in_window(
    samples: Sequence[TelegramSample],
    *,
    start: datetime,
    window: timedelta,
) -> int:
    """Zaehlt Telegramme in [start, start+window]."""
    end = start + window
    return sum(1 for s in samples if start <= s.ts <= end)


__all__ = [
    "RECONNECT_STORM_BURST_FACTOR",
    "RECONNECT_STORM_BURST_WINDOW_SEC",
    "RECONNECT_STORM_SILENCE_SEC",
    "detect_reconnect_storm",
]
