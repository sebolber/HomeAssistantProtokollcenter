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
            vol.Required(ATTR_SOURCE): cv.string,
            vol.Required(ATTR_TEXT): cv.string,
            vol.Optional(ATTR_METADATA): dict,
        }
    )


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
    domain_data[entry.entry_id] = {
        "database": database,
        "repository": repository,
        "webhook_repository": webhook_repository,
    }

    await _async_register_services(hass, repository)
    async_register_views(hass)
    await _async_register_panel(hass)
    _async_register_retention(hass, entry, database)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    _LOGGER.debug("messagehub config entry %s set up", entry.entry_id)
    return True


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
        panel_custom.async_register_panel(  # type: ignore[attr-defined]
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
