"""KNX-Telegramm-Statistik: Klassifizierung, Empfehlungs-Engine,
Anti-Pattern-Detector und Aggregations-Helfer.

Iter 1: classify_severity + recommended_rate_for.
Iter 2: Recommendation-Dataclass + build_recommendation.
Folgende Iterationen erweitern dieses Modul.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Final, Literal

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
        "CO2: Hysterese >= 25-50 ppm, Sendezyklus >= 5-10 Min. "
        "Ist-Rate: {rate:.1f} Tel/Min."
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


def _compute_ratio(rate: float, recommended: float) -> float:
    """Verhaeltnis Ist/Soll, mit Sonderfall recommended<=0."""
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
    template = (
        _RECOMMENDATION_TEMPLATES.get(dpt or "")
        or _RECOMMENDATION_TEMPLATES["_default"]
    )
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
    ratio = _compute_ratio(rate, recommended)

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
