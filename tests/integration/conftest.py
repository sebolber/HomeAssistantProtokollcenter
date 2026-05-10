"""Pytest-Fixtures fuer HA-Integration-Tests.

Lazy-Aktivierung der Custom-Integration-Loadability ueber das von
`pytest-homeassistant-custom-component` bereitgestellte
`enable_custom_integrations`-Fixture.
"""

from __future__ import annotations

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component


@pytest.fixture(autouse=True)
def _auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Aktiviert das Laden von custom_components fuer alle HA-Tests automatisch."""
    return


@pytest.fixture(autouse=True)
async def _setup_manifest_dependencies(hass: HomeAssistant) -> None:
    """manifest.json deklariert dependencies=[http, frontend, webhook]. In
    Produktiv-HA werden diese vor `async_setup_entry` geladen, in
    `pytest-homeassistant-custom-component` aber nicht — daher hier explizit.
    `frontend` wird transitiv durch `http` mitgesetzt; `webhook` setzen wir
    selbst, weil `register_webhook` sonst spaeter scheitert.
    """
    assert await async_setup_component(hass, "http", {})
    assert await async_setup_component(hass, "webhook", {})
