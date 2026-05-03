"""KNX-Recommendation-Engine.

Iter L1.1 (Sprint Recommendations): Sende-Modus-Klassifikation.
Iter L1.2: DeviceRecommendationService.

Layer 1 / Sprint-Plan-Phase: deterministische Heuristik aus Inter-
Telegramm-Intervallen + Wertaenderungs-Counter. Keine externen
Provider, keine I/O ausser ueber das uebergebene Repository.
"""

from __future__ import annotations

import json
import statistics
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, Final, Literal

from .knx_dpt_recommendations import (
    DptRecommendation,
    recommend_for_dpt,
    reasoning_source,
)

if TYPE_CHECKING:
    from ..storage.knx_stats_repo import KnxStatsRepository

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


# ---------------------------------------------------------------------------
# Iter L1.2 — Geraete-Empfehlungs-Aggregation
# ---------------------------------------------------------------------------


Severity = Literal["ok", "info", "warn", "deviation"]
"""Pro-GA-Severity der Empfehlungs-Card.

- ``ok`` — beobachteter Modus stimmt mit Empfehlung ueberein.
- ``info`` — keine Empfehlung verfuegbar (z. B. unbekannter DPT) oder
  Klassifikation ist ``insufficient`` / ``silent``. Kein Handlungs-
  bedarf, aber kein Pruefsiegel.
- ``warn`` — leichte Abweichung (z. B. on_change empfohlen,
  beobachtet hybrid).
- ``deviation`` — klare Abweichung (z. B. cyclic empfohlen, beobachtet
  on_change, oder umgekehrt).
"""


@dataclass(frozen=True, slots=True)
class GaRecommendation:
    """Empfehlung fuer eine einzelne GA des Geraets."""

    ga: str
    label: str | None
    dpt: str | None
    observed: SendModeObservation
    recommended_mode: SendMode | None
    """``None`` wenn kein DPT-Match — Frontend zeigt 'keine Empfehlung
    verfuegbar' und kann ggf. KI-Layer aktivieren (L4)."""

    recommended_cycle_minutes: tuple[int, int] | None
    recommended_hysteresis: str | None
    severity: Severity
    rationale: str | None
    """Kurze WHY-Begruendung der DPT-Empfehlung (1:1 aus
    ``DptRecommendation.rationale``)."""


@dataclass(frozen=True, slots=True)
class DeviceRecommendation:
    """Aggregat-Empfehlung fuer ein Geraet (`dev_source`).

    ``headline_mode`` ist der Mehrheits-Modus der GAs (oder ``"silent"``
    wenn alle GAs stumm sind, oder ``"insufficient"`` wenn keine
    belastbare Klassifikation moeglich war).

    ``confidence`` ist die schwaechste GA-Konfidenz (Pessimist):
    sobald eine GA ``low`` ist, ist das Geraets-Aggregat auch ``low``.
    """

    dev_source: str
    headline_mode: SendMode
    headline_recommendation: str
    """Menschen-lesbarer Satz, fertig fuer Frontend-Render — kein
    weiteres String-Building noetig."""

    ga_recommendations: list[GaRecommendation] = field(default_factory=list)
    confidence: Confidence = "low"
    reasoning: list[str] = field(default_factory=list)
    """Layer-Marker + WHY-Eintraege; pro Layer ein Eintrag plus
    pro relevanter GA ein optionaler Detail-Eintrag."""

    generated_at: str = ""
    """ISO-Zeit der Compute-Aufruf — fuer Cache-Hit-Anzeige im UI."""


# Schwere/Leichte Abweichungs-Tabelle: was ist "ok", "warn", "deviation"?
# Reihenfolge: (recommended, observed) → severity. Hybrid ueberlappt
# semantisch mit cyclic+on_change, daher "warn" statt "deviation".
_SEVERITY_TABLE: Final[dict[tuple[SendMode, SendMode], Severity]] = {
    # Empfehlung on_change
    ("on_change", "on_change"): "ok",
    ("on_change", "cyclic"): "deviation",
    ("on_change", "hybrid"): "warn",
    # Empfehlung cyclic
    ("cyclic", "cyclic"): "ok",
    ("cyclic", "on_change"): "deviation",
    ("cyclic", "hybrid"): "warn",
    # Empfehlung hybrid (selten — Wetter/Klima)
    ("hybrid", "hybrid"): "ok",
    ("hybrid", "on_change"): "warn",
    ("hybrid", "cyclic"): "warn",
}


def _severity_for(
    recommended: SendMode | None,
    observed: SendMode,
) -> Severity:
    """Mappt das Paar (Empfehlung, Beobachtung) auf eine Severity.

    - Keine Empfehlung -> "info" (unkritisch, kann nicht bewertet werden).
    - silent / insufficient als Beobachtung -> "info".
    - sonst Tabelle.
    """
    if recommended is None:
        return "info"
    if observed in ("silent", "insufficient"):
        return "info"
    # Cast hilft mypy: nach dem ``in``-Filter ist observed garantiert
    # eines aus on_change / cyclic / hybrid.
    return _SEVERITY_TABLE.get((recommended, observed), "warn")  # type: ignore[arg-type]


def _ga_recommendation(
    *,
    ga: str,
    label: str | None,
    dpt: str | None,
    observation: SendModeObservation,
) -> GaRecommendation:
    """Verheiratet Klassifikation + DPT-Empfehlung pro GA."""
    dpt_reco: DptRecommendation | None = recommend_for_dpt(dpt)
    severity = _severity_for(
        dpt_reco.mode if dpt_reco is not None else None,
        observation.mode,
    )
    cycle: tuple[int, int] | None = None
    if dpt_reco is not None and dpt_reco.cycle_minutes_min is not None:
        # mypy: beide non-None (Tabelle setzt sie immer paarweise).
        assert dpt_reco.cycle_minutes_max is not None
        cycle = (dpt_reco.cycle_minutes_min, dpt_reco.cycle_minutes_max)
    return GaRecommendation(
        ga=ga,
        label=label,
        dpt=dpt,
        observed=observation,
        recommended_mode=dpt_reco.mode if dpt_reco is not None else None,
        recommended_cycle_minutes=cycle,
        recommended_hysteresis=(
            dpt_reco.hysteresis if dpt_reco is not None else None
        ),
        severity=severity,
        rationale=dpt_reco.rationale if dpt_reco is not None else None,
    )


def _aggregate_headline(
    ga_recos: Sequence[GaRecommendation],
) -> tuple[SendMode, Confidence]:
    """Bestimmt Headline-Modus + Konfidenz aus den GA-Empfehlungen.

    - Alle GAs silent -> headline = silent, confidence = high.
    - Alle GAs insufficient -> headline = insufficient, confidence = low.
    - Sonst: Mehrheits-Modus unter den auswertbaren GAs (silent/
      insufficient zaehlen nicht). Bei Tie -> ``hybrid``.
    - Confidence = niedrigste der auswertbaren GA-Konfidenzen (Pessimist).
    """
    if not ga_recos:
        return "silent", "high"
    if all(r.observed.mode == "silent" for r in ga_recos):
        return "silent", "high"
    if all(r.observed.mode == "insufficient" for r in ga_recos):
        return "insufficient", "low"

    countable = [
        r for r in ga_recos if r.observed.mode not in ("silent", "insufficient")
    ]
    if not countable:
        return "insufficient", "low"

    counts: dict[SendMode, int] = {}
    for r in countable:
        counts[r.observed.mode] = counts.get(r.observed.mode, 0) + 1
    sorted_counts = sorted(counts.items(), key=lambda kv: -kv[1])
    top = sorted_counts[0]
    if len(sorted_counts) > 1 and sorted_counts[1][1] == top[1]:
        headline: SendMode = "hybrid"
    else:
        headline = top[0]

    # Konfidenz: Pessimist ueber ALLE GAs (auch silent/insufficient),
    # damit eine einzige unklare GA das Geraets-Aggregat ehrlich
    # signalisiert. silent-GAs haben "high" Konfidenz (Stille ist klar
    # erkennbar), insufficient-GAs haben "low" — die fliessen ein.
    confidence_order = {"low": 0, "medium": 1, "high": 2}
    min_conf = min(
        ga_recos, key=lambda r: confidence_order[r.observed.confidence]
    ).observed.confidence
    return headline, min_conf


def _build_headline_text(
    headline_mode: SendMode,
    ga_recos: Sequence[GaRecommendation],
) -> str:
    """Erzeugt einen menschen-lesbaren Headline-Satz.

    Beispiele:
    - "stumm — kein Telegramm in der Periode"
    - "zyklisch (Median ~60 s) — empfohlen: hybrid (5-15 Min Heartbeat
      mit Hysterese >= 0.2 K)"
    """
    if headline_mode == "silent":
        return "Stumm — kein Telegramm in der Periode."
    if headline_mode == "insufficient":
        return (
            "Zu wenig Telegramme fuer eine belastbare Klassifikation "
            f"(< {SEND_MODE_INSUFFICIENT_THRESHOLD} pro GA)."
        )
    countable = [
        r for r in ga_recos if r.observed.mode not in ("silent", "insufficient")
    ]
    if not countable:
        return f"Aktuell {headline_mode}, keine Empfehlung verfuegbar."

    medians_min = [
        r.observed.median_interval_minutes
        for r in countable
        if r.observed.median_interval_minutes is not None
    ]
    median_text = ""
    if medians_min:
        avg_median = round(sum(medians_min) / len(medians_min), 1)
        median_text = f" (Median ~{avg_median} Min/Telegramm)"

    deviating = [r for r in countable if r.severity in ("warn", "deviation")]
    if not deviating:
        return f"Aktuell {headline_mode}{median_text} — passt zur Empfehlung."

    rec_modes = sorted(
        {r.recommended_mode for r in deviating if r.recommended_mode is not None}
    )
    if not rec_modes:
        return f"Aktuell {headline_mode}{median_text} — keine DPT-Empfehlung verfuegbar."
    rec_text = " / ".join(rec_modes)
    return (
        f"Aktuell {headline_mode}{median_text} — empfohlen: {rec_text} "
        f"({len(deviating)} von {len(countable)} GAs abweichend)."
    )


async def compute_device_recommendation(
    repo: "KnxStatsRepository",
    dev_source: str,
    from_iso: str,
    to_iso: str,
) -> DeviceRecommendation | None:
    """Aggregiert die Geraete-Empfehlung aus den GA-Klassifikationen.

    Liefert ``None``, wenn das Geraet im Periode keine GAs gemeldet hat
    — analog zu ``compute_source_detail``.
    """
    if not dev_source:
        return None
    ga_rows = await repo.gas_for_source(
        dev_source, from_iso, to_iso, limit=100,
    )
    if not ga_rows:
        return None

    ga_recos: list[GaRecommendation] = []
    for row in ga_rows:
        ga = str(row["ga"])
        samples = await repo.samples_for_ga_classification(
            ga, from_iso, to_iso,
        )
        timestamps = [s["timestamp"] for s in samples]
        values = [s["value"] for s in samples]
        intervals = intervals_from_timestamps(timestamps)
        value_changes = count_value_changes(values)
        observation = classify_send_mode(
            intervals,
            sample_count=len(samples),
            value_changes=value_changes,
        )
        ga_recos.append(
            _ga_recommendation(
                ga=ga,
                label=row.get("label"),
                dpt=row.get("dpt"),
                observation=observation,
            )
        )

    headline_mode, confidence = _aggregate_headline(ga_recos)
    headline_text = _build_headline_text(headline_mode, ga_recos)

    reasoning: list[str] = []
    if any(r.recommended_mode is not None for r in ga_recos):
        reasoning.append(
            f"Layer 1 ({reasoning_source()}) — DPT-Standard-Empfehlung "
            f"je GA aus knx_dpt_recommendations."
        )
    silent_count = sum(1 for r in ga_recos if r.observed.mode == "silent")
    if silent_count:
        reasoning.append(
            f"{silent_count} GA(s) stumm in der Periode — "
            "Klassifikation als 'silent' ohne weitere Wertung."
        )
    insufficient_count = sum(
        1 for r in ga_recos if r.observed.mode == "insufficient"
    )
    if insufficient_count:
        reasoning.append(
            f"{insufficient_count} GA(s) mit zu wenig Telegrammen — "
            "low confidence, lange Beobachtungsperiode empfohlen."
        )
    deviation_count = sum(1 for r in ga_recos if r.severity == "deviation")
    if deviation_count:
        reasoning.append(
            f"{deviation_count} GA(s) zeigen klare Abweichung "
            "vom DPT-Default — siehe Detail-Tabelle."
        )

    return DeviceRecommendation(
        dev_source=dev_source,
        headline_mode=headline_mode,
        headline_recommendation=headline_text,
        ga_recommendations=ga_recos,
        confidence=confidence,
        reasoning=reasoning,
        generated_at=datetime.now(UTC).isoformat(timespec="seconds"),
    )


def device_recommendation_to_dict(reco: DeviceRecommendation) -> dict[str, Any]:
    """Serialisiert das DTO fuer den HTTP-Response.

    Format gespiegelt vom Frontend-Interface; jede Aenderung hier
    muss auch im Frontend-DTO und im Schema-Contract-Test (L1.5)
    nachgezogen werden.
    """
    return {
        "dev_source": reco.dev_source,
        "headline_mode": reco.headline_mode,
        "headline_recommendation": reco.headline_recommendation,
        "confidence": reco.confidence,
        "reasoning": list(reco.reasoning),
        "generated_at": reco.generated_at,
        "ga_recommendations": [
            {
                "ga": ga.ga,
                "label": ga.label,
                "dpt": ga.dpt,
                "observed": {
                    "mode": ga.observed.mode,
                    "confidence": ga.observed.confidence,
                    "sample_count": ga.observed.sample_count,
                    "value_changes": ga.observed.value_changes,
                    "median_interval_s": ga.observed.median_interval_s,
                    "median_interval_minutes": ga.observed.median_interval_minutes,
                    "stdev_interval_s": ga.observed.stdev_interval_s,
                },
                "recommended_mode": ga.recommended_mode,
                "recommended_cycle_minutes": (
                    list(ga.recommended_cycle_minutes)
                    if ga.recommended_cycle_minutes is not None
                    else None
                ),
                "recommended_hysteresis": ga.recommended_hysteresis,
                "severity": ga.severity,
                "rationale": ga.rationale,
            }
            for ga in reco.ga_recommendations
        ],
    }
