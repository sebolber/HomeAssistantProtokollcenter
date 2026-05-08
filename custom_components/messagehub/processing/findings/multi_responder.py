"""Detector `MULTI_RESPONDER` (Iter 15 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F2.
Erkennt: >=2 unterschiedliche `knx_source` antworten innerhalb eines
kurzen Zeitfensters auf dieselbe GA — ein klassisches Indiz fuer
mehrere Aktoren mit gesetztem L-Flag.

Severity: warning (siehe §9.3 — kann beabsichtigt sein, z. B. parallele
Aktoren). Evidence: `{responding_sources, count, window_ms}`.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from typing import Final

from ..knx_stats import TelegramSample
from . import Finding, FindingSeverity

_MULTI_RESPONDER_SEVERITY: Final[FindingSeverity] = "warning"
_MULTI_RESPONDER_VERSION: Final[str] = "MULTI_RESPONDER/v1"

# Fenster, innerhalb dessen Antworten als "auf denselben Read" gelten.
# 1.0 s ist konservativ — KNX-Standard-Reaktionszeit liegt < 200 ms,
# aber es gibt langsame Aktoren (Heizungsstellantriebe, Dimmer mit
# Sanftanlauf). Wir wollen sie nicht falsch positiv ueber Stundenfenster
# hinweg matchen.
_MULTI_RESPONDER_WINDOW_SEC: Final[float] = 1.0

# Mindestanzahl unterschiedlicher Sources fuer einen Finding.
_MULTI_RESPONDER_MIN_SOURCES: Final[int] = 2


def detect_multi_responder(
    *,
    ga: str,
    samples: Sequence[TelegramSample],
    now: datetime,
) -> Finding | None:
    """Liefert ein Finding, wenn mehrere Sources binnen Window antworten.

    Algorithmus:
    1. Filtere Responses (telegramtype == "GroupValueResponse").
    2. Sliding-Window von `_MULTI_RESPONDER_WINDOW_SEC` Sekunden ueber
       die Response-Liste; wenn das Set der Sources im Fenster >=2
       Eintraege hat, Finding emittieren.
    """
    responses = sorted(
        (s for s in samples if s.telegramtype == "GroupValueResponse"),
        key=lambda s: s.ts,
    )
    if len(responses) < _MULTI_RESPONDER_MIN_SOURCES:
        return None
    sources_in_window = _max_unique_sources_in_window(responses)
    if len(sources_in_window) < _MULTI_RESPONDER_MIN_SOURCES:
        return None
    return Finding(
        code="MULTI_RESPONDER",
        schema_version=1,
        severity=_MULTI_RESPONDER_SEVERITY,
        ga=ga,
        source=None,
        evidence={
            "responding_sources": sorted(sources_in_window),
            "count": len(sources_in_window),
            "window_ms": int(_MULTI_RESPONDER_WINDOW_SEC * 1000),
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_MULTI_RESPONDER_VERSION,
    )


def _max_unique_sources_in_window(
    responses: Sequence[TelegramSample],
) -> set[str]:
    """Liefert das groesste Set unterschiedlicher Sources im Fenster.

    Die Sequenz ist nach ts sortiert (Aufrufer-Vertrag). Wir laufen mit
    einem Sliding-Window-Pointer durch und tracken aktuelle Sources.
    Bei mehr als 2 Sources im Fenster brechen wir ab, weil das Finding
    dann sicher ausgeloest wird; bei <=2 setzen wir das groesste
    bisher gesehene Set zurueck.
    """
    best: set[str] = set()
    left = 0
    for right, current in enumerate(responses):
        while (current.ts - responses[left].ts).total_seconds() > _MULTI_RESPONDER_WINDOW_SEC:
            left += 1
        window_sources = {responses[i].source for i in range(left, right + 1)}
        if len(window_sources) > len(best):
            best = window_sources
    return best


__all__ = ["detect_multi_responder"]
