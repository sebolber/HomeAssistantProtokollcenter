"""Integrationstests fuer den Service `messagehub.add_message`."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
import voluptuous as vol
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.messagehub.const import DOMAIN, EVENT_MESSAGE_ADDED

if TYPE_CHECKING:
    from homeassistant.core import Event, HomeAssistant


async def _setup_entry(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, data={}, title="Message Hub")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


@pytest.mark.asyncio
async def test_add_message_service_is_registered(hass: HomeAssistant) -> None:
    await _setup_entry(hass)
    assert hass.services.has_service(DOMAIN, "add_message")


@pytest.mark.asyncio
async def test_add_message_service_persists_and_fires_event(hass: HomeAssistant) -> None:
    await _setup_entry(hass)

    received: list[Event] = []

    def _capture(event: Event) -> None:
        received.append(event)

    hass.bus.async_listen(EVENT_MESSAGE_ADDED, _capture)

    await hass.services.async_call(
        DOMAIN,
        "add_message",
        {
            "severity": "error",
            "source": "pihole",
            "text": "DNS unreachable",
            "metadata": {"host": "pi.hole"},
        },
        blocking=True,
    )
    # blocking=True wartet auf den Service-Handler, aber die Bus-Listener
    # laufen als separate Tasks auf dem Eventloop — async_block_till_done
    # spuelt sie, damit `received` befuellt ist.
    await hass.async_block_till_done()

    assert len(received) == 1
    payload = received[0].data
    assert payload["severity"] == "error"
    assert payload["source"] == "pihole"
    assert payload["text"] == "DNS unreachable"
    assert payload["metadata"] == {"host": "pi.hole"}
    assert isinstance(payload["id"], int)
    assert payload["id"] > 0


@pytest.mark.asyncio
async def test_add_message_service_rejects_invalid_severity(hass: HomeAssistant) -> None:
    await _setup_entry(hass)

    with pytest.raises(vol.Invalid):
        await hass.services.async_call(
            DOMAIN,
            "add_message",
            {
                "severity": "panic",
                "source": "pihole",
                "text": "boom",
            },
            blocking=True,
        )


@pytest.mark.asyncio
async def test_add_message_service_rejects_invalid_source(hass: HomeAssistant) -> None:
    await _setup_entry(hass)

    with pytest.raises(ValueError, match="Invalid source"):
        await hass.services.async_call(
            DOMAIN,
            "add_message",
            {
                "severity": "info",
                "source": "UPPERCASE",
                "text": "x",
            },
            blocking=True,
        )
