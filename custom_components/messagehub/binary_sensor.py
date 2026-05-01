"""Binary-Sensor-Plattform fuer messagehub.

Iteration 5: Skelett-Sensor `binary_sensor.messagehub_has_unacknowledged_errors`.
Voll funktionsfaehiger Status-Lifecycle folgt in Iteration 28/29.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddEntitiesCallback


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Registriert das Skelett des Unack-Errors-Sensors."""
    _ = hass  # in spaeteren Iterationen fuer DB-Zugriffe genutzt
    async_add_entities([HasUnacknowledgedErrorsBinarySensor(entry.entry_id)], True)


class HasUnacknowledgedErrorsBinarySensor(BinarySensorEntity):
    """Wahr, wenn unbestaetigte Errors in den letzten 24h existieren.

    Iteration 5: Skelett — gibt aktuell immer False zurueck. Logik kommt
    in Iteration 28/29 mit Status-Lifecycle.
    """

    _attr_has_entity_name = True
    _attr_device_class = BinarySensorDeviceClass.PROBLEM
    _attr_should_poll = False

    def __init__(self, entry_id: str) -> None:
        self._entry_id = entry_id
        self._attr_unique_id = f"{DOMAIN}_{entry_id}_has_unacknowledged_errors"
        self._attr_name = "Has unacknowledged errors"
        self._attr_is_on = False
