"""Gemeinsame Helper-Funktionen, die quer ueber Listener und Jobs benutzt werden."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from .const import EVENT_MESSAGE_ADDED

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


def fire_message_added(hass: HomeAssistant, message: Any) -> None:
    """Feuert EVENT_MESSAGE_ADDED auf dem HA-Eventbus.

    Zentrale Stelle, damit alle Ingest-Pfade (Webhook, KNX, MQTT,
    Syslog, Eventbus, Service) die gleiche Event-Form ablegen — Frontend
    und Sensoren reagieren auf genau dieses Schema.
    """
    hass.bus.async_fire(
        EVENT_MESSAGE_ADDED,
        {
            "id": message.id,
            "severity": message.severity.value,
            "source": message.source,
            "text": message.text,
            "metadata": message.metadata,
            "timestamp": message.timestamp_iso,
        },
    )
