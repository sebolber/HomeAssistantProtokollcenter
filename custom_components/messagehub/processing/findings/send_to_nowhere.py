"""Detector `SEND_TO_NOWHERE` (Iter 31 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9
Iter 31. Korrelation: ein Write auf einer GA, das nicht innerhalb
`SEND_TO_NOWHERE_STATUS_WINDOW_MS` von einem Status-Echo (anderer Wert
oder GroupValueResponse) gefolgt wird, deutet darauf hin, dass der
Aktor nicht erreichbar ist (KNX-Bus offline, Geraet unprogrammiert,
Routing-Loop).

Severity: info — die Heuristik kann False-Positive sein, wenn das
Status-Echo auf einer separaten GA liegt (typisch fuer KNX-Schalt-
Aktoren mit getrennter Status-GA). Wir liefern den Hinweis als
Beobachtung, nicht als harten Bug.

Evidence: `{write_at, status_window_ms, status_received}`.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime, timedelta
from typing import Final

from ..knx_stats import TelegramSample
from . import Finding, FindingSeverity

SEND_TO_NOWHERE_STATUS_WINDOW_MS: Final[int] = 5000
"""Fenster nach dem Write, innerhalb dessen wir ein Status-Echo erwarten.

5 s ist konservativ — KNX-Standard-Reaktionszeit < 200 ms, langsame
Aktoren (Stellantriebe, Dimmer mit Sanftanlauf) brauchen aber 1-3 s.
Tighter waere agil, looser frisst zu viele Trigger im selben Fenster
und unterdrueckt echte Faelle."""

_SEND_TO_NOWHERE_SEVERITY: Final[FindingSeverity] = "info"
_SEND_TO_NOWHERE_VERSION: Final[str] = "SEND_TO_NOWHERE/v1"

_WINDOW_DELTA: Final[timedelta] = timedelta(milliseconds=SEND_TO_NOWHERE_STATUS_WINDOW_MS)


def detect_send_to_nowhere(
    *,
    ga: str,
    samples: Sequence[TelegramSample],
    now: datetime,
) -> Finding | None:
    """Liefert ein Finding, wenn ein Write ohne Status-Echo bleibt.

    Algorithmus:
    1. Sortiere Samples nach ts.
    2. Finde den letzten GroupValueWrite mit
       `now - write.ts >= STATUS_WINDOW` (sonst ist das Fenster noch
       offen, wir koennen nicht behaupten, dass kein Status mehr kommt).
    3. Pruefe, ob im Fenster `[write.ts, write.ts + STATUS_WINDOW]`
       ein Status-Echo (GroupValueResponse oder Write mit anderer
       Source / anderem Wert) folgt.
    4. Wenn nicht, Finding emittieren.

    Liefert max. einen Finding pro Aufruf — Dedup via Repo, also
    haeufige Wiederholung wird zu occurrence_count, nicht zu Spam.
    """
    if not samples:
        return None
    sorted_samples = sorted(samples, key=lambda s: s.ts)
    write_idx = _find_expired_write_without_status(sorted_samples, now)
    if write_idx is None:
        return None
    write = sorted_samples[write_idx]
    return Finding(
        code="SEND_TO_NOWHERE",
        schema_version=1,
        severity=_SEND_TO_NOWHERE_SEVERITY,
        ga=ga,
        source=write.source or None,
        evidence={
            "write_at": write.ts.isoformat(),
            "status_window_ms": SEND_TO_NOWHERE_STATUS_WINDOW_MS,
            "status_received": False,
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_SEND_TO_NOWHERE_VERSION,
    )


def _find_expired_write_without_status(
    samples: Sequence[TelegramSample],
    now: datetime,
) -> int | None:
    """Liefert den Index des letzten Writes ohne Status-Echo.

    Wir filtern Writes vor, die selbst ein Status-Echo sind (folgen
    binnen WINDOW auf einen Write von anderer Source) — sonst wuerde
    der Detector den Status-Update vom Aktor als unbeantworteten
    Befehl missdeuten.

    Fuer die verbleibenden "Command-Writes": pruefe, ob im Fenster
    `[write.ts, write.ts + WINDOW]` ein Status-Echo folgt; wenn nicht
    und das Fenster bereits abgelaufen ist (relativ zu `now`),
    Finding emittieren.
    """
    for idx in range(len(samples) - 1, -1, -1):
        sample = samples[idx]
        if sample.telegramtype != "GroupValueWrite":
            continue
        if now - sample.ts <= _WINDOW_DELTA:
            # Fenster noch offen — wir koennen nicht aussagen.
            continue
        if _is_status_echo_of_previous(samples, write_idx=idx):
            # Dieser Write ist selbst ein Status-Echo, nicht ein Befehl.
            continue
        if not _has_status_echo(samples, write_idx=idx):
            return idx
    return None


def _is_status_echo_of_previous(
    samples: Sequence[TelegramSample],
    *,
    write_idx: int,
) -> bool:
    """True, wenn dieser Write selbst ein Status-Echo eines frueheren ist.

    Heuristik: existiert ein vorheriger Write von ANDERER Source binnen
    WINDOW vor diesem Write? Dann wahrscheinlich Aktor-Status-Update.
    """
    write = samples[write_idx]
    window_start = write.ts - _WINDOW_DELTA
    for j in range(write_idx - 1, -1, -1):
        candidate = samples[j]
        if candidate.ts < window_start:
            return False
        if candidate.telegramtype != "GroupValueWrite":
            continue
        if candidate.source != write.source:
            return True
    return False


def _has_status_echo(samples: Sequence[TelegramSample], *, write_idx: int) -> bool:
    """True, wenn im Window ein Status-Echo auf den Write folgt."""
    write = samples[write_idx]
    window_end = write.ts + _WINDOW_DELTA
    for j in range(write_idx + 1, len(samples)):
        candidate = samples[j]
        if candidate.ts > window_end:
            return False
        if candidate.telegramtype == "GroupValueResponse":
            return True
        if candidate.telegramtype == "GroupValueRead":
            continue
        # GroupValueWrite — als Status-Echo gewertet, wenn Source oder
        # Wert sich unterscheiden (typisch: Aktor schickt seinen neuen
        # Status zurueck).
        if candidate.source != write.source or repr(candidate.value) != repr(write.value):
            return True
    return False


__all__ = [
    "SEND_TO_NOWHERE_STATUS_WINDOW_MS",
    "detect_send_to_nowhere",
]
