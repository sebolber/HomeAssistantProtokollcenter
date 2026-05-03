"""Iter L2.1 (Sprint Recommendations / Phase 9): Modell-spezifische
Empfehlungs-Overrides.

Layer 2 der Recommendation-Engine. Eine kuratierte Tabelle ordnet
``(manufacturer, model_glob)`` einer ``ModelRecommendation`` zu —
die wiederum einzelne DPT-Empfehlungen ueberschreibt.

Quellen fuer die Eintraege:
- ``KNX_MANUFACTURER_HINTS`` (const.py) — bereits gepflegte
  Hersteller-Hinweise.
- KNX-Forum + ETS-Manuals (Hoermann, MDT, Hager, Gira, ABB, Theben,
  Busch-Jaeger, Zennio, Elsner).

Lookup ist case-insensitive auf manufacturer (lowercase) +
fnmatch-Glob auf model. Beim Ergaenzen die Glob-Eintraege so eng
wie moeglich halten — `garage*` ist akzeptabel, `*` waere zu breit.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from fnmatch import fnmatch
from typing import Final

from .knx_dpt_recommendations import DptRecommendation


_SOURCE: Final = "device_model"
"""Reasoning-Layer-Marker fuer Layer 2."""


@dataclass(frozen=True, slots=True)
class ModelRecommendation:
    """Modell-spezifischer Override fuer eine oder mehrere DPTs.

    Felder:
    - ``manufacturer`` — canonical lowercase, z. B. ``"hoermann"``.
      Wir vermeiden Sonderzeichen in der Tabelle (``hoermann`` statt
      ``hörmann``) — der Lookup normalisiert beides identisch.
    - ``model_glob`` — fnmatch-Pattern (case-insensitive) gegen das
      User-Eingabe-Modell. Glob ist absichtlich enger als Regex —
      kein Risiko unbeabsichtigter Match-Cascades.
    - ``dpt_overrides`` — pro DPT eine modifizierte ``DptRecommendation``.
      Caller wendet den Override nur fuer die ueberlappenden DPTs an;
      andere GAs des Geraets bleiben bei ihrer Layer-1-Empfehlung.
    - ``rationale`` — menschen-lesbarer Reasoning-Eintrag.
    - ``doc_url`` — optionaler Link zur Hersteller-Doku.
    """

    manufacturer: str
    model_glob: str
    dpt_overrides: dict[str, DptRecommendation] = field(default_factory=dict)
    rationale: str = ""
    doc_url: str | None = None


# Bewusst kuratierter Startsatz mit ~10 bekannten Modellen aus den
# `KNX_MANUFACTURER_HINTS`. Erweiterung per PR.
KNX_DEVICE_MODEL_RECOMMENDATIONS: Final[list[ModelRecommendation]] = [
    ModelRecommendation(
        manufacturer="hoermann",
        model_glob="garage*",
        dpt_overrides={
            "9.001": DptRecommendation(
                mode="on_change",
                cycle_minutes_min=None,
                cycle_minutes_max=None,
                hysteresis="Klima-GAs nur aktivieren bei realer Sensorik",
                max_rate_per_min=0.5,
                rationale=(
                    "Hörmann-Tor-Gateway sendet ohne realen Sensor "
                    "Default-0 zyklisch — Klima-Group-Objects deaktivieren."
                ),
            ),
        },
        rationale=(
            "Hörmann Garage-Gateway: Tor-Klima-Group-Objects (Temperatur/"
            "Feuchte/Taupunkt) nur aktivieren, wenn reale Sensorik "
            "angeschlossen ist."
        ),
        doc_url="https://www.hoermann.de/produkte/knx",
    ),
    ModelRecommendation(
        manufacturer="mdt",
        model_glob="dali*",
        dpt_overrides={
            "1.001": DptRecommendation(
                mode="on_change",
                cycle_minutes_min=None,
                cycle_minutes_max=None,
                hysteresis="Sendebremse >= 1 s",
                max_rate_per_min=1.0,
                rationale=(
                    "DALI-Gateway-Status: Sendebremse via ETS-App auf "
                    ">= 1 s konfigurieren."
                ),
            ),
        },
        rationale="MDT DALI-Gateway: Sendebremse >= 1 s im Status-Telegramm.",
        doc_url="https://www.mdt.de/Downloads.html",
    ),
    ModelRecommendation(
        manufacturer="mdt",
        model_glob="dimm*",
        dpt_overrides={
            "5.001": DptRecommendation(
                mode="on_change",
                cycle_minutes_min=None,
                cycle_minutes_max=None,
                hysteresis=">= 2 % Aenderung",
                max_rate_per_min=2.0,
                rationale="MDT-Dimmaktor: Stellgroesse mit Hysterese >= 2 %.",
            ),
        },
        rationale="MDT-Dimmaktor: Stellgroesse-Hysterese statt linear senden.",
        doc_url="https://www.mdt.de/Downloads.html",
    ),
    ModelRecommendation(
        manufacturer="hager",
        model_glob="schalt*",
        dpt_overrides={
            "1.001": DptRecommendation(
                mode="on_change",
                cycle_minutes_min=None,
                cycle_minutes_max=None,
                hysteresis=None,
                max_rate_per_min=1.0,
                rationale=(
                    "Hager-Schaltaktor: Status nur bei Aenderung, "
                    "zyklisches Senden meist unnoetig."
                ),
            ),
        },
        rationale="Hager-Schaltaktor: Status-Objekt nur bei Aenderung.",
        doc_url="https://hager.com/de/service/downloads",
    ),
    ModelRecommendation(
        manufacturer="gira",
        model_glob="wetter*",
        dpt_overrides={
            "9.004": DptRecommendation(
                mode="hybrid",
                cycle_minutes_min=5,
                cycle_minutes_max=15,
                hysteresis=">= 50 lux",
                max_rate_per_min=2.0,
                rationale=(
                    "Gira-Wetterstation: Helligkeits-Hysterese >= 50 Lux, "
                    "Sendezyklus >= 5 Min."
                ),
            ),
        },
        rationale="Gira-Wetterstation: Helligkeit mit Hysterese + 5-Min-Heartbeat.",
        doc_url="https://katalog.gira.de/de/datenblatt.html",
    ),
    ModelRecommendation(
        manufacturer="abb",
        model_glob="heiz*",
        dpt_overrides={
            "5.001": DptRecommendation(
                mode="on_change",
                cycle_minutes_min=None,
                cycle_minutes_max=None,
                hysteresis=">= 2 % Stellgroessenaenderung",
                max_rate_per_min=1.0,
                rationale=(
                    "ABB-Heizungsaktor: Mindeststellgroessenaenderung "
                    ">= 2 % verhindert Dauer-Stellsignal."
                ),
            ),
        },
        rationale="ABB-Heizungsaktor: Stellgroesse mit Hysterese.",
        doc_url="https://library.e.abb.com/public/",
    ),
    ModelRecommendation(
        manufacturer="theben",
        model_glob="praesenz*",
        dpt_overrides={
            "9.004": DptRecommendation(
                mode="hybrid",
                cycle_minutes_min=5,
                cycle_minutes_max=15,
                hysteresis="diskrete Schwellwerte",
                max_rate_per_min=2.0,
                rationale=(
                    "Theben-Praesenzmelder: Helligkeits-Schwellwerte "
                    "mit Hysterese, nicht gleitend."
                ),
            ),
        },
        rationale="Theben-Praesenzmelder: Hysterese-basierte Schwellwerte.",
        doc_url="https://www.theben.de/de/service/downloads",
    ),
    ModelRecommendation(
        manufacturer="busch-jaeger",
        model_glob="thermo*",
        dpt_overrides={
            "9.001": DptRecommendation(
                mode="hybrid",
                cycle_minutes_min=5,
                cycle_minutes_max=15,
                hysteresis=">= 0.2 K",
                max_rate_per_min=2.0,
                rationale=(
                    "Busch-Jaeger Raum-Thermostat: Temperatur mit "
                    "Hysterese >= 0.2 K."
                ),
            ),
        },
        rationale="Busch-Jaeger Raum-Thermostat: Hysterese 0.2 K.",
        doc_url="https://www.busch-jaeger-katalog.de/",
    ),
    ModelRecommendation(
        manufacturer="zennio",
        model_glob="multi*",
        dpt_overrides={},
        rationale=(
            "Zennio Multi-Sensor: pro Kanal individuelle Hysterese-Werte "
            "setzen — DPT-Defaults bleiben Layer 1, Hinweis als Reasoning."
        ),
        doc_url="https://www.zennio.com/manuals",
    ),
    ModelRecommendation(
        manufacturer="elsner",
        model_glob="t-ap*",
        dpt_overrides={
            "9.005": DptRecommendation(
                mode="hybrid",
                cycle_minutes_min=5,
                cycle_minutes_max=10,
                hysteresis=">= 1 m/s, Sturm separat",
                max_rate_per_min=2.0,
                rationale=(
                    "Elsner Wetterstation T-AP: Wind-Sendezyklus >= 5 Min, "
                    "Sturmschwellen als eigene GA."
                ),
            ),
        },
        rationale="Elsner T-AP: Wind-Heartbeat 5-10 Min, Sturm separat.",
        doc_url="https://www.elsner-elektronik.de/de/service/downloads.html",
    ),
]


def find_model_recommendation(
    manufacturer: str | None,
    model: str | None,
) -> ModelRecommendation | None:
    """Liefert die erste passende Modell-Empfehlung oder ``None``.

    Lookup case-insensitive auf manufacturer + fnmatch-Glob auf model.
    Es zaehlt der erste Treffer in der Reihenfolge der Tabelle —
    spezifischere Eintraege also nach vorne stellen.
    """
    if not manufacturer or not model:
        return None
    norm_manufacturer = manufacturer.strip().lower()
    norm_model = model.strip().lower()
    for entry in KNX_DEVICE_MODEL_RECOMMENDATIONS:
        if entry.manufacturer != norm_manufacturer:
            continue
        if fnmatch(norm_model, entry.model_glob.lower()):
            return entry
    return None


def reasoning_source() -> str:
    """Reasoning-Layer-Marker fuer Layer 2."""
    return _SOURCE
