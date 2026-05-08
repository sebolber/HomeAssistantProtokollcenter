"""Detector `READ_NO_RESPONSE` (Iter 16 / knx-findings).

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F8.
Erkennt: GroupValueRead ohne nachfolgenden Response binnen
`READ_NO_RESPONSE_TIMEOUT_SEC` Sekunden.

Severity: warning (siehe §9.3 — Empfaenger koennte temporaer offline
sein). Evidence: `{read_at, expected_until}`.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime, timedelta
from typing import Final

from ..knx_stats import TelegramSample
from . import Finding, FindingSeverity

READ_NO_RESPONSE_TIMEOUT_SEC: Final[float] = 3.0
"""3 s, weil KNX-Spec ein Telegramm ohne ACK 3-mal wiederholt und dann
verworfen wird (siehe §3.1 F8). Nach 3 s ist sicher, dass kein
Empfaenger antwortet."""

_READ_NO_RESPONSE_SEVERITY: Final[FindingSeverity] = "warning"
_READ_NO_RESPONSE_VERSION: Final[str] = "READ_NO_RESPONSE/v1"


def detect_read_no_response(
    *,
    ga: str,
    samples: Sequence[TelegramSample],
    now: datetime,
) -> list[Finding]:
    """Pro unbeantwortetem Read ein Finding.

    Algorithmus:
    1. Sortiere Samples nach ts.
    2. Fuer jeden Read: pruefe, ob im Fenster [read_ts, read_ts +
       TIMEOUT] ein Response folgt.
    3. Wenn nicht und das Fenster bereits abgelaufen ist (relativ zu
       `now`), Finding emittieren.
    """
    timeout = timedelta(seconds=READ_NO_RESPONSE_TIMEOUT_SEC)
    sorted_samples = sorted(samples, key=lambda s: s.ts)
    findings: list[Finding] = []
    for i, sample in enumerate(sorted_samples):
        if sample.telegramtype != "GroupValueRead":
            continue
        if now - sample.ts < timeout:
            continue
        expected_until = sample.ts + timeout
        if _has_response_in_window(sorted_samples, i + 1, expected_until):
            continue
        findings.append(
            _build_finding(
                ga=ga,
                read_at=sample.ts,
                expected_until=expected_until,
                now=now,
            )
        )
    return findings


def _has_response_in_window(
    samples: Sequence[TelegramSample],
    start_idx: int,
    until: datetime,
) -> bool:
    """True, wenn im Fenster ein GroupValueResponse vorliegt."""
    for j in range(start_idx, len(samples)):
        s = samples[j]
        if s.ts > until:
            return False
        if s.telegramtype == "GroupValueResponse":
            return True
    return False


def _build_finding(
    *,
    ga: str,
    read_at: datetime,
    expected_until: datetime,
    now: datetime,
) -> Finding:
    return Finding(
        code="READ_NO_RESPONSE",
        schema_version=1,
        severity=_READ_NO_RESPONSE_SEVERITY,
        ga=ga,
        source=None,
        evidence={
            "read_at": read_at.isoformat(),
            "expected_until": expected_until.isoformat(),
            "timeout_sec": READ_NO_RESPONSE_TIMEOUT_SEC,
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_READ_NO_RESPONSE_VERSION,
    )


__all__ = [
    "READ_NO_RESPONSE_TIMEOUT_SEC",
    "detect_read_no_response",
]
