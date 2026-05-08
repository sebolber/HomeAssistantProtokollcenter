"""Detector `MULTI_TIME_MASTER` (Iter 18 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F14.
Erkennt: >=2 unterschiedliche `knx_source` schreiben auf eine
Zeit-/Datums-GA (DPT 10.001/11.001/19.001) — typisches Symptom fuer
versehentliche Doppel-Aktivierung des Time-Master-Modus auf zwei
Geraeten (Drift, Konflikt).

Severity: error (Doppel-Zeitquellen erzeugen Drift, siehe §9.3).
Evidence: `{sources, clock_dpt}`.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from typing import Final

from ..knx_stats import TelegramSample
from . import Finding, FindingSeverity

CLOCK_DPTS: Final[frozenset[str]] = frozenset({"10.001", "11.001", "19.001"})
"""DPT-Codes fuer Zeit/Datum-Master.
- 10.001: Time-of-day
- 11.001: Date
- 19.001: DateTime kombiniert
"""

_MULTI_TIME_MASTER_MIN_SOURCES: Final[int] = 2
_MULTI_TIME_MASTER_SEVERITY: Final[FindingSeverity] = "error"
_MULTI_TIME_MASTER_VERSION: Final[str] = "MULTI_TIME_MASTER/v1"


def detect_multi_time_master(
    *,
    ga: str,
    dpt: str | None,
    samples: Sequence[TelegramSample],
    now: datetime,
) -> Finding | None:
    """Liefert ein Finding, wenn mehr als eine Source auf der GA schreibt."""
    if dpt not in CLOCK_DPTS:
        return None
    sources = {
        s.source for s in samples if s.telegramtype != "GroupValueRead"
    }
    if len(sources) < _MULTI_TIME_MASTER_MIN_SOURCES:
        return None
    return Finding(
        code="MULTI_TIME_MASTER",
        schema_version=1,
        severity=_MULTI_TIME_MASTER_SEVERITY,
        ga=ga,
        source=None,
        evidence={
            "sources": sorted(sources),
            "clock_dpt": dpt,
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_MULTI_TIME_MASTER_VERSION,
    )


__all__ = ["CLOCK_DPTS", "detect_multi_time_master"]
