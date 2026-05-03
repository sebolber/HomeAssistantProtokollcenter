"""Iter 21 (knx-findings): Detector `SEND_CYCLE_DRIFT`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F15.
Erkennt: der Median-Sendezyklus (`Δt zwischen aufeinanderfolgenden
Telegrammen`) der letzten 24 h ist ueber Nacht <= 50% des Medians der
letzten 7 Tage gefallen — Hinweis auf eine Sensorik, die ihren Sende-
Rhythmus drastisch verkuerzt.

Severity: info (siehe §9.3 — Trend-Hinweis, nicht akut).
Evidence: `{recent_median_dt, baseline_median_dt, ratio}`.
"""

from __future__ import annotations

from datetime import UTC, datetime

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.send_cycle_drift import (
    SEND_CYCLE_DRIFT_RATIO_THRESHOLD,
    detect_send_cycle_drift,
)


def _now() -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)


class TestSendCycleDriftDetector:
    def test_send_cycle_drift_emits_finding_when_median_dt_halved(self) -> None:
        # Arrange — Baseline 60 s, heute 25 s (< 50%).
        finding = detect_send_cycle_drift(
            ga="1/2/3",
            recent_median_dt_sec=25.0,
            baseline_median_dt_sec=60.0,
            now=_now(),
        )

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "SEND_CYCLE_DRIFT"
        assert finding.severity == "info"
        assert finding.ga == "1/2/3"
        assert finding.evidence["recent_median_dt"] == 25.0
        assert finding.evidence["baseline_median_dt"] == 60.0
        assert 0.4 < finding.evidence["ratio"] < 0.5

    def test_no_finding_when_recent_close_to_baseline(self) -> None:
        # Arrange — recent / baseline ~ 0.9 (kein Drift).
        finding = detect_send_cycle_drift(
            ga="1/2/3",
            recent_median_dt_sec=54.0,
            baseline_median_dt_sec=60.0,
            now=_now(),
        )
        assert finding is None

    def test_no_finding_when_recent_higher_than_baseline(self) -> None:
        # Arrange — Sendezyklus laenger geworden -> kein Drift-Symptom.
        finding = detect_send_cycle_drift(
            ga="1/2/3",
            recent_median_dt_sec=120.0,
            baseline_median_dt_sec=60.0,
            now=_now(),
        )
        assert finding is None

    def test_no_finding_when_baseline_zero(self) -> None:
        # Arrange — Baseline = 0 (keine Vorperiode-Daten) -> ratio
        # nicht berechenbar.
        finding = detect_send_cycle_drift(
            ga="1/2/3",
            recent_median_dt_sec=10.0,
            baseline_median_dt_sec=0.0,
            now=_now(),
        )
        assert finding is None

    def test_no_finding_when_recent_zero(self) -> None:
        # Arrange — recent=0 (keine Telegramme heute) -> kein Drift-Symptom,
        # eher Silence (anderer Detector).
        finding = detect_send_cycle_drift(
            ga="1/2/3",
            recent_median_dt_sec=0.0,
            baseline_median_dt_sec=60.0,
            now=_now(),
        )
        assert finding is None

    def test_finding_at_exact_threshold(self) -> None:
        # Arrange — recent = 30, baseline = 60 -> ratio = 0.5 (exakt
        # Schwelle).
        finding = detect_send_cycle_drift(
            ga="1/2/3",
            recent_median_dt_sec=30.0,
            baseline_median_dt_sec=60.0,
            now=_now(),
        )
        assert finding is not None  # inklusiv

    def test_threshold_is_50_percent(self) -> None:
        assert SEND_CYCLE_DRIFT_RATIO_THRESHOLD == 0.5
