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
    from .storage import Database, MessageRepository, MigrationRunner  # noqa: PLC0415

    config_dir = Path(hass.config.path(""))
    database = Database.for_config_dir(config_dir)
    await database.open()
    await MigrationRunner(database).run()
    repository = MessageRepository(database)

    domain_data = hass.data.setdefault(DOMAIN, {})
    domain_data[entry.entry_id] = {
        "database": database,
        "repository": repository,
    }

    await _async_register_services(hass, repository)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    _LOGGER.debug("messagehub config entry %s set up", entry.entry_id)
    return True


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
