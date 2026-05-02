"""Iter 34: Hersteller-Hinweise via Substring-Match."""

from __future__ import annotations

from custom_components.messagehub.processing.knx_manufacturer import (
    lookup_manufacturer_hints,
)


class TestLookup:
    def test_none_returns_none(self) -> None:
        assert lookup_manufacturer_hints(None) is None

    def test_empty_string_returns_none(self) -> None:
        assert lookup_manufacturer_hints("") is None

    def test_unknown_returns_none(self) -> None:
        assert lookup_manufacturer_hints("FantasyKnxCorp") is None

    def test_exact_match_hoermann(self) -> None:
        h = lookup_manufacturer_hints("hörmann")
        assert h is not None
        assert h["matched_key"] == "hörmann"
        assert "doc_url" in h
        assert isinstance(h["tips"], list)
        assert len(h["tips"]) > 0

    def test_substring_match_full_company_name(self) -> None:
        h = lookup_manufacturer_hints("Hörmann KG Verkaufsgesellschaft")
        assert h is not None
        assert h["matched_key"] == "hörmann"

    def test_substring_match_mdt_full_name(self) -> None:
        h = lookup_manufacturer_hints("MDT technologies")
        assert h is not None
        assert h["matched_key"] == "mdt"

    def test_case_insensitive(self) -> None:
        h = lookup_manufacturer_hints("HAGER ELECTRO")
        assert h is not None
        assert h["matched_key"] == "hager"

    def test_returns_independent_tips_list(self) -> None:
        h1 = lookup_manufacturer_hints("hörmann")
        h2 = lookup_manufacturer_hints("hörmann")
        assert h1 is not None and h2 is not None
        # Veraendern eines Ergebnisses darf nicht die Knowledge-Base ueberschreiben
        h1["tips"].append("manipuliert")
        assert "manipuliert" not in h2["tips"]
