"""Heartbeat- und Anomaly-Tick — beide laufen alle 60 s.

Heartbeat: erkennt 'silent sources' (Quellen, die normalerweise alle X min
liefern, aber jetzt seit >1.5*X stumm sind).

Anomaly: vergleicht den 1-Min-Bucket-Count pro Source mit EWMA-Mean +
3-sigma-Schwelle und meldet Bursts.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

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


def async_register_periodic_jobs(hass: HomeAssistant, database: Any, repository: Any) -> Any:
    """Registriert Heartbeat + Anomaly-Tick (alle 60 s)."""
    # HA-Eventbus-Helper bleibt lazy: Tests instanziieren Periodic-Jobs
    # ohne vollstaendigen HA-Stack.
    from homeassistant.helpers.event import async_track_time_interval  # noqa: PLC0415

    hb_repo = HeartbeatRepository(database)
    metrics_repo = SourceMetricsRepository(database)

    async def _heartbeat_tick(_now: Any) -> None:
        await _run_heartbeat_tick(hass, repository, hb_repo)

    async def _anomaly_tick(_now: Any) -> None:
        await _run_anomaly_tick(hass, repository, database, metrics_repo)

    unsub_hb = async_track_time_interval(hass, _heartbeat_tick, timedelta(seconds=60))
    unsub_an = async_track_time_interval(hass, _anomaly_tick, timedelta(seconds=60))

    def _unsub() -> None:
        unsub_hb()
        unsub_an()

    return _unsub
