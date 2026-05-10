"""Iter 3: Anti-Pattern-Detector.

Erkennt Konstant-Wert-Spam, Read-Burst, Mehrfach-Response,
Heartbeat-Spam und Status-Schleife auf einer Zeitreihe von Telegrammen.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.processing.knx_stats import (
    Finding,
    TelegramSample,
    detect_patterns,
)


def _ts(seconds: float) -> datetime:
    return datetime(2026, 5, 2, 16, 0, 0, tzinfo=UTC) + timedelta(seconds=seconds)


class TestConstantValueDetector:
    def test_constant_zero_value_flagged_for_float_dpt(self) -> None:
        samples = [
            TelegramSample(ts=_ts(i), value=0.0, telegramtype="GroupValueWrite", source="1.1.220")
            for i in range(15)
        ]
        findings = detect_patterns(samples, dpt="9.001")
        kinds = {f.kind for f in findings}
        assert "constant_value" in kinds

    def test_varying_values_not_flagged(self) -> None:
        samples = [
            TelegramSample(
                ts=_ts(i), value=20.0 + i * 0.5, telegramtype="GroupValueWrite", source="1.1.5"
            )
            for i in range(15)
        ]
        findings = detect_patterns(samples, dpt="9.001")
        kinds = {f.kind for f in findings}
        assert "constant_value" not in kinds

    def test_too_few_samples_not_flagged(self) -> None:
        samples = [
            TelegramSample(ts=_ts(i), value=0.0, telegramtype="GroupValueWrite", source="1.1.220")
            for i in range(5)
        ]
        findings = detect_patterns(samples, dpt="9.001")
        assert all(f.kind != "constant_value" for f in findings)


class TestReadBurstDetector:
    def test_many_reads_short_window_flagged(self) -> None:
        samples = [
            TelegramSample(
                ts=_ts(i * 0.1),
                value=None,
                telegramtype="GroupValueRead",
                source="1.1.6",
            )
            for i in range(15)
        ]
        findings = detect_patterns(samples, dpt="1.001")
        kinds = {f.kind for f in findings}
        assert "read_burst" in kinds

    def test_few_reads_not_flagged(self) -> None:
        samples = [
            TelegramSample(
                ts=_ts(i * 0.1),
                value=None,
                telegramtype="GroupValueRead",
                source="1.1.6",
            )
            for i in range(5)
        ]
        findings = detect_patterns(samples, dpt="1.001")
        kinds = {f.kind for f in findings}
        assert "read_burst" not in kinds

    def test_writes_only_no_burst_flag(self) -> None:
        samples = [
            TelegramSample(
                ts=_ts(i * 0.1),
                value=1,
                telegramtype="GroupValueWrite",
                source="1.1.6",
            )
            for i in range(20)
        ]
        findings = detect_patterns(samples, dpt="1.001")
        kinds = {f.kind for f in findings}
        assert "read_burst" not in kinds


class TestMultipleResponseDetector:
    def test_multiple_responses_close_in_time_flagged(self) -> None:
        samples = [
            TelegramSample(ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.6"),
            TelegramSample(
                ts=_ts(0.05), value=1, telegramtype="GroupValueResponse", source="1.1.11"
            ),
            TelegramSample(
                ts=_ts(0.08), value=1, telegramtype="GroupValueResponse", source="1.1.11"
            ),
            TelegramSample(
                ts=_ts(0.11), value=1, telegramtype="GroupValueResponse", source="1.1.11"
            ),
            TelegramSample(
                ts=_ts(0.13), value=1, telegramtype="GroupValueResponse", source="1.1.11"
            ),
        ]
        findings = detect_patterns(samples, dpt="1.001")
        kinds = {f.kind for f in findings}
        assert "multiple_response" in kinds

    def test_single_response_not_flagged(self) -> None:
        samples = [
            TelegramSample(ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.6"),
            TelegramSample(
                ts=_ts(0.05), value=1, telegramtype="GroupValueResponse", source="1.1.11"
            ),
            TelegramSample(ts=_ts(60), value=None, telegramtype="GroupValueRead", source="1.1.6"),
            TelegramSample(
                ts=_ts(60.05), value=1, telegramtype="GroupValueResponse", source="1.1.11"
            ),
        ]
        findings = detect_patterns(samples, dpt="1.001")
        kinds = {f.kind for f in findings}
        assert "multiple_response" not in kinds


class TestHeartbeatDetector:
    def test_constant_interval_flagged_as_heartbeat(self) -> None:
        # Identische Werte mit konstantem dt = 30 s → kurzer Heartbeat
        samples = [
            TelegramSample(ts=_ts(i * 30), value=1, telegramtype="GroupValueWrite", source="1.1.5")
            for i in range(20)
        ]
        findings = detect_patterns(samples, dpt="1.001")
        kinds = {f.kind for f in findings}
        assert "heartbeat_spam" in kinds

    def test_long_interval_heartbeat_not_flagged(self) -> None:
        # 5 Min Intervall = ok
        samples = [
            TelegramSample(ts=_ts(i * 300), value=1, telegramtype="GroupValueWrite", source="1.1.5")
            for i in range(10)
        ]
        findings = detect_patterns(samples, dpt="1.001")
        kinds = {f.kind for f in findings}
        assert "heartbeat_spam" not in kinds


class TestEmptyAndEdge:
    def test_empty_samples_returns_empty_findings(self) -> None:
        assert detect_patterns([], dpt="1.001") == []

    def test_single_sample_returns_empty_findings(self) -> None:
        samples = [
            TelegramSample(ts=_ts(0), value=1, telegramtype="GroupValueWrite", source="1.1.5"),
        ]
        assert detect_patterns(samples, dpt="1.001") == []


class TestFindingDataclass:
    def test_finding_fields(self) -> None:
        f = Finding(kind="constant_value", severity="orange", text="x")
        assert f.kind == "constant_value"
        assert f.severity == "orange"
        assert f.text == "x"
