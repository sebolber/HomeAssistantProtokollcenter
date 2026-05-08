"""KNX-Telegramm-Statistik: Klassifizierung, Empfehlungs-Engine,
Anti-Pattern-Detector und Aggregations-Helfer.

Iter 1: classify_severity + recommended_rate_for.
Iter 2: Recommendation-Dataclass + build_recommendation.
Iter 3: Anti-Pattern-Detector (Konstant-Wert, Read-Burst, Mehrfach-
        Response, Heartbeat-Spam).
Folgende Iterationen erweitern dieses Modul.
"""

from __future__ import annotations

import math
import statistics
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Final, Literal

from ..const import (
    KNX_RATIO_GREEN_MAX,
    KNX_RATIO_ORANGE_MAX,
    KNX_RATIO_YELLOW_MAX,
    KNX_RECOMMENDED_RATES_PER_MIN,
)

KnxSeverity = Literal["green", "yellow", "orange", "red"]

_DEFAULT_RATE_KEY: Final = "_default"


def recommended_rate_for(dpt: str | None) -> float:
    """Liefert die obere Soll-Rate (Tel/Min) fuer einen DPT-String.

    Unbekannte oder leere DPTs fallen auf `_default`-Wert zurueck.
    DPT-Strings haben das ETS-Format `<main>.<sub>` (z. B. "9.001"); wir
    matchen exakt — Phase-2 koennte einen Main-Type-Fallback ergaenzen,
    wenn Bedarf entsteht.

    Iter 62 / WR-T: Generischer "9.x"-Hinweis aus `infer_dpt_from_samples`
    wird wie `9.001` (Temperatur) behandelt — gleiche Soll-Rate, weil
    alle 9.x-Werte (Temperatur/Helligkeit/Wind/Feuchte/CO2) im Bereich
    1-4 Tel/Min liegen.
    """
    if not dpt:
        return KNX_RECOMMENDED_RATES_PER_MIN[_DEFAULT_RATE_KEY]
    if dpt == "9.x":
        return KNX_RECOMMENDED_RATES_PER_MIN.get(
            "9.001",
            KNX_RECOMMENDED_RATES_PER_MIN[_DEFAULT_RATE_KEY],
        )
    return KNX_RECOMMENDED_RATES_PER_MIN.get(
        dpt,
        KNX_RECOMMENDED_RATES_PER_MIN[_DEFAULT_RATE_KEY],
    )


# Iter 62 / WR-T: DPT-Auto-Erkennung aus Werte-Samples. Heuristik
# konservativ — lieber kein DPT raten als falsch. Der DPT-String ist
# Eingabe fuer recommended_rate_for + build_recommendation, ein falscher
# Treffer wuerde dem User irrefuehrende Empfehlungen geben.
_DPT_5001_BYTE_MAX: Final = 255  # 8-bit unsigned upper bound (DPT 5.x).


def _classify_int_samples(int_values: list[int]) -> str | None:
    """Helfer fuer infer_dpt_from_samples — nur Integer-Branche.

    Iter B2 (gehaerter):
    - 1.001 nur, wenn alle Werte in {0,1} UND mindestens beide Werte
      vorkommen (Wert-Diversitaet). Sequenz ausschliesslich aus 0 oder
      ausschliesslich 1 ist nicht entscheidbar — koennte ebenso ein
      Stellantrieb sein, der gerade in seiner Ruhe-/Arbeitslage haengt.
    - 5.001 nur, wenn mindestens ein Wert >= 2 ist. {0, 100} ist klar
      Stellantrieb-Profil, {0, 1} koennte ein Schaltkanal sein und wird
      durch die obige Regel abgefangen.
    - Werte ausserhalb [0, 255] -> None (out-of-range fuer beide DPTs).
    """
    if not int_values:
        return None
    distinct = set(int_values)
    if distinct.issubset({0, 1}):
        # Beide Werte muessen vorkommen, sonst nicht entscheidbar.
        if distinct == {0, 1}:
            return "1.001"
        return None
    if all(0 <= v <= _DPT_5001_BYTE_MAX for v in int_values):
        # Stellantrieb / Dimmwert: mindestens ein Wert > 1.
        return "5.001"
    return None


# Iter 63 / U13: Lightweight Anti-Pattern-Erkennung fuer den Top-Sender-
# Listen-Badge. Voller Detector (`detect_patterns`) braucht
# TelegramSample-Objekte mit ts + dev_source + telegramtype und ist im
# Detail-Pane bereits da. Hier reicht eine binaere "hat etwas
# Auffaelliges?"-Flag — der User klickt fuer Details.
# Min-Samples kleiner als _CONSTANT_VALUE_MIN_SAMPLES (10) im vollen
# Detector, weil hier nur die letzten 30 Bulk-Samples vorliegen.
_LIGHTWEIGHT_CONSTANT_MIN: Final = 5


def has_anti_pattern_in_samples(values: Sequence[object]) -> bool:
    """True, wenn die Sample-Sequenz auf Konstant-Wert-Spam hindeutet.

    Konstant-Wert-Spam: >= 5 Werte und alle identisch (z. B. Hörmann-
    Tor-Gateway sendet zyklisch DPT 9.001 = 0). Andere Anti-Patterns
    (Read-Burst, Mehrfach-Response, Heartbeat) brauchen ts/typ und
    werden im Detail-Pane via `detect_patterns` ausgewertet.
    """
    if len(values) < _LIGHTWEIGHT_CONSTANT_MIN:
        return False
    sanitized = [v for v in values if v is not None]
    if len(sanitized) < _LIGHTWEIGHT_CONSTANT_MIN:
        return False
    first = sanitized[0]
    return all(v == first for v in sanitized[1:])


def infer_dpt_from_samples(values: Sequence[object]) -> str | None:
    """Rät einen DPT aus den letzten Werten einer GA.

    - 1.001 (Schalten): alle Werte aus {0, 1, True, False}.
    - 5.001 (8-bit unsigned, z. B. Dimmwert): alle Werte int in
      [0, _DPT_5001_BYTE_MAX] und nicht ausschliesslich 0/1
      (sonst greift 1.001).
    - 9.x (2-byte Float, generisch): irgendein Wert ist nicht-integer
      Float. Konkreter Subtyp (9.001/9.004/...) braucht Sensor-Kontext
      und wird nicht erraten.
    - None: gemischt, leer, Strings oder out-of-range — nicht entscheidbar.
    """
    if not values:
        return None
    sanitized = [v for v in values if v is not None]
    if not sanitized:
        return None

    has_float = False
    int_values: list[int] = []
    for v in sanitized:
        # bool ist subtype von int — getrennt zuerst pruefen.
        if isinstance(v, bool):
            int_values.append(int(v))
        elif isinstance(v, int):
            int_values.append(v)
        elif isinstance(v, float):
            if v.is_integer():
                int_values.append(int(v))
            else:
                has_float = True
        else:
            # String, list, dict, etc. — nicht entscheidbar.
            return None

    if has_float:
        return "9.x"
    return _classify_int_samples(int_values)


def classify_severity(rate: float, recommended: float) -> KnxSeverity:
    """Klassifiziert das Verhaeltnis Ist-Rate / Soll-Rate als Ampelfarbe.

    Schwellen aus const.py:
    - rate <= recommended * KNX_RATIO_GREEN_MAX  → "green"
    - rate <= recommended * KNX_RATIO_YELLOW_MAX → "yellow"
    - rate <= recommended * KNX_RATIO_ORANGE_MAX → "orange"
    - sonst → "red"

    Sonderfaelle:
    - rate=0      → "green" (kein Verkehr ist nie verdaechtig)
    - recommended=0 mit rate>0 → "red" (nichts erwartet, aber gesendet)
    """
    if rate <= 0.0:
        return "green"
    if recommended <= 0.0:
        return "red"
    ratio = rate / recommended
    if ratio <= KNX_RATIO_GREEN_MAX:
        return "green"
    if ratio <= KNX_RATIO_YELLOW_MAX:
        return "yellow"
    if ratio <= KNX_RATIO_ORANGE_MAX:
        return "orange"
    return "red"


# DPT-spezifische Templates fuer die Empfehlungstexte. Werden parametrisiert
# mit der Ist-Rate. Fuer DPTs ausserhalb der Liste greift das _default-Template.
_RECOMMENDATION_TEMPLATES: Final[dict[str, str]] = {
    "1.001": (
        "Schaltbefehl: nur Aenderungen senden, kein Zyklus. "
        "Hohe Rate ({rate:.1f} Tel/Min) deutet auf Schalt-Schleife oder "
        "redundante Toggle-Telegramme hin. ETS-Logik pruefen."
    ),
    "1.018": (
        "Bewegungsmelder: Nachtriggerzeit (Sperrzeit) auf >= 30 s anheben. "
        "Aktuelle Rate {rate:.1f} Tel/Min deutet auf zu kurze Sperrzeit."
    ),
    "5.001": (
        "Dimmwert/Stellgroesse: nur bei Aenderung >= 1-2 % senden, zyklisch "
        ">= 10 Min als Heartbeat. Aktuelle Rate {rate:.1f} Tel/Min ist zu hoch."
    ),
    "9.001": (
        "Temperatur: empfohlen Hysterese >= 0,2 K, Sendezyklus >= 5 Min. "
        "Ist-Rate {rate:.1f} Tel/Min deutet auf zu enge Hysterese oder "
        "zu kurzen Sendezyklus."
    ),
    "9.004": (
        "Helligkeit (Lux): empfohlen Hysterese >= 50 Lux, Sendezyklus "
        ">= 5 Min. Bei Wetterstationen haeufig die groesste Buslast-Quelle. "
        "Ist-Rate: {rate:.1f} Tel/Min."
    ),
    "9.005": (
        "Wind: empfohlen Hysterese >= 1 m/s, Sendezyklus >= 5 Min. "
        "Sturm-Schwellen separat als eigene GA. Ist-Rate: {rate:.1f} Tel/Min."
    ),
    "9.007": (
        "Feuchte: traeges Signal, Hysterese >= 2-5 % und Sendezyklus "
        ">= 10 Min. Ist-Rate {rate:.1f} Tel/Min ist zu hoch."
    ),
    "9.008": (
        "CO2: Hysterese >= 25-50 ppm, Sendezyklus >= 5-10 Min. Ist-Rate: {rate:.1f} Tel/Min."
    ),
    "13.010": (
        "Energiezaehler: zyklisch >= 5-15 Min reicht voellig. "
        "Ist-Rate: {rate:.1f} Tel/Min — Sendezyklus deutlich verlaengern."
    ),
    "13.013": (
        "Energiezaehler kWh: zyklisch >= 5-15 Min reicht voellig. "
        "Ist-Rate: {rate:.1f} Tel/Min — Sendezyklus deutlich verlaengern."
    ),
    "_default": (
        "Unbekannte DPT-Klasse — erwarteter Bereich <= 5 Tel/Min. "
        "Pruefe in der ETS Sendeparameter und Hysterese. "
        "Ist-Rate: {rate:.1f} Tel/Min."
    ),
}

_GREEN_TEXT: Final = "Telegrammrate ist im erwarteten Bereich — keine Aktion noetig."


def safe_ratio(rate: float, recommended: float) -> float:
    """Verhaeltnis Ist/Soll mit Sonderfall recommended<=0.

    Public, weil sowohl Recommendation-Engine (knx_stats.py) als auch
    Service-Layer (knx_stats_service.py) ihn brauchen. Vermeidet eine
    duplizierte Implementierung.
    """
    if recommended <= 0.0:
        return float("inf") if rate > 0.0 else 0.0
    return rate / recommended


@dataclass(frozen=True, slots=True)
class Recommendation:
    """Strukturierte Empfehlung fuer eine GA / Geraet.

    Wird vom API-Layer als JSON serialisiert und vom Frontend
    im Detail-Pane gerendert.
    """

    severity: KnxSeverity
    text: str
    action_required: bool
    ratio: float
    estimated_reduction_pct: float | None


def _format_template(dpt: str | None, rate: float) -> str:
    """Sucht das DPT-Template und formatiert es mit der Ist-Rate."""
    template = _RECOMMENDATION_TEMPLATES.get(dpt or "") or _RECOMMENDATION_TEMPLATES["_default"]
    return template.format(rate=rate)


def build_recommendation(
    *,
    dpt: str | None,
    rate: float,
    recommended: float,
) -> Recommendation:
    """Erzeugt eine vollstaendige Recommendation aus DPT + Raten.

    Berechnet Severity, Text (DPT-spezifisch) und geschaetzte
    Reduktion in Prozent.
    """
    severity = classify_severity(rate, recommended)
    ratio = safe_ratio(rate, recommended)

    if severity == "green":
        return Recommendation(
            severity=severity,
            text=_GREEN_TEXT,
            action_required=False,
            ratio=ratio,
            estimated_reduction_pct=None,
        )

    text = _format_template(dpt, rate)
    reduction: float | None = None
    if rate > 0.0 and recommended > 0.0 and rate > recommended:
        reduction = (1.0 - recommended / rate) * 100.0
    elif math.isinf(ratio):
        reduction = 100.0

    return Recommendation(
        severity=severity,
        text=text,
        action_required=True,
        ratio=ratio,
        estimated_reduction_pct=reduction,
    )


# Anti-Pattern-Detector (Iter 3) ---------------------------------------------

# Schwellen aus dem Konzept §5.6
_CONSTANT_VALUE_MIN_SAMPLES: Final[int] = 10
_READ_BURST_MIN_COUNT: Final[int] = 10
_READ_BURST_WINDOW_SEC: Final[float] = 5.0
_MULTI_RESPONSE_WINDOW_SEC: Final[float] = 0.2
_MULTI_RESPONSE_MIN_COUNT: Final[int] = 2
_HEARTBEAT_MIN_SAMPLES: Final[int] = 10
_HEARTBEAT_MAX_INTERVAL_SEC: Final[float] = 60.0
_HEARTBEAT_INTERVAL_TOLERANCE: Final[float] = 0.2  # ±20 %
_MIN_PATTERN_SAMPLES: Final[int] = 2

FindingKind = Literal[
    "constant_value",
    "read_burst",
    "multiple_response",
    "heartbeat_spam",
    "status_loop",
]


@dataclass(frozen=True, slots=True)
class TelegramSample:
    """Ein einzelnes KNX-Telegramm fuer den Pattern-Detector.

    Reduzierte Sicht des Telegramms — nur die fuer Mustererkennung
    relevanten Felder. Wird vom Storage-Layer aus den DB-Rows befuellt.
    """

    ts: datetime
    value: Any
    telegramtype: str | None
    source: str


@dataclass(frozen=True, slots=True)
class Finding:
    """Erkannte Anomalie im Telegramm-Strom."""

    kind: FindingKind
    severity: KnxSeverity
    text: str


def _detect_constant_value(samples: Sequence[TelegramSample]) -> Finding | None:
    """Konstant-Wert-Spam: Wert (oder Wert-Repr) variiert nicht ueber
    >= _CONSTANT_VALUE_MIN_SAMPLES Stichproben."""
    if len(samples) < _CONSTANT_VALUE_MIN_SAMPLES:
        return None
    values = {repr(s.value) for s in samples if s.telegramtype != "GroupValueRead"}
    if len(values) != 1:
        return None
    only = next(iter(values))
    return Finding(
        kind="constant_value",
        severity="orange",
        text=(
            f"Sensor sendet konstanten Wert ({only}) ueber "
            f"{len(samples)} Telegramme. Wahrscheinlich keine reale "
            f"Sensorik dran oder Default-0 im Geraet. ETS-App pruefen, "
            f"zyklisches Senden deaktivieren."
        ),
    )


def _detect_read_burst(samples: Sequence[TelegramSample]) -> Finding | None:
    """Read-Burst: >= N GroupValueRead-Telegramme einer Source in < T Sek."""
    reads = [s for s in samples if s.telegramtype == "GroupValueRead"]
    if len(reads) < _READ_BURST_MIN_COUNT:
        return None
    by_source: dict[str, list[datetime]] = {}
    for r in reads:
        by_source.setdefault(r.source, []).append(r.ts)
    for src, timestamps in by_source.items():
        timestamps.sort()
        for i in range(len(timestamps) - _READ_BURST_MIN_COUNT + 1):
            window = (timestamps[i + _READ_BURST_MIN_COUNT - 1] - timestamps[i]).total_seconds()
            if window <= _READ_BURST_WINDOW_SEC:
                return Finding(
                    kind="read_burst",
                    severity="orange",
                    text=(
                        f"Read-Burst von Geraet {src}: "
                        f"{_READ_BURST_MIN_COUNT}+ GroupValueRead in "
                        f"{window:.1f}s. Typisch HA `sync_state` zu "
                        f"aggressiv — auf `init` oder `expire 30` "
                        f"umstellen."
                    ),
                )
    return None


def _detect_multiple_response(samples: Sequence[TelegramSample]) -> Finding | None:
    """Mehrfach-Response: >= 2 Responses innerhalb _MULTI_RESPONSE_WINDOW_SEC."""
    responses = sorted(
        (s for s in samples if s.telegramtype == "GroupValueResponse"),
        key=lambda s: s.ts,
    )
    if len(responses) < _MULTI_RESPONSE_MIN_COUNT + 1:
        return None
    for i in range(len(responses) - _MULTI_RESPONSE_MIN_COUNT):
        window = (responses[i + _MULTI_RESPONSE_MIN_COUNT].ts - responses[i].ts).total_seconds()
        if window <= _MULTI_RESPONSE_WINDOW_SEC:
            return Finding(
                kind="multiple_response",
                severity="orange",
                text=(
                    f"Mehrfach-Response: {_MULTI_RESPONSE_MIN_COUNT + 1}+ "
                    f"Responses innerhalb {window * 1000:.0f}ms. "
                    f"Mehrere Aktoren auf gleicher GA oder Aktor "
                    f"antwortet redundant. ETS-Topologie und Status-"
                    f"Objekt-Konfig pruefen."
                ),
            )
    return None


def _detect_heartbeat_spam(samples: Sequence[TelegramSample]) -> Finding | None:
    """Heartbeat-Spam: konstantes dt < _HEARTBEAT_MAX_INTERVAL_SEC,
    Werte identisch ueber _HEARTBEAT_MIN_SAMPLES Stichproben."""
    writes = sorted(
        (s for s in samples if s.telegramtype != "GroupValueRead"),
        key=lambda s: s.ts,
    )
    if len(writes) < _HEARTBEAT_MIN_SAMPLES:
        return None
    deltas = [(writes[i + 1].ts - writes[i].ts).total_seconds() for i in range(len(writes) - 1)]
    if not deltas:
        return None
    median_dt = statistics.median(deltas)
    if median_dt <= 0 or median_dt >= _HEARTBEAT_MAX_INTERVAL_SEC:
        return None
    # Toleranz-Check: alle Deltas innerhalb ±20 % des Medians?
    tolerance = median_dt * _HEARTBEAT_INTERVAL_TOLERANCE
    if any(abs(d - median_dt) > tolerance for d in deltas):
        return None
    # Werte identisch?
    values = {repr(w.value) for w in writes}
    if len(values) != 1:
        return None
    return Finding(
        kind="heartbeat_spam",
        severity="yellow",
        text=(
            f"Heartbeat alle {median_dt:.0f}s mit identischem Wert. "
            f"Lebenszeichen-Intervall zu kurz — auf >= 5 Min anheben."
        ),
    )


def detect_patterns(
    samples: Sequence[TelegramSample],
    *,
    dpt: str | None,
) -> list[Finding]:
    """Fuehrt alle Anti-Pattern-Detektoren in fester Reihenfolge aus.

    Nicht-anwendbare Detektoren liefern None und werden uebersprungen.
    Liefert die Liste der erkannten Findings (kann leer sein).

    Iter 85 / CR-26: `dpt` aktuell nicht genutzt; Param bleibt fuer
    spaetere DPT-spezifische Detektoren (z. B. Status-Schleife nur
    fuer DPT 1.001). `noqa: ARG001` markiert das explizit.
    """
    if len(samples) < _MIN_PATTERN_SAMPLES:
        return []
    detectors = (
        _detect_constant_value,
        _detect_read_burst,
        _detect_multiple_response,
        _detect_heartbeat_spam,
    )
    findings: list[Finding] = []
    for detector in detectors:
        result = detector(samples)
        if result is not None:
            findings.append(result)
    return findings


# =============================================================================
# Iter 37 (Feature K): Bus-Health-Score 0-100
# =============================================================================
#
# Aggregiert die vier KPIs zu einer Single-Glance-Zahl. Reine Funktion;
# der Service holt die Inputs aus Repo-Aggregaten und reicht sie hier
# durch. Die Schwellen sind bewusst konservativ, damit der Score in
# einer gesunden Anlage knapp unter 100 schwankt — Abweichungen fallen
# damit sofort auf.

# Wertebereich pro Komponente (oberhalb wird auf 0 geclampt):
_REPEAT_PCT_LIMIT: Final[float] = 10.0  # 10 % Wiederholungen -> 0 Punkte
_BUSLOAD_PCT_LIMIT: Final[float] = 50.0  # 50 % Buslast -> 0 Punkte
_SILENCE_DEVICES_LIMIT: Final[int] = 10
_OPEN_ALARMS_LIMIT: Final[int] = 20

# Empfehlungs-Schwellen (Alles darueber generiert ein Finding).
_REPEAT_PCT_FINDING_THRESHOLD: Final[float] = 0.5  # KNX-Praxis "<0,5 %"
_BUSLOAD_PCT_FINDING_THRESHOLD: Final[float] = 20.0
_SILENCE_FINDING_THRESHOLD: Final[int] = 1
_ALARMS_FINDING_THRESHOLD: Final[int] = 1

# Schwellen, ab denen ein Finding von "warn" auf "critical" eskaliert.
_REPEAT_PCT_CRITICAL: Final[float] = 5.0
_BUSLOAD_PCT_CRITICAL: Final[float] = 40.0
_ALARMS_CRITICAL: Final[int] = 5

# Gewichtung der Komponenten (Summe = 1.0).
#
# Iter B3 (Konzept-Schwaeche B3): Repeat-Quote runtergewichtet, weil
# xknx das ``repeated``-Flag in der Cemi-Frame-Lage praktisch nie
# liefert. Die echte Wiederholrate waere nur per Bus-Sniffer messbar
# (BL-D blocked). Frueher hatte dieser KPI 30% Gewicht — der Score zog
# damit dauerhaft auf ~70 runter, ohne dass real ein Bus-Problem vorlag.
# Jetzt wird er als Approximation markiert (siehe
# ``compute_health_score`` -> ``repeat_approximate``) und nimmt nur
# noch 10% Gewicht ein. Buslast (realistischster KPI) bekommt 40%,
# Silence + Alarme je 25%.
_WEIGHT_REPEAT: Final[float] = 0.10
_WEIGHT_BUSLOAD: Final[float] = 0.40
_WEIGHT_SILENCE: Final[float] = 0.25
_WEIGHT_ALARMS: Final[float] = 0.25

# Severity-Schwellen (Score >= X -> Severity).
_SCORE_GREEN_MIN: Final[int] = 90
_SCORE_YELLOW_MIN: Final[int] = 70
_SCORE_ORANGE_MIN: Final[int] = 50


@dataclass(frozen=True, slots=True)
class HealthScoreInput:
    """Eingaben fuer den Bus-Health-Score.

    Alle Werte stammen aus existierenden Repo-Aggregaten:
    - repeat_ratio_pct: KnxStatsRepository.bus_health
    - busload_max_pct: busload_timeseries -> max_pct (Iter 36)
    - silent_devices: Anzahl mit alarm=True aus silence_detect
    - open_alarms: alarms.triggered_count (Iter 15)
    """

    repeat_ratio_pct: float
    busload_max_pct: float
    silent_devices: int
    open_alarms: int


class HealthFinding(dict):  # type: ignore[type-arg]
    """TypedDict-aehnlich; einfach als dict serialisierbar fuer JSON."""

    severity: str
    code: str
    message: str


def _component_health(value: float, limit: float) -> int:
    """Linearer Score 100→0 zwischen 0 und limit, geclamped."""
    if value <= 0.0 or limit <= 0.0:
        return 100
    pct = min(value / limit, 1.0)
    return max(0, round(100 * (1.0 - pct)))


def _severity_for_score(score: int) -> KnxSeverity:
    if score >= _SCORE_GREEN_MIN:
        return "green"
    if score >= _SCORE_YELLOW_MIN:
        return "yellow"
    if score >= _SCORE_ORANGE_MIN:
        return "orange"
    return "red"


def _de_pct(value: float) -> str:
    """Locale-freier de-DE-Stil mit Komma + 2 Nachkommastellen."""
    return f"{value:.2f}".replace(".", ",")


def _build_health_findings(input_: HealthScoreInput) -> list[HealthFinding]:
    out: list[HealthFinding] = []
    if input_.repeat_ratio_pct > _REPEAT_PCT_FINDING_THRESHOLD:
        out.append(
            HealthFinding(
                severity="warn" if input_.repeat_ratio_pct < _REPEAT_PCT_CRITICAL else "critical",
                code="high-repeat-rate",
                message=(
                    f"Wiederhol-Quote {_de_pct(input_.repeat_ratio_pct)} % "
                    f"(Empfehlung <{_de_pct(_REPEAT_PCT_FINDING_THRESHOLD)} %)"
                ),
            )
        )
    if input_.busload_max_pct > _BUSLOAD_PCT_FINDING_THRESHOLD:
        out.append(
            HealthFinding(
                severity="warn" if input_.busload_max_pct < _BUSLOAD_PCT_CRITICAL else "critical",
                code="high-busload",
                message=(
                    f"Buslast-Spitze {_de_pct(input_.busload_max_pct)} % "
                    f"(Empfehlung <{int(_BUSLOAD_PCT_FINDING_THRESHOLD)} %)"
                ),
            )
        )
    if input_.silent_devices >= _SILENCE_FINDING_THRESHOLD:
        out.append(
            HealthFinding(
                severity="warn",
                code="silent-devices",
                message=(
                    f"{input_.silent_devices} stumme(s) Geraet(e) — "
                    f"Source-Adressen ohne Telegramm im Beobachtungsfenster"
                ),
            )
        )
    if input_.open_alarms >= _ALARMS_FINDING_THRESHOLD:
        out.append(
            HealthFinding(
                severity="warn" if input_.open_alarms < _ALARMS_CRITICAL else "critical",
                code="open-alarms",
                message=f"{input_.open_alarms} offene Alarm(e) im Zeitraum",
            )
        )
    return out


def compute_health_score(input_: HealthScoreInput) -> dict[str, Any]:
    """Berechnet den Bus-Health-Score aus den vier Eingangs-KPIs.

    Liefert dict mit:
    - score: int 0..100
    - severity: green/yellow/orange/red
    - components: dict pro Komponente (0..100)
    - findings: list[HealthFinding] mit konkreten Hinweisen
    - repeat_approximate: bool — Iter B3: signalisiert dem UI, dass
      die Repeat-Komponente auf einer Approximation beruht (xknx
      liefert das echte Repeat-Bit nicht — F4/BL-D im Konzept).
    """
    components = {
        "repeat": _component_health(input_.repeat_ratio_pct, _REPEAT_PCT_LIMIT),
        "busload": _component_health(input_.busload_max_pct, _BUSLOAD_PCT_LIMIT),
        "silence": _component_health(float(input_.silent_devices), float(_SILENCE_DEVICES_LIMIT)),
        "alarms": _component_health(float(input_.open_alarms), float(_OPEN_ALARMS_LIMIT)),
    }
    weighted = (
        _WEIGHT_REPEAT * components["repeat"]
        + _WEIGHT_BUSLOAD * components["busload"]
        + _WEIGHT_SILENCE * components["silence"]
        + _WEIGHT_ALARMS * components["alarms"]
    )
    score = max(0, min(100, round(weighted)))
    return {
        "score": score,
        "severity": _severity_for_score(score),
        "components": components,
        "findings": _build_health_findings(input_),
        # Iter B3: Approximations-Marker fuer das Frontend. Der
        # Repeat-Bit ist xknx-seitig nicht zuverlaessig sichtbar — bis
        # ein Sniffer-Side-Channel oder Layer-2-Frame-Pass-Through
        # ergaenzt wird, ist die Quote eine Schaetzung mit Tendenz 0.
        "repeat_approximate": True,
    }
