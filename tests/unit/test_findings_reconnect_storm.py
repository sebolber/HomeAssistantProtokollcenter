"""Iter 20 (knx-findings): Detector `RECONNECT_STORM`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F13.
Erkennt: nach einer Bus-/Geraete-Stille von mindestens 60 s feuert eine
einzelne `knx_source` einen Burst (>= 10x normaler 30-s-Schnitt). Typisch
fuer reconnect-Floods nach Bus-Spannungsausfall.

Severity: warning (siehe §9.3 — Symptom, kein Bug; kann normal sein).
Evidence: `{silence_until, burst_count, normal_avg}`.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.reconnect_storm import (
    RECONNECT_STORM_BURST_FACTOR,
    RECONNECT_STORM_BURST_WINDOW_SEC,
    RECONNECT_STORM_SILENCE_SEC,
    detect_reconnect_storm,
)
from custom_components.messagehub.processing.knx_stats import TelegramSample


def _ts(seconds: float) -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(seconds=seconds)


def _w(t: float, source: str = "1.1.5") -> TelegramSample:
    return TelegramSample(
        ts=_ts(t), value=1, telegramtype="GroupValueWrite", source=source
    )


class TestReconnectStormDetector:
    def test_reconnect_storm_emits_finding_after_silence_followed_by_burst(
        self,
    ) -> None:
        # Arrange — Stille von t=0 bis t=120 (>60 s), dann Burst von 50
        # Telegrammen in 30 s.
        samples = [_w(0.0)]  # eine Aktivitaet vor der Stille
        samples.extend(_w(120.0 + i * 0.3) for i in range(50))  # Burst

        # Act
        finding = detect_reconnect_storm(
            source="1.1.5",
            samples=samples,
            now=_ts(150.0),
            normal_avg_per_30s=2.0,  # normal: 2 Telegramme pro 30 s
        )

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "RECONNECT_STORM"
        assert finding.severity == "warning"
        assert finding.source == "1.1.5"
        assert finding.evidence["burst_count"] >= 10 * 2  # >= factor * normal
        assert finding.evidence["normal_avg"] == 2.0
        assert "silence_until" in finding.evidence

    def test_no_finding_without_silence(self) -> None:
        # Arrange — kontinuierliche Aktivitaet, keine Pause.
        samples = [_w(t) for t in range(60)]

        # Act
        finding = detect_reconnect_storm(
            source="1.1.5", samples=samples, now=_ts(60.0),
            normal_avg_per_30s=2.0,
        )

        # Assert
        assert finding is None

    def test_no_finding_when_silence_is_short(self) -> None:
        # Arrange — Stille nur 30 s (< 60 s).
        samples = [_w(0.0)]
        samples.extend(_w(30.0 + i * 0.3) for i in range(50))

        # Act
        finding = detect_reconnect_storm(
            source="1.1.5", samples=samples, now=_ts(60.0),
            normal_avg_per_30s=2.0,
        )

        # Assert
        assert finding is None

    def test_no_finding_when_burst_below_factor(self) -> None:
        # Arrange — Stille >60 s, aber nach der Stille nur ein einzelnes
        # Telegramm — normal_avg=10 -> Faktor 10 nicht erreicht.
        samples = [_w(0.0)]
        samples.append(_w(120.0))

        # Act
        finding = detect_reconnect_storm(
            source="1.1.5", samples=samples, now=_ts(150.0),
            normal_avg_per_30s=10.0,
        )

        # Assert
        assert finding is None

    def test_no_finding_when_normal_avg_zero(self) -> None:
        # Arrange — keine Baseline => wir koennen keinen Faktor berechnen.
        samples = [_w(0.0), *[_w(120.0 + i * 0.3) for i in range(50)]]

        # Act
        finding = detect_reconnect_storm(
            source="1.1.5", samples=samples, now=_ts(150.0),
            normal_avg_per_30s=0.0,
        )

        # Assert — keine Finding bei fehlender Baseline (sonst Division
        # durch Null oder 100% False-Positives in frischen Installationen).
        assert finding is None

    def test_constants_per_decision(self) -> None:
        assert RECONNECT_STORM_SILENCE_SEC == 60.0
        assert RECONNECT_STORM_BURST_WINDOW_SEC == 30.0
        assert RECONNECT_STORM_BURST_FACTOR == 10.0

    def test_finding_evidence_silence_until_iso(self) -> None:
        # Arrange
        samples = [_w(0.0)]
        samples.extend(_w(120.0 + i * 0.3) for i in range(40))

        # Act
        finding = detect_reconnect_storm(
            source="1.1.5", samples=samples, now=_ts(150.0),
            normal_avg_per_30s=2.0,
        )

        # Assert
        assert finding is not None
        assert finding.evidence["silence_until"] == _ts(120.0).isoformat()
