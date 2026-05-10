"""Iter 14 (knx-findings): Phase-2-Translations sind in allen Sprachen vorhanden.

Vertrag aus `docs/messagehub_knx_konfigurationsfehler_recherche.md` §9.7.
Statisch via JSON-Inspektion — kein HA-Stack noetig.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

_TRANSLATIONS_DIR = (
    Path(__file__).resolve().parents[2] / "custom_components" / "messagehub" / "translations"
)
_PHASE2_CODES = ("DPT_MISMATCH", "VALUE_OUT_OF_RANGE")
_PHASE3_CODES = (
    "MULTI_RESPONDER",
    "READ_NO_RESPONSE",
    "TOGGLE_LOOP",
    "MULTI_TIME_MASTER",
)
_PHASE4_CODES = (
    "RECONNECT_STORM",
    "SEND_CYCLE_DRIFT",
    "REPEAT_APPROXIMATION",
)
# Iter 31 (Phase 7): komplexer Letzter Detector + i18n.
_PHASE7_CODES = ("SEND_TO_NOWHERE",)
_LANGS = ("de", "en", "es", "fr", "it", "nl")


@pytest.mark.parametrize("lang", _LANGS)
def test_translations_valid_json(lang: str) -> None:
    path = _TRANSLATIONS_DIR / f"{lang}.json"
    assert path.exists(), f"Translation file fuer {lang} fehlt"
    json.loads(path.read_text(encoding="utf-8"))


@pytest.mark.parametrize("lang", _LANGS)
@pytest.mark.parametrize(
    "code",
    _PHASE2_CODES + _PHASE3_CODES + _PHASE4_CODES + _PHASE7_CODES,
)
def test_finding_translation_has_required_keys_for_each_lang(lang: str, code: str) -> None:
    path = _TRANSLATIONS_DIR / f"{lang}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    codes = data.get("findings", {}).get("codes", {})
    assert code in codes, f"{code} fehlt in {lang}.json"
    entry = codes[code]
    for key in ("title", "description", "help_url"):
        assert key in entry, f"{lang}.json -> {code} fehlt Key {key!r}"
        assert entry[key], f"{lang}.json -> {code}.{key} ist leer"


def test_finding_translation_resolves_all_phase3_codes() -> None:
    """Iter 19: alle Phase-3-Codes sind in DE und EN gepflegt.

    Spiegelt das Test-zuerst-Artefakt aus §9.9 Iter 19. Pruefen wir
    explizit die Description-Platzhalter, weil ein leeres Template
    sonst stillschweigend durchrutschen wuerde.
    """
    de = json.loads((_TRANSLATIONS_DIR / "de.json").read_text(encoding="utf-8"))
    en = json.loads((_TRANSLATIONS_DIR / "en.json").read_text(encoding="utf-8"))
    expected_placeholders = {
        "MULTI_RESPONDER": ("{count}", "{window_ms}", "{responding_sources}"),
        "READ_NO_RESPONSE": ("{read_at}", "{timeout_sec}"),
        "TOGGLE_LOOP": ("{period_ms}", "{cycles}"),
        "MULTI_TIME_MASTER": ("{sources}", "{clock_dpt}"),
    }
    for code, placeholders in expected_placeholders.items():
        de_entry = de["findings"]["codes"][code]
        en_entry = en["findings"]["codes"][code]
        # Title: DE/EN unterschiedlich, beide nicht leer.
        assert de_entry["title"]
        assert en_entry["title"]
        assert de_entry["title"] != en_entry["title"], (
            f"{code} hat identische Titel in DE und EN — vermutlich kopiert"
        )
        # Description enthaelt alle Evidence-Platzhalter.
        for placeholder in placeholders:
            assert placeholder in de_entry["description"], (
                f"DE.{code} fehlt Platzhalter {placeholder}"
            )
            assert placeholder in en_entry["description"], (
                f"EN.{code} fehlt Platzhalter {placeholder}"
            )


def test_finding_translation_resolves_all_phase4_codes() -> None:
    """Iter 23: alle Phase-4-Codes sind in DE und EN gepflegt."""
    de = json.loads((_TRANSLATIONS_DIR / "de.json").read_text(encoding="utf-8"))
    en = json.loads((_TRANSLATIONS_DIR / "en.json").read_text(encoding="utf-8"))
    expected_placeholders = {
        "RECONNECT_STORM": (
            "{silence_until}",
            "{burst_count}",
            "{normal_avg}",
            "{factor}",
        ),
        "SEND_CYCLE_DRIFT": (
            "{recent_median_dt}",
            "{baseline_median_dt}",
            "{ratio}",
        ),
        "REPEAT_APPROXIMATION": (
            "{total_repeats}",
            "{period_days}",
            "{repeats_per_day}",
        ),
    }
    for code, placeholders in expected_placeholders.items():
        de_entry = de["findings"]["codes"][code]
        en_entry = en["findings"]["codes"][code]
        assert de_entry["title"] != en_entry["title"], f"{code} hat identische Titel in DE und EN"
        for placeholder in placeholders:
            assert placeholder in de_entry["description"], (
                f"DE.{code} fehlt Platzhalter {placeholder}"
            )
            assert placeholder in en_entry["description"], (
                f"EN.{code} fehlt Platzhalter {placeholder}"
            )


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
