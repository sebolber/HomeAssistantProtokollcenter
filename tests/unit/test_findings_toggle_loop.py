"""Iter 17 (knx-findings): Detector `TOGGLE_LOOP`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F6.
Erkennt: DPT 1.001 alterniert in fester Frequenz mit Δt < 2 s ueber
mindestens 4 Zyklen — typisch fuer Schalt-Schleifen, in denen GA
sendend und hoerend gleichzeitig genutzt wird.

Severity: error (Schleifen sind nahezu nie gewollt; sie kosten
Bus-Zeit). Evidence: `{period_ms, cycles}`.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.toggle_loop import (
    TOGGLE_LOOP_MAX_PERIOD_SEC,
    TOGGLE_LOOP_MIN_CYCLES,
    detect_toggle_loop,
)
from custom_components.messagehub.processing.knx_stats import TelegramSample


def _ts(seconds: float) -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(seconds=seconds)


def _w(value: int, t: float) -> TelegramSample:
    return TelegramSample(
        ts=_ts(t), value=value, telegramtype="GroupValueWrite", source="1.1.5"
    )


class TestToggleLoopDetector:
    def test_toggle_loop_emits_finding_for_alternating_pattern(self) -> None:
        # Arrange — 0,1,0,1,0,1,0,1 mit Δt = 1 s -> 8 Werte = 4 Zyklen.
        samples = [_w(i % 2, i * 1.0) for i in range(8)]

        # Act
        finding = detect_toggle_loop(
            ga="1/2/3", dpt="1.001", samples=samples, now=_ts(8.0)
        )

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "TOGGLE_LOOP"
        assert finding.severity == "error"
        assert finding.ga == "1/2/3"
        assert finding.evidence["cycles"] >= TOGGLE_LOOP_MIN_CYCLES
        assert "period_ms" in finding.evidence

    def test_no_finding_when_not_alternating(self) -> None:
        # Arrange — alle 0en, keine Alternation.
        samples = [_w(0, i * 0.5) for i in range(20)]

        # Act
        finding = detect_toggle_loop(
            ga="1/2/3", dpt="1.001", samples=samples, now=_ts(10.0)
        )

        # Assert
        assert finding is None

    def test_no_finding_when_dpt_not_1001(self) -> None:
        # Arrange — alternierendes Muster bei DPT 9.001 ist kein Toggle.
        samples = [_w(i % 2, i * 1.0) for i in range(20)]

        # Act
        finding = detect_toggle_loop(
            ga="1/2/3", dpt="9.001", samples=samples, now=_ts(20.0)
        )

        # Assert
        assert finding is None

    def test_no_finding_when_period_too_long(self) -> None:
        # Arrange — Alternation mit Δt = 5 s -> ueber 2 s Schwelle.
        samples = [_w(i % 2, i * 5.0) for i in range(20)]

        # Act
        finding = detect_toggle_loop(
            ga="1/2/3", dpt="1.001", samples=samples, now=_ts(100.0)
        )

        # Assert
        assert finding is None

    def test_no_finding_with_too_few_cycles(self) -> None:
        # Arrange — nur 3 Wertwechsel (4 Werte) - Schwelle ist 4.
        samples = [_w(i % 2, i * 1.0) for i in range(4)]

        # Act
        finding = detect_toggle_loop(
            ga="1/2/3", dpt="1.001", samples=samples, now=_ts(4.0)
        )

        # Assert
        assert finding is None

    def test_finding_evidence_period_in_milliseconds(self) -> None:
        # Arrange — Δt = 1.5 s -> period_ms = 3000 (zwei Δt = ein Zyklus).
        samples = [_w(i % 2, i * 1.5) for i in range(8)]

        # Act
        finding = detect_toggle_loop(
            ga="1/2/3", dpt="1.001", samples=samples, now=_ts(12.0)
        )

        # Assert
        assert finding is not None
        assert finding.evidence["period_ms"] == 3000  # 1.5 s * 2 transitions

    def test_constant_min_cycles_is_4(self) -> None:
        # Decision: 4 Zyklen Schwelle, weil 8 alternierende Werte ueber
        # < 16 s eindeutig kein normaler Schalt-Use-Case sind.
        assert TOGGLE_LOOP_MIN_CYCLES == 4

    def test_constant_max_period_is_2_seconds(self) -> None:
        # Decision: 2 s, weil typische Manuell-Schaltungen ueber 2 s
        # auseinander liegen.
        assert TOGGLE_LOOP_MAX_PERIOD_SEC == 2.0
