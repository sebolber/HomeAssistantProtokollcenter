"""Finding-Vertrag fuer KNX-Konfigurations-Detektoren.

Schema-Quelle: docs/messagehub_knx_konfigurationsfehler_recherche.md §9.6.

Iter 1 (knx-findings): Dataclass + Severity-Enum + JSON-Round-Trip.
Spaetere Iterationen ergaenzen Repository (Iter 2), Acknowledgements
(Iter 3), Severity-Overrides (Iter 4) und konkrete Detektoren.

Detektoren erzeugen Findings mit `code` + `evidence`. Lesbare Strings
(title, description) werden vom UI-Layer aus `translations/*.json`
geladen — der Detector haelt nur den semantischen Vertrag.

Decision: `FindingSeverity` ist `Literal["debug","info","warning","error"]`,
nicht das Rate-Ampelschema (green/yellow/orange/red) aus `KnxSeverity`.
Begruendung: Findings sind log-aehnliche Hinweise (eine Konfig-Anomalie
ist eindeutig oder nicht), waehrend `KnxSeverity` ein Verhaeltnis
(Ist-/Soll-Rate) abbildet. Die SQL-CHECK-Constraint in den nachfolgenden
Migrationen (Iter 3 + 4) verwendet exakt diese vier Stufen, daher
gleichen wir den Dataclass-Vertrag damit ab.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import TYPE_CHECKING, Any, Final, Literal

if TYPE_CHECKING:  # nur fuer Type-Hints, vermeidet Zirkular-Imports.
    from .knx_stats import (
        Finding as LegacyPatternFinding,
    )
    from .knx_stats import (
        HealthScoreInput,
    )

FindingSeverity = Literal["debug", "info", "warning", "error"]

FINDING_SEVERITIES: Final[tuple[FindingSeverity, ...]] = (
    "debug",
    "info",
    "warning",
    "error",
)

# Type-Alias fuer Detector-Evidence. Pro Code frei strukturiert (siehe
# §9.6) — z. B. {"project_dpt": "9.001", "inferred_dpt": "1.001",
# "confidence": 0.94}. Wir validieren nur, dass es sich um ein
# JSON-serialisierbares Dict handelt; Schema-Validierung pro Code
# erfolgt im jeweiligen Detector-Test.
EvidencePayload = dict[str, Any]


@dataclass(frozen=True, slots=True)
class Finding:
    """Erkennung eines KNX-Konfigurations-/Verhaltens-Musters.

    Attribute (Reihenfolge stabil fuer JSON-Serialisierung):
        code: Maschinenlesbarer Detector-Code, z. B. "DPT_MISMATCH".
            Vertragsoberflaeche zwischen Detector, DB und UI.
        schema_version: Inkrementiert bei Heuristik-Tuning eines
            Detectors (siehe §9.5). Erlaubt User-Acks fuer alte
            Versionen unangetastet zu lassen.
        severity: Default aus const.py / Override aus DB (Iter 4).
        ga: KNX-Gruppenadresse "M/L/G". `None` bei GA-uebergreifenden
            Findings (z. B. MULTI_TIME_MASTER ueber Set von Sources).
        source: KNX-Phys-Adresse "x.y.z" der ausloesenden Quelle.
            `None`, wenn keine eindeutige Source identifizierbar.
        title: Kurzer UI-Titel (durch translations/, vom UI gerendert).
        description: Ausfuehrliche Beschreibung (durch translations/).
        evidence: Strukturierter Detector-Output, pro Code frei.
        first_seen: Erstes Auftreten dieses Findings.
        last_seen: Letztes Auftreten — gleich first_seen, wenn neu.
        occurrence_count: Wie oft seit first_seen erkannt.
        detector_version: Versionierter Detector-Name, z. B.
            "DPT_MISMATCH/v1". Damit ist nachvollziehbar, welche
            Detector-Iteration den Finding produziert hat.
    """

    code: str
    schema_version: int
    severity: FindingSeverity
    ga: str | None
    source: str | None
    title: str
    description: str
    evidence: EvidencePayload = field(default_factory=dict)
    first_seen: datetime = field(default_factory=lambda: datetime.fromtimestamp(0))
    last_seen: datetime = field(default_factory=lambda: datetime.fromtimestamp(0))
    occurrence_count: int = 1
    detector_version: str = ""

    def to_dict(self) -> dict[str, Any]:
        """JSON-kompatibles Dict mit ISO-Datetimes."""
        return {
            "code": self.code,
            "schema_version": self.schema_version,
            "severity": self.severity,
            "ga": self.ga,
            "source": self.source,
            "title": self.title,
            "description": self.description,
            "evidence": dict(self.evidence),
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "occurrence_count": self.occurrence_count,
            "detector_version": self.detector_version,
        }

    def to_json(self) -> str:
        """Stabile JSON-Repraesentation, sortierte Keys nicht erzwungen."""
        return json.dumps(self.to_dict(), default=str)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Finding:
        """Inverse zu `to_dict`. ISO-Datetime-Strings werden geparst."""
        severity = data["severity"]
        if severity not in FINDING_SEVERITIES:
            raise ValueError(
                f"Unknown FindingSeverity {severity!r}; "
                f"expected one of {FINDING_SEVERITIES}"
            )
        return cls(
            code=str(data["code"]),
            schema_version=int(data["schema_version"]),
            severity=severity,
            ga=data.get("ga"),
            source=data.get("source"),
            title=str(data["title"]),
            description=str(data["description"]),
            evidence=dict(data.get("evidence") or {}),
            first_seen=_parse_datetime(data["first_seen"]),
            last_seen=_parse_datetime(data["last_seen"]),
            occurrence_count=int(data.get("occurrence_count", 1)),
            detector_version=str(data.get("detector_version", "")),
        )

    @classmethod
    def from_json(cls, payload: str) -> Finding:
        """Inverse zu `to_json`."""
        return cls.from_dict(json.loads(payload))


def _parse_datetime(value: Any) -> datetime:
    """Akzeptiert datetime oder ISO-String; alles andere ist Fehler."""
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value)
    raise TypeError(
        f"first_seen/last_seen must be datetime or ISO string, got {type(value)!r}"
    )


# =============================================================================
# Iter 5: Bestand auf neuen Vertrag heben
# =============================================================================
#
# `processing/knx_stats.py` haelt die historischen Detektoren
# (Bus-Health-Score + Anti-Pattern-Detector) mit eigenen Dataclasses.
# Statt sie disruptiv umzubauen, liefern die folgenden Lift-Funktionen
# einen 1:1-Mapping ihrer Outputs auf den neuen Finding-Vertrag.
# Damit landen Bestandsdetektoren ab Iter 6/9 im Konfigurations-Check-
# Tab, ohne dass die existierenden Tests / API-Antworten brechen.

# Severity-Schwellen aus knx_stats.py — hier dupliziert, weil der Lift
# nicht von den dort liegenden Internals abhaengen soll. Werte stimmen
# absichtlich mit den `_*_CRITICAL`-Konstanten dort ueberein.
_HEALTH_REPEAT_PCT_CRITICAL: Final[float] = 5.0
_HEALTH_BUSLOAD_PCT_CRITICAL: Final[float] = 40.0
_HEALTH_ALARMS_CRITICAL: Final[int] = 5

_HEALTH_REPEAT_PCT_FINDING: Final[float] = 0.5
_HEALTH_BUSLOAD_PCT_FINDING: Final[float] = 20.0
_HEALTH_SILENCE_FINDING: Final[int] = 1
_HEALTH_ALARMS_FINDING: Final[int] = 1


def lift_health_findings(
    input_: HealthScoreInput,
    *,
    now: datetime,
) -> list[Finding]:
    """Mappt einen `HealthScoreInput` auf neue Finding-Liste.

    Pro KPI ein Finding mit `code = "HEALTH_*"`. severity ist `warning`
    unter der Critical-Schwelle, `error` darueber.
    """
    out: list[Finding] = []
    if input_.repeat_ratio_pct > _HEALTH_REPEAT_PCT_FINDING:
        out.append(
            _build_health_finding(
                code="HEALTH_REPEAT_RATE",
                severity=_severity_for(
                    input_.repeat_ratio_pct,
                    critical=_HEALTH_REPEAT_PCT_CRITICAL,
                ),
                evidence={
                    "repeat_ratio_pct": input_.repeat_ratio_pct,
                    "threshold": _HEALTH_REPEAT_PCT_FINDING,
                },
                now=now,
            )
        )
    if input_.busload_max_pct > _HEALTH_BUSLOAD_PCT_FINDING:
        out.append(
            _build_health_finding(
                code="HEALTH_BUSLOAD",
                severity=_severity_for(
                    input_.busload_max_pct,
                    critical=_HEALTH_BUSLOAD_PCT_CRITICAL,
                ),
                evidence={
                    "busload_max_pct": input_.busload_max_pct,
                    "threshold": _HEALTH_BUSLOAD_PCT_FINDING,
                },
                now=now,
            )
        )
    if input_.silent_devices >= _HEALTH_SILENCE_FINDING:
        out.append(
            _build_health_finding(
                code="HEALTH_SILENCE",
                severity="warning",
                evidence={"silent_devices": input_.silent_devices},
                now=now,
            )
        )
    if input_.open_alarms >= _HEALTH_ALARMS_FINDING:
        out.append(
            _build_health_finding(
                code="HEALTH_ALARMS",
                severity=_severity_for(
                    float(input_.open_alarms),
                    critical=float(_HEALTH_ALARMS_CRITICAL),
                ),
                evidence={"open_alarms": input_.open_alarms},
                now=now,
            )
        )
    return out


def lift_pattern_findings(
    legacy: list[LegacyPatternFinding],
    *,
    ga: str,
    source: str | None,
    now: datetime,
) -> list[Finding]:
    """Mappt Anti-Pattern-Findings (Legacy) auf neue Finding-Liste.

    `kind` -> `code` via `_KIND_TO_CODE`, `severity` (KnxSeverity) ->
    `FindingSeverity` via `_KNX_TO_FINDING_SEVERITY`. Der Legacy-Text
    wird in `evidence['legacy_text']` mitgenommen, damit die UI ihn
    rendern kann, bis die Translations stehen.
    """
    out: list[Finding] = []
    for legacy_finding in legacy:
        code = _KIND_TO_CODE.get(legacy_finding.kind)
        if code is None:
            continue
        severity = _KNX_TO_FINDING_SEVERITY.get(legacy_finding.severity, "info")
        out.append(
            Finding(
                code=code,
                schema_version=1,
                severity=severity,
                ga=ga,
                source=source,
                title="",
                description="",
                evidence={
                    "kind": legacy_finding.kind,
                    "legacy_text": legacy_finding.text,
                    "legacy_severity": legacy_finding.severity,
                },
                first_seen=now,
                last_seen=now,
                occurrence_count=1,
                detector_version=f"{code}/v1",
            )
        )
    return out


def _build_health_finding(
    *,
    code: str,
    severity: FindingSeverity,
    evidence: dict[str, Any],
    now: datetime,
) -> Finding:
    return Finding(
        code=code,
        schema_version=1,
        severity=severity,
        ga=None,  # bus-weite Findings haben keine GA
        source=None,
        title="",
        description="",
        evidence=evidence,
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=f"{code}/v1",
    )


def _severity_for(value: float, *, critical: float) -> FindingSeverity:
    """`error` ab `critical`, sonst `warning`. info/debug bei Bedarf
    spaeter — die Health-Inputs haben kein "ist OK"-Signal hier, weil
    `lift_health_findings` schon ueber der Schwelle filtert."""
    return "error" if value >= critical else "warning"


_KIND_TO_CODE: Final[dict[str, str]] = {
    "constant_value": "PATTERN_CONSTANT_VALUE",
    "read_burst": "PATTERN_READ_BURST",
    "multiple_response": "PATTERN_MULTIPLE_RESPONSE",
    "heartbeat_spam": "PATTERN_HEARTBEAT_SPAM",
}

_KNX_TO_FINDING_SEVERITY: Final[dict[str, FindingSeverity]] = {
    "green": "info",
    "yellow": "info",
    "orange": "warning",
    "red": "error",
}
