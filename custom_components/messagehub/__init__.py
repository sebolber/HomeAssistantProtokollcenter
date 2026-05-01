"""Home Assistant Custom Integration `messagehub`.

Zentrale Sammelstelle fuer Nachrichten und Fehlermeldungen aus mehreren
Eingangskanaelen (Webhook, MQTT, Eventbus, Syslog), persistiert in eigener
SQLite, dargestellt in einem Lovelace-Sidebar-Panel.

Spezifikation: docs/messagehub_konzept.md
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up messagehub from a config entry.

    Iteration 1: No-op-Initialisierung. Spaetere Iterationen ergaenzen
    Storage, Webhooks, Sensoren und Frontend-Panel.
    """
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {}
    _LOGGER.debug("messagehub config entry %s set up (no-op)", entry.entry_id)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True
