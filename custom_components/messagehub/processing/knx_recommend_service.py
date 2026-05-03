"""KNX-Recommendation-Engine.

Iter L1.1 (Sprint Recommendations): Sende-Modus-Klassifikation.
Iter L1.2: DeviceRecommendationService (in Folge-Iter).

Layer 1 / Sprint-Plan-Phase: deterministische Heuristik aus Inter-
Telegramm-Intervallen + Wertaenderungs-Counter. Keine externen
Provider, keine I/O ausser ueber das uebergebene Repository.
"""

from __future__ import annotations

import json
import statistics
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import Final, Literal

# Klassifikations-Schwellwerte. Bewusst als Module-Konstanten — Tests
# brauchen sie als Pinning, und User koennen sie per Import an einer
# Stelle nachschlagen.
SEND_MODE_INSUFFICIENT_THRESHOLD: Final[int] = 10
"""Unter so vielen Telegrammen ist die Klassifikation statistisch
nicht belastbar — Modus = ``insufficient``, Konfidenz = ``low``."""

SEND_MODE_HIGH_CONFIDENCE_THRESHOLD: Final[int] = 30
"""Ab so vielen Telegrammen ist die Standardabweichung verlaesslich
genug fuer eine ``high``-Konfidenz."""

CYCLIC_REGULARITY_MAX_RATIO: Final[float] = 0.3
"""``stdev(intervals) / median(intervals) <`` diesem Wert -> klar
periodisch. Bewusst konservativ — echte Cyclic-Sender treffen meist
< 0.1, > 0.3 ist schon "irregular"."""

ON_CHANGE_GAP_RATIO: Final[float] = 10.0
"""P95(interval) > diesem Faktor mal Median(interval) -> lange
Pausen typisch fuer event-getriebenes Senden."""

ON_CHANGE_VALUE_CHANGE_THRESHOLD: Final[float] = 0.7
"""value_changes / sample_count >= diesem Wert -> jedes Telegramm
korrespondiert mit einer Wertaenderung. Realistischer Wert: 0.7,
weil Repeat-Telegramme (Iter REPEAT_APPROXIMATION) ausnahmsweise mal
identisch sind, der Sender aber konzeptuell on_change ist."""


SendMode = Literal["cyclic", "on_change", "hybrid", "silent", "insufficient"]
Confidence = Literal["high", "medium", "low"]


@dataclass(frozen=True, slots=True)
class SendModeObservation:
    """Klassifikation des aktuellen Sende-Modus einer GA.

    ``median_interval_s``/``stdev_interval_s`` sind nur gefuellt, wenn
    >= 2 Telegramme im Beobachtungsfenster waren — sonst ``None``.
    ``sample_count`` ist die effektive Stichprobengroesse (bis zum
    Hard-Cap des Repository-Calls).
    """

    mode: SendMode
    confidence: Confidence
    sample_count: int
    value_changes: int
    median_interval_s: float | None
    stdev_interval_s: float | None

    @property
    def median_interval_minutes(self) -> float | None:
        """Bequemer Konvertor — Frontend zeigt Minuten, nicht Sekunden."""
        if self.median_interval_s is None:
            return None
        return round(self.median_interval_s / 60.0, 2)


def intervals_from_timestamps(timestamps: Sequence[str | datetime]) -> list[float]:
    """Reine Hilfsfunktion: ISO-Strings → Inter-Intervall-Sekunden.

    Robust gegen:
    - Strings mit/ohne Timezone-Suffix (verwendet ``fromisoformat``).
    - Datetime-Objekte direkt (Test-Pfade).
    - Doppelte Zeitstempel (Intervall = 0.0).

    Wirft ``ValueError`` nicht weiter — wer einen Mix aus naive/aware
    Datetimes uebergibt, bekommt ``TypeError`` aus der Subtraktion;
    der ist hier nicht abgefangen, weil das auf Datenkorruption
    hindeutet, die der Caller sehen soll.
    """
    parsed: list[datetime] = []
    for entry in timestamps:
        if isinstance(entry, datetime):
            parsed.append(entry)
        else:
            parsed.append(datetime.fromisoformat(entry))
    parsed.sort()
    intervals: list[float] = []
    for prev, current in zip(parsed, parsed[1:], strict=False):
        diff = (current - prev).total_seconds()
        intervals.append(max(0.0, diff))
    return intervals


def count_value_changes(values: Iterable[str | None]) -> int:
    """Zaehlt, wie oft sich der Wert von Telegramm zu Telegramm
    aendert. JSON-decoded fuer den Vergleich (sonst zaehlen Whitespace-
    Unterschiede in der TEXT-Spalte als "Aenderung").

    NULL-Werte werden als nicht-vergleichbar uebersprungen — der
    Vergleichszaehler springt nicht hoch, wenn ein Telegramm ohne
    Value-Payload zwischen zwei identische Werte rutscht.
    """
    last: object = _SENTINEL
    changes = 0
    for raw in values:
        if raw is None:
            continue
        try:
            decoded = json.loads(raw)
        except (TypeError, ValueError):
            decoded = raw
        if last is _SENTINEL:
            last = decoded
            continue
        if decoded != last:
            changes += 1
            last = decoded
    return changes


_SENTINEL: Final = object()


def _percentile(sorted_values: Sequence[float], pct: float) -> float:
    """Linearer Interpolations-Percentile. Erwartet sortierte Liste.

    ``pct`` in [0.0, 1.0]. Edge-cases: leere Liste -> 0.0; einziger
    Wert -> dieser Wert; pct ausserhalb [0,1] wird geclippt.
    """
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return sorted_values[0]
    pct_clipped = max(0.0, min(1.0, pct))
    pos = pct_clipped * (len(sorted_values) - 1)
    low = int(pos)
    frac = pos - low
    if low + 1 >= len(sorted_values):
        return sorted_values[low]
    return sorted_values[low] + frac * (sorted_values[low + 1] - sorted_values[low])


def classify_send_mode(
    intervals: Sequence[float],
    *,
    sample_count: int,
    value_changes: int,
) -> SendModeObservation:
    """Klassifiziert das aktuelle Sende-Profil.

    Eingabe:
    - ``intervals`` — Sekunden zwischen aufeinanderfolgenden
      Telegrammen (gleiche Reihenfolge wie Repository-Lieferung).
    - ``sample_count`` — Anzahl Telegramme (= ``len(intervals) + 1``
      bei lueckenfreier Lieferung; explizit, damit der Caller
      Repository-Hard-Caps verlustfrei melden kann).
    - ``value_changes`` — Anzahl Wertaenderungen zwischen
      aufeinanderfolgenden Telegrammen.

    Klassifikations-Tree (Reihenfolge wichtig):
    1. ``sample_count == 0`` -> ``silent``.
    2. ``sample_count < SEND_MODE_INSUFFICIENT_THRESHOLD``
       -> ``insufficient`` (low confidence).
    3. ``stdev/median < CYCLIC_REGULARITY_MAX_RATIO`` -> ``cyclic``.
    4. ``p95/median > ON_CHANGE_GAP_RATIO`` UND ``value_changes/
       sample_count >= ON_CHANGE_VALUE_CHANGE_THRESHOLD`` -> ``on_change``.
    5. sonst -> ``hybrid`` (medium confidence).
    """
    if sample_count == 0:
        return SendModeObservation(
            mode="silent",
            confidence="high",
            sample_count=0,
            value_changes=0,
            median_interval_s=None,
            stdev_interval_s=None,
        )
    if sample_count < SEND_MODE_INSUFFICIENT_THRESHOLD:
        median = _safe_median(intervals)
        return SendModeObservation(
            mode="insufficient",
            confidence="low",
            sample_count=sample_count,
            value_changes=value_changes,
            median_interval_s=median,
            stdev_interval_s=None,
        )

    median = statistics.median(intervals)
    stdev = statistics.stdev(intervals) if len(intervals) >= 2 else 0.0
    sorted_intervals = sorted(intervals)
    p95 = _percentile(sorted_intervals, 0.95)

    confidence: Confidence = (
        "high" if sample_count >= SEND_MODE_HIGH_CONFIDENCE_THRESHOLD else "medium"
    )

    # Cyclic-Pruefung zuerst — strenger Filter, schliesst andere
    # Modi aus, weil regelmaessige Intervalle ein eindeutiges Muster
    # sind. Median > 0 ist Voraussetzung; bei median=0 (Burst) faellt
    # die Klassifikation in den Hybrid-Branch.
    if median > 0.0 and stdev / median < CYCLIC_REGULARITY_MAX_RATIO:
        return SendModeObservation(
            mode="cyclic",
            confidence=confidence,
            sample_count=sample_count,
            value_changes=value_changes,
            median_interval_s=round(median, 3),
            stdev_interval_s=round(stdev, 3),
        )

    change_ratio = value_changes / sample_count if sample_count else 0.0
    if (
        median > 0.0
        and p95 / median > ON_CHANGE_GAP_RATIO
        and change_ratio >= ON_CHANGE_VALUE_CHANGE_THRESHOLD
    ):
        return SendModeObservation(
            mode="on_change",
            confidence=confidence,
            sample_count=sample_count,
            value_changes=value_changes,
            median_interval_s=round(median, 3),
            stdev_interval_s=round(stdev, 3),
        )

    return SendModeObservation(
        mode="hybrid",
        confidence="medium" if confidence == "high" else confidence,
        sample_count=sample_count,
        value_changes=value_changes,
        median_interval_s=round(median, 3),
        stdev_interval_s=round(stdev, 3),
    )


def _safe_median(intervals: Sequence[float]) -> float | None:
    """Median oder ``None`` bei leerer Liste."""
    if not intervals:
        return None
    return round(statistics.median(intervals), 3)
