"""Iter L1.0: Tests fuer die DPT-Recommendation-Tabelle.

Pure-data-Tests — keine Repos, keine I/O, keine Async-Pfade. Sehr
schneller Lauf, hoeren als Sicherheitsnetz fuer die Konsistenz der
Tabelle und das Fallback-Verhalten.
"""

from __future__ import annotations

import pytest

from custom_components.messagehub.processing.knx_dpt_recommendations import (
    KNX_DPT_RECOMMENDATIONS,
    DptRecommendation,
    recommend_for_dpt,
    reasoning_source,
)


def test_known_dpt_returns_recommendation_for_temperature() -> None:
    reco = recommend_for_dpt("9.001")
    assert reco is not None
    assert reco.mode == "hybrid"
    assert reco.cycle_minutes_min == 5
    assert reco.cycle_minutes_max == 15
    assert reco.hysteresis is not None and "K" in reco.hysteresis


def test_known_dpt_returns_on_change_for_switch() -> None:
    reco = recommend_for_dpt("1.001")
    assert reco is not None
    assert reco.mode == "on_change"
    assert reco.cycle_minutes_min is None
    assert reco.hysteresis is None


def test_known_dpt_returns_cyclic_for_date() -> None:
    reco = recommend_for_dpt("11.001")
    assert reco is not None
    assert reco.mode == "cyclic"
    assert reco.cycle_minutes_min == 720
    assert reco.cycle_minutes_max == 1440


def test_unknown_dpt_returns_none() -> None:
    assert recommend_for_dpt("99.999") is None


def test_empty_or_none_dpt_returns_none() -> None:
    assert recommend_for_dpt(None) is None
    assert recommend_for_dpt("") is None


def test_main_type_fallback_for_9x() -> None:
    """9.123 ist nicht direkt gemappt, aber ``9.x``-Familien-Default
    sollte greifen."""
    reco = recommend_for_dpt("9.123")
    assert reco is not None
    assert reco.mode == "hybrid"
    # Familie 9.x hat den generischen Hysterese-Hinweis
    assert reco.hysteresis is not None
    assert "Datenblatt" in reco.hysteresis


def test_inferred_9x_family_marker_resolves() -> None:
    """``infer_dpt_from_samples`` gibt fuer Float-Samples ``9.x``
    zurueck — der Lookup muss das direkt als Familien-Default
    interpretieren (kein Family-Regex-Match noetig)."""
    reco = recommend_for_dpt("9.x")
    assert reco is not None
    assert reco.mode == "hybrid"


def test_main_type_fallback_for_13x_counter() -> None:
    reco = recommend_for_dpt("13.077")
    assert reco is not None
    assert reco.mode == "cyclic"


def test_invalid_format_returns_none() -> None:
    """Strings ohne ``.<sub>``-Format fallen durch das Family-Regex."""
    assert recommend_for_dpt("9") is None
    assert recommend_for_dpt("foo") is None
    assert recommend_for_dpt("1.2.3") is None


def test_recommendation_is_immutable() -> None:
    """``frozen=True`` macht das Dataclass-Objekt unveraenderbar —
    schuetzt vor versehentlicher Mutation der Modul-Tabelle."""
    reco = recommend_for_dpt("9.001")
    assert reco is not None
    with pytest.raises(AttributeError):
        reco.mode = "cyclic"  # type: ignore[misc]


def test_table_covers_all_existing_recommended_rates() -> None:
    """Konsistenz mit ``KNX_RECOMMENDED_RATES_PER_MIN`` (Iter 1).

    Jeder explizit gemappte DPT in der alten Rate-Tabelle muss auch
    in der neuen Recommendation-Tabelle einen Eintrag haben — sonst
    wuerde ein User mit DPT X ploetzlich keine Empfehlung mehr sehen,
    wo vorher eine Rate galt.
    """
    from custom_components.messagehub.const import KNX_RECOMMENDED_RATES_PER_MIN

    for dpt in KNX_RECOMMENDED_RATES_PER_MIN:
        if dpt == "_default":
            continue
        reco = recommend_for_dpt(dpt)
        assert reco is not None, f"DPT {dpt} fehlt in KNX_DPT_RECOMMENDATIONS"


def test_max_rate_consistent_with_old_table() -> None:
    """Die Empfehlungs-``max_rate_per_min`` darf nicht groesser sein als
    der existierende ``KNX_RECOMMENDED_RATES_PER_MIN``-Wert — sonst
    waere die neue Empfehlung lascher als die alte Severity-Schwelle
    und der ``classify_severity``-Pfad wuerde mit unserer Empfehlung
    in Widerspruch geraten.
    """
    from custom_components.messagehub.const import KNX_RECOMMENDED_RATES_PER_MIN

    for dpt, reco in KNX_DPT_RECOMMENDATIONS.items():
        if dpt.endswith(".x"):
            continue  # Familien-Defaults haben keinen Pendant-Eintrag
        old = KNX_RECOMMENDED_RATES_PER_MIN.get(dpt)
        if old is None:
            continue
        assert reco.max_rate_per_min <= old, (
            f"DPT {dpt}: neue max_rate_per_min ({reco.max_rate_per_min}) "
            f"> alte recommended_rate ({old})"
        )


def test_reasoning_source_is_dpt_standard() -> None:
    assert reasoning_source() == "dpt_standard"


def test_dataclass_typed_correctly() -> None:
    """Smoke: dass der Dataclass-Constructor mit allen Feldern
    konstruiert (keine Renaming-Drift zur Tabelle)."""
    reco = DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=None,
        max_rate_per_min=1.0,
        rationale="test",
    )
    assert reco.mode == "on_change"
