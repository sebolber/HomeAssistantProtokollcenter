"""Detector-Runner — verbindet Bausteine aus Iter 5/11/12/13/15/16/17/22.

Iter 29a (Wiring-Audit-Folge): Bisher waren die Detektoren reine Lib-
Funktionen ohne Caller. Dieser Runner fuehrt sie pro GA aus, wendet
den Severity-Resolver an und persistiert die Findings via
`FindingsRepository.record(...)`.

Aufgerufen vom Endpoint `POST /api/messagehub/findings/refresh` (siehe
`api/findings.py:FindingsRefreshView`) — der User triggert den Lauf
manuell aus der findings-view.

Bus-weite Detektoren (HEALTH_*, RECONNECT_STORM, MULTI_TIME_MASTER,
SEND_CYCLE_DRIFT, ORPHAN_GA, STALE_GA) laufen in Iter 29b ueber einen
Periodischen Job.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import TYPE_CHECKING, Any

from .findings import Finding, lift_pattern_findings
from .findings.dpt_mismatch import detect_dpt_mismatch
from .findings.multi_responder import detect_multi_responder
from .findings.read_no_response import detect_read_no_response
from .findings.repeat_approximation import detect_repeat_approximation
from .findings.toggle_loop import detect_toggle_loop
from .findings.value_range import detect_value_out_of_range
from .knx_stats import (
    TelegramSample,
    detect_patterns,
    infer_dpt_from_samples,
)

if TYPE_CHECKING:
    from ..storage.findings_repo import FindingsRepository
    from ..storage.knx_stats_repo import KnxStatsRepository
    from .knx_repo import KnxAddressRepository

_LOGGER = logging.getLogger(__name__)

# Mindest-Sample-Mengen fuer die Confidence-Stufen des Auto-Erkenners.
# Heuristik: je mehr Samples desto sicherer. Bei < _MIN_SAMPLES_FOR_INFER
# infereieren wir gar nicht, weil ein zufaelliger Schalt-Test sonst
# einen "DPT_MISMATCH"-Finding ausloesen koennte.
_MIN_SAMPLES_FOR_INFER = 10
_HIGH_CONFIDENCE_SAMPLES = 100
_MID_CONFIDENCE_SAMPLES = 30


def _confidence_from_sample_count(count: int) -> float:
    """Heuristische Confidence fuer `infer_dpt_from_samples`.

    Begruendung: `infer_dpt_from_samples` selbst gibt nur den DPT-String
    zurueck, keine Confidence. Wir bauen sie aus der Sample-Menge auf:
    bei wenigen Samples ist der Befund leichter zufaellig (z. B.
    Schalt-Test mit 5 mal `0`), bei vielen Samples ist er statistisch
    haerter. Schwellen aligned mit `DPT_MISMATCH_CONFIDENCE_THRESHOLD`
    (0.85) — d. h. ein "echter Mismatch" wird erst ab 30 Samples
    gemeldet, davor liefert der Detector None.
    """
    if count >= _HIGH_CONFIDENCE_SAMPLES:
        return 0.95
    if count >= _MID_CONFIDENCE_SAMPLES:
        return 0.85
    if count >= _MIN_SAMPLES_FOR_INFER:
        return 0.7
    return 0.0


async def run_per_ga_detectors(
    *,
    ga: str,
    findings_repo: FindingsRepository,
    address_repo: KnxAddressRepository,
    stats_repo: KnxStatsRepository,
    period_from: str,
    period_to: str,
    now: datetime,
) -> int:
    """Fuehrt alle GA-bezogenen Detektoren aus und persistiert Findings.

    Returns: Anzahl der persistierten Findings (incl. Dedup-Updates).

    Reihenfolge:
    1. Samples + Soll-DPT laden.
    2. Inferenz (`infer_dpt_from_samples`) + Persistenz
       (`set_dpt_inferred`) — schliesst Iter 11.
    3. Per-Sample: VALUE_OUT_OF_RANGE.
    4. Per-GA: DPT_MISMATCH, MULTI_RESPONDER, READ_NO_RESPONSE,
       TOGGLE_LOOP, REPEAT_APPROXIMATION.
    5. Legacy-Pattern-Detektor + lift_pattern_findings — schliesst Iter 5.
    6. Severity-Resolver (`resolve_severity`) anwenden — schliesst
       Iter-4-Luecke.
    7. `record(...)` — schliesst Iter-2-Luecke.
    """
    samples_raw = await stats_repo.ga_samples(ga, period_from, period_to)
    samples = _samples_from_raw(samples_raw)
    address = await address_repo.get(ga)
    project_dpt: str | None = address.dpt if address is not None else None

    inferred_value, inferred_confidence = await _persist_inferred_dpt(
        address_repo=address_repo,
        ga=ga,
        samples=samples,
        now=now,
    )

    findings: list[Finding] = []
    findings.extend(_per_sample_findings(ga, project_dpt, samples_raw, now))
    findings.extend(
        _per_ga_findings(
            ga=ga,
            project_dpt=project_dpt,
            inferred_dpt=inferred_value,
            inferred_confidence=inferred_confidence,
            samples=samples,
            samples_raw=samples_raw,
            period_from=period_from,
            period_to=period_to,
            now=now,
        )
    )
    findings.extend(_legacy_pattern_findings(ga, samples, samples_raw, now))

    return await _record_with_severity_override(findings_repo, findings)


async def _persist_inferred_dpt(
    *,
    address_repo: KnxAddressRepository,
    ga: str,
    samples: list[TelegramSample],
    now: datetime,
) -> tuple[str | None, float]:
    """Inferiert DPT + persistiert in `knx_group_addresses`.

    Liefert `(inferred_dpt, confidence)` fuer den DPT_MISMATCH-Detector.
    """
    if not samples:
        return None, 0.0
    values = [s.value for s in samples if s.telegramtype != "GroupValueRead"]
    inferred = infer_dpt_from_samples(values)
    if inferred is None:
        return None, 0.0
    confidence = _confidence_from_sample_count(len(values))
    if confidence <= 0.0:
        return inferred, confidence
    await address_repo.set_dpt_inferred(
        address=ga,
        dpt_inferred=inferred,
        confidence=confidence,
        at=now.isoformat(timespec="seconds"),
    )
    return inferred, confidence


def _samples_from_raw(rows: list[dict[str, Any]]) -> list[TelegramSample]:
    """Konvertiert ga_samples-Rows in TelegramSample-Objekte.

    Defensiv gegenueber kaputten ts-Strings: Rows mit invalidem ts
    werden uebersprungen, damit der Runner an einer einzelnen
    fehlerhaften Zeile nicht stehen bleibt.
    """
    out: list[TelegramSample] = []
    for row in rows:
        ts_raw = row.get("ts")
        if not ts_raw:
            continue
        try:
            ts = datetime.fromisoformat(str(ts_raw))
        except ValueError:
            _LOGGER.debug("ga_samples row mit invalidem ts %r uebersprungen", ts_raw)
            continue
        out.append(
            TelegramSample(
                ts=ts,
                value=row.get("value"),
                telegramtype=row.get("telegramtype"),
                source=str(row.get("dev_source", "")),
            )
        )
    return out


def _per_sample_findings(
    ga: str,
    project_dpt: str | None,
    samples_raw: list[dict[str, Any]],
    now: datetime,
) -> list[Finding]:
    """VALUE_OUT_OF_RANGE pro Write-Sample."""
    findings: list[Finding] = []
    for row in samples_raw:
        if row.get("telegramtype") == "GroupValueRead":
            continue
        finding = detect_value_out_of_range(
            ga=ga, dpt=project_dpt, value=row.get("value"), now=now,
        )
        if finding is not None:
            findings.append(finding)
    return findings


def _per_ga_findings(
    *,
    ga: str,
    project_dpt: str | None,
    inferred_dpt: str | None,
    inferred_confidence: float,
    samples: list[TelegramSample],
    samples_raw: list[dict[str, Any]],
    period_from: str,
    period_to: str,
    now: datetime,
) -> list[Finding]:
    """GA-bezogene Detektoren, die ein einzelnes Finding (oder None) liefern."""
    out: list[Finding] = []
    mismatch = detect_dpt_mismatch(
        ga=ga,
        project_dpt=project_dpt,
        inferred_dpt=inferred_dpt,
        confidence=inferred_confidence,
        samples=len(samples_raw),
        now=now,
    )
    if mismatch is not None:
        out.append(mismatch)
    multi = detect_multi_responder(ga=ga, samples=samples, now=now)
    if multi is not None:
        out.append(multi)
    out.extend(detect_read_no_response(ga=ga, samples=samples, now=now))
    toggle = detect_toggle_loop(ga=ga, dpt=project_dpt, samples=samples, now=now)
    if toggle is not None:
        out.append(toggle)
    period_days = _period_days(period_from, period_to)
    if period_days > 0:
        repeat = detect_repeat_approximation(
            ga=ga, samples=samples, period_days=period_days, now=now,
        )
        if repeat is not None:
            out.append(repeat)
    return out


def _legacy_pattern_findings(
    ga: str,
    samples: list[TelegramSample],
    samples_raw: list[dict[str, Any]],
    now: datetime,
) -> list[Finding]:
    """Legacy-Pattern-Detektor (knx_stats.detect_patterns) + Lift.

    Schliesst Iter-5-Luecke: bisher landeten Anti-Pattern-Findings nur
    in der KnxStats-Detail-Pane, nicht im Findings-Tab.
    """
    if not samples:
        return []
    legacy = detect_patterns(samples, dpt=None)
    if not legacy:
        return []
    source = samples_raw[0].get("dev_source") if samples_raw else None
    return lift_pattern_findings(legacy, ga=ga, source=source, now=now)


async def _record_with_severity_override(
    repo: FindingsRepository,
    findings: list[Finding],
) -> int:
    """Wendet den Severity-Resolver an und ruft `repo.record(...)`.

    Schliesst Iter-4-Luecke: Bisher hatte `resolve_severity` keinen
    Produktiv-Caller, User-Overrides griffen damit nirgends.
    """
    count = 0
    for finding in findings:
        try:
            severity = await repo.resolve_severity(finding.code)
        except KeyError:
            # Code nicht in KNX_FINDING_DEFAULT_SEVERITIES — defensiv
            # Default behalten (passiert nur bei fehlerhaftem Detector,
            # also Bug; loggen, nicht crashen).
            _LOGGER.warning(
                "code %s ohne Default-Severity, behalte Detector-Wert",
                finding.code,
            )
            severity = finding.severity
        finding_with_resolved = (
            finding if severity == finding.severity
            else _replace_severity(finding, severity)
        )
        await repo.record(finding_with_resolved)
        count += 1
    return count


def _replace_severity(finding: Finding, severity: str) -> Finding:
    """Liefert einen neuen Finding mit ueberschriebener Severity.

    Finding ist `frozen=True`; deshalb erzeugen wir eine neue Instanz
    statt zu mutieren.
    """
    return Finding(
        code=finding.code,
        schema_version=finding.schema_version,
        severity=severity,  # type: ignore[arg-type]
        ga=finding.ga,
        source=finding.source,
        title=finding.title,
        description=finding.description,
        evidence=dict(finding.evidence),
        first_seen=finding.first_seen,
        last_seen=finding.last_seen,
        occurrence_count=finding.occurrence_count,
        detector_version=finding.detector_version,
    )


def _period_days(period_from: str, period_to: str) -> float:
    try:
        from_dt = datetime.fromisoformat(period_from)
        to_dt = datetime.fromisoformat(period_to)
    except ValueError:
        return 0.0
    delta = (to_dt - from_dt).total_seconds()
    if delta <= 0:
        return 0.0
    return delta / 86400.0


__all__ = ["run_per_ga_detectors"]
