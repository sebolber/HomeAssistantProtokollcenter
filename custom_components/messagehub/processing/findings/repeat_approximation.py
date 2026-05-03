"""Detector `REPEAT_APPROXIMATION` (Iter 22 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F4.
Approximiert das Repeat-Bit, das wir ohne xknx-Layer-2-Zugriff nicht
sehen koennen: identisches Telegramm mit Δt < 100 ms auf gleicher GA
ist mit hoher Wahrscheinlichkeit eine Wiederholung. Zaehlt sie pro
Tag und liefert ein Finding, wenn die Anzahl ueber dem Schwellwert
liegt.

Severity: warning (siehe §9.3 — Approximation, nicht Wahrheit, deshalb
mild). Evidence: `{repeats_per_day, total_repeats, period_days}`.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from itertools import pairwise
from typing import Final

from ..knx_stats import TelegramSample
from . import Finding, FindingSeverity

REPEAT_APPROXIMATION_WINDOW_MS: Final[int] = 100
"""Maximaler Δt zwischen zwei identischen Telegrammen, um sie als
Wiederholung zu zaehlen. KNX-Spec erlaubt ~50 ms Repeat-Frame; 100 ms
gibt uns Toleranz fuer Bus-Last-Schwankungen ohne Eingriff von xknx."""

REPEAT_APPROXIMATION_MIN_PER_DAY: Final[float] = 5.0
"""Mindestanzahl approximierter Wiederholungen pro Tag fuer einen Finding.

Decision: einzelne Spuriose passieren auch in gesunden Anlagen
(z. B. durch Reflexion auf langen Linien). Erst >=5/Tag werden
verdaechtig."""

_REPEAT_APPROXIMATION_SEVERITY: Final[FindingSeverity] = "warning"
_REPEAT_APPROXIMATION_VERSION: Final[str] = "REPEAT_APPROXIMATION/v1"

_WINDOW_SECONDS: Final[float] = REPEAT_APPROXIMATION_WINDOW_MS / 1000.0


def detect_repeat_approximation(
    *,
    ga: str,
    samples: Sequence[TelegramSample],
    period_days: float,
    now: datetime,
) -> Finding | None:
    """Liefert ein Finding, wenn ueber `period_days` zu viele
    approximierte Wiederholungen vorkamen.

    `period_days` ist der Erfassungszeitraum, ueber den die `samples`
    spannen — wir normalisieren auf "pro Tag", damit der Schwellwert
    von der Sampling-Periode unabhaengig ist.
    """
    if period_days <= 0.0:
        return None
    writes = sorted(
        (s for s in samples if s.telegramtype != "GroupValueRead"),
        key=lambda s: s.ts,
    )
    repeats = _count_repeats(writes)
    repeats_per_day = repeats / period_days
    if repeats_per_day < REPEAT_APPROXIMATION_MIN_PER_DAY:
        return None
    return Finding(
        code="REPEAT_APPROXIMATION",
        schema_version=1,
        severity=_REPEAT_APPROXIMATION_SEVERITY,
        ga=ga,
        source=None,
        title="",
        description="",
        evidence={
            "repeats_per_day": round(repeats_per_day, 1),
            "total_repeats": repeats,
            "period_days": period_days,
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_REPEAT_APPROXIMATION_VERSION,
    )


def _count_repeats(writes: Sequence[TelegramSample]) -> int:
    """Zaehlt aufeinanderfolgende Paare mit identischem Wert + Δt < Window."""
    count = 0
    for prev, curr in pairwise(writes):
        dt = (curr.ts - prev.ts).total_seconds()
        if dt > _WINDOW_SECONDS:
            continue
        if repr(prev.value) == repr(curr.value):
            count += 1
    return count


__all__ = [
    "REPEAT_APPROXIMATION_MIN_PER_DAY",
    "REPEAT_APPROXIMATION_WINDOW_MS",
    "detect_repeat_approximation",
]
