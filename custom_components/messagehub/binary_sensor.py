"""Binary-Sensor-Plattform fuer messagehub.

Iter 29: Sensor wird true, wenn unack-Errors existieren.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)

from .const import DOMAIN, EVENT_MESSAGE_ADDED, EVENT_MESSAGE_DELETED

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import Event, HomeAssistant
    from homeassistant.helpers.entity_platform import AddEntitiesCallback

    from .storage import MessageRepository


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Registriert binary_sensor.messagehub_has_unacknowledged_errors."""
    state = hass.data[DOMAIN][entry.entry_id]
    repo: MessageRepository = state["repository"]
    async_add_entities(
        [HasUnacknowledgedErrorsBinarySensor(entry.entry_id, repo)], update_before_add=True
    )


class HasUnacknowledgedErrorsBinarySensor(BinarySensorEntity):
    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.PROBLEM
    _attr_should_poll = False
    _attr_name = "Has unacknowledged errors"

    def __init__(self, entry_id: str, repo: MessageRepository) -> None:
        self._entry_id = entry_id
        self._repo = repo
        self._attr_unique_id = f"{DOMAIN}_{entry_id}_has_unacknowledged_errors"
        self._attr_is_on = False

    async def async_added_to_hass(self) -> None:
        async def _refresh(_event: Event | None = None) -> None:
            await self.async_update_ha_state(force_refresh=True)

        self.hass.bus.async_listen(EVENT_MESSAGE_ADDED, _refresh)
        self.hass.bus.async_listen(EVENT_MESSAGE_DELETED, _refresh)

    async def async_update(self) -> None:
        self._attr_is_on = (await self._repo.count_unacknowledged_errors()) > 0
