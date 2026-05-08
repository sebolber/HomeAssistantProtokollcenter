"""Heartbeat- und Anomaly-Tick — beide laufen alle 60 s.

Heartbeat: erkennt 'silent sources' (Quellen, die normalerweise alle X min
liefern, aber jetzt seit >1.5*X stumm sind).

Anomaly: vergleicht den 1-Min-Bucket-Count pro Source mit EWMA-Mean +
3-sigma-Schwelle und meldet Bursts.

Iter 24: knx-stats-Cleanup laeuft alle 6 Stunden — loescht
knx_raw_telegrams aelter als DEFAULT_KNX_RAW_RETENTION_HOURS,
knx_telegram_counters aelter als DEFAULT_KNX_COUNTER_RETENTION_DAYS,
plus Hard-Cap KNX_RAW_HARD_CAP_ROWS.

Iter 29b: bus-wide-Findings-Tick laeuft alle
KNX_FINDINGS_RUN_INTERVAL_MINUTES (default 15) — fuehrt
`run_bus_wide_detectors` aus, das HEALTH_*, RECONNECT_STORM,
SEND_CYCLE_DRIFT, MULTI_TIME_MASTER, ORPHAN_GA, STALE_GA aufruft.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

from ..const import (
    DEFAULT_KNX_COUNTER_RETENTION_DAYS,
    DEFAULT_KNX_FINDINGS_BUS_WIDE_PERIOD_DAYS,
    DEFAULT_KNX_RAW_RETENTION_HOURS,
    KNX_FINDINGS_RUN_INTERVAL_MINUTES,
    KNX_RAW_HARD_CAP_ROWS,
)
from ..helpers import fire_message_added
from ..processing.anomaly import SourceMetricsRepository, is_anomaly, update
from ..processing.heartbeat import HeartbeatRepository, is_silent
from ..storage import Message, Severity

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


async def _handle_silent_heartbeat(
    hass: HomeAssistant, repository: Any, hb_repo: Any, hb: Any
) -> None:
    """Erzeugt eine Heartbeat-Silent-Message und markiert die Quelle als gemeldet."""
    msg = Message(
        severity=Severity.WARNING,
        source="messagehub.heartbeat",
        text=f"silent: {hb.source} (>1.5x interval)",
        metadata={"heartbeat_source": hb.source},
    )
    await repository.insert_or_aggregate(msg)
    await hb_repo.set_silent(hb.source, True)
    fire_message_added(hass, msg)


async def _run_heartbeat_tick(hass: HomeAssistant, repository: Any, hb_repo: Any) -> None:
    """Prueft alle Heartbeats und meldet stille Quellen."""
    try:
        for hb in await hb_repo.list_all():
            if not hb.enabled or hb.silent_alert_active:
                continue
            if is_silent(hb):
                await _handle_silent_heartbeat(hass, repository, hb_repo, hb)
    except (ValueError, RuntimeError) as err:
        _LOGGER.warning("heartbeat tick failed: %s", err)


async def _handle_anomaly_row(
    hass: HomeAssistant,
    repository: Any,
    metrics_repo: Any,
    source: str,
    cnt: int,
    now_bucket: str,
) -> None:
    """Wertet eine source/count-Zeile aus, meldet Anomalien und aktualisiert Metriken."""
    metric = await metrics_repo.get(source)
    if metric.last_bucket == now_bucket:
        return
    if is_anomaly(metric, cnt):
        msg = Message(
            severity=Severity.WARNING,
            source="messagehub.anomaly",
            text=f"{source}: {cnt}/min (mean ~{metric.ewma_rate:.1f})",
            metadata={"anomaly_source": source, "rate": cnt},
        )
        await repository.insert_or_aggregate(msg, window_minutes=15)
        fire_message_added(hass, msg)
    metric = update(metric, cnt)
    metric.last_bucket = now_bucket
    await metrics_repo.save(metric)


async def _run_anomaly_tick(
    hass: HomeAssistant, repository: Any, database: Any, metrics_repo: Any
) -> None:
    """Vergleicht 1-Min-Bucket-Counts pro Source mit EWMA-Mean."""
    try:
        cutoff = (datetime.now(UTC) - timedelta(minutes=1)).isoformat(timespec="seconds")
        rows = await database.fetch_all(
            "SELECT source, COUNT(*) AS cnt FROM messages WHERE timestamp >= ? GROUP BY source",
            (cutoff,),
        )
        now_bucket = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M")
        for row in rows:
            source = str(row["source"])
            if source.startswith("messagehub."):
                continue
            await _handle_anomaly_row(
                hass, repository, metrics_repo, source, int(row["cnt"]), now_bucket
            )
    except (ValueError, RuntimeError) as err:
        _LOGGER.warning("anomaly tick failed: %s", err)


async def _run_knx_stats_cleanup(database: Any) -> None:
    """Iter 24: cleanup-Job fuer knx_raw_telegrams + knx_telegram_counters."""
    from ..storage.knx_stats_repo import KnxStatsRepository  # noqa: PLC0415

    repo = KnxStatsRepository(database)
    now = datetime.now(UTC)
    raw_cutoff = (now - timedelta(hours=DEFAULT_KNX_RAW_RETENTION_HOURS)).isoformat(
        timespec="seconds"
    )
    counter_cutoff = (now - timedelta(days=DEFAULT_KNX_COUNTER_RETENTION_DAYS)).strftime(
        "%Y-%m-%dT%H:00:00"
    )
    try:
        deleted_raw = await repo.cleanup_raw_older_than(raw_cutoff)
        deleted_capped = await repo.cleanup_raw_hard_cap(KNX_RAW_HARD_CAP_ROWS)
        deleted_counter = await repo.cleanup_counters_older_than(counter_cutoff)
        if deleted_raw or deleted_capped or deleted_counter:
            _LOGGER.info(
                "knx-stats cleanup: raw=%d (cap=%d), counters=%d",
                deleted_raw,
                deleted_capped,
                deleted_counter,
            )
    except (ValueError, RuntimeError) as err:
        _LOGGER.warning("knx-stats cleanup failed: %s", err)


async def _run_findings_bus_wide_tick(hass: HomeAssistant, database: Any) -> None:
    """Iter 29b: triggert run_bus_wide_detectors periodisch.

    Iter A3: Liest den Bus-Analyse-Toggle aus ``hass.data`` und reicht ihn
    an den Runner durch. Bei OFF emittiert der Runner ein
    ``ANALYSIS_DISABLED``-Finding statt aller anderen Detektoren.

    Faengt Exceptions defensiv ab und loggt sie, damit ein einzelner
    fehlerhafter Tick den HA-Job-Scheduler nicht stoert.
    """
    from ..const import DOMAIN, HASS_KEY_KNX_BUS_ANALYSIS  # noqa: PLC0415
    from ..processing.findings_runner import (  # noqa: PLC0415
        run_bus_wide_detectors,
    )
    from ..processing.knx_repo import KnxAddressRepository  # noqa: PLC0415
    from ..storage.findings_repo import FindingsRepository  # noqa: PLC0415
    from ..storage.knx_stats_repo import KnxStatsRepository  # noqa: PLC0415

    now = datetime.now(UTC)
    period_to = now
    period_from = now - timedelta(days=DEFAULT_KNX_FINDINGS_BUS_WIDE_PERIOD_DAYS)
    domain_data = hass.data.get(DOMAIN, {})
    bus_analysis_enabled = bool(
        domain_data.get(HASS_KEY_KNX_BUS_ANALYSIS, True)
    )
    try:
        recorded = await run_bus_wide_detectors(
            findings_repo=FindingsRepository(database),
            address_repo=KnxAddressRepository(database),
            stats_repo=KnxStatsRepository(database),
            period_from=period_from.isoformat(timespec="seconds"),
            period_to=period_to.isoformat(timespec="seconds"),
            now=now,
            bus_analysis_enabled=bus_analysis_enabled,
        )
        if recorded:
            _LOGGER.info("knx-findings bus-wide tick: %d Findings persistiert", recorded)
    except (ValueError, RuntimeError) as err:
        _LOGGER.warning("knx-findings bus-wide tick failed: %s", err)


def async_register_periodic_jobs(hass: HomeAssistant, database: Any, repository: Any) -> Any:
    """Registriert Heartbeat + Anomaly-Tick (alle 60 s) + KNX-Stats-Cleanup
    (alle 6 h) + bus-wide-Findings-Tick (alle 15 Min)."""
    # HA-Eventbus-Helper bleibt lazy: Tests instanziieren Periodic-Jobs
    # ohne vollstaendigen HA-Stack.
    from homeassistant.helpers.event import async_track_time_interval  # noqa: PLC0415

    hb_repo = HeartbeatRepository(database)
    metrics_repo = SourceMetricsRepository(database)

    async def _heartbeat_tick(_now: Any) -> None:
        await _run_heartbeat_tick(hass, repository, hb_repo)

    async def _anomaly_tick(_now: Any) -> None:
        await _run_anomaly_tick(hass, repository, database, metrics_repo)

    async def _knx_cleanup_tick(_now: Any) -> None:
        await _run_knx_stats_cleanup(database)

    async def _findings_bus_wide_tick(_now: Any) -> None:
        await _run_findings_bus_wide_tick(hass, database)

    unsub_hb = async_track_time_interval(hass, _heartbeat_tick, timedelta(seconds=60))
    unsub_an = async_track_time_interval(hass, _anomaly_tick, timedelta(seconds=60))
    unsub_cleanup = async_track_time_interval(hass, _knx_cleanup_tick, timedelta(hours=6))
    unsub_findings = async_track_time_interval(
        hass,
        _findings_bus_wide_tick,
        timedelta(minutes=KNX_FINDINGS_RUN_INTERVAL_MINUTES),
    )

    def _unsub() -> None:
        unsub_hb()
        unsub_an()
        unsub_cleanup()
        unsub_findings()

    return _unsub
