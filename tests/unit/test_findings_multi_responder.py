"""Iter 15 (knx-findings): Detector `MULTI_RESPONDER`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F2.
Erkennt: >=2 unterschiedliche `knx_source` antworten innerhalb eines
kurzen Fensters auf dieselbe GA. Schliesst meist auf mehrere Aktoren
mit gesetztem L-Flag.

Severity: warning (siehe §9.3 — kann beabsichtigt sein, z. B. parallele
Aktoren). Evidence: `{responding_sources: [...]}` plus Zeit-Fenster.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.multi_responder import (
    detect_multi_responder,
)
from custom_components.messagehub.processing.knx_stats import TelegramSample


def _ts(seconds: float) -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(seconds=seconds)


def _r(source: str, t: float) -> TelegramSample:
    return TelegramSample(
        ts=_ts(t), value=1, telegramtype="GroupValueResponse", source=source,
    )


class TestMultiResponderDetector:
    def test_multi_responder_emits_finding_when_two_sources_respond_to_one_read(
        self,
    ) -> None:
        # Arrange — Read + zwei unterschiedliche Sources antworten innerhalb 200ms.
        samples = [
            TelegramSample(
                ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.10"
            ),
            _r("1.1.5", 0.05),
            _r("1.1.6", 0.10),
        ]

        # Act
        finding = detect_multi_responder(ga="1/2/3", samples=samples, now=_ts(0))

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "MULTI_RESPONDER"
        assert finding.severity == "warning"
        assert finding.ga == "1/2/3"
        assert sorted(finding.evidence["responding_sources"]) == ["1.1.5", "1.1.6"]

    def test_no_finding_when_single_source_responds(self) -> None:
        # Arrange — beide Responses kommen von derselben Source.
        samples = [
            _r("1.1.5", 0.05),
            _r("1.1.5", 0.10),
            _r("1.1.5", 0.15),
        ]

        # Act
        finding = detect_multi_responder(ga="1/2/3", samples=samples, now=_ts(0))

        # Assert
        assert finding is None

    def test_no_finding_when_responses_outside_window(self) -> None:
        # Arrange — zwei Sources antworten, aber zeitlich weit auseinander.
        samples = [
            _r("1.1.5", 0.0),
            _r("1.1.6", 5.0),  # 5s Lueck — getrennte "Antworten".
        ]

        # Act
        finding = detect_multi_responder(ga="1/2/3", samples=samples, now=_ts(5.0))

        # Assert
        assert finding is None

    def test_evidence_contains_window_and_count(self) -> None:
        # Arrange
        samples = [
            _r("1.1.5", 0.0),
            _r("1.1.6", 0.05),
            _r("1.1.7", 0.15),
        ]

        # Act
        finding = detect_multi_responder(ga="1/2/3", samples=samples, now=_ts(0.15))

        # Assert
        assert finding is not None
        assert sorted(finding.evidence["responding_sources"]) == [
            "1.1.5",
            "1.1.6",
            "1.1.7",
        ]
        assert finding.evidence["count"] == 3
        assert "window_ms" in finding.evidence

    def test_only_response_telegrams_count(self) -> None:
        # Arrange — Reads + Writes von vielen Sources sollten nicht zaehlen.
        samples = [
            TelegramSample(
                ts=_ts(0), value=None, telegramtype="GroupValueRead", source="1.1.5"
            ),
            TelegramSample(
                ts=_ts(0.05), value=1, telegramtype="GroupValueWrite", source="1.1.6"
            ),
        ]

        # Act
        finding = detect_multi_responder(ga="1/2/3", samples=samples, now=_ts(0.05))

        # Assert
        assert finding is None

    def test_detector_version_is_v1(self) -> None:
        # Arrange
        samples = [_r("1.1.5", 0.0), _r("1.1.6", 0.05)]
        # Act
        finding = detect_multi_responder(ga="1/2/3", samples=samples, now=_ts(0.05))
        # Assert
        assert finding is not None
        assert finding.detector_version == "MULTI_RESPONDER/v1"
