"""KNX-Telegramm-Statistik: Klassifizierung, Empfehlungs-Engine,
Anti-Pattern-Detector und Aggregations-Helfer.

Iter 1: classify_severity + recommended_rate_for.
Iter 2: Recommendation-Dataclass + build_recommendation.
Iter 3: Anti-Pattern-Detector (Konstant-Wert, Read-Burst, Mehrfach-
        Response, Heartbeat-Spam).
Folgende Iterationen erweitern dieses Modul.
"""

from __future__ import annotations

import math
import statistics
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Final, Literal

from ..const import (
    KNX_RATIO_GREEN_MAX,
    KNX_RATIO_ORANGE_MAX,
    KNX_RATIO_YELLOW_MAX,
    KNX_RECOMMENDED_RATES_PER_MIN,
)

KnxSeverity = Literal["green", "yellow", "orange", "red"]

_DEFAULT_RATE_KEY: Final = "_default"


def recommended_rate_for(dpt: str | None) -> float:
    """Liefert die obere Soll-Rate (Tel/Min) fuer einen DPT-String.

    Unbekannte oder leere DPTs fallen auf `_default`-Wert zurueck.
    DPT-Strings haben das ETS-Format `<main>.<sub>` (z. B. "9.001"); wir
    matchen exakt — Phase-2 koennte einen Main-Type-Fallback ergaenzen,
    wenn Bedarf entsteht.
    """
    if not dpt:
        return KNX_RECOMMENDED_RATES_PER_MIN[_DEFAULT_RATE_KEY]
    return KNX_RECOMMENDED_RATES_PER_MIN.get(
        dpt,
        KNX_RECOMMENDED_RATES_PER_MIN[_DEFAULT_RATE_KEY],
    )


def classify_severity(rate: float, recommended: float) -> KnxSeverity:
    """Klassifiziert das Verhaeltnis Ist-Rate / Soll-Rate als Ampelfarbe.

    Schwellen aus const.py:
    - rate <= recommended * KNX_RATIO_GREEN_MAX  → "green"
    - rate <= recommended * KNX_RATIO_YELLOW_MAX → "yellow"
    - rate <= recommended * KNX_RATIO_ORANGE_MAX → "orange"
    - sonst → "red"

    Sonderfaelle:
    - rate=0      → "green" (kein Verkehr ist nie verdaechtig)
    - recommended=0 mit rate>0 → "red" (nichts erwartet, aber gesendet)
    """
    if rate <= 0.0:
        return "green"
    if recommended <= 0.0:
        return "red"
    ratio = rate / recommended
    if ratio <= KNX_RATIO_GREEN_MAX:
        return "green"
    if ratio <= KNX_RATIO_YELLOW_MAX:
        return "yellow"
    if ratio <= KNX_RATIO_ORANGE_MAX:
        return "orange"
    return "red"


# DPT-spezifische Templates fuer die Empfehlungstexte. Werden parametrisiert
# mit der Ist-Rate. Fuer DPTs ausserhalb der Liste greift das _default-Template.
_RECOMMENDATION_TEMPLATES: Final[dict[str, str]] = {
    "1.001": (
        "Schaltbefehl: nur Aenderungen senden, kein Zyklus. "
        "Hohe Rate ({rate:.1f} Tel/Min) deutet auf Schalt-Schleife oder "
        "redundante Toggle-Telegramme hin. ETS-Logik pruefen."
    ),
    "1.018": (
        "Bewegungsmelder: Nachtriggerzeit (Sperrzeit) auf >= 30 s anheben. "
        "Aktuelle Rate {rate:.1f} Tel/Min deutet auf zu kurze Sperrzeit."
    ),
    "5.001": (
        "Dimmwert/Stellgroesse: nur bei Aenderung >= 1-2 % senden, zyklisch "
        ">= 10 Min als Heartbeat. Aktuelle Rate {rate:.1f} Tel/Min ist zu hoch."
    ),
    "9.001": (
        "Temperatur: empfohlen Hysterese >= 0,2 K, Sendezyklus >= 5 Min. "
        "Ist-Rate {rate:.1f} Tel/Min deutet auf zu enge Hysterese oder "
        "zu kurzen Sendezyklus."
    ),
    "9.004": (
        "Helligkeit (Lux): empfohlen Hysterese >= 50 Lux, Sendezyklus "
        ">= 5 Min. Bei Wetterstationen haeufig die groesste Buslast-Quelle. "
        "Ist-Rate: {rate:.1f} Tel/Min."
    ),
    "9.005": (
        "Wind: empfohlen Hysterese >= 1 m/s, Sendezyklus >= 5 Min. "
        "Sturm-Schwellen separat als eigene GA. Ist-Rate: {rate:.1f} Tel/Min."
    ),
    "9.007": (
        "Feuchte: traeges Signal, Hysterese >= 2-5 % und Sendezyklus "
        ">= 10 Min. Ist-Rate {rate:.1f} Tel/Min ist zu hoch."
    ),
    "9.008": (
        "CO2: Hysterese >= 25-50 ppm, Sendezyklus >= 5-10 Min. Ist-Rate: {rate:.1f} Tel/Min."
    ),
    "13.010": (
        "Energiezaehler: zyklisch >= 5-15 Min reicht voellig. "
        "Ist-Rate: {rate:.1f} Tel/Min — Sendezyklus deutlich verlaengern."
    ),
    "13.013": (
        "Energiezaehler kWh: zyklisch >= 5-15 Min reicht voellig. "
        "Ist-Rate: {rate:.1f} Tel/Min — Sendezyklus deutlich verlaengern."
    ),
    "_default": (
        "Unbekannte DPT-Klasse — erwarteter Bereich <= 5 Tel/Min. "
        "Pruefe in der ETS Sendeparameter und Hysterese. "
        "Ist-Rate: {rate:.1f} Tel/Min."
    ),
}

_GREEN_TEXT: Final = "Telegrammrate ist im erwarteten Bereich — keine Aktion noetig."


def safe_ratio(rate: float, recommended: float) -> float:
    """Verhaeltnis Ist/Soll mit Sonderfall recommended<=0.

    Public, weil sowohl Recommendation-Engine (knx_stats.py) als auch
    Service-Layer (knx_stats_service.py) ihn brauchen. Vermeidet eine
    duplizierte Implementierung.
    """
    if recommended <= 0.0:
        return float("inf") if rate > 0.0 else 0.0
    return rate / recommended


@dataclass(frozen=True, slots=True)
class Recommendation:
    """Strukturierte Empfehlung fuer eine GA / Geraet.

    Wird vom API-Layer als JSON serialisiert und vom Frontend
    im Detail-Pane gerendert.
    """

    severity: KnxSeverity
    text: str
    action_required: bool
    ratio: float
    estimated_reduction_pct: float | None


def _format_template(dpt: str | None, rate: float) -> str:
    """Sucht das DPT-Template und formatiert es mit der Ist-Rate."""
    template = _RECOMMENDATION_TEMPLATES.get(dpt or "") or _RECOMMENDATION_TEMPLATES["_default"]
    return template.format(rate=rate)


def build_recommendation(
    *,
    dpt: str | None,
    rate: float,
    recommended: float,
) -> Recommendation:
    """Erzeugt eine vollstaendige Recommendation aus DPT + Raten.

    Berechnet Severity, Text (DPT-spezifisch) und geschaetzte
    Reduktion in Prozent.
    """
    severity = classify_severity(rate, recommended)
    ratio = safe_ratio(rate, recommended)

    if severity == "green":
        return Recommendation(
            severity=severity,
            text=_GREEN_TEXT,
            action_required=False,
            ratio=ratio,
            estimated_reduction_pct=None,
        )

    text = _format_template(dpt, rate)
    reduction: float | None = None
    if rate > 0.0 and recommended > 0.0 and rate > recommended:
        reduction = (1.0 - recommended / rate) * 100.0
    elif math.isinf(ratio):
        reduction = 100.0

    return Recommendation(
        severity=severity,
        text=text,
        action_required=True,
        ratio=ratio,
        estimated_reduction_pct=reduction,
    )


# Anti-Pattern-Detector (Iter 3) ---------------------------------------------

# Schwellen aus dem Konzept §5.6
_CONSTANT_VALUE_MIN_SAMPLES: Final[int] = 10
_READ_BURST_MIN_COUNT: Final[int] = 10
_READ_BURST_WINDOW_SEC: Final[float] = 5.0
_MULTI_RESPONSE_WINDOW_SEC: Final[float] = 0.2
_MULTI_RESPONSE_MIN_COUNT: Final[int] = 2
_HEARTBEAT_MIN_SAMPLES: Final[int] = 10
_HEARTBEAT_MAX_INTERVAL_SEC: Final[float] = 60.0
_HEARTBEAT_INTERVAL_TOLERANCE: Final[float] = 0.2  # ±20 %
_MIN_PATTERN_SAMPLES: Final[int] = 2

FindingKind = Literal[
    "constant_value",
    "read_burst",
    "multiple_response",
    "heartbeat_spam",
    "status_loop",
]


@dataclass(frozen=True, slots=True)
class TelegramSample:
    """Ein einzelnes KNX-Telegramm fuer den Pattern-Detector.

    Reduzierte Sicht des Telegramms — nur die fuer Mustererkennung
    relevanten Felder. Wird vom Storage-Layer aus den DB-Rows befuellt.
    """

    ts: datetime
    value: Any
    telegramtype: str | None
    source: str


@dataclass(frozen=True, slots=True)
class Finding:
    """Erkannte Anomalie im Telegramm-Strom."""

    kind: FindingKind
    severity: KnxSeverity
    text: str


def _detect_constant_value(samples: Sequence[TelegramSample]) -> Finding | None:
    """Konstant-Wert-Spam: Wert (oder Wert-Repr) variiert nicht ueber
    >= _CONSTANT_VALUE_MIN_SAMPLES Stichproben."""
    if len(samples) < _CONSTANT_VALUE_MIN_SAMPLES:
        return None
    values = {repr(s.value) for s in samples if s.telegramtype != "GroupValueRead"}
    if len(values) != 1:
        return None
    only = next(iter(values))
    return Finding(
        kind="constant_value",
        severity="orange",
        text=(
            f"Sensor sendet konstanten Wert ({only}) ueber "
            f"{len(samples)} Telegramme. Wahrscheinlich keine reale "
            f"Sensorik dran oder Default-0 im Geraet. ETS-App pruefen, "
            f"zyklisches Senden deaktivieren."
        ),
    )


def _detect_read_burst(samples: Sequence[TelegramSample]) -> Finding | None:
    """Read-Burst: >= N GroupValueRead-Telegramme einer Source in < T Sek."""
    reads = [s for s in samples if s.telegramtype == "GroupValueRead"]
    if len(reads) < _READ_BURST_MIN_COUNT:
        return None
    by_source: dict[str, list[datetime]] = {}
    for r in reads:
        by_source.setdefault(r.source, []).append(r.ts)
    for src, timestamps in by_source.items():
        timestamps.sort()
        for i in range(len(timestamps) - _READ_BURST_MIN_COUNT + 1):
            window = (timestamps[i + _READ_BURST_MIN_COUNT - 1] - timestamps[i]).total_seconds()
            if window <= _READ_BURST_WINDOW_SEC:
                return Finding(
                    kind="read_burst",
                    severity="orange",
                    text=(
                        f"Read-Burst von Geraet {src}: "
                        f"{_READ_BURST_MIN_COUNT}+ GroupValueRead in "
                        f"{window:.1f}s. Typisch HA `sync_state` zu "
                        f"aggressiv — auf `init` oder `expire 30` "
                        f"umstellen."
                    ),
                )
    return None


def _detect_multiple_response(samples: Sequence[TelegramSample]) -> Finding | None:
    """Mehrfach-Response: >= 2 Responses innerhalb _MULTI_RESPONSE_WINDOW_SEC."""
    responses = sorted(
        (s for s in samples if s.telegramtype == "GroupValueResponse"),
        key=lambda s: s.ts,
    )
    if len(responses) < _MULTI_RESPONSE_MIN_COUNT + 1:
        return None
    for i in range(len(responses) - _MULTI_RESPONSE_MIN_COUNT):
        window = (responses[i + _MULTI_RESPONSE_MIN_COUNT].ts - responses[i].ts).total_seconds()
        if window <= _MULTI_RESPONSE_WINDOW_SEC:
            return Finding(
                kind="multiple_response",
                severity="orange",
                text=(
                    f"Mehrfach-Response: {_MULTI_RESPONSE_MIN_COUNT + 1}+ "
                    f"Responses innerhalb {window * 1000:.0f}ms. "
                    f"Mehrere Aktoren auf gleicher GA oder Aktor "
                    f"antwortet redundant. ETS-Topologie und Status-"
                    f"Objekt-Konfig pruefen."
                ),
            )
    return None


def _detect_heartbeat_spam(samples: Sequence[TelegramSample]) -> Finding | None:
    """Heartbeat-Spam: konstantes dt < _HEARTBEAT_MAX_INTERVAL_SEC,
    Werte identisch ueber _HEARTBEAT_MIN_SAMPLES Stichproben."""
    writes = sorted(
        (s for s in samples if s.telegramtype != "GroupValueRead"),
        key=lambda s: s.ts,
    )
    if len(writes) < _HEARTBEAT_MIN_SAMPLES:
        return None
    deltas = [(writes[i + 1].ts - writes[i].ts).total_seconds() for i in range(len(writes) - 1)]
    if not deltas:
        return None
    median_dt = statistics.median(deltas)
    if median_dt <= 0 or median_dt >= _HEARTBEAT_MAX_INTERVAL_SEC:
        return None
    # Toleranz-Check: alle Deltas innerhalb ±20 % des Medians?
    tolerance = median_dt * _HEARTBEAT_INTERVAL_TOLERANCE
    if any(abs(d - median_dt) > tolerance for d in deltas):
        return None
    # Werte identisch?
    values = {repr(w.value) for w in writes}
    if len(values) != 1:
        return None
    return Finding(
        kind="heartbeat_spam",
        severity="yellow",
        text=(
            f"Heartbeat alle {median_dt:.0f}s mit identischem Wert. "
            f"Lebenszeichen-Intervall zu kurz — auf >= 5 Min anheben."
        ),
    )


def detect_patterns(
    samples: Sequence[TelegramSample],
    *,
    dpt: str | None,
) -> list[Finding]:
    """Fuehrt alle Anti-Pattern-Detektoren in fester Reihenfolge aus.

    Nicht-anwendbare Detektoren liefern None und werden uebersprungen.
    Liefert die Liste der erkannten Findings (kann leer sein).
    """
    if len(samples) < _MIN_PATTERN_SAMPLES:
        return []
    detectors = (
        _detect_constant_value,
        _detect_read_burst,
        _detect_multiple_response,
        _detect_heartbeat_spam,
    )
    findings: list[Finding] = []
    for detector in detectors:
        result = detector(samples)
        if result is not None:
            findings.append(result)
    # dpt aktuell nicht genutzt — zukunft: DPT-spezifische Detektoren
    # (z. B. Status-Schleife nur fuer DPT 1.001).
    _ = dpt
    return findings
