"""Iter 2: Recommendation-Engine fuer KNX-Stats."""

from __future__ import annotations

from custom_components.messagehub.processing.knx_stats import (
    Recommendation,
    build_recommendation,
)


class TestBuildRecommendation:
    def test_green_severity_returns_no_action_recommendation(self) -> None:
        rec = build_recommendation(dpt="9.001", rate=1.0, recommended=2.0)
        assert rec.severity == "green"
        assert rec.action_required is False
        assert "im erwarteten Bereich" in rec.text

    def test_red_severity_includes_dpt_specific_advice(self) -> None:
        rec = build_recommendation(dpt="9.004", rate=140.0, recommended=2.0)
        assert rec.severity == "red"
        assert rec.action_required is True
        assert "Helligkeit" in rec.text or "Lux" in rec.text

    def test_temperature_dpt_mentions_hysterese(self) -> None:
        rec = build_recommendation(dpt="9.001", rate=12.0, recommended=2.0)
        assert "Hysterese" in rec.text or "Sendezyklus" in rec.text

    def test_switch_dpt_mentions_loop(self) -> None:
        rec = build_recommendation(dpt="1.001", rate=30.0, recommended=1.0)
        assert "Schleife" in rec.text or "Toggle" in rec.text or "Aenderung" in rec.text

    def test_unknown_dpt_uses_generic_template(self) -> None:
        rec = build_recommendation(dpt="99.999", rate=20.0, recommended=5.0)
        assert rec.severity == "orange"
        assert "Unbekannte" in rec.text or "ETS" in rec.text

    def test_none_dpt_uses_generic_template(self) -> None:
        rec = build_recommendation(dpt=None, rate=20.0, recommended=5.0)
        assert "ETS" in rec.text or "Unbekannte" in rec.text

    def test_recommendation_includes_estimated_reduction(self) -> None:
        rec = build_recommendation(dpt="9.004", rate=100.0, recommended=2.0)
        assert rec.estimated_reduction_pct is not None
        assert 90 < rec.estimated_reduction_pct < 100

    def test_recommendation_no_reduction_for_green(self) -> None:
        rec = build_recommendation(dpt="9.001", rate=1.0, recommended=2.0)
        assert rec.estimated_reduction_pct is None

    def test_recommendation_includes_ratio(self) -> None:
        rec = build_recommendation(dpt="9.004", rate=10.0, recommended=2.0)
        assert rec.ratio == 5.0

    def test_recommendation_zero_recommended_with_rate(self) -> None:
        rec = build_recommendation(dpt="9.004", rate=1.0, recommended=0.0)
        assert rec.severity == "red"
        assert rec.ratio == float("inf")

    def test_dataclass_is_frozen(self) -> None:
        rec = build_recommendation(dpt="9.001", rate=1.0, recommended=2.0)
        try:
            rec.severity = "red"  # type: ignore[misc]
        except Exception:  # noqa: BLE001 — wir wollen jede Mutation blocken
            return
        raise AssertionError("Recommendation should be frozen")


class TestRecommendationDataclass:
    def test_has_required_fields(self) -> None:
        rec = Recommendation(
            severity="red",
            text="x",
            action_required=True,
            ratio=5.0,
            estimated_reduction_pct=80.0,
        )
        assert rec.severity == "red"
        assert rec.text == "x"
        assert rec.action_required is True
        assert rec.ratio == 5.0
        assert rec.estimated_reduction_pct == 80.0
