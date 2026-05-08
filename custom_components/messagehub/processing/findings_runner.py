"""Detector-Runner — verbindet Bausteine aus Iter 5/11/12/13/15-22/24/25.

Iter 29a (Wiring-Audit-Folge): Per-GA-Detektoren (DPT_MISMATCH,
VALUE_OUT_OF_RANGE, MULTI_RESPONDER, READ_NO_RESPONSE, TOGGLE_LOOP,
REPEAT_APPROXIMATION, PATTERN_*) laufen on-demand via API
(`POST /findings/refresh`).

Iter 29b: Bus-weite Detektoren (HEALTH_*, RECONNECT_STORM,
SEND_CYCLE_DRIFT, MULTI_TIME_MASTER, ORPHAN_GA, STALE_GA) laufen
periodisch (alle 15 Min default) ueber einen Job
(`jobs/periodic.py:_run_findings_bus_wide_tick`).
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime
from typing import TYPE_CHECKING, Any

from .findings import Finding, lift_health_findings, lift_pattern_findings
from .findings.dpt_mismatch import detect_dpt_mismatch
from .findings.multi_responder import detect_multi_responder
from .findings.multi_time_master import CLOCK_DPTS, detect_multi_time_master
from .findings.orphan_ga import detect_orphan_ga
from .findings.read_no_response import detect_read_no_response
from .findings.reconnect_storm import detect_reconnect_storm
from .findings.repeat_approximation import detect_repeat_approximation
from .findings.send_cycle_drift import detect_send_cycle_drift
from .findings.send_to_nowhere import detect_send_to_nowhere
from .findings.stale_ga import detect_stale_ga
from .findings.toggle_loop import detect_toggle_loop
from .findings.value_range import detect_value_out_of_range
from .knx_stats import (
    HealthScoreInput,
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
    # Vergleichs-`now` muss zur Zeitstempel-Repraesentation der Samples
    # passen; `_samples_from_raw` liefert naive UTC, weil SQLite-`datetime`-
    # Stringe keine TZ liefern. Aufrufer schickt typischerweise `datetime.
    # now(UTC)` — wir strippen das tzinfo vor dem Vergleichen.
    now = _now_naive(now)
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

    Timestamps werden als naive UTC normalisiert (tzinfo abgestreift),
    weil SQLite-`datetime(...)` keine Zonen mitliefert und ein Mix aus
    aware/naive in `sorted(...)` einen TypeError werfen wuerde.
    """
    out: list[TelegramSample] = []
    for row in rows:
        ts_raw = row.get("ts")
        if not ts_raw:
            continue
        ts = _parse_naive_utc(str(ts_raw))
        if ts is None:
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


def _parse_naive_utc(value: str) -> datetime | None:
    """Parst ISO-String zu naivem UTC-Datetime; None bei Fehler."""
    try:
        ts = datetime.fromisoformat(value)
    except ValueError:
        return None
    if ts.tzinfo is not None:
        ts = ts.replace(tzinfo=None)
    return ts


def _now_naive(now: datetime) -> datetime:
    """Strippt tzinfo vom Vergleichs-`now`, damit Mischvergleich klappt."""
    return now.replace(tzinfo=None) if now.tzinfo is not None else now


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
    nowhere = detect_send_to_nowhere(ga=ga, samples=samples, now=now)
    if nowhere is not None:
        out.append(nowhere)
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


# ============================================================================
# Iter 29b: Bus-wide Detector Runner (periodisch).
# ============================================================================

# Default-Schwelle "stille Quelle" fuer den Health-Score-Input.
# Spiegelt den Default des KnxStatsService-/health_score-Endpoints
# (max_silence_minutes=60). 60 min ist konservativ — kuerzer wuerde
# tagsueber regelmaessig 'stille Heizungssteuerungen' melden.
_DEFAULT_MAX_SILENCE_MINUTES = 60

# Baseline fuer SEND_CYCLE_DRIFT: Recent = letzte 24 h, Baseline = die
# 7 Tage davor. Schwelle in `detect_send_cycle_drift` (50%-Halbierung).
_DRIFT_RECENT_DAYS = 1
_DRIFT_BASELINE_DAYS = 7


async def run_bus_wide_detectors(
    *,
    findings_repo: FindingsRepository,
    address_repo: KnxAddressRepository,
    stats_repo: KnxStatsRepository,
    period_from: str,
    period_to: str,
    now: datetime,
    bus_analysis_enabled: bool = True,
) -> int:
    """Fuehrt alle bus-weiten Detektoren aus und persistiert Findings.

    Reihenfolge:
    1. Bus-Health-Score-Inputs sammeln -> `lift_health_findings` (Iter 5).
    2. Pro Source: RECONNECT_STORM (Iter 20).
    3. Pro Whitelist-GA mit Clock-DPT (10/11/19): MULTI_TIME_MASTER (Iter 18).
    4. Pro Whitelist-GA: SEND_CYCLE_DRIFT (Iter 21), ORPHAN_GA (Iter 24),
       STALE_GA (Iter 25).
    5. Severity-Resolver + record() — analog zum per-GA-Runner.

    Iter A3: Bei deaktivierter Bus-Analyse (``bus_analysis_enabled=False``)
    wird genau EIN Finding ``ANALYSIS_DISABLED`` emittiert — alle anderen
    Detektoren werden uebersprungen, weil ihre Datenquelle
    (knx_raw_telegrams) leer waere und User keinen falschen "alles OK"-
    Eindruck bekommen sollen.

    Returns: Anzahl persistierter Findings.
    """
    now = _now_naive(now)
    if not bus_analysis_enabled:
        finding = build_analysis_disabled_finding(now=now)
        return await _record_with_severity_override(findings_repo, [finding])
    findings: list[Finding] = []
    findings.extend(await _build_health_findings(stats_repo, period_from, period_to, now))
    addresses = await address_repo.list_all()

    findings.extend(
        await _build_per_source_findings(stats_repo, period_from, period_to, now)
    )
    findings.extend(
        await _build_clock_master_findings(
            stats_repo, addresses, period_from, period_to, now,
        )
    )
    findings.extend(
        await _build_drift_findings(stats_repo, addresses, period_to, now)
    )
    findings.extend(
        await _build_silent_ga_findings(
            stats_repo, addresses, period_from, period_to, now,
        )
    )
    return await _record_with_severity_override(findings_repo, findings)


_ANALYSIS_DISABLED_VERSION = "ANALYSIS_DISABLED/v1"


def build_analysis_disabled_finding(*, now: datetime) -> Finding:
    """Liefert ein Finding, das anzeigt: Bus-Analyse-Toggle ist aus.

    Severity ``warning`` (nicht ``error``), weil das Abschalten ein
    bewusster Bedienakt sein kann (z. B. waehrend Datenmigration).
    Der User sieht trotzdem einen klaren Hinweis im Findings-Tab,
    statt eine leere Liste falsch zu interpretieren.
    """
    return Finding(
        code="ANALYSIS_DISABLED",
        schema_version=1,
        severity="warning",
        ga=None,
        source=None,
        title="",
        description="",
        evidence={
            "reason": "bus-analysis toggle disabled — no telegrams recorded",
        },
        first_seen=now,
        last_seen=now,
        occurrence_count=1,
        detector_version=_ANALYSIS_DISABLED_VERSION,
    )


async def _build_health_findings(
    stats_repo: KnxStatsRepository,
    period_from: str,
    period_to: str,
    now: datetime,
) -> list[Finding]:
    """Aggregiert die vier Health-KPIs und liftet sie auf Findings."""
    bus_h = await stats_repo.bus_health(period_from, period_to)
    busload = await stats_repo.busload_timeseries(period_from, period_to)
    busload_max = max((b["busload_pct"] for b in busload), default=0.0)
    # `silence_detect` parst now_iso -> last_seen_str und vergleicht beide.
    # Damit der Vergleich klappt, muss die TZ-Form zu der in der DB
    # gespeicherten `timestamp`-Spalte passen — die Tests/Snapshots nutzen
    # `+00:00`, also liefern wir den UTC-aware-String.
    from datetime import UTC as _UTC  # noqa: PLC0415
    now_for_silence = (
        now if now.tzinfo is not None else now.replace(tzinfo=_UTC)
    )
    silence = await stats_repo.silence_detect(
        period_from,
        period_to,
        now_iso=now_for_silence.isoformat(timespec="seconds"),
        max_silence_minutes=_DEFAULT_MAX_SILENCE_MINUTES,
    )
    silent_devices = sum(1 for r in silence if r["alarm"])
    input_ = HealthScoreInput(
        repeat_ratio_pct=float(bus_h["ratio_pct"]),
        busload_max_pct=float(busload_max),
        silent_devices=silent_devices,
        # open_alarms aus dem KnxStats-Service nicht direkt verfuegbar;
        # der Score-Endpoint nutzt aktuell auch 0 (siehe knx_stats_service
        # Iter 37). Identisches Verhalten hier, damit Findings konsistent
        # mit dem Score-Tab bleiben.
        open_alarms=0,
    )
    return lift_health_findings(input_, now=now)


async def _build_per_source_findings(
    stats_repo: KnxStatsRepository,
    period_from: str,
    period_to: str,
    now: datetime,
) -> list[Finding]:
    """RECONNECT_STORM: Pro `dev_source` 30-s-Avg + Burst nach Stille."""
    sample_rows = await _samples_for_period(stats_repo, period_from, period_to)
    if not sample_rows:
        return []
    by_source: dict[str, list[TelegramSample]] = defaultdict(list)
    for row in sample_rows:
        ts_str = row.get("ts")
        if not ts_str:
            continue
        ts = _parse_naive_utc(str(ts_str))
        if ts is None:
            continue
        sample = TelegramSample(
            ts=ts,
            value=row.get("value"),
            telegramtype=row.get("telegramtype"),
            source=str(row.get("dev_source", "")),
        )
        by_source[sample.source].append(sample)

    out: list[Finding] = []
    for source, samples in by_source.items():
        if not source:
            continue
        normal_avg = _normal_avg_per_30s(samples)
        finding = detect_reconnect_storm(
            source=source,
            samples=samples,
            now=now,
            normal_avg_per_30s=normal_avg,
        )
        if finding is not None:
            out.append(finding)
    return out


async def _build_clock_master_findings(
    stats_repo: KnxStatsRepository,
    addresses: list[Any],
    period_from: str,
    period_to: str,
    now: datetime,
) -> list[Finding]:
    """MULTI_TIME_MASTER fuer alle Whitelist-GAs mit Clock-DPT."""
    out: list[Finding] = []
    for addr in addresses:
        if addr.dpt not in CLOCK_DPTS:
            continue
        samples_raw = await stats_repo.ga_samples(
            addr.address, period_from, period_to,
        )
        samples = _samples_from_raw(samples_raw)
        finding = detect_multi_time_master(
            ga=addr.address, dpt=addr.dpt, samples=samples, now=now,
        )
        if finding is not None:
            out.append(finding)
    return out


async def _build_drift_findings(
    stats_repo: KnxStatsRepository,
    addresses: list[Any],
    period_to: str,
    now: datetime,
) -> list[Finding]:
    """SEND_CYCLE_DRIFT pro Whitelist-GA, mit 24h-vs-7d-Baseline."""
    out: list[Finding] = []
    try:
        period_to_dt = datetime.fromisoformat(period_to)
    except ValueError:
        return []
    from datetime import timedelta as _td  # noqa: PLC0415
    recent_from = period_to_dt - _td(days=_DRIFT_RECENT_DAYS)
    baseline_to = recent_from
    baseline_from = baseline_to - _td(days=_DRIFT_BASELINE_DAYS)
    for addr in addresses:
        recent_samples = _samples_from_raw(
            await stats_repo.ga_samples(
                addr.address,
                recent_from.isoformat(timespec="seconds"),
                period_to_dt.isoformat(timespec="seconds"),
            )
        )
        baseline_samples = _samples_from_raw(
            await stats_repo.ga_samples(
                addr.address,
                baseline_from.isoformat(timespec="seconds"),
                baseline_to.isoformat(timespec="seconds"),
            )
        )
        recent_dt = _median_dt_seconds(recent_samples)
        baseline_dt = _median_dt_seconds(baseline_samples)
        finding = detect_send_cycle_drift(
            ga=addr.address,
            recent_median_dt_sec=recent_dt,
            baseline_median_dt_sec=baseline_dt,
            now=now,
        )
        if finding is not None:
            out.append(finding)
    return out


async def _build_silent_ga_findings(
    stats_repo: KnxStatsRepository,
    addresses: list[Any],
    period_from: str,
    period_to: str,
    now: datetime,
) -> list[Finding]:
    """ORPHAN_GA + STALE_GA pro Whitelist-Eintrag."""
    out: list[Finding] = []
    counts = await _counts_per_ga(stats_repo, period_from, period_to)
    last_seen_map = await _last_seen_per_ga(stats_repo)
    for addr in addresses:
        count = counts.get(addr.address, 0)
        orphan = detect_orphan_ga(
            ga=addr.address,
            telegram_count=count,
            period_from=period_from,
            period_to=period_to,
            now=now,
        )
        if orphan is not None:
            out.append(orphan)
        last_seen_str = last_seen_map.get(addr.address)
        last_seen_dt: datetime | None = None
        if last_seen_str:
            last_seen_dt = _parse_naive_utc(last_seen_str)
        stale = detect_stale_ga(ga=addr.address, last_seen=last_seen_dt, now=now)
        if stale is not None:
            out.append(stale)
    return out


async def _samples_for_period(
    stats_repo: KnxStatsRepository,
    period_from: str,
    period_to: str,
) -> list[dict[str, Any]]:
    """Liefert ALLE Samples ueber den Zeitraum (fuer per-Source-Aggregation).

    Ohne explizite GA-Filterung — wir brauchen Samples aller Quellen, um
    RECONNECT_STORM-Bursts zu erkennen. SQL via direktes Query, weil
    `ga_samples` strikt pro GA arbeitet.
    """
    import contextlib  # noqa: PLC0415
    import json as _json  # noqa: PLC0415
    rows = await stats_repo._db.fetch_all(
        "SELECT timestamp AS ts, destination AS ga, source AS dev_source, "
        "       value, telegramtype "
        "FROM knx_raw_telegrams "
        "WHERE timestamp >= ? AND timestamp < ? "
        "ORDER BY timestamp ASC",
        (period_from, period_to),
    )
    out: list[dict[str, Any]] = []
    for row in rows:
        raw = row["value"]
        if isinstance(raw, str):
            with contextlib.suppress(ValueError, TypeError):
                raw = _json.loads(raw)
        out.append({
            "ts": str(row["ts"]),
            "ga": str(row["ga"]),
            "dev_source": str(row["dev_source"] or ""),
            "value": raw,
            "telegramtype": row["telegramtype"],
        })
    return out


async def _counts_per_ga(
    stats_repo: KnxStatsRepository,
    period_from: str,
    period_to: str,
) -> dict[str, int]:
    rows = await stats_repo._db.fetch_all(
        "SELECT destination AS ga, COUNT(*) AS n "
        "FROM knx_raw_telegrams "
        "WHERE timestamp >= ? AND timestamp < ? "
        "GROUP BY destination",
        (period_from, period_to),
    )
    return {str(r["ga"]): int(r["n"]) for r in rows}


async def _last_seen_per_ga(stats_repo: KnxStatsRepository) -> dict[str, str]:
    rows = await stats_repo._db.fetch_all(
        "SELECT destination AS ga, MAX(timestamp) AS last_seen "
        "FROM knx_raw_telegrams "
        "GROUP BY destination",
    )
    out: dict[str, str] = {}
    for row in rows:
        last = row["last_seen"]
        if last is None:
            continue
        out[str(row["ga"])] = str(last)
    return out


_MIN_SAMPLES_FOR_RATE = 2


def _normal_avg_per_30s(samples: list[TelegramSample]) -> float:
    """Mittlere Telegramm-Anzahl pro 30 s ueber den Sample-Zeitraum."""
    if len(samples) < _MIN_SAMPLES_FOR_RATE:
        return 0.0
    sorted_samples = sorted(samples, key=lambda s: s.ts)
    total_seconds = (sorted_samples[-1].ts - sorted_samples[0].ts).total_seconds()
    if total_seconds <= 0:
        return 0.0
    buckets = total_seconds / 30.0
    return len(samples) / buckets if buckets > 0 else 0.0


def _median_dt_seconds(samples: list[TelegramSample]) -> float:
    """Median(Δt) in Sekunden ueber die Sample-Folge.

    0.0 bei < 2 Samples — der Detector handhabt das als 'keine Baseline'.
    """
    if len(samples) < _MIN_SAMPLES_FOR_RATE:
        return 0.0
    import statistics  # noqa: PLC0415
    from itertools import pairwise  # noqa: PLC0415
    sorted_samples = sorted(samples, key=lambda s: s.ts)
    deltas = [(b.ts - a.ts).total_seconds() for a, b in pairwise(sorted_samples)]
    return float(statistics.median(deltas))


__all__ = ["run_bus_wide_detectors", "run_per_ga_detectors"]
