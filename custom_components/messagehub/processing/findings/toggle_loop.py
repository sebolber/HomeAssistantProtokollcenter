"""Detector `TOGGLE_LOOP` (Iter 17 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F6.
Erkennt: DPT 1.001 alterniert zwischen 0/1 in einer Frequenz mit
Δt < 2 s ueber mindestens 4 Zyklen — typisches Symptom fuer Schalt-
Schleifen, in denen GA sendend und hoerend gleichzeitig genutzt wird.

Severity: error (Schleifen sind nahezu nie gewollt; sie kosten
Bus-Zeit). Evidence: `{period_ms, cycles}`.
"""

from __future__ import annotations

import statistics
from collections.abc import Sequence
from datetime import datetime
from itertools import pairwise
from typing import Final

from ..knx_stats import TelegramSample
from . import Finding, FindingSeverity

TOGGLE_LOOP_MIN_CYCLES: Final[int] = 4
"""Mindestanzahl Zyklen (= 8 Werte) fuer einen Finding."""

TOGGLE_LOOP_MAX_PERIOD_SEC: Final[float] = 2.0
"""Maximaler Δt zwischen aufeinanderfolgenden Werten."""

_TOGGLE_LOOP_DPT: Final[str] = "1.001"
_TOGGLE_LOOP_SEVERITY: Final[FindingSeverity] = "error"
_TOGGLE_LOOP_VERSION: Final[str] = "TOGGLE_LOOP/v1"


def detect_toggle_loop(
    *,
    ga: str,
    dpt: str | None,
    samples: Sequence[TelegramSample],
    now: datetime,
) -> Finding | None:
    """Liefert ein Finding, wenn Werte alternieren in der Frequenz."""
    if dpt != _TOGGLE_LOOP_DPT:
        return None
    writes = sorted(
        (s for s in samples if s.telegramtype != "GroupValueRead"),
        key=lambda s: s.ts,
    )
    # Mindestens (cycles + 1) Werte fuer N Transitionen, plus 1 Sicherheit.
    if len(writes) <= TOGGLE_LOOP_MIN_CYCLES:
        return None
    cycles = _count_alternating_cycles(writes)
    if cycles < TOGGLE_LOOP_MIN_CYCLES:
        return None
    period_ms = _median_period_ms(writes)
    return Finding(
        code="TOGGLE_LOOP",
        schema_version=1,
        severity=_TOGGLE_LOOP_SEVERITY,
        ga=ga,
        source=None,
        evidence={"period_ms": period_ms, "cycles": cycles},
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_TOGGLE_LOOP_VERSION,
    )


def _count_alternating_cycles(writes: Sequence[TelegramSample]) -> int:
    """Zaehlt 0->1- und 1->0-Wertwechsel mit Δt < TOGGLE_LOOP_MAX_PERIOD_SEC.

    Ein "Zyklus" ist hier eine einzelne Transition (Wertwechsel) — die
    Foren-Konvention zaehlt Wertwechsel, nicht Hin-und-Her-Paare.
    Wir brechen ab, sobald eine Transition den Δt-Schwellwert
    ueberschreitet, weil eine Schleife ihre Frequenz typischerweise
    haelt.
    """
    transitions = 0
    last_value = _to_bool(writes[0].value)
    for prev, curr in pairwise(writes):
        dt = (curr.ts - prev.ts).total_seconds()
        if dt > TOGGLE_LOOP_MAX_PERIOD_SEC:
            break
        curr_value = _to_bool(curr.value)
        if curr_value is None or last_value is None:
            break
        if curr_value != last_value:
            transitions += 1
            last_value = curr_value
    return transitions


def _median_period_ms(writes: Sequence[TelegramSample]) -> int:
    """Median(Δt) zweier Transitionen = Periode eines Zyklus.

    Periode in ms gerundet. Wir nutzen den Median, weil Einzel-Spitzen
    (z. B. eine kurze 5-s-Pause durch Bus-Lastspitze) den Mittelwert
    sonst nach oben treiben.
    """
    deltas = [(b.ts - a.ts).total_seconds() for a, b in pairwise(writes)]
    if not deltas:
        return 0
    median_dt = statistics.median(deltas)
    return round(median_dt * 2 * 1000)  # 2 Transitionen = ein Zyklus


def _to_bool(value: object) -> bool | None:
    """Mappt KNX-DPT-1.001-Wert auf bool."""
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return bool(value)
    if isinstance(value, str) and value in ("0", "1"):
        return value == "1"
    return None


__all__ = [
    "TOGGLE_LOOP_MAX_PERIOD_SEC",
    "TOGGLE_LOOP_MIN_CYCLES",
    "detect_toggle_loop",
]
