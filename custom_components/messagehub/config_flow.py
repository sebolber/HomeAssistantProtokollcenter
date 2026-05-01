"""Config-Flow fuer die messagehub-Integration.

Iteration 1: Minimaler Single-Instance-Flow ohne Pflichtfelder.
Iteration 7 ergaenzt den vollstaendigen Options-Flow.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.config_entries import ConfigFlow

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.data_entry_flow import FlowResult


class MessageHubConfigFlow(ConfigFlow, domain=DOMAIN):
    """Config-Flow: Single-Instance, keine Pflichtfelder."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """User-Step: bestaetigen und Eintrag anlegen."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            return self.async_create_entry(title="Message Hub", data={})

        return self.async_show_form(step_id="user")
