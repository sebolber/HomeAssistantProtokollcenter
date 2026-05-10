"""Iter L1.0 (Sprint Recommendations): DPT-Recommendation-Tabelle.

Erweitert die schmale `recommended_rate_for(dpt)`-Logik um eine
strukturierte Empfehlung pro KNX-Datapoint-Type, die Sende-Modus,
Zyklusdauer-Korridor und Hysterese-Vorgabe enthaelt.

Layer 1 der Recommendation-Engine: deterministisch, offline-faehig,
mypy-strict-konform. Keine I/O, nur Daten + Lookup.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Final, Literal

SendMode = Literal["on_change", "cyclic", "hybrid"]
"""Empfohlener Sende-Modus.

- ``on_change`` — Telegramm nur bei Wertaenderung. Default fuer
  Schalt-/Statusobjekte und feinaufloesende Sensoren mit Hysterese.
- ``cyclic`` — Telegramm in festem Intervall. Default fuer Systemzeit/
  Datum und Energiezaehler-Push-Modi.
- ``hybrid`` — Telegramm bei Aenderung **plus** Heartbeat-Zyklus, fuer
  ausfallsensitive Werte (z. B. Temperatur, Feuchte).
"""


@dataclass(frozen=True, slots=True)
class DptRecommendation:
    """Empfehlung pro DPT (Layer 1 / DPT-Standard).

    Felder bleiben textuell, damit das Frontend sie 1:1 darstellen kann
    — die Empfehlungs-Engine uebersetzt sie spaeter (Layer 3) in
    konkrete Cycle-Minutes-Zahlen mit Live-Anomalie-Anpassungen.
    """

    mode: SendMode
    cycle_minutes_min: int | None
    """Untergrenze des empfohlenen Zyklus in Minuten. ``None`` fuer
    reine ``on_change``-DPTs (kein Heartbeat noetig)."""

    cycle_minutes_max: int | None
    """Obergrenze des empfohlenen Zyklus in Minuten. ``None`` analog."""

    hysteresis: str | None
    """Menschen-lesbare Hysterese-Vorgabe, z. B. ``">= 0.5 K"`` oder
    ``">= 50 lux"``. ``None`` wenn nicht relevant (Schalten/Status)."""

    max_rate_per_min: float
    """Obere Soll-Rate (Telegramme/Minute). Spiegelt
    ``KNX_RECOMMENDED_RATES_PER_MIN`` aus ``const.py`` (Konsistenz mit
    bestehender ``recommended_rate_for``-Logik)."""

    rationale: str
    """Kurze WHY-Begruendung — wird als Reasoning-Eintrag im Frontend
    gerendert. Soll selbst-erklaerend sein, nicht KNX-Spec-Referenz."""


_SOURCE: Final = "dpt_standard"
"""Reasoning-Layer-Marker fuer dieses Modul."""

# Konsolidiert aus KNX-DPT-Spec (support.knx.org), der etablierten
# `KNX_RECOMMENDED_RATES_PER_MIN`-Tabelle in ``const.py`` und
# §6 von ``docs/messagehub_knx_konfigurationsfehler_recherche.md``.
KNX_DPT_RECOMMENDATIONS: Final[dict[str, DptRecommendation]] = {
    # ----- Boolean / Status (1.x) -----
    "1.001": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=None,
        max_rate_per_min=1.0,
        rationale=(
            "Schalten/Status: Telegramm nur bei Aenderung. "
            "Zyklisches Senden ueberlastet den Bus ohne Mehrwert."
        ),
    ),
    "1.002": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=None,
        max_rate_per_min=1.0,
        rationale="Boolean-Wert: Telegramm nur bei Aenderung.",
    ),
    "1.011": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=None,
        max_rate_per_min=1.0,
        rationale="Status-Bit: nur bei Aenderung. Keine Pflicht-Heartbeats.",
    ),
    "1.018": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=None,
        max_rate_per_min=1.0,
        rationale=(
            "Bewegungserkennung: Trigger-only. Heartbeat-Telegramme verschleiern echte Bewegung."
        ),
    ),
    "1.x": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=None,
        max_rate_per_min=1.0,
        rationale="Generische 1-Bit-DPT: nur bei Aenderung.",
    ),
    # ----- Relative Steuerung (3.x) -----
    "3.007": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=None,
        max_rate_per_min=1.0,
        rationale="Dimmen relativ (Start/Stopp): nur bei Aktion.",
    ),
    # ----- 8-bit Skalierung (5.x) -----
    "5.001": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=">= 3 % Aenderung",
        max_rate_per_min=2.0,
        rationale=(
            "Dimmwert/Stellgroesse 0-100 %: bei Aenderung mit "
            "Mindestschritt, sonst pumpt jeder Slider den Bus."
        ),
    ),
    "5.003": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=">= 5 deg Aenderung",
        max_rate_per_min=2.0,
        rationale=(
            "Winkel 0-360 deg: bei Aenderung mit Mindestschritt, "
            "Jalousie-Lamellenfeedback braucht keinen Sub-Grad-Strom."
        ),
    ),
    # ----- 2-byte Float (9.x) -----
    "9.001": DptRecommendation(
        mode="hybrid",
        cycle_minutes_min=5,
        cycle_minutes_max=15,
        hysteresis=">= 0.2 K",
        max_rate_per_min=2.0,
        rationale=(
            "Temperatur: bei Aenderung mit Hysterese (Sensor-Rauschen "
            "filtern) plus Heartbeat alle 5-15 Min als Lebenszeichen."
        ),
    ),
    "9.004": DptRecommendation(
        mode="hybrid",
        cycle_minutes_min=5,
        cycle_minutes_max=15,
        hysteresis=">= 50 lux",
        max_rate_per_min=2.0,
        rationale=(
            "Helligkeit (Lux): natuerliches Licht aendert sich kontinuierlich "
            "— ohne Hysterese sendet der Sensor jede Sekunde."
        ),
    ),
    "9.005": DptRecommendation(
        mode="hybrid",
        cycle_minutes_min=5,
        cycle_minutes_max=10,
        hysteresis=">= 1 m/s",
        max_rate_per_min=4.0,
        rationale=(
            "Wind: Sturmschwellwerte als eigene GA loesen, Mess-GA "
            "mit Hysterese + Heartbeat (5-10 Min) reichen aus."
        ),
    ),
    "9.007": DptRecommendation(
        mode="hybrid",
        cycle_minutes_min=10,
        cycle_minutes_max=30,
        hysteresis=">= 2 % rH",
        max_rate_per_min=1.0,
        rationale="Feuchte: traege Groesse, 10-30 Min Heartbeat reichen.",
    ),
    "9.008": DptRecommendation(
        mode="hybrid",
        cycle_minutes_min=5,
        cycle_minutes_max=15,
        hysteresis=">= 50 ppm",
        max_rate_per_min=2.0,
        rationale=(
            "CO2: Lueftungssteuerung braucht zeitnahen Wert, "
            "5-15 Min Heartbeat fuer Trend-Auswertung."
        ),
    ),
    "9.x": DptRecommendation(
        mode="hybrid",
        cycle_minutes_min=5,
        cycle_minutes_max=15,
        hysteresis="je Sensor — siehe Datenblatt",
        max_rate_per_min=2.0,
        rationale=(
            "Generische 2-Byte-Float: hybrid mit DPT-typischer Hysterese, "
            "Heartbeat 5-15 Min als Lebenszeichen."
        ),
    ),
    # ----- Zeit / Datum (10.x / 11.x) -----
    "10.001": DptRecommendation(
        mode="cyclic",
        cycle_minutes_min=1,
        cycle_minutes_max=60,
        hysteresis=None,
        max_rate_per_min=2.0,
        rationale=(
            "Time-of-day: Master sendet zyklisch (typisch 1-60 Min). "
            "Mehr als ein Master = MULTI_TIME_MASTER-Finding."
        ),
    ),
    "11.001": DptRecommendation(
        mode="cyclic",
        cycle_minutes_min=720,
        cycle_minutes_max=1440,
        hysteresis=None,
        max_rate_per_min=0.05,
        rationale="Datum: 1 x pro Tag reicht (typisch zur Mitternacht).",
    ),
    # ----- 4-byte Zaehler (13.x) -----
    "13.010": DptRecommendation(
        mode="cyclic",
        cycle_minutes_min=10,
        cycle_minutes_max=60,
        hysteresis=None,
        max_rate_per_min=0.5,
        rationale=(
            "Energiezaehler Wh: zyklisch fuer Trend-Aufzeichnung, "
            "Granularitaet je nach Loggin-Anspruch (10-60 Min)."
        ),
    ),
    "13.013": DptRecommendation(
        mode="cyclic",
        cycle_minutes_min=10,
        cycle_minutes_max=60,
        hysteresis=None,
        max_rate_per_min=0.5,
        rationale=(
            "Energiezaehler kWh: zyklisch fuer Verbrauchsstatistik. "
            "On-change ginge bei sehr grossen Lasten verloren."
        ),
    ),
    "13.x": DptRecommendation(
        mode="cyclic",
        cycle_minutes_min=10,
        cycle_minutes_max=60,
        hysteresis=None,
        max_rate_per_min=0.5,
        rationale="Generischer 4-byte-Counter: zyklisch (10-60 Min).",
    ),
    # ----- Szenen (17.x / 18.x) -----
    "17.001": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=None,
        max_rate_per_min=1.0,
        rationale="Szenenaufruf: Trigger-only, niemals zyklisch.",
    ),
    "18.001": DptRecommendation(
        mode="on_change",
        cycle_minutes_min=None,
        cycle_minutes_max=None,
        hysteresis=None,
        max_rate_per_min=1.0,
        rationale="Szenensteuerung: Trigger-only.",
    ),
}


_DPT_FAMILY_RE: Final = re.compile(r"^(\d+)\.\d+$")
"""Erkennt ETS-Format ``<main>.<sub>`` — wir extrahieren ``<main>``
fuer den Fallback auf den Familien-Default ``<main>.x``."""


def recommend_for_dpt(dpt: str | None) -> DptRecommendation | None:
    """Liefert die DPT-Empfehlung. ``None`` bei unbekanntem oder
    nicht-mappbarem DPT.

    Lookup-Reihenfolge:
    1. Exakter Treffer (z. B. ``9.001``).
    2. Familien-Fallback (z. B. ``9.999`` -> ``9.x``).
    3. Spezial: ``"9.x"`` aus ``infer_dpt_from_samples`` -> direkter
       Fallback auf ``9.x``-Eintrag.

    Bewusst kein ``_default``-Fallback — unbekannter DPT bedeutet
    ``None``, sodass die Empfehlungs-Engine entscheiden kann, ob sie
    auf Layer 4 (KI) eskaliert oder die Karte als
    ``"insufficient data"`` markiert.
    """
    if not dpt:
        return None
    direct = KNX_DPT_RECOMMENDATIONS.get(dpt)
    if direct is not None:
        return direct
    match = _DPT_FAMILY_RE.match(dpt)
    if match is None:
        return None
    family = f"{match.group(1)}.x"
    return KNX_DPT_RECOMMENDATIONS.get(family)


def reasoning_source() -> str:
    """Reasoning-Layer-Marker fuer dieses Modul."""
    return _SOURCE
