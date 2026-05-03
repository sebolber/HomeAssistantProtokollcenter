"""Iter 16 (knx-findings): Detector `READ_NO_RESPONSE`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F8.
Erkennt: GroupValueRead ohne nachfolgenden Response binnen 3 s — meist
Hinweis auf "ETS-L-Flag fehlt" auf der Quell-GA.

Severity: warning (siehe §9.3 — Empfaenger koennte temporaer offline
sein). Evidence: `{read_at, expected_until}` plus Fenster-Sek.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.read_no_response import (
    READ_NO_RESPONSE_TIMEOUT_SEC,
    detect_read_no_response,
)
from custom_components.messagehub.processing.knx_stats import TelegramSample


def _ts(seconds: float) -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(seconds=seconds)


class TestReadNoResponseDetector:
    def test_read_no_response_emits_finding_after_timeout_window(self) -> None:
        # Arrange — Read um t=0, kein Response, "now" = 5 s spaeter (>3 s).
        samples = [
            TelegramSample(
                ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
        ]

        # Act
        findings = detect_read_no_response(
            ga="1/2/3", samples=samples, now=_ts(5.0)
        )

        # Assert
        assert len(findings) == 1
        f = findings[0]
        assert isinstance(f, Finding)
        assert f.code == "READ_NO_RESPONSE"
        assert f.severity == "warning"
        assert f.ga == "1/2/3"
        assert f.evidence["read_at"] == _ts(0).isoformat()
        # expected_until = read_at + Timeout
        assert f.evidence["expected_until"] == (
            _ts(0) + timedelta(seconds=READ_NO_RESPONSE_TIMEOUT_SEC)
        ).isoformat()

    def test_no_finding_when_response_within_window(self) -> None:
        # Arrange — Response folgt rechtzeitig.
        samples = [
            TelegramSample(
                ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
            TelegramSample(
                ts=_ts(0.5), value=1, telegramtype="GroupValueResponse", source="1.1.6"
            ),
        ]

        # Act
        findings = detect_read_no_response(
            ga="1/2/3", samples=samples, now=_ts(5.0)
        )

        # Assert
        assert findings == []

    def test_no_finding_when_window_not_yet_elapsed(self) -> None:
        # Arrange — Read um t=0, "now" 1 s spaeter (Window = 3 s nicht abgelaufen).
        samples = [
            TelegramSample(
                ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
        ]

        # Act
        findings = detect_read_no_response(
            ga="1/2/3", samples=samples, now=_ts(1.0)
        )

        # Assert — noch nicht ausgewertet (Response koennte gleich kommen).
        assert findings == []

    def test_finding_per_unanswered_read(self) -> None:
        # Arrange — drei separate Reads, keiner beantwortet.
        samples = [
            TelegramSample(
                ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
            TelegramSample(
                ts=_ts(10.0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
            TelegramSample(
                ts=_ts(20.0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
        ]

        # Act
        findings = detect_read_no_response(
            ga="1/2/3", samples=samples, now=_ts(30.0)
        )

        # Assert
        assert len(findings) == 3

    def test_only_response_to_a_specific_read_window_counts(self) -> None:
        # Arrange — zwei Reads (t=0, t=10), Response nur bei t=11
        # (innerhalb der Antwort-Spanne des zweiten Reads, NICHT des ersten).
        samples = [
            TelegramSample(
                ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
            TelegramSample(
                ts=_ts(10.0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
            TelegramSample(
                ts=_ts(11.0), value=1, telegramtype="GroupValueResponse",
                source="1.1.6",
            ),
        ]

        # Act
        findings = detect_read_no_response(
            ga="1/2/3", samples=samples, now=_ts(20.0)
        )

        # Assert — nur der erste Read bleibt unbeantwortet.
        assert len(findings) == 1
        assert findings[0].evidence["read_at"] == _ts(0).isoformat()

    def test_writes_do_not_count_as_response(self) -> None:
        # Arrange — Read + GroupValueWrite (kein Response).
        samples = [
            TelegramSample(
                ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
            TelegramSample(
                ts=_ts(0.5), value=1, telegramtype="GroupValueWrite", source="1.1.6"
            ),
        ]

        # Act
        findings = detect_read_no_response(
            ga="1/2/3", samples=samples, now=_ts(5.0)
        )

        # Assert
        assert len(findings) == 1

    def test_constant_is_3_seconds(self) -> None:
        # Decision: 3 s — siehe §3.1 F8 (KNX-Spec wiederholt 3x bei
        # fehlendem ACK, danach gilt das Telegramm als verloren).
        assert READ_NO_RESPONSE_TIMEOUT_SEC == 3.0
