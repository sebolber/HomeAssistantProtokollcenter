"""Iter 22 (knx-findings): Detector `REPEAT_APPROXIMATION`.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §3.1 F4.
Approximiert das Repeat-Bit, das wir ohne xknx-Layer-2-Zugriff nicht
sehen: identisches Telegramm Δt < 100 ms auf gleicher GA = vermutete
Wiederholung. Zaehlt diese pro Tag und liefert ein Finding, wenn die
Anzahl ueber dem Schwellwert liegt.

Severity: warning (siehe §9.3 — Approximation, nicht Wahrheit, deshalb
mild). Evidence: `{repeats_per_day, total_repeats, period_days}`.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.findings.repeat_approximation import (
    REPEAT_APPROXIMATION_MIN_PER_DAY,
    REPEAT_APPROXIMATION_WINDOW_MS,
    detect_repeat_approximation,
)
from custom_components.messagehub.processing.knx_stats import TelegramSample


def _ts(seconds: float) -> datetime:
    return datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) + timedelta(seconds=seconds)


def _w(value: object, t: float) -> TelegramSample:
    return TelegramSample(
        ts=_ts(t), value=value, telegramtype="GroupValueWrite", source="1.1.5"
    )


class TestRepeatApproximationDetector:
    def test_repeat_approximation_counts_doubles_within_100ms_window(self) -> None:
        # Arrange — 5 Doubles (10 Telegramme) mit Δt = 50 ms auf einem
        # einzelnen Tag.
        samples: list[TelegramSample] = []
        for i in range(5):
            samples.append(_w(1, i * 60.0))           # primary
            samples.append(_w(1, i * 60.0 + 0.05))     # repeat <100ms
        period_days = 1.0

        # Act
        finding = detect_repeat_approximation(
            ga="1/2/3",
            samples=samples,
            period_days=period_days,
            now=_ts(300.0),
        )

        # Assert
        assert isinstance(finding, Finding)
        assert finding.code == "REPEAT_APPROXIMATION"
        assert finding.severity == "warning"
        assert finding.evidence["total_repeats"] == 5
        assert finding.evidence["repeats_per_day"] == 5.0
        assert finding.evidence["period_days"] == 1.0

    def test_no_finding_when_repeats_below_threshold(self) -> None:
        # Arrange — nur 2 Doubles (unter Schwelle 5/Tag).
        samples = [_w(1, 0.0), _w(1, 0.05), _w(1, 60.0), _w(1, 60.05)]
        finding = detect_repeat_approximation(
            ga="1/2/3", samples=samples, period_days=1.0, now=_ts(120.0),
        )
        assert finding is None

    def test_no_finding_when_values_differ(self) -> None:
        # Arrange — schnelle Aufeinanderfolge, aber mit unterschiedlichen
        # Werten -> keine Wiederholung.
        samples = [_w(1, 0.0), _w(0, 0.05), _w(1, 0.10), _w(0, 0.15)]
        finding = detect_repeat_approximation(
            ga="1/2/3", samples=samples, period_days=1.0, now=_ts(0.15),
        )
        assert finding is None

    def test_no_finding_when_window_too_long(self) -> None:
        # Arrange — gleiche Werte, aber Δt = 200 ms (>100 ms Schwelle).
        samples = [_w(1, 0.0), _w(1, 0.20), _w(1, 0.40), _w(1, 0.60),
                   _w(1, 0.80), _w(1, 1.00), _w(1, 1.20), _w(1, 1.40),
                   _w(1, 1.60), _w(1, 1.80)]
        finding = detect_repeat_approximation(
            ga="1/2/3", samples=samples, period_days=1.0, now=_ts(1.80),
        )
        assert finding is None

    def test_repeats_per_day_normalized_to_period(self) -> None:
        # Arrange — 5 Doubles in einer halben Tag-Periode.
        samples: list[TelegramSample] = []
        for i in range(5):
            samples.append(_w(1, i * 100.0))
            samples.append(_w(1, i * 100.0 + 0.05))

        # Act — period_days = 0.5 -> repeats_per_day = 10.
        finding = detect_repeat_approximation(
            ga="1/2/3", samples=samples, period_days=0.5, now=_ts(500.0),
        )

        # Assert
        assert finding is not None
        assert finding.evidence["repeats_per_day"] == 10.0
        assert finding.evidence["total_repeats"] == 5

    def test_constants_per_decision(self) -> None:
        # Decision: 100 ms = wir koennen Repeat-Bit nicht sehen, aber
        # KNX-Spec erlaubt 50 ms zwischen Wiederholungen — 100 ms gibt
        # uns Toleranz fuer Bus-Last-Schwankungen.
        assert REPEAT_APPROXIMATION_WINDOW_MS == 100
        # Decision: 5 pro Tag = praktischer Schwellwert; einzelne
        # Spurioses passieren auch in gesunden Anlagen, gehaeuft sind
        # sie verdaechtig.
        assert REPEAT_APPROXIMATION_MIN_PER_DAY == 5.0

    def test_detector_only_inspects_writes(self) -> None:
        # Arrange — Reads zaehlen NICHT (sie haben keinen "Wert").
        samples = [
            TelegramSample(ts=_ts(0), value=None,
                           telegramtype="GroupValueRead", source="1.1.5"),
            TelegramSample(ts=_ts(0.05), value=None,
                           telegramtype="GroupValueRead", source="1.1.5"),
        ] * 10
        finding = detect_repeat_approximation(
            ga="1/2/3", samples=samples, period_days=1.0, now=_ts(0.5),
        )
        assert finding is None
