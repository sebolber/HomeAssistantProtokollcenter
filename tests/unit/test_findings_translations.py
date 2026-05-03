"""Iter 14 (knx-findings): Phase-2-Translations sind in allen Sprachen vorhanden.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.7.
Statisch via JSON-Inspektion — kein HA-Stack noetig.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

_TRANSLATIONS_DIR = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "messagehub"
    / "translations"
)
_PHASE2_CODES = ("DPT_MISMATCH", "VALUE_OUT_OF_RANGE")
_LANGS = ("de", "en", "es", "fr", "it", "nl")


@pytest.mark.parametrize("lang", _LANGS)
def test_translations_valid_json(lang: str) -> None:
    path = _TRANSLATIONS_DIR / f"{lang}.json"
    assert path.exists(), f"Translation file fuer {lang} fehlt"
    json.loads(path.read_text(encoding="utf-8"))


@pytest.mark.parametrize("lang", _LANGS)
@pytest.mark.parametrize("code", _PHASE2_CODES)
def test_finding_translation_has_required_keys_for_each_lang(
    lang: str, code: str
) -> None:
    path = _TRANSLATIONS_DIR / f"{lang}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    codes = data.get("findings", {}).get("codes", {})
    assert code in codes, f"{code} fehlt in {lang}.json"
    entry = codes[code]
    for key in ("title", "description", "help_url"):
        assert key in entry, f"{lang}.json -> {code} fehlt Key {key!r}"
        assert entry[key], f"{lang}.json -> {code}.{key} ist leer"


def test_finding_translation_resolves_for_dpt_mismatch_de_and_en() -> None:
    """Test-zuerst-Artefakt aus §9.9 Iter 14.

    Stellt sicher, dass DPT_MISMATCH in DE und EN unterschiedliche, nicht
    leere Strings hat — und dass die Description die wesentlichen
    Evidence-Platzhalter enthaelt.
    """
    de = json.loads((_TRANSLATIONS_DIR / "de.json").read_text(encoding="utf-8"))
    en = json.loads((_TRANSLATIONS_DIR / "en.json").read_text(encoding="utf-8"))
    de_entry = de["findings"]["codes"]["DPT_MISMATCH"]
    en_entry = en["findings"]["codes"]["DPT_MISMATCH"]

    # Title: DE/EN unterschiedlich (kein Copy-Paste-Fehler).
    assert de_entry["title"] != en_entry["title"]
    # Description enthaelt die Evidence-Platzhalter aus §9.6.
    for placeholder in ("{inferred_dpt}", "{project_dpt}", "{samples}", "{confidence}"):
        assert placeholder in de_entry["description"], f"DE missing {placeholder}"
        assert placeholder in en_entry["description"], f"EN missing {placeholder}"
    # Help-URL zeigt auf die KNX-Doku.
    assert de_entry["help_url"].startswith("https://support.knx.org/")
    assert en_entry["help_url"].startswith("https://support.knx.org/")
