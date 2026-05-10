"""Tests fuer die Basis-Initialisierung der messagehub-Integration.

Beide Tests gehen ueber den `hass.config_entries`-Lifecycle, nicht ueber
direkte Aufrufe von `async_setup_entry` / `async_unload_entry`. Hintergrund:
Seit HA 2024.x lockt `async_forward_entry_setups` einen `setup_lock` mit
`OperationNotAllowed`, wenn der Entry-State nicht via `config_entries`
auf LOADED gesetzt wurde.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.messagehub.const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


@pytest.mark.asyncio
async def test_setup_entry_succeeds_with_empty_config(hass: HomeAssistant) -> None:
    """ConfigEntry initialisiert mit leerer Konfiguration erfolgreich."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, title="Message Hub")
    entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(entry.entry_id) is True
    await hass.async_block_till_done()
    assert DOMAIN in hass.data
    assert entry.entry_id in hass.data[DOMAIN]


@pytest.mark.asyncio
async def test_unload_entry_removes_state(hass: HomeAssistant) -> None:
    """ConfigEntry-Unload entfernt den Eintrag aus hass.data."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, title="Message Hub")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id) is True
    await hass.async_block_till_done()

    assert await hass.config_entries.async_unload(entry.entry_id) is True
    await hass.async_block_till_done()
    assert entry.entry_id not in hass.data[DOMAIN]
