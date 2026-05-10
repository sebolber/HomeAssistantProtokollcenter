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
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime
from itertools import pairwise
from typing import TYPE_CHECKING, Any, Final, Literal

from .knx_device_model_recommendations import (
    ModelRecommendation,
    find_model_recommendation,
)
from .knx_device_model_recommendations import (
    reasoning_source as model_reasoning_source,
)
from .knx_dpt_recommendations import (
    DptRecommendation,
    reasoning_source,
    recommend_for_dpt,
)

if TYPE_CHECKING:
    from ..storage.findings_repo import FindingsRepository
    from ..storage.knx_devices_repo import KnxDeviceRepository
    from ..storage.knx_stats_repo import KnxStatsRepository
    from ..storage.recommendation_cache_repo import RecommendationCacheRepository
    from .findings import Finding
    from .recommendation_provider import RecommendationProvider

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

STDEV_MIN_SAMPLES: Final[int] = 2
"""``statistics.stdev`` braucht mindestens 2 Werte. Bei < 2 Intervallen
liefert die Heuristik 0.0, der Klassifikator faellt auf
``insufficient`` zurueck."""


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
    for prev, current in pairwise(parsed):
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
    stdev = statistics.stdev(intervals) if len(intervals) >= STDEV_MIN_SAMPLES else 0.0
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


RecommendationSource = Literal["dpt_standard", "device_model", "llm"]
"""Iter UX-6: Quelle der Empfehlung pro GA — wird vom Frontend als
Pill in der ``empfohlen``-Spalte gerendert, damit der User auf einen
Blick sieht, ob ein Layer-1-DPT-Default, ein Layer-2-Modell-Override
oder ein Layer-4-LLM-Vorschlag greift."""


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

    source: RecommendationSource | None = None
    """Iter UX-6: Quelle der Empfehlung. ``None`` wenn keine
    Empfehlung greift (alle Layer leer)."""


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
    return _SEVERITY_TABLE.get((recommended, observed), "warn")


def _ga_recommendation(
    *,
    ga: str,
    label: str | None,
    dpt: str | None,
    observation: SendModeObservation,
    model_override: ModelRecommendation | None = None,
) -> GaRecommendation:
    """Verheiratet Klassifikation + DPT-Empfehlung pro GA.

    Iter L2.2: optionaler ``model_override`` ueberschreibt die Layer-1-
    Empfehlung pro DPT, wenn die Modell-Tabelle einen Eintrag fuer
    diese GA's DPT bereithaelt. Ansonsten greift weiter Layer 1.

    Iter UX-6: setzt ``source`` auf ``device_model`` wenn der Modell-
    Override greift, sonst ``dpt_standard``. ``None`` wenn kein DPT-
    Match — der LLM-Fallback (L4) setzt dann sein eigenes ``llm``.
    """
    dpt_reco: DptRecommendation | None = recommend_for_dpt(dpt)
    source: RecommendationSource | None = "dpt_standard" if dpt_reco is not None else None
    if model_override is not None and dpt is not None and dpt in model_override.dpt_overrides:
        dpt_reco = model_override.dpt_overrides[dpt]
        source = "device_model"
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
        recommended_hysteresis=(dpt_reco.hysteresis if dpt_reco is not None else None),
        severity=severity,
        rationale=dpt_reco.rationale if dpt_reco is not None else None,
        source=source,
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

    countable = [r for r in ga_recos if r.observed.mode not in ("silent", "insufficient")]
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
    countable = [r for r in ga_recos if r.observed.mode not in ("silent", "insufficient")]
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

    rec_modes = sorted({r.recommended_mode for r in deviating if r.recommended_mode is not None})
    if not rec_modes:
        return f"Aktuell {headline_mode}{median_text} — keine DPT-Empfehlung verfuegbar."
    rec_text = " / ".join(rec_modes)
    return (
        f"Aktuell {headline_mode}{median_text} — empfohlen: {rec_text} "
        f"({len(deviating)} von {len(countable)} GAs abweichend)."
    )


# Iter L3.0: Layer-3-Schwellwerte (Live-Anomalie-Override).
BUSLOAD_OVERRIDE_THRESHOLD_PCT: Final[float] = 30.0
"""Bei Periode-Avg-Buslast >= 30 % wird die Empfehlung um den Faktor
``BUSLOAD_OVERRIDE_FACTOR`` verlaengert. Schwelle aus User-Praxis:
< 30 % ist normaler Betrieb, daruber wird das KNX-TP-Bus zunehmend
ineffizient (Kollisionen, Repeats)."""

BUSLOAD_OVERRIDE_FACTOR: Final[float] = 1.5
"""Cycle-Stretch-Faktor — z. B. 5-15 Min wird zu 8-23 Min."""


def _apply_busload_override(
    ga_recos: list[GaRecommendation],
    avg_busload_pct: float,
) -> tuple[list[GaRecommendation], bool]:
    """Layer-3-Override: bei hoher Buslast cycle_minutes-Korridor
    nach oben strecken (cycles werden seltener).

    Return: (neue Liste, wurde-overridden-Flag). Flag signalisiert dem
    Service, ob ein Reasoning-Eintrag noetig ist.
    """
    if avg_busload_pct < BUSLOAD_OVERRIDE_THRESHOLD_PCT:
        return ga_recos, False
    factor = BUSLOAD_OVERRIDE_FACTOR
    overridden: list[GaRecommendation] = []
    any_override = False
    for ga in ga_recos:
        if ga.recommended_cycle_minutes is None:
            overridden.append(ga)
            continue
        new_min = max(1, round(ga.recommended_cycle_minutes[0] * factor))
        new_max = max(new_min, round(ga.recommended_cycle_minutes[1] * factor))
        overridden.append(replace(ga, recommended_cycle_minutes=(new_min, new_max)))
        any_override = True
    return overridden, any_override


RELEVANT_FINDING_CODES_FOR_RECOMMENDATIONS: Final[frozenset[str]] = frozenset(
    {
        "SEND_CYCLE_DRIFT",
        "REPEAT_APPROXIMATION",
        "TOGGLE_LOOP",
        "MULTI_RESPONDER",
    }
)
"""Iter L3.1: Findings-Codes, die die Empfehlung schaerfen. Die Liste
ist bewusst eng — nur Phaenomene, die direkt mit Sende-Modus oder
Sende-Frequenz zu tun haben. Andere Codes (DPT_MISMATCH, ORPHAN_GA,
STALE_GA) werden vom User ueber den Findings-Tab adressiert, nicht
ueber die Empfehlungs-Card."""


def _apply_findings_override(
    ga_recos: list[GaRecommendation],
    *,
    active_findings: Sequence[Finding],
) -> list[GaRecommendation]:
    """Layer-3-Findings-Override: aktive (unacked) Findings auf einer
    GA setzen die GA-Severity auf 'deviation'.

    ``active_findings`` muss bereits ack-gefiltert sein und nur Codes
    aus ``RELEVANT_FINDING_CODES_FOR_RECOMMENDATIONS`` enthalten.
    """
    if not active_findings:
        return ga_recos
    affected_gas: set[str] = {str(f.ga) for f in active_findings if f.ga is not None}
    if not affected_gas:
        return ga_recos
    return [replace(ga, severity="deviation") if ga.ga in affected_gas else ga for ga in ga_recos]


async def _fetch_active_findings_for_source(
    findings_repo: FindingsRepository,
    dev_source: str,
) -> list[Finding]:
    """Holt unacked Findings einer Source, gefiltert auf relevante Codes.

    Defensiv gegen Repos ohne ``list_acknowledgements`` (aelteres Schema):
    fallback liefert alle Findings, sodass die Pipeline nicht abbricht.
    """
    items = await findings_repo.list_findings(
        source=dev_source,
        limit=200,
    )
    if not items:
        return []
    if hasattr(findings_repo, "list_acknowledgements"):
        rows = await findings_repo.list_acknowledgements()
        acked = {(str(r["ga"]), str(r["finding_code"])) for r in rows}
    else:
        acked = set()
    return [
        f
        for f in items
        if f.code in RELEVANT_FINDING_CODES_FOR_RECOMMENDATIONS
        and (f.ga is None or (f.ga, f.code) not in acked)
    ]


def _device_profile_strings(profile: dict[str, Any] | None) -> tuple[str, str]:
    if profile is None:
        return "", ""
    return str(profile.get("manufacturer") or ""), str(profile.get("model") or "")


async def _lookup_dpt_in_cache(
    cache_repo: RecommendationCacheRepository | None,
    cache_key: str,
) -> DptRecommendation | None:
    if cache_repo is None:
        return None
    cached = await cache_repo.get(cache_key)
    if cached is None:
        return None
    response = cached["response"]
    if not isinstance(response, dict):
        return None
    return _dpt_recommendation_from_dict(response)


async def _resolve_dpt_via_llm(
    *,
    ga: GaRecommendation,
    provider: RecommendationProvider,
    cache_repo: RecommendationCacheRepository | None,
    provider_name: str,
    model_name: str,
    manufacturer: str,
    device_model: str,
    api_key: str | None,
) -> DptRecommendation | None:
    """Cache-First-Lookup, sonst Provider-Fetch (mit Cache-Write bei Treffer)."""
    # Iter C2: api_key-Fingerprint geht in den Cache-Key, damit
    # zwei verschiedene Provider-Schluessel (Free/Pro) NICHT
    # denselben Eintrag teilen.
    from ..storage.recommendation_cache_repo import (  # noqa: PLC0415
        make_cache_key,
    )

    cache_key = make_cache_key(
        provider=provider_name,
        model=model_name,
        dpt=ga.dpt,
        manufacturer=manufacturer or None,
        device_model=device_model or None,
        api_key=api_key,
    )
    cached_reco = await _lookup_dpt_in_cache(cache_repo, cache_key)
    if cached_reco is not None:
        return cached_reco
    fresh = await provider.fetch(
        dpt=ga.dpt,
        manufacturer=manufacturer or None,
        model=device_model or None,
        context={
            "observed_mode": ga.observed.mode,
            "median_interval_minutes": (ga.observed.median_interval_minutes or 0.0),
            "sample_count": ga.observed.sample_count,
        },
    )
    if fresh is not None and cache_repo is not None:
        await cache_repo.set(
            cache_key=cache_key,
            response=_dpt_recommendation_to_dict(fresh),
            provider=provider_name,
            model=model_name,
        )
    return fresh


def _ga_with_llm_recommendation(
    ga: GaRecommendation, dpt_reco: DptRecommendation
) -> GaRecommendation:
    """Setzt die LLM-Empfehlung in einen ``GaRecommendation`` ein."""
    cycle: tuple[int, int] | None = None
    if dpt_reco.cycle_minutes_min is not None:
        assert dpt_reco.cycle_minutes_max is not None
        cycle = (dpt_reco.cycle_minutes_min, dpt_reco.cycle_minutes_max)
    # Iter UX-6: kein "[KI]"-Praefix mehr — der explizite
    # ``source``-Marker wird im Frontend als Pill gerendert.
    return replace(
        ga,
        recommended_mode=dpt_reco.mode,
        recommended_cycle_minutes=cycle,
        recommended_hysteresis=dpt_reco.hysteresis,
        rationale=dpt_reco.rationale,
        severity=_severity_for(dpt_reco.mode, ga.observed.mode),
        source="llm",
    )


async def _apply_llm_fallback(
    ga_recos: list[GaRecommendation],
    *,
    provider: RecommendationProvider,
    cache_repo: RecommendationCacheRepository | None,
    provider_name: str,
    model_name: str,
    device_profile: dict[str, Any] | None,
    api_key: str | None = None,
) -> tuple[list[GaRecommendation], int]:
    """Layer-4-Fallback fuer GAs ohne ``recommended_mode``.

    Reihenfolge pro betroffener GA:
    1. Cache-Hit pruefen (sha256 ueber alle relevanten Inputs).
    2. Bei Miss: Provider.fetch() (kann None liefern bei
       Disabled/Fehler — dann bleibt die GA ohne Empfehlung).
    3. Bei Treffer: ``DptRecommendation`` einsetzen + persistenter
       Cache schreiben.

    Returns: (modifizierte Liste, Anzahl der GAs mit LLM-Befuellung).
    """
    manufacturer, device_model = _device_profile_strings(device_profile)
    new_recos: list[GaRecommendation] = []
    filled = 0
    for ga in ga_recos:
        if ga.recommended_mode is not None:
            new_recos.append(ga)
            continue
        dpt_reco = await _resolve_dpt_via_llm(
            ga=ga,
            provider=provider,
            cache_repo=cache_repo,
            provider_name=provider_name,
            model_name=model_name,
            manufacturer=manufacturer,
            device_model=device_model,
            api_key=api_key,
        )
        if dpt_reco is None:
            new_recos.append(ga)
            continue
        new_recos.append(_ga_with_llm_recommendation(ga, dpt_reco))
        filled += 1
    return new_recos, filled


def _dpt_recommendation_to_dict(reco: DptRecommendation) -> dict[str, Any]:
    return {
        "mode": reco.mode,
        "cycle_minutes_min": reco.cycle_minutes_min,
        "cycle_minutes_max": reco.cycle_minutes_max,
        "hysteresis": reco.hysteresis,
        "max_rate_per_min": reco.max_rate_per_min,
        "rationale": reco.rationale,
    }


def _dpt_recommendation_from_dict(
    payload: dict[str, Any],
) -> DptRecommendation | None:
    mode = payload.get("mode")
    if mode not in {"on_change", "cyclic", "hybrid"}:
        return None
    return DptRecommendation(
        mode=mode,
        cycle_minutes_min=payload.get("cycle_minutes_min"),
        cycle_minutes_max=payload.get("cycle_minutes_max"),
        hysteresis=payload.get("hysteresis"),
        max_rate_per_min=float(payload.get("max_rate_per_min") or 1.0),
        rationale=str(payload.get("rationale") or ""),
    )


async def _avg_busload_pct(
    repo: KnxStatsRepository,
    from_iso: str,
    to_iso: str,
) -> float:
    """Hilfsfunktion: durchschnittliche Buslast ueber die Periode.

    Nutzt das gleiche Bucketing-Schema wie ``compute_busload`` im
    ``KnxStatsService`` (Default 10 s). Robust bei leeren Perioden.
    """
    series = await repo.busload_timeseries(from_iso, to_iso, bucket_seconds=10)
    if not series:
        return 0.0
    pcts = [float(b["busload_pct"]) for b in series]
    return sum(pcts) / len(pcts)


@dataclass(frozen=True)
class _DeviceProfile:
    """Geloeste Geraete-Identitaet fuer Layer-2/Layer-4-Lookups."""

    profile: dict[str, Any] | None
    source: str  # "user_override" | "ets_discovery" | ""
    manufacturer: str | None
    model: str | None


async def _resolve_device_profile(
    *,
    devices_repo: KnxDeviceRepository | None,
    ets_devices: dict[str, dict[str, Any]] | None,
    dev_source: str,
) -> _DeviceProfile:
    """Layer-2-Lookup mit klarer Quellen-Reihenfolge.

    1. User-Override aus knx_devices (manuell gepflegt, hat Vorrang)
    2. ETS-Discovery-Daten (Hersteller + Produkt direkt aus dem
       KNX-Projekt — Standardquelle, kein Pflegeaufwand fuer den User)
    3. Leeres Profil — kein Modell-Override
    """
    user_profile = await _fetch_user_profile(devices_repo, dev_source)
    if user_profile is not None:
        return user_profile
    ets_profile = _fetch_ets_profile(ets_devices, dev_source)
    if ets_profile is not None:
        return ets_profile
    return _DeviceProfile(profile=None, source="", manufacturer=None, model=None)


async def _fetch_user_profile(
    devices_repo: KnxDeviceRepository | None, dev_source: str
) -> _DeviceProfile | None:
    if devices_repo is None:
        return None
    user_profile = await devices_repo.get(dev_source)
    if user_profile is None:
        return None
    if not (user_profile.get("manufacturer") or user_profile.get("model")):
        return None
    profile = dict(user_profile)
    manufacturer = str(profile["manufacturer"]) if profile.get("manufacturer") else None
    model = str(profile["model"]) if profile.get("model") else None
    return _DeviceProfile(
        profile=profile,
        source="user_override",
        manufacturer=manufacturer,
        model=model,
    )


def _fetch_ets_profile(
    ets_devices: dict[str, dict[str, Any]] | None, dev_source: str
) -> _DeviceProfile | None:
    if ets_devices is None:
        return None
    ets_entry = ets_devices.get(dev_source)
    if ets_entry is None:
        return None
    manufacturer = (ets_entry.get("manufacturer") or "").strip() or None
    model = (ets_entry.get("product") or "").strip() or None
    if manufacturer is None and model is None:
        return None
    return _DeviceProfile(
        profile={"manufacturer": manufacturer, "model": model},
        source="ets_discovery",
        manufacturer=manufacturer,
        model=model,
    )


async def _classify_gas(
    *,
    repo: KnxStatsRepository,
    ga_rows: list[dict[str, Any]],
    from_iso: str,
    to_iso: str,
    model_override: ModelRecommendation | None,
) -> list[GaRecommendation]:
    """Klassifiziert pro GA-Zeile Sample-Verlauf -> ``GaRecommendation``."""
    ga_recos: list[GaRecommendation] = []
    for row in ga_rows:
        ga = str(row["ga"])
        samples = await repo.samples_for_ga_classification(ga, from_iso, to_iso)
        timestamps = [s["timestamp"] for s in samples]
        values = [s["value"] for s in samples]
        observation = classify_send_mode(
            intervals_from_timestamps(timestamps),
            sample_count=len(samples),
            value_changes=count_value_changes(values),
        )
        ga_recos.append(
            _ga_recommendation(
                ga=ga,
                label=row.get("label"),
                dpt=row.get("dpt"),
                observation=observation,
                model_override=model_override,
            )
        )
    return ga_recos


def _layer1_reasoning(ga_recos: list[GaRecommendation]) -> str | None:
    if not any(r.recommended_mode is not None for r in ga_recos):
        return None
    return (
        f"Layer 1 ({reasoning_source()}) — DPT-Standard-Empfehlung "
        "je GA aus knx_dpt_recommendations."
    )


def _layer2_reasoning(
    profile: _DeviceProfile, model_override: ModelRecommendation | None
) -> str | None:
    source_label = "User-Override" if profile.source == "user_override" else "ETS-Projekt"
    if model_override is not None:
        # Layer-2-Marker mit Hersteller-/Modell-Begruendung + Doc-URL +
        # Quellen-Marker (ETS oder User-Override).
        doc_suffix = f" ({model_override.doc_url})" if model_override.doc_url else ""
        return (
            f"Layer 2 ({model_reasoning_source()}, {source_label}) — "
            f"{model_override.manufacturer}/{model_override.model_glob}: "
            f"{model_override.rationale}{doc_suffix}"
        )
    if profile.profile is not None and profile.manufacturer:
        return (
            f"Layer 2 (device_model, {source_label}) — Hersteller "
            f"'{profile.manufacturer}' (Modell: {profile.model or 'unbekannt'}) "
            "hat noch keinen kuratierten Override in der Tabelle."
        )
    return None


def _layer3_busload_reasoning(busload_overridden: bool, avg_busload: float) -> str | None:
    if not busload_overridden:
        return None
    return (
        f"Layer 3 (live_anomaly) — Bus-Avg-Last {avg_busload:.1f} % "
        f">= {BUSLOAD_OVERRIDE_THRESHOLD_PCT:.0f} % → empfohlene "
        f"Zyklen um Faktor {BUSLOAD_OVERRIDE_FACTOR} verlaengert."
    )


def _layer3_findings_reasoning(findings: list[Finding]) -> list[str]:
    out: list[str] = []
    for finding in findings:
        ga_label = f"auf {finding.ga}" if finding.ga is not None else "(bus-weit)"
        # Iter B6: title kommt nicht mehr aus dem Finding selbst —
        # die UI rendert die Translation zur Laufzeit. Im Reasoning-
        # Text reicht der Code als maschinenlesbarer Marker; das
        # Frontend (oder ein nachgelagerter Service) ersetzt ihn ggf.
        # mit dem lokalisierten Titel.
        out.append(f"Layer 3 (live_anomaly) — Finding {finding.code} {ga_label} aktiv")
    return out


def _layer4_reasoning(llm_filled_count: int) -> str | None:
    if not llm_filled_count:
        return None
    return (
        f"Layer 4 (llm) — {llm_filled_count} GA(s) ohne DPT-/Modell-"
        "Treffer durch LLM-Vorschlag ergaenzt. Bitte manuell pruefen."
    )


def _summary_reasoning(ga_recos: list[GaRecommendation]) -> list[str]:
    out: list[str] = []
    silent_count = sum(1 for r in ga_recos if r.observed.mode == "silent")
    if silent_count:
        out.append(
            f"{silent_count} GA(s) stumm in der Periode — "
            "Klassifikation als 'silent' ohne weitere Wertung."
        )
    insufficient_count = sum(1 for r in ga_recos if r.observed.mode == "insufficient")
    if insufficient_count:
        out.append(
            f"{insufficient_count} GA(s) mit zu wenig Telegrammen — "
            "low confidence, lange Beobachtungsperiode empfohlen."
        )
    deviation_count = sum(1 for r in ga_recos if r.severity == "deviation")
    if deviation_count:
        out.append(
            f"{deviation_count} GA(s) zeigen klare Abweichung "
            "vom DPT-Default — siehe Detail-Tabelle."
        )
    return out


def _build_reasoning(
    *,
    ga_recos: list[GaRecommendation],
    profile: _DeviceProfile,
    model_override: ModelRecommendation | None,
    llm_filled_count: int,
    busload_overridden: bool,
    avg_busload: float,
    active_findings: list[Finding],
) -> list[str]:
    """Setzt die einzelnen Reasoning-Zeilen aus den Layer-Helfern zusammen.

    Reihenfolge bewusst stabil — die UI verlaesst sich darauf, dass
    Layer 1 vor Layer 2 vor Layer 4 vor Layer 3 vor Summary steht.
    """
    candidates: list[str | None] = [
        _layer1_reasoning(ga_recos),
        _layer2_reasoning(profile, model_override),
        _layer4_reasoning(llm_filled_count),
        _layer3_busload_reasoning(busload_overridden, avg_busload),
    ]
    reasoning = [line for line in candidates if line]
    reasoning.extend(_layer3_findings_reasoning(active_findings))
    reasoning.extend(_summary_reasoning(ga_recos))
    return reasoning


async def compute_device_recommendation(
    repo: KnxStatsRepository,
    dev_source: str,
    from_iso: str,
    to_iso: str,
    *,
    devices_repo: KnxDeviceRepository | None = None,
    ets_devices: dict[str, dict[str, Any]] | None = None,
    findings_repo: FindingsRepository | None = None,
    llm_provider: RecommendationProvider | None = None,
    llm_cache_repo: RecommendationCacheRepository | None = None,
    llm_provider_name: str = "openai_chat",
    llm_model: str = "",
    llm_api_key: str | None = None,
) -> DeviceRecommendation | None:
    """Aggregiert die Geraete-Empfehlung aus den GA-Klassifikationen.

    Liefert ``None``, wenn das Geraet im Periode keine GAs gemeldet hat
    — analog zu ``compute_source_detail``.

    Iter L2.2: optionales ``devices_repo`` aktiviert Layer-2-Modell-
    Overrides — wenn das Geraete-Profil (`knx_devices`-Eintrag) ein
    bekanntes Manufacturer/Model-Paar liefert, ueberschreibt die
    Modell-Tabelle einzelne DPT-Empfehlungen. Caller kann ``None``
    uebergeben (z. B. in Tests), dann greift weiter Layer 1.
    """
    if not dev_source:
        return None
    ga_rows = await repo.gas_for_source(dev_source, from_iso, to_iso, limit=100)
    if not ga_rows:
        return None

    profile = await _resolve_device_profile(
        devices_repo=devices_repo,
        ets_devices=ets_devices,
        dev_source=dev_source,
    )
    model_override = find_model_recommendation(profile.manufacturer, profile.model)

    ga_recos = await _classify_gas(
        repo=repo,
        ga_rows=ga_rows,
        from_iso=from_iso,
        to_iso=to_iso,
        model_override=model_override,
    )

    # Iter L4.x: Layer 4 — LLM-Fallback fuer GAs ohne L1/L2-Treffer.
    # KEIN Override fuer GAs mit existierender Empfehlung; Layer 4 ist
    # ausschliesslich Fallback. Provider-Aufrufe sind teuer + Rate-
    # limited; Cache-Lookup zuerst.
    llm_filled_count = 0
    if llm_provider is not None:
        ga_recos, llm_filled_count = await _apply_llm_fallback(
            ga_recos,
            provider=llm_provider,
            cache_repo=llm_cache_repo,
            provider_name=llm_provider_name,
            model_name=llm_model,
            device_profile=profile.profile,
            api_key=llm_api_key,
        )

    # Iter L3.0: Layer-3-Override — bei hoher Buslast die Cycle-
    # Korridore nach oben strecken. Modifiziert nicht den Modus.
    avg_busload = await _avg_busload_pct(repo, from_iso, to_iso)
    ga_recos, busload_overridden = _apply_busload_override(ga_recos, avg_busload)

    # Iter L3.1: Layer-3-Findings — aktive (unacked) Findings dieser
    # Source schaerfen die Severity der betroffenen GAs auf 'deviation'.
    active_findings: list[Finding] = []
    if findings_repo is not None:
        active_findings = await _fetch_active_findings_for_source(findings_repo, dev_source)
        if active_findings:
            ga_recos = _apply_findings_override(ga_recos, active_findings=active_findings)

    headline_mode, confidence = _aggregate_headline(ga_recos)
    headline_text = _build_headline_text(headline_mode, ga_recos)

    reasoning = _build_reasoning(
        ga_recos=ga_recos,
        profile=profile,
        model_override=model_override,
        llm_filled_count=llm_filled_count,
        busload_overridden=busload_overridden,
        avg_busload=avg_busload,
        active_findings=active_findings,
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
                "source": ga.source,
            }
            for ga in reco.ga_recommendations
        ],
    }
