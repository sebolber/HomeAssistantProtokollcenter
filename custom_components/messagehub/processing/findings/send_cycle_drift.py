"""Detector `SEND_CYCLE_DRIFT` (Iter 21 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F15.
Erkennt Drift im Sendezyklus: Median(Δt) der letzten 24 h ist <= 50%
des Medians der letzten 7 Tage gefallen — Hinweis auf eine Sensorik,
die ihre Sendefrequenz drastisch erhoeht hat (z. B. Wetterstation mit
verkuerztem Zyklus durch verstellten Hysterese-Wert).

Severity: info (siehe §9.3 — Trend-Hinweis, nicht akut).
Evidence: `{recent_median_dt, baseline_median_dt, ratio}`.
"""

from __future__ import annotations

from datetime import datetime
from typing import Final

from . import Finding, FindingSeverity

SEND_CYCLE_DRIFT_RATIO_THRESHOLD: Final[float] = 0.5
"""Schwellwert: Recent / Baseline <= 0.5 -> Finding.

Begruendung: 50%-Halbierung ist groesser als jede normale Tages-/
Wochen-Schwankung. Tighter Threshold (z. B. 0.3) wuerde echte Drift-
Faelle in unauffaelligen Anlagen verschlucken; looser (z. B. 0.7)
wuerde Tageszeit-Effekte (Heizung tagsueber sendet oefter als nachts)
falsch flaggen.
"""

_SEND_CYCLE_DRIFT_SEVERITY: Final[FindingSeverity] = "info"
_SEND_CYCLE_DRIFT_VERSION: Final[str] = "SEND_CYCLE_DRIFT/v1"


def detect_send_cycle_drift(
    *,
    ga: str,
    recent_median_dt_sec: float,
    baseline_median_dt_sec: float,
    now: datetime,
) -> Finding | None:
    """Liefert Finding, wenn der Sendezyklus stark verkuerzt ist.

    Bedingungen:
    - baseline > 0 (sonst keine Vergleichsbasis).
    - recent > 0 (recent=0 ist Silence, eigener Detector).
    - recent / baseline <= SEND_CYCLE_DRIFT_RATIO_THRESHOLD.
    """
    if baseline_median_dt_sec <= 0.0 or recent_median_dt_sec <= 0.0:
        return None
    ratio = recent_median_dt_sec / baseline_median_dt_sec
    if ratio > SEND_CYCLE_DRIFT_RATIO_THRESHOLD:
        return None
    return Finding(
        code="SEND_CYCLE_DRIFT",
        schema_version=1,
        severity=_SEND_CYCLE_DRIFT_SEVERITY,
        ga=ga,
        source=None,
        evidence={
            "recent_median_dt": recent_median_dt_sec,
            "baseline_median_dt": baseline_median_dt_sec,
            "ratio": round(ratio, 3),
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_SEND_CYCLE_DRIFT_VERSION,
    )


__all__ = [
    "SEND_CYCLE_DRIFT_RATIO_THRESHOLD",
    "detect_send_cycle_drift",
]
