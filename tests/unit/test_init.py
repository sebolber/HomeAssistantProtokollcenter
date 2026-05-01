"""Tests fuer die Basis-Initialisierung der messagehub-Integration."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.messagehub import async_setup_entry, async_unload_entry
from custom_components.messagehub.const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


@pytest.mark.asyncio
async def test_setup_entry_succeeds_with_empty_config(hass: HomeAssistant) -> None:
    """async_setup_entry initialisiert mit leerer Konfiguration erfolgreich."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, title="Message Hub")
    entry.add_to_hass(hass)

    assert await async_setup_entry(hass, entry) is True
    assert DOMAIN in hass.data
    assert entry.entry_id in hass.data[DOMAIN]


@pytest.mark.asyncio
async def test_unload_entry_removes_state(hass: HomeAssistant) -> None:
    """async_unload_entry entfernt den Eintrag aus hass.data."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, title="Message Hub")
    entry.add_to_hass(hass)
    await async_setup_entry(hass, entry)

    assert await async_unload_entry(hass, entry) is True
    assert entry.entry_id not in hass.data[DOMAIN]
