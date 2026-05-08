"""Detector `VALUE_OUT_OF_RANGE` (Iter 13 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §6.
Vergleicht den DPT-spezifischen Min/Max-Bereich aus
`KNX_DPT_VALUE_RANGES` mit dem konkreten Wert. Erzeugt Finding
(severity=error) mit Evidence `{value, dpt, range_min, range_max}`.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Final

from ...const import KNX_DPT_VALUE_RANGES
from . import Finding, FindingSeverity

_VALUE_OUT_OF_RANGE_SEVERITY: Final[FindingSeverity] = "error"
_VALUE_OUT_OF_RANGE_VERSION: Final[str] = "VALUE_OUT_OF_RANGE/v1"


def detect_value_out_of_range(
    *,
    ga: str,
    dpt: str | None,
    value: Any,
    now: datetime,
) -> Finding | None:
    """Liefert einen Finding, wenn `value` ausserhalb der DPT-Range liegt.

    Liefert `None` fuer:
    - DPT ist None oder nicht in `KNX_DPT_VALUE_RANGES` (kein Bereich
      hinterlegt -> wir koennen nichts pruefen).
    - Wert ist nicht numerisch (Strings/None — DPT 16.x liefert ASCII).
    """
    if dpt is None:
        return None
    range_ = KNX_DPT_VALUE_RANGES.get(dpt)
    if range_ is None:
        return None
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        # bool ist Subtyp von int — bei DPT 1.001 ist die Range nicht
        # hinterlegt, also greifen wir hier ohnehin nicht ein.
        return None
    range_min, range_max = range_
    numeric_value = float(value)
    if range_min <= numeric_value <= range_max:
        return None
    return Finding(
        code="VALUE_OUT_OF_RANGE",
        schema_version=1,
        severity=_VALUE_OUT_OF_RANGE_SEVERITY,
        ga=ga,
        source=None,
        evidence={
            "value": numeric_value,
            "dpt": dpt,
            "range_min": float(range_min),
            "range_max": float(range_max),
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_VALUE_OUT_OF_RANGE_VERSION,
    )


__all__ = ["detect_value_out_of_range"]
