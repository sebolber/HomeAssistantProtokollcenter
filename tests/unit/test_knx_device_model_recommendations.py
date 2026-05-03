"""Iter L2.1: Tests fuer die Modell-Recommendation-Tabelle (Layer 2)."""

from __future__ import annotations

from custom_components.messagehub.processing.knx_device_model_recommendations import (
    KNX_DEVICE_MODEL_RECOMMENDATIONS,
    ModelRecommendation,
    find_model_recommendation,
    reasoning_source,
)


# ---------------------------------------------------------------------------
# Lookup-Verhalten
# ---------------------------------------------------------------------------


def test_known_manufacturer_and_model_returns_entry() -> None:
    reco = find_model_recommendation("hoermann", "garage-control")
    assert reco is not None
    assert reco.manufacturer == "hoermann"
    assert reco.doc_url is not None


def test_case_insensitive_match() -> None:
    reco_lower = find_model_recommendation("hoermann", "garage-control")
    reco_mixed = find_model_recommendation("Hoermann", "Garage-Control")
    reco_upper = find_model_recommendation("HOERMANN", "GARAGE-CONTROL")
    assert reco_lower == reco_mixed == reco_upper


def test_glob_pattern_matches_variants() -> None:
    """Ein 'garage*'-Glob muss alle Varianten 'garage-pro', 'garage-x'
    abfangen — wir versprechen das im Plan."""
    a = find_model_recommendation("hoermann", "garage-pro")
    b = find_model_recommendation("hoermann", "garage-x")
    c = find_model_recommendation("hoermann", "garage-1")
    assert a is not None and b is not None and c is not None
    assert a is b is c


def test_unknown_manufacturer_returns_none() -> None:
    assert find_model_recommendation("acme", "xyz") is None


def test_unknown_model_returns_none() -> None:
    assert find_model_recommendation("hoermann", "tor-mini") is None


def test_none_inputs_return_none() -> None:
    assert find_model_recommendation(None, None) is None
    assert find_model_recommendation(None, "garage-control") is None
    assert find_model_recommendation("hoermann", None) is None


def test_empty_strings_return_none() -> None:
    assert find_model_recommendation("", "garage-control") is None
    assert find_model_recommendation("hoermann", "") is None


def test_whitespace_strip() -> None:
    assert find_model_recommendation(
        "  hoermann  ", "  garage-control  "
    ) is not None


# ---------------------------------------------------------------------------
# Tabellen-Konsistenz
# ---------------------------------------------------------------------------


def test_table_has_at_least_ten_entries() -> None:
    """Min-Coverage gemaess Plan: ~10 bekannte Modelle."""
    assert len(KNX_DEVICE_MODEL_RECOMMENDATIONS) >= 10


def test_all_entries_have_canonical_lowercase_manufacturer() -> None:
    """Tabelle wird gegen lowercase verglichen — Eintraege MUESSEN
    selbst lowercase sein, sonst greift der Match nicht."""
    for entry in KNX_DEVICE_MODEL_RECOMMENDATIONS:
        assert entry.manufacturer == entry.manufacturer.lower(), (
            f"Manufacturer {entry.manufacturer!r} ist nicht lowercase"
        )


def test_all_entries_have_rationale() -> None:
    """Reasoning-Eintrag ist Pflicht — Layer-2-Marker im Frontend zeigt
    sonst leere Bullets."""
    for entry in KNX_DEVICE_MODEL_RECOMMENDATIONS:
        assert entry.rationale, (
            f"Eintrag {entry.manufacturer}/{entry.model_glob} ohne rationale"
        )


def test_dataclass_immutable() -> None:
    """frozen=True schuetzt vor versehentlicher Mutation der Tabelle."""
    import pytest

    reco = find_model_recommendation("hoermann", "garage-control")
    assert reco is not None
    with pytest.raises(AttributeError):
        reco.manufacturer = "acme"  # type: ignore[misc]


def test_reasoning_source_marker() -> None:
    assert reasoning_source() == "device_model"


def test_dpt_overrides_carry_dpt_recommendation_objects() -> None:
    """Sub-Type-Konsistenz: Tabelle MUSS DptRecommendation-Instanzen
    enthalten, sonst zerbricht die Service-Pipeline beim Spread."""
    from custom_components.messagehub.processing.knx_dpt_recommendations import (
        DptRecommendation,
    )

    for entry in KNX_DEVICE_MODEL_RECOMMENDATIONS:
        for dpt, override in entry.dpt_overrides.items():
            assert isinstance(override, DptRecommendation), (
                f"{entry.manufacturer}/{dpt}: kein DptRecommendation"
            )


def test_glob_specificity_no_global_wildcards() -> None:
    """Schutz gegen versehentliches '*'-Glob: das wuerde JEDES Modell
    matchen und Layer-2-Override entwerten."""
    for entry in KNX_DEVICE_MODEL_RECOMMENDATIONS:
        assert entry.model_glob != "*", (
            f"Eintrag {entry.manufacturer} hat Wildcard-Glob — zu unspezifisch"
        )
