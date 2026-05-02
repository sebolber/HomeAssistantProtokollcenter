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

from .const import (
    DEVICE_MANUFACTURER,
    DEVICE_MODEL,
    DEVICE_NAME,
    DOMAIN,
    EVENT_MESSAGE_ADDED,
    SEVERITIES,
)

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

    # Iter 48 (N1): Bus-Analyse-Toggle aus messagehub_settings laden,
    # damit der Listener-Guard korrekt arbeitet — der Default kommt aus
    # const.py, falls die Tabelle noch leer ist.
    from .const import (  # noqa: PLC0415
        DEFAULT_KNX_BUS_ANALYSIS_ENABLED,
        HASS_KEY_KNX_BUS_ANALYSIS,
        SETTINGS_KEY_KNX_BUS_ANALYSIS,
    )
    from .storage.settings_repo import SettingsRepository  # noqa: PLC0415

    bus_analysis_enabled = await SettingsRepository(database).get_bool(
        SETTINGS_KEY_KNX_BUS_ANALYSIS,
        default=DEFAULT_KNX_BUS_ANALYSIS_ENABLED,
    )
    domain_data[HASS_KEY_KNX_BUS_ANALYSIS] = bus_analysis_enabled

    # v0.8.2: explizit das Geraet im Device-Registry anlegen, damit
    # bestehende Entitaeten aus aelteren Versionen (ohne device_info)
    # nach dem Update auch ohne Re-Setup mit dem Geraet verknuepft werden.
    _ensure_device_registered(hass, entry)

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

    _register_services(hass, repository)
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


async def _execute_remediation_hook(hass: HomeAssistant, source: str, hook: Any) -> None:
    """Fuehrt einen einzelnen Remediation-Hook aus oder loggt einen Vorschlag."""
    if hook.confirm_required:
        _LOGGER.info(
            "remediation suggestion: %s -> %s (manual confirm)",
            source,
            hook.automation_id,
        )
        return
    domain, _, name = hook.automation_id.partition(".")
    if not domain or not name:
        return
    try:
        await hass.services.async_call(
            domain, "turn_on", {"entity_id": hook.automation_id}, blocking=False
        )
        _LOGGER.info("remediation auto-executed: %s -> %s", source, hook.automation_id)
    except (ValueError, RuntimeError) as err:
        _LOGGER.warning("remediation %s failed: %s", hook.automation_id, err)


class _RemediationHookCache:
    """30-Sekunden-Cache fuer die Liste aktiver Remediation-Hooks."""

    TTL_SECONDS = 30.0

    def __init__(self, repo: Any) -> None:
        self._repo = repo
        self._hooks: list[Any] | None = None
        self._ts: float = 0.0

    async def get(self) -> list[Any]:
        from time import monotonic  # noqa: PLC0415

        now = monotonic()
        if self._hooks is None or now - self._ts > self.TTL_SECONDS:
            self._hooks = await self._repo.list_enabled()
            self._ts = now
        return self._hooks


def _async_register_remediation_listener(hass: HomeAssistant, database: Any) -> Any:
    """Iter 47: lauscht auf message_added, matched gegen Hooks, fuehrt
    auto-Modus aus oder setzt eine Vorschlag-Notiz."""
    from .processing.remediation import matches as hook_matches  # noqa: PLC0415
    from .processing.remediation_repo import RemediationHookRepository  # noqa: PLC0415

    cache = _RemediationHookCache(RemediationHookRepository(database))

    async def _on_added(event: Any) -> None:
        try:
            source = str(dict(event.data).get("source", ""))
            # Auto-Vermeidung: keine Remediation auf eigene Meta-Sources.
            if source.startswith("messagehub."):
                return
            for hook in await cache.get():
                if hook_matches(hook, source, None):
                    await _execute_remediation_hook(hass, source, hook)
        except (ValueError, RuntimeError) as err:
            _LOGGER.debug("remediation listener skipped: %s", err)

    return hass.bus.async_listen(EVENT_MESSAGE_ADDED, _on_added)


# MQTT-Subscriptions in listeners/mqtt.py extrahiert.
from .listeners.mqtt import (  # noqa: E402
    async_register_mqtt_subscriptions as _async_register_mqtt_subscriptions,
)


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


# Syslog-Listener nach listeners/syslog.py ausgelagert.
from .listeners.syslog import (  # noqa: E402
    async_register_syslog_listener as _async_register_syslog_listener,
)


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


# KNX-Listener-Funktionen sind nach listeners/knx.py umgezogen.
# Re-Exports fuer Backward-Compat: Tests und alte Import-Pfade
# erwarten die alten privaten Namen weiterhin in __init__.
from .listeners.knx import (  # noqa: E402, F401
    _build_knx_message,
    _get_xknx_instance,
    _log_knx_event,
    _telegram_to_knx_event_data,
)
from .listeners.knx import async_register_knx_listener as _async_register_knx_listener  # noqa: E402


def _fire_added(hass: HomeAssistant, message: Any) -> None:
    """Backward-compat-Wrapper. Neue Implementation in helpers.py."""
    from .helpers import fire_message_added  # noqa: PLC0415

    fire_message_added(hass, message)


# Periodic-Jobs nach jobs/periodic.py ausgelagert.
from .jobs.periodic import (  # noqa: E402, F401
    _handle_anomaly_row,
    _handle_silent_heartbeat,
    _run_anomaly_tick,
    _run_heartbeat_tick,
)
from .jobs.periodic import (  # noqa: E402
    async_register_periodic_jobs as _async_register_periodic_jobs,
)


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


def _ensure_device_registered(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Legt das messagehub-Geraet im HA-Device-Registry an (oder updated es).

    Wird beim Setup aufgerufen — auch beim Reload nach einem Update von
    einer alten Version, die noch kein DeviceInfo auf den Entitaeten
    hatte. Damit existieren das Geraet und seine identifiers garantiert,
    sodass HA die Entitaeten beim Setup zuordnen kann und der "Zu
    Dashboard hinzufuegen"-Knopf in Geraete & Dienste erscheint.

    Best-effort: wenn die Registry-API auf einer HA-Version unerwartet
    reagiert, soll das den ganzen Setup nicht hart abbrechen.
    """
    try:
        from homeassistant.helpers import device_registry as dr  # noqa: PLC0415

        registry = dr.async_get(hass)
        registry.async_get_or_create(
            config_entry_id=entry.entry_id,
            identifiers={(DOMAIN, entry.entry_id)},
            manufacturer=DEVICE_MANUFACTURER,
            model=DEVICE_MODEL,
            name=DEVICE_NAME,
            configuration_url=f"homeassistant://navigate/{DOMAIN}",
        )
    except Exception as err:
        # Geraete-Registrierung ist Komfort, nicht kritisch — Setup soll
        # weiterlaufen, Entitaeten zeigen sich dann ohne Geraete-Gruppe.
        _LOGGER.warning("device-registry update skipped: %s", err)


def _bundle_cache_buster(bundle_path: Path) -> str:
    """Liefert eine kurze Cache-Buster-Zeichenkette aus der Bundle-mtime.

    Hintergrund: HA serviert das Panel-JS unter einem festen Pfad ohne
    eingebauten Hash. Ohne Cache-Buster zeigt der Browser nach einem
    Frontend-Rebuild das alte Bundle aus dem HTTP-Cache.
    """
    try:
        mtime = int(bundle_path.stat().st_mtime)
    except OSError:
        return "0"
    return str(mtime)


async def _async_register_panel(hass: HomeAssistant) -> None:
    """Registriert das Sidebar-Panel (Iter 16)."""
    from homeassistant.components import frontend, panel_custom  # noqa: PLC0415

    frontend_path = Path(__file__).parent / "frontend_dist"
    bundle_path = frontend_path / "messagehub-panel.js"
    # exists() ist blockierende I/O -> Executor
    exists = await hass.async_add_executor_job(frontend_path.exists)
    if not exists:
        _LOGGER.warning("frontend_dist/ fehlt — Panel wird ohne Build registriert")
    # mtime-basierter Cache-Buster, damit der Browser nach jedem Rebuild
    # das neue Bundle laedt statt aus dem HTTP-Cache zu servieren.
    buster = await hass.async_add_executor_job(_bundle_cache_buster, bundle_path)
    panel_url = f"/messagehub-panel/messagehub-panel.js?v={buster}"
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
        await panel_custom.async_register_panel(
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
    return bool(unload_ok)


def _register_services(hass: HomeAssistant, repository: MessageRepository) -> None:
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
