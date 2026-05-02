"""KNX-Telegramm-Statistik: Klassifizierung, Empfehlungs-Engine,
Anti-Pattern-Detector und Aggregations-Helfer.

Iter 1: classify_severity + recommended_rate_for.
Folgende Iterationen erweitern dieses Modul.
"""

from __future__ import annotations

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
