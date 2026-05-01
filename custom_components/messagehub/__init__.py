"""Home Assistant Custom Integration `messagehub`.

Zentrale Sammelstelle fuer Nachrichten und Fehlermeldungen aus mehreren
Eingangskanaelen (Webhook, MQTT, Eventbus, Syslog), persistiert in eigener
SQLite, dargestellt in einem Lovelace-Sidebar-Panel.

Spezifikation: docs/messagehub_konzept.md

Hinweis: Schwergewichtige HA-Imports (voluptuous, helpers.config_validation)
werden lazy in async_setup_entry geladen, damit die Subpackages
`storage` und `processing` ohne installierten HA-Stack importierbar
bleiben (z. B. in reinen Unit-Tests).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any

from .const import DOMAIN, EVENT_MESSAGE_ADDED, SEVERITIES

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant, ServiceCall

    from .storage import MessageRepository

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[str] = ["binary_sensor", "sensor"]

SERVICE_ADD_MESSAGE = "add_message"

ATTR_SEVERITY = "severity"
ATTR_SOURCE = "source"
ATTR_TEXT = "text"
ATTR_METADATA = "metadata"


def _build_add_message_schema() -> Any:
    """Lazy-baut das voluptuous-Schema (HA-Dep) erst beim Service-Register."""
    import voluptuous as vol  # noqa: PLC0415
    from homeassistant.helpers import config_validation as cv  # noqa: PLC0415

    return vol.Schema(
        {
            vol.Required(ATTR_SEVERITY): vol.In(SEVERITIES),
            vol.Required(ATTR_SOURCE): vol.All(cv.string, vol.Length(min=1, max=64)),
            vol.Required(ATTR_TEXT): vol.All(cv.string, vol.Length(min=1, max=8192)),
            vol.Optional(ATTR_METADATA): vol.Schema({str: object}),
        }
    )


async def _async_register_existing_webhooks(hass: HomeAssistant, webhook_repo: Any) -> None:
    """Liest beim Start alle in der DB hinterlegten Webhooks und registriert
    sie beim HA-Webhook-System, damit eingehende POSTs an unseren Handler
    geroutet werden."""
    configs = await webhook_repo.list_all()
    for cfg in configs:
        if not cfg.enabled:
            continue
        async_register_webhook(hass, cfg)


def async_register_webhook(hass: HomeAssistant, cfg: Any) -> None:
    """Registriert einen einzelnen Webhook beim HA-Webhook-System (idempotent)."""
    import contextlib  # noqa: PLC0415

    from homeassistant.components import webhook as ha_webhook  # noqa: PLC0415

    from .ingestion.webhook import async_handle_webhook  # noqa: PLC0415

    async def _handler(hass_: HomeAssistant, webhook_id: str, request: Any) -> Any:
        return await async_handle_webhook(hass_, webhook_id, request, config=cfg)

    with contextlib.suppress(ValueError, KeyError):
        ha_webhook.async_unregister(hass, cfg.webhook_id)
    ha_webhook.async_register(
        hass,
        DOMAIN,
        cfg.name,
        cfg.webhook_id,
        _handler,
        local_only=False,
    )
    _LOGGER.info("registered webhook %s -> %s", cfg.name, cfg.webhook_id)


def async_unregister_webhook(hass: HomeAssistant, webhook_id: str) -> None:
    import contextlib  # noqa: PLC0415

    from homeassistant.components import webhook as ha_webhook  # noqa: PLC0415

    with contextlib.suppress(ValueError, KeyError):
        ha_webhook.async_unregister(hass, webhook_id)
        _LOGGER.info("unregistered webhook %s", webhook_id)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up messagehub: oeffnet die DB, fuehrt Migrationen aus, registriert Services."""
    from .api import async_register_views  # noqa: PLC0415
    from .storage import (  # noqa: PLC0415
        Database,
        MessageRepository,
        MigrationRunner,
        WebhookConfigRepository,
    )
    from .storage.migrations import discover_migrations  # noqa: PLC0415

    config_dir = Path(hass.config.path(""))
    database = Database.for_config_dir(config_dir)
    # Datei-/Ordner-Anlage und Migration-Discovery laufen blockierend —
    # daher auf den Executor auslagern, damit der Event-Loop frei bleibt.
    await database.async_open(hass)
    migrations = await hass.async_add_executor_job(discover_migrations)
    await MigrationRunner(database, migrations=migrations).run()
    repository = MessageRepository(database)
    webhook_repository = WebhookConfigRepository(database)

    domain_data = hass.data.setdefault(DOMAIN, {})
    state = {
        "database": database,
        "repository": repository,
        "webhook_repository": webhook_repository,
    }
    domain_data[entry.entry_id] = state

    # Iter 30/31: Notification-Dispatch
    from .notifications.dispatch import DispatchManager  # noqa: PLC0415
    from .notifications.repository import ChannelRepository  # noqa: PLC0415

    channel_repo = ChannelRepository(database)
    dispatch = DispatchManager(hass, channel_repo)
    await dispatch.reload()
    state["channel_repository"] = channel_repo
    state["dispatch"] = dispatch

    # v0.3: GeoIP-Resolver (optional)
    from .processing.geoip import GeoIpResolver  # noqa: PLC0415

    geoip_path = Path(hass.config.path("messagehub")) / "GeoLite2-Country.mmdb"
    state["geoip"] = GeoIpResolver(geoip_path if geoip_path.is_file() else None)

    await _async_register_services(hass, repository)
    async_register_views(hass)
    await _async_register_panel(hass)
    _async_register_retention(hass, entry, database)
    await _async_register_existing_webhooks(hass, webhook_repository)
    state["unsub_eventbus"] = _async_register_eventbus_listeners(hass, repository)
    state["unsub_knx"] = _async_register_knx_listener(hass, database, repository)
    state["unsub_periodic"] = _async_register_periodic_jobs(hass, database, repository)
    state["unsub_dispatch"] = _async_register_dispatch_listener(hass, dispatch)
    state["unsub_remediation"] = _async_register_remediation_listener(hass, database)
    state["unsub_mqtt"] = await _async_register_mqtt_subscriptions(hass, database, repository)
    state["weekly_report_unsub"] = _async_register_weekly_report(hass, entry, database)
    state["unsub_syslog"] = await _async_register_syslog_listener(hass, entry, repository)
    state["pattern_unsub"] = _async_register_pattern_mining(hass, database, repository)

    # Options-Update-Listener (Review #5): Aenderungen aktivieren ohne Restart.
    state["unsub_options"] = entry.add_update_listener(_async_options_updated)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    _LOGGER.debug("messagehub config entry %s set up", entry.entry_id)
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Re-load die Integration beim Optionen-Update, damit z. B. Retention-Job
    mit neuen Werten neu geplant wird (Review #5)."""
    _LOGGER.debug("messagehub options updated, reloading entry %s", entry.entry_id)
    await hass.config_entries.async_reload(entry.entry_id)


def _async_register_eventbus_listeners(hass: HomeAssistant, repository: Any) -> Any:
    """Iter 38: HA-Eventbus-Listener fuer system_log_event und state_changed."""
    from homeassistant.const import EVENT_STATE_CHANGED  # noqa: PLC0415

    from .ingestion.eventbus import (  # noqa: PLC0415
        map_state_changed_unavailable,
        map_system_log_event,
    )
    from .storage import Message  # noqa: PLC0415

    async def _on_system_log(event: Any) -> None:
        try:
            severity, source, text = map_system_log_event(dict(event.data))
            if not text:
                return
            msg = Message(severity=severity, source=source, text=text or "system_log")
            await repository.insert_or_aggregate(msg, window_minutes=10)
            _fire_added(hass, msg)
        except (ValueError, TypeError) as err:
            _LOGGER.debug("system_log_event ingest skipped: %s", err)

    async def _on_state_change(event: Any) -> None:
        try:
            mapped = map_state_changed_unavailable(dict(event.data))
            if mapped is None:
                return
            severity, source, text = mapped
            msg = Message(severity=severity, source=source, text=text)
            await repository.insert_or_aggregate(msg, window_minutes=10)
            _fire_added(hass, msg)
        except (ValueError, TypeError) as err:
            _LOGGER.debug("state_changed ingest skipped: %s", err)

    unsub_log = hass.bus.async_listen("system_log_event", _on_system_log)
    unsub_state = hass.bus.async_listen(EVENT_STATE_CHANGED, _on_state_change)

    def _unsub() -> None:
        unsub_log()
        unsub_state()

    return _unsub


def _async_register_dispatch_listener(hass: HomeAssistant, dispatch: Any) -> Any:
    """Iter 30/31: lauscht auf messagehub_message_added und feuert konfigurierte Channels."""

    async def _on_added(event: Any) -> None:
        try:
            data = dict(event.data)
            from .storage import Message, Severity  # noqa: PLC0415

            msg = Message(
                severity=Severity.normalise(data.get("severity")),
                source=str(data.get("source", "?")),
                text=str(data.get("text", "")),
                metadata=data.get("metadata"),
            )
            msg.id = data.get("id")
            await dispatch.dispatch(msg)
        except (ValueError, RuntimeError) as err:
            _LOGGER.debug("dispatch skipped: %s", err)

    return hass.bus.async_listen(EVENT_MESSAGE_ADDED, _on_added)


def _async_register_remediation_listener(hass: HomeAssistant, database: Any) -> Any:
    """Iter 47: lauscht auf message_added, matched gegen Hooks, fuehrt
    auto-Modus aus oder setzt eine Vorschlag-Notiz."""
    from .processing.remediation import matches as hook_matches  # noqa: PLC0415
    from .processing.remediation_repo import RemediationHookRepository  # noqa: PLC0415

    repo = RemediationHookRepository(database)
    cache: dict[str, Any] = {"hooks": None, "ts": 0.0}
    cache_ttl = 30.0

    async def _hooks() -> list[Any]:
        from time import monotonic  # noqa: PLC0415

        now = monotonic()
        if cache["hooks"] is None or now - cache["ts"] > cache_ttl:
            cache["hooks"] = await repo.list_enabled()
            cache["ts"] = now
        return cache["hooks"]

    async def _on_added(event: Any) -> None:
        try:
            data = dict(event.data)
            source = str(data.get("source", ""))
            # Auto-Vermeidung: keine Remediation auf eigene Meta-Sources.
            if source.startswith("messagehub."):
                return
            for hook in await _hooks():
                if not hook_matches(hook, source, None):
                    continue
                if hook.confirm_required:
                    _LOGGER.info(
                        "remediation suggestion: %s -> %s (manual confirm)",
                        source,
                        hook.automation_id,
                    )
                    continue
                domain, _, name = hook.automation_id.partition(".")
                if not domain or not name:
                    continue
                try:
                    await hass.services.async_call(
                        domain, "turn_on", {"entity_id": hook.automation_id}, blocking=False
                    )
                    _LOGGER.info("remediation auto-executed: %s -> %s", source, hook.automation_id)
                except (ValueError, RuntimeError) as err:
                    _LOGGER.warning("remediation %s failed: %s", hook.automation_id, err)
        except (ValueError, RuntimeError) as err:
            _LOGGER.debug("remediation listener skipped: %s", err)

    return hass.bus.async_listen(EVENT_MESSAGE_ADDED, _on_added)


async def _async_register_mqtt_subscriptions(
    hass: HomeAssistant, database: Any, repository: Any
) -> Any:
    """Iter 37: registriert MQTT-Subscriptions fuer alle aktivierten topic_patterns."""
    from .ingestion.mqtt_repo import MqttTopicRepository  # noqa: PLC0415
    from .storage import Message, Severity  # noqa: PLC0415

    if "mqtt" not in hass.config.components:
        _LOGGER.debug("mqtt not loaded — skipping MQTT subscriptions")
        return None

    try:
        from homeassistant.components import mqtt  # noqa: PLC0415
    except ImportError:
        return None

    repo = MqttTopicRepository(database)
    topics = await repo.list_all()
    unsubs: list[Any] = []

    for topic in topics:
        if not topic.enabled:
            continue
        sev = Severity.normalise(topic.severity)
        captured_topic = topic

        async def _handler(message: Any, _t: Any = captured_topic, _s: Any = sev) -> None:
            try:
                payload = (
                    message.payload.decode("utf-8", errors="replace")
                    if isinstance(message.payload, bytes | bytearray)
                    else str(message.payload)
                )
                msg = Message(
                    severity=_s,
                    source=_t.source,
                    text=f"[{message.topic}] {payload}"[:8000],
                    metadata={"mqtt_topic": message.topic},
                )
                await repository.insert_or_aggregate(msg, window_minutes=10)
                _fire_added(hass, msg)
            except (ValueError, TypeError) as err:
                _LOGGER.debug("MQTT ingest skipped: %s", err)

        try:
            unsub = await mqtt.async_subscribe(hass, topic.topic_pattern, _handler)
            unsubs.append(unsub)
            _LOGGER.info("subscribed to MQTT %s -> %s", topic.topic_pattern, topic.source)
        except (ValueError, RuntimeError) as err:
            _LOGGER.warning("MQTT subscribe %s failed: %s", topic.topic_pattern, err)

    def _unsub_all() -> None:
        import contextlib  # noqa: PLC0415

        for u in unsubs:
            with contextlib.suppress(ValueError, RuntimeError):
                u()

    return _unsub_all


def _async_register_weekly_report(hass: HomeAssistant, entry: ConfigEntry, database: Any) -> Any:
    """Iter 46: sonntags 23:00 erzeugt einen Markdown-Report und schickt ihn
    via notify-Service (Empfaenger aus Options)."""
    from homeassistant.helpers.event import async_track_time_change  # noqa: PLC0415

    from .processing.reports import generate_weekly_report  # noqa: PLC0415

    async def _job(now: Any) -> None:
        weekday_sunday = 6
        if now.weekday() != weekday_sunday:
            return
        opts = entry.options
        notify_service = opts.get("weekly_notify_service")
        if not notify_service:
            return
        try:
            md = await generate_weekly_report(database)
            await hass.services.async_call(
                "notify",
                notify_service,
                {
                    "title": "messagehub Wochenreport",
                    "message": md,
                },
                blocking=False,
            )
            _LOGGER.info("weekly report dispatched via notify.%s", notify_service)
        except (ValueError, RuntimeError) as err:
            _LOGGER.warning("weekly report failed: %s", err)

    return async_track_time_change(hass, _job, hour=23, minute=0, second=0)


async def _async_register_syslog_listener(
    hass: HomeAssistant, entry: ConfigEntry, repository: Any
) -> Any:
    """Iter 39: optionaler Syslog-UDP-Listener (Default off)."""
    import asyncio  # noqa: PLC0415

    from .ingestion.syslog import parse_rfc3164  # noqa: PLC0415
    from .storage import Message  # noqa: PLC0415

    if not entry.options.get("syslog_enabled", False):
        return None
    port = int(entry.options.get("syslog_port", 5514))
    min_port, max_port = 1024, 65535
    if not (min_port <= port <= max_port):
        _LOGGER.warning("syslog_port %d ungueltig (%d-%d), skip", port, min_port, max_port)
        return None

    class _SyslogProtocol(asyncio.DatagramProtocol):
        def datagram_received(self, data: bytes, addr: Any) -> None:
            try:
                line = data.decode("utf-8", errors="replace").strip()
                parsed = parse_rfc3164(line)
                msg = Message(
                    severity=parsed.severity,
                    source=f"syslog.{parsed.hostname.lower()}"[:64].replace(" ", "-"),
                    text=parsed.text[:8000] if parsed.text else line[:8000],
                    metadata={"syslog_facility": parsed.facility, "remote": str(addr)},
                )
                hass.async_create_task(repository.insert_or_aggregate(msg, window_minutes=10))
                hass.async_create_task(_fire_added_async(hass, msg))
            except (ValueError, UnicodeDecodeError):
                pass

    async def _fire_added_async(h: Any, m: Any) -> None:
        _fire_added(h, m)

    loop = asyncio.get_event_loop()
    transport, _ = await loop.create_datagram_endpoint(
        _SyslogProtocol, local_addr=("0.0.0.0", port)
    )
    _LOGGER.info("syslog UDP listener active on :%d", port)

    def _unsub() -> None:
        transport.close()

    return _unsub


def _async_register_pattern_mining(hass: HomeAssistant, database: Any, repository: Any) -> Any:
    """v0.3: nightly um 04:15 — sucht regelmaessige Wiederholungen
    und erzeugt Meta-Nachrichten 'messagehub.pattern'."""
    from homeassistant.helpers.event import async_track_time_change  # noqa: PLC0415

    from .processing.patterns import detect_patterns  # noqa: PLC0415
    from .storage import Message, Severity  # noqa: PLC0415

    async def _job(_now: Any) -> None:
        try:
            patterns = await detect_patterns(database, days=30)
        except (ValueError, RuntimeError) as err:
            _LOGGER.warning("pattern mining failed: %s", err)
            return
        for p in patterns:
            text = (
                f"{p.source}: '{p.text_sample[:80]}' tritt {p.period} auf "
                f"({p.occurrences}x in 30 Tagen, conf={p.confidence})"
            )
            msg = Message(
                severity=Severity.INFO,
                source="messagehub.pattern",
                text=text,
                metadata={
                    "pattern_period": p.period,
                    "pattern_fingerprint": p.fingerprint,
                    "pattern_source": p.source,
                    "pattern_occurrences": p.occurrences,
                    "pattern_confidence": p.confidence,
                },
            )
            await repository.insert_or_aggregate(msg, window_minutes=1440)
            _fire_added(hass, msg)
        if patterns:
            _LOGGER.info("Pattern-Mining: %d wiederkehrende Pattern erkannt", len(patterns))

    return async_track_time_change(hass, _job, hour=4, minute=15, second=0)


def _async_register_knx_listener(hass: HomeAssistant, database: Any, repository: Any) -> Any:
    """Iter 48: lauscht auf knx_event und loggt nur GAs, die in
    knx_group_addresses mit log_enabled=1 hinterlegt sind.

    Voraussetzung: HA-KNX-Integration ist mit IP-Tunneling/Routing
    konfiguriert. Sie feuert pro Telegramm 'knx_event' mit den Feldern
    destination (Gruppenadresse), source (Geraete-Adresse), telegramtype,
    value, data."""
    from .processing.knx_dpt import format_value as format_knx_value  # noqa: PLC0415
    from .processing.knx_repo import (  # noqa: PLC0415
        KnxAddressRepository,
        resolve_severity,
    )
    from .storage import Message, Severity  # noqa: PLC0415

    knx_repo = KnxAddressRepository(database)
    cache: dict[str, Any] = {"map": None, "ts": 0.0}
    cache_ttl_seconds = 30.0

    async def _refresh_cache() -> dict[str, Any]:
        from time import monotonic  # noqa: PLC0415

        now = monotonic()
        if cache["map"] is None or now - cache["ts"] > cache_ttl_seconds:
            cache["map"] = await knx_repo.list_logged()
            cache["ts"] = now
        return cache["map"]

    async def _on_knx_event(event: Any) -> None:
        try:
            data = dict(event.data)
            ga = str(data.get("destination") or "").strip()
            if not ga:
                return
            mapping = await _refresh_cache()
            cfg = mapping.get(ga)
            if cfg is None:
                return
            telegramtype = data.get("telegramtype")
            value = data.get("value")
            if value is None:
                value = data.get("data")
            severity = Severity.normalise(resolve_severity(cfg, value))
            # v0.4: DPT-Formatter — `1.005 + True` -> 'Alarm', `9.001 + 21.5` -> '21.5 °C'.
            formatted = format_knx_value(cfg.dpt, value)
            text = f"{cfg.label} = {formatted}" if formatted else cfg.label
            if telegramtype and telegramtype != "GroupValueWrite":
                text = f"{text} ({telegramtype})"
            msg = Message(
                severity=severity,
                source="knx-bus",
                text=text,
                metadata={
                    "knx_ga": ga,
                    "knx_label": cfg.label,
                    "knx_dpt": cfg.dpt,
                    "knx_value": value,
                    "knx_source": data.get("source"),
                    "knx_telegramtype": telegramtype,
                },
            )
            await repository.insert_or_aggregate(msg, window_minutes=10)
            _fire_added(hass, msg)
        except (ValueError, TypeError, KeyError) as err:
            _LOGGER.debug("knx_event ingest skipped: %s", err)

    return hass.bus.async_listen("knx_event", _on_knx_event)


def _fire_added(hass: HomeAssistant, message: Any) -> None:
    """Helper: feuert messagehub_message_added konsistent."""
    hass.bus.async_fire(
        EVENT_MESSAGE_ADDED,
        {
            "id": message.id,
            "severity": message.severity.value,
            "source": message.source,
            "text": message.text,
            "metadata": message.metadata,
            "timestamp": message.timestamp_iso,
        },
    )


def _async_register_periodic_jobs(hass: HomeAssistant, database: Any, repository: Any) -> Any:
    """Iter 35: Heartbeat-Check, Iter 36: Anomalie-Evaluierung — beides 60s."""
    from datetime import UTC as _UTC  # noqa: PLC0415
    from datetime import datetime as _dt  # noqa: PLC0415
    from datetime import timedelta as _td  # noqa: PLC0415

    from homeassistant.helpers.event import async_track_time_interval  # noqa: PLC0415

    from .processing.anomaly import (  # noqa: PLC0415
        SourceMetricsRepository,
        is_anomaly,
        update,
    )
    from .processing.heartbeat import HeartbeatRepository, is_silent  # noqa: PLC0415
    from .storage import Message, Severity  # noqa: PLC0415

    hb_repo = HeartbeatRepository(database)
    metrics_repo = SourceMetricsRepository(database)

    async def _heartbeat_tick(_now: _dt) -> None:
        try:
            for hb in await hb_repo.list_all():
                if not hb.enabled or hb.silent_alert_active:
                    continue
                if is_silent(hb):
                    msg = Message(
                        severity=Severity.WARNING,
                        source="messagehub.heartbeat",
                        text=f"silent: {hb.source} (>1.5x interval)",
                        metadata={"heartbeat_source": hb.source},
                    )
                    await repository.insert_or_aggregate(msg)
                    await hb_repo.set_silent(hb.source, True)
                    _fire_added(hass, msg)
        except (ValueError, RuntimeError) as err:
            _LOGGER.warning("heartbeat tick failed: %s", err)

    async def _anomaly_tick(_now: _dt) -> None:
        try:
            cutoff = (_dt.now(_UTC) - _td(minutes=1)).isoformat(timespec="seconds")
            rows = await database.fetch_all(
                "SELECT source, COUNT(*) AS cnt FROM messages WHERE timestamp >= ? GROUP BY source",
                (cutoff,),
            )
            now_bucket = _dt.now(_UTC).strftime("%Y-%m-%dT%H:%M")
            for row in rows:
                source = str(row["source"])
                if source.startswith("messagehub."):
                    continue
                cnt = int(row["cnt"])
                metric = await metrics_repo.get(source)
                if metric.last_bucket == now_bucket:
                    continue
                if is_anomaly(metric, cnt):
                    msg = Message(
                        severity=Severity.WARNING,
                        source="messagehub.anomaly",
                        text=f"{source}: {cnt}/min (mean ~{metric.ewma_rate:.1f})",
                        metadata={"anomaly_source": source, "rate": cnt},
                    )
                    await repository.insert_or_aggregate(msg, window_minutes=15)
                    _fire_added(hass, msg)
                metric = update(metric, cnt)
                metric.last_bucket = now_bucket
                await metrics_repo.save(metric)
        except (ValueError, RuntimeError) as err:
            _LOGGER.warning("anomaly tick failed: %s", err)

    unsub_hb = async_track_time_interval(hass, _heartbeat_tick, _td(seconds=60))
    unsub_an = async_track_time_interval(hass, _anomaly_tick, _td(seconds=60))

    def _unsub() -> None:
        unsub_hb()
        unsub_an()

    return _unsub


def _async_register_retention(hass: HomeAssistant, entry: ConfigEntry, database: Any) -> None:
    """Registriert taeglichen Retention-Lauf um 03:30 (Iter 24)."""
    from datetime import datetime as _dt  # noqa: PLC0415

    from homeassistant.helpers.event import async_track_time_change  # noqa: PLC0415

    from .const import (  # noqa: PLC0415
        DEFAULT_HARD_CAP_TOTAL,
        DEFAULT_RETENTION_DEBUG_DAYS,
        DEFAULT_RETENTION_ERROR_DAYS,
        DEFAULT_RETENTION_INFO_DAYS,
        DEFAULT_RETENTION_WARNING_DAYS,
        OPT_HARD_CAP_TOTAL,
        OPT_RETENTION_DEBUG_DAYS,
        OPT_RETENTION_ERROR_DAYS,
        OPT_RETENTION_INFO_DAYS,
        OPT_RETENTION_WARNING_DAYS,
    )
    from .processing.retention import run_retention, run_vacuum  # noqa: PLC0415

    async def _job(now: _dt) -> None:
        opts = entry.options
        max_days = {
            "debug": opts.get(OPT_RETENTION_DEBUG_DAYS, DEFAULT_RETENTION_DEBUG_DAYS),
            "info": opts.get(OPT_RETENTION_INFO_DAYS, DEFAULT_RETENTION_INFO_DAYS),
            "warning": opts.get(OPT_RETENTION_WARNING_DAYS, DEFAULT_RETENTION_WARNING_DAYS),
            "error": opts.get(OPT_RETENTION_ERROR_DAYS, DEFAULT_RETENTION_ERROR_DAYS),
        }
        await run_retention(
            database,
            max_days=max_days,
            hard_cap_total=opts.get(OPT_HARD_CAP_TOTAL, DEFAULT_HARD_CAP_TOTAL),
        )
        weekday_sunday = 6
        if now.weekday() == weekday_sunday:
            await run_vacuum(database)

    state = hass.data[DOMAIN][entry.entry_id]
    state["retention_unsub"] = async_track_time_change(hass, _job, hour=3, minute=30, second=0)


async def _async_register_panel(hass: HomeAssistant) -> None:
    """Registriert das Sidebar-Panel (Iter 16)."""
    from homeassistant.components import frontend, panel_custom  # noqa: PLC0415

    panel_url = "/messagehub-panel/messagehub-panel.js"
    frontend_path = Path(__file__).parent / "frontend_dist"
    # exists() ist blockierende I/O -> Executor
    exists = await hass.async_add_executor_job(frontend_path.exists)
    if not exists:
        _LOGGER.warning("frontend_dist/ fehlt — Panel wird ohne Build registriert")
    # register_static_path ist intern blockierend (path stat).
    # Neuere HA-Versionen haben async_register_static_paths.
    if hasattr(hass.http, "async_register_static_paths"):
        from homeassistant.components.http import StaticPathConfig  # noqa: PLC0415

        await hass.http.async_register_static_paths(
            [StaticPathConfig("/messagehub-panel", str(frontend_path), False)]
        )
    else:
        await hass.async_add_executor_job(
            hass.http.register_static_path,
            "/messagehub-panel",
            str(frontend_path),
            False,
        )
    if "messagehub" in hass.data.get("frontend_panels", {}):
        return
    try:
        await panel_custom.async_register_panel(  # type: ignore[attr-defined]
            hass,
            webcomponent_name="messagehub-panel",
            frontend_url_path="messagehub",
            module_url=panel_url,
            sidebar_title="Messages",
            sidebar_icon="mdi:message-alert",
            require_admin=True,
            embed_iframe=False,
        )
    except (RuntimeError, ValueError):
        # Fallback fuer aeltere/neuere HA: nur statisch + frontend.async_register
        frontend.async_register_built_in_panel(
            hass,
            "custom",
            "Messages",
            "mdi:message-alert",
            "messagehub",
            config={
                "_panel_custom": {
                    "name": "messagehub-panel",
                    "embed_iframe": False,
                    "trust_external": False,
                    "module_url": panel_url,
                },
            },
            require_admin=True,
        )


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Tear down: schliesst die DB, entfernt den Service, gibt Plattformen frei."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    domain_data = hass.data.get(DOMAIN, {})
    state = domain_data.pop(entry.entry_id, None)
    if state is not None:
        import contextlib  # noqa: PLC0415

        geoip = state.get("geoip")
        if geoip is not None:
            with contextlib.suppress(Exception):
                geoip.close()
        for key in (
            "unsub_eventbus",
            "unsub_knx",
            "unsub_periodic",
            "unsub_dispatch",
            "unsub_remediation",
            "unsub_mqtt",
            "unsub_syslog",
            "unsub_options",
            "retention_unsub",
            "weekly_report_unsub",
            "pattern_unsub",
        ):
            unsub = state.get(key)
            if callable(unsub):
                with contextlib.suppress(RuntimeError, ValueError):
                    unsub()
        database = state["database"]
        await database.close()
    if not domain_data and hass.services.has_service(DOMAIN, SERVICE_ADD_MESSAGE):
        hass.services.async_remove(DOMAIN, SERVICE_ADD_MESSAGE)
    return unload_ok


async def _async_register_services(hass: HomeAssistant, repository: MessageRepository) -> None:
    """Registriert messagehub.add_message (idempotent)."""
    if hass.services.has_service(DOMAIN, SERVICE_ADD_MESSAGE):
        return

    async def _handle_add_message(call: ServiceCall) -> None:
        await _async_handle_add_message(hass, repository, call.data)

    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_MESSAGE,
        _handle_add_message,
        schema=_build_add_message_schema(),
    )


async def _async_handle_add_message(
    hass: HomeAssistant,
    repository: MessageRepository,
    data: dict[str, Any],
) -> None:
    """Validiert die Service-Eingaben, persistiert und feuert das Event."""
    from .storage import Message, Severity, validate_source, validate_text  # noqa: PLC0415

    severity = Severity.normalise(data[ATTR_SEVERITY])
    source = validate_source(data[ATTR_SOURCE])
    text = validate_text(data[ATTR_TEXT])
    metadata = data.get(ATTR_METADATA)

    message = Message(
        severity=severity,
        source=source,
        text=text,
        metadata=metadata,
    )
    new_id = await repository.insert(message)

    hass.bus.async_fire(
        EVENT_MESSAGE_ADDED,
        {
            "id": new_id,
            "severity": message.severity.value,
            "source": message.source,
            "text": message.text,
            "metadata": message.metadata,
            "timestamp": message.timestamp_iso,
        },
    )
