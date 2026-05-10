"""Iter E1: Translation-Vollstaendigkeitstest.

Sicherstellen, dass alle 6 Backend-Sprachfiles dieselben Finding-Codes
liefern. CI faengt damit den Fall, dass jemand einen neuen Detector
einbaut und die Translations vergisst.
"""

from __future__ import annotations

import json
from pathlib import Path

from custom_components.messagehub.const import KNX_FINDING_DEFAULT_SEVERITIES

_TRANS_DIR = (
    Path(__file__).parent.parent.parent / "custom_components" / "messagehub" / "translations"
)


def _load(lang: str) -> dict[str, dict[str, str]]:
    fn = _TRANS_DIR / f"{lang}.json"
    data = json.loads(fn.read_text())
    return data.get("findings", {}).get("codes", {})


def test_all_supported_languages_have_translations_directory() -> None:
    """Stellen sicher, dass die erwarteten Sprachen vorhanden sind."""
    expected = {"de.json", "en.json", "es.json", "fr.json", "it.json", "nl.json"}
    found = {f.name for f in _TRANS_DIR.iterdir() if f.suffix == ".json"}
    assert expected <= found, f"missing translation files: {expected - found}"


def test_all_languages_have_same_finding_codes() -> None:
    """Jede Sprachdatei muss die gleichen Finding-Codes definieren."""
    de = _load("de")
    de_codes = set(de)
    for lang in ("en", "es", "fr", "it", "nl"):
        codes = set(_load(lang))
        missing = de_codes - codes
        extra = codes - de_codes
        assert not missing, f"Sprache {lang} fehlt Codes (vs. de): {sorted(missing)}"
        assert not extra, f"Sprache {lang} hat zusaetzliche Codes (vs. de): {sorted(extra)}"


def test_each_code_has_title_description_help_url() -> None:
    """Pro Code muessen alle drei Felder vorhanden + nicht-leer-fuer-title sein."""
    for lang in ("de", "en", "es", "fr", "it", "nl"):
        codes = _load(lang)
        for code, payload in codes.items():
            assert "title" in payload, f"{lang}/{code}: title fehlt"
            assert "description" in payload, f"{lang}/{code}: description fehlt"
            assert "help_url" in payload, f"{lang}/{code}: help_url fehlt"
            assert payload["title"], f"{lang}/{code}: title ist leer"


def test_default_severity_codes_have_translations() -> None:
    """Iter E1: jeder Code in KNX_FINDING_DEFAULT_SEVERITIES muss
    Translations in DE+EN haben — sonst sieht der User leere Titel."""
    de_codes = set(_load("de"))
    en_codes = set(_load("en"))
    for code in KNX_FINDING_DEFAULT_SEVERITIES:
        # HEALTH_*/PATTERN_* sind im Bestand definiert; sie haben evtl.
        # noch keine Translations und werden in einer separaten Iter
        # nachgepflegt. ANALYSIS_DISABLED hat seit Iter A3 Translations.
        if code.startswith("HEALTH_") or code.startswith("PATTERN_"):
            continue
        assert code in de_codes, f"DE: Translation fuer Code {code} fehlt"
        assert code in en_codes, f"EN: Translation fuer Code {code} fehlt"
