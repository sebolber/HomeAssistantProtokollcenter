"""Iter 1: classify_severity + recommended_rate_for (KNX-Statistik)."""

from __future__ import annotations

from custom_components.messagehub.const import KNX_RECOMMENDED_RATES_PER_MIN
from custom_components.messagehub.processing.knx_stats import (
    classify_severity,
    recommended_rate_for,
)


class TestClassifySeverity:
    def test_at_recommended_returns_green(self) -> None:
        assert classify_severity(rate=2.0, recommended=2.0) == "green"

    def test_below_recommended_returns_green(self) -> None:
        assert classify_severity(rate=1.0, recommended=2.0) == "green"

    def test_slightly_above_returns_yellow(self) -> None:
        assert classify_severity(rate=2.5, recommended=2.0) == "yellow"

    def test_double_recommended_returns_yellow(self) -> None:
        assert classify_severity(rate=4.0, recommended=2.0) == "yellow"

    def test_triple_recommended_returns_orange(self) -> None:
        assert classify_severity(rate=6.0, recommended=2.0) == "orange"

    def test_5x_recommended_returns_orange(self) -> None:
        assert classify_severity(rate=10.0, recommended=2.0) == "orange"

    def test_above_5x_returns_red(self) -> None:
        assert classify_severity(rate=20.0, recommended=2.0) == "red"

    def test_zero_rate_returns_green(self) -> None:
        assert classify_severity(rate=0.0, recommended=2.0) == "green"

    def test_zero_recommended_with_active_rate_returns_red(self) -> None:
        assert classify_severity(rate=0.5, recommended=0.0) == "red"

    def test_zero_rate_zero_recommended_returns_green(self) -> None:
        assert classify_severity(rate=0.0, recommended=0.0) == "green"


class TestRecommendedRateFor:
    def test_known_temperature_dpt(self) -> None:
        assert recommended_rate_for("9.001") == KNX_RECOMMENDED_RATES_PER_MIN["9.001"]

    def test_known_brightness_dpt(self) -> None:
        assert recommended_rate_for("9.004") == KNX_RECOMMENDED_RATES_PER_MIN["9.004"]

    def test_unknown_dpt_uses_default(self) -> None:
        assert recommended_rate_for("99.999") == KNX_RECOMMENDED_RATES_PER_MIN["_default"]

    def test_none_dpt_uses_default(self) -> None:
        assert recommended_rate_for(None) == KNX_RECOMMENDED_RATES_PER_MIN["_default"]

    def test_empty_string_uses_default(self) -> None:
        assert recommended_rate_for("") == KNX_RECOMMENDED_RATES_PER_MIN["_default"]
