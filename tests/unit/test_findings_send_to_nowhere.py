"""Iter 31 (knx-findings): Detector `SEND_TO_NOWHERE`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.9
Iter 31: Korrelation Write -> Status-Echo; ohne Status-Echo innerhalb
erwartbarer Zeit ein Finding mit Evidence
`{write_at, status_window_ms, status_received}`.

Severity: info (siehe §9.3 — Heuristik kann False-Positive sein,
wenn Status auf separater GA liegt).
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.send_to_nowhere import (
    SEND_TO_NOWHERE_STATUS_WINDOW_MS,
    detect_send_to_nowhere,
)
from custom_components.messagehub.processing.knx_stats import TelegramSample


def _now() -> datetime:
    return datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC)


def _sample(
    *,
    offset_sec: float,
    value: object,
    telegramtype: str = "GroupValueWrite",
    source: str = "1.1.10",
) -> TelegramSample:
    return TelegramSample(
        ts=datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(seconds=offset_sec),
        value=value,
        telegramtype=telegramtype,
        source=source,
    )


class TestSendToNowhere:
    def test_send_to_nowhere_emits_finding_when_no_status_follows_write(
        self,
    ) -> None:
        # Arrange — Write um 0 s, danach NICHTS bis _now() (1 h spaeter).
        # status_window = 5 s, also ist _now() laengst danach.
        samples = [_sample(offset_sec=0, value=1)]

        finding = detect_send_to_nowhere(ga="1/2/3", samples=samples, now=_now())

        assert isinstance(finding, Finding)
        assert finding.code == "SEND_TO_NOWHERE"
        assert finding.severity == "info"
        assert finding.ga == "1/2/3"
        assert finding.evidence["status_window_ms"] == SEND_TO_NOWHERE_STATUS_WINDOW_MS
        assert finding.evidence["status_received"] is False
        assert finding.detector_version == "SEND_TO_NOWHERE/v1"

    def test_no_finding_when_status_follows_write_within_window(self) -> None:
        # Arrange — Write um 0 s, Status (anderer Wert) 1 s spaeter.
        samples = [
            _sample(offset_sec=0, value=1),
            _sample(
                offset_sec=1,
                value=0,
                telegramtype="GroupValueWrite",
                source="1.1.20",
            ),
        ]
        finding = detect_send_to_nowhere(ga="1/2/3", samples=samples, now=_now())
        assert finding is None

    def test_no_finding_when_status_response_follows_write(self) -> None:
        # GroupValueResponse zaehlt auch als Status-Echo.
        samples = [
            _sample(offset_sec=0, value=1),
            _sample(
                offset_sec=1,
                value=1,
                telegramtype="GroupValueResponse",
                source="1.1.20",
            ),
        ]
        finding = detect_send_to_nowhere(ga="1/2/3", samples=samples, now=_now())
        assert finding is None

    def test_no_finding_when_window_not_yet_expired(self) -> None:
        # Write geschah erst 1 s vor `now()`, das Status-Fenster (5 s)
        # ist also noch offen — kein Finding, weil wir nicht behaupten
        # koennen, dass das Status nie kommt.
        samples = [_sample(offset_sec=3595, value=1)]  # 5 s vor _now()
        finding = detect_send_to_nowhere(
            ga="1/2/3",
            samples=samples,
            now=_now(),
        )
        # Window ist 5 s; Write war exakt 5 s vor now; Window endet bei now.
        # Strenges > now bedeutet: nicht abgelaufen -> kein Finding.
        assert finding is None

    def test_no_finding_when_no_writes(self) -> None:
        samples = [
            _sample(offset_sec=0, value=1, telegramtype="GroupValueRead"),
            _sample(
                offset_sec=1,
                value=1,
                telegramtype="GroupValueResponse",
                source="1.1.20",
            ),
        ]
        finding = detect_send_to_nowhere(ga="1/2/3", samples=samples, now=_now())
        assert finding is None

    def test_no_finding_when_samples_empty(self) -> None:
        finding = detect_send_to_nowhere(ga="1/2/3", samples=[], now=_now())
        assert finding is None

    def test_threshold_constant_is_5000_ms(self) -> None:
        assert SEND_TO_NOWHERE_STATUS_WINDOW_MS == 5000
