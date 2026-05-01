"""HTTP-API fuer das messagehub-Panel.

Wir importieren `messages` lazy ueber async_register_views, damit die
Subpackages `audit` und `export` ohne HA-Stack ladbar bleiben.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


def async_register_views(hass: HomeAssistant) -> None:
    from .messages import async_register_views as _impl  # noqa: PLC0415

    _impl(hass)


__all__ = ["async_register_views"]
