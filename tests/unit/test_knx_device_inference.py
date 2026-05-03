"""Iter L2.3: Auto-Inferenz-Tests (HA-frei)."""

from __future__ import annotations

from custom_components.messagehub.processing.knx_device_inference import (
    infer_manufacturer_from_labels,
)


def test_empty_labels_returns_none() -> None:
    assert infer_manufacturer_from_labels([]) is None
    assert infer_manufacturer_from_labels([""]) is None
    assert infer_manufacturer_from_labels(["", "  "]) is None


def test_clear_match_to_known_manufacturer() -> None:
    result = infer_manufacturer_from_labels(
        ["Hoermann Tor Klima Temp", "Hoermann Tor Klima Feuchte"]
    )
    assert result == "hoermann"


def test_umlaut_normalization() -> None:
    """KNX_MANUFACTURER_HINTS hat 'hörmann' als Key — Inferenz muss
    'hoermann' (canonical) zurueckgeben."""
    result = infer_manufacturer_from_labels(["Hörmann Garage"])
    assert result == "hoermann"


def test_multiple_matches_return_none_safety() -> None:
    """Sicherheit: zwei Hersteller im Label-Salat -> kein Vorschlag.
    Wir wollen nicht raten, sonst greift Layer 2 falsch."""
    result = infer_manufacturer_from_labels(
        ["Hoermann Tor", "MDT Aktor"]
    )
    assert result is None


def test_no_match_returns_none() -> None:
    assert infer_manufacturer_from_labels(
        ["Wohnzimmer Licht", "Schalter"]
    ) is None


def test_case_insensitive() -> None:
    assert infer_manufacturer_from_labels(["mDt-Sensor"]) == "mdt"


def test_match_inside_label_text() -> None:
    """Nicht nur exakte Label-Werte, auch Sub-String-Match —
    'Sensor MDT-AKM-04' triggert."""
    assert infer_manufacturer_from_labels(["Sensor MDT-AKM-04"]) == "mdt"


def test_empty_strings_filtered() -> None:
    """Leere Strings im Array duerfen den Match nicht stoeren."""
    assert infer_manufacturer_from_labels(["", "Hoermann Tor", ""]) == "hoermann"
