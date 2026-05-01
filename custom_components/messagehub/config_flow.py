"""Config-Flow fuer die messagehub-Integration.

Iteration 7: Single-Instance-Erstinstallation + Options-Flow fuer
Retention-Defaults, Hard-Cap, Log-Level und Aggregations-Fenster.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow

from .const import (
    DEFAULT_AGGREGATION_WINDOW_MINUTES,
    DEFAULT_HARD_CAP_TOTAL,
    DEFAULT_LOG_LEVEL,
    DEFAULT_RETENTION_DEBUG_DAYS,
    DEFAULT_RETENTION_ERROR_DAYS,
    DEFAULT_RETENTION_INFO_DAYS,
    DEFAULT_RETENTION_WARNING_DAYS,
    DOMAIN,
    OPT_AGGREGATION_WINDOW_MINUTES,
    OPT_HARD_CAP_TOTAL,
    OPT_LOG_LEVEL,
    OPT_RETENTION_DEBUG_DAYS,
    OPT_RETENTION_ERROR_DAYS,
    OPT_RETENTION_INFO_DAYS,
    OPT_RETENTION_WARNING_DAYS,
)

if TYPE_CHECKING:
    from homeassistant.data_entry_flow import FlowResult

LOG_LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR"]


class MessageHubConfigFlow(ConfigFlow, domain=DOMAIN):
    """Erstinstallation: Single-Instance ohne Pflichtfelder."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(title="Message Hub", data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return MessageHubOptionsFlow(config_entry)


class MessageHubOptionsFlow(OptionsFlow):
    """Options-Flow: Retention, Hard-Cap, Log-Level, Aggregations-Fenster."""

    def __init__(self, entry: ConfigEntry) -> None:
        self._entry = entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        opts = self._entry.options
        schema = vol.Schema(
            {
                vol.Optional(
                    OPT_RETENTION_DEBUG_DAYS,
                    default=opts.get(OPT_RETENTION_DEBUG_DAYS, DEFAULT_RETENTION_DEBUG_DAYS),
                ): vol.All(vol.Coerce(int), vol.Range(min=0, max=3650)),
                vol.Optional(
                    OPT_RETENTION_INFO_DAYS,
                    default=opts.get(OPT_RETENTION_INFO_DAYS, DEFAULT_RETENTION_INFO_DAYS),
                ): vol.All(vol.Coerce(int), vol.Range(min=0, max=3650)),
                vol.Optional(
                    OPT_RETENTION_WARNING_DAYS,
                    default=opts.get(OPT_RETENTION_WARNING_DAYS, DEFAULT_RETENTION_WARNING_DAYS),
                ): vol.All(vol.Coerce(int), vol.Range(min=0, max=3650)),
                vol.Optional(
                    OPT_RETENTION_ERROR_DAYS,
                    default=opts.get(OPT_RETENTION_ERROR_DAYS, DEFAULT_RETENTION_ERROR_DAYS),
                ): vol.All(vol.Coerce(int), vol.Range(min=0, max=3650)),
                vol.Optional(
                    OPT_HARD_CAP_TOTAL,
                    default=opts.get(OPT_HARD_CAP_TOTAL, DEFAULT_HARD_CAP_TOTAL),
                ): vol.All(vol.Coerce(int), vol.Range(min=100, max=10_000_000)),
                vol.Optional(
                    OPT_AGGREGATION_WINDOW_MINUTES,
                    default=opts.get(
                        OPT_AGGREGATION_WINDOW_MINUTES,
                        DEFAULT_AGGREGATION_WINDOW_MINUTES,
                    ),
                ): vol.All(vol.Coerce(int), vol.Range(min=0, max=1440)),
                vol.Optional(
                    OPT_LOG_LEVEL,
                    default=opts.get(OPT_LOG_LEVEL, DEFAULT_LOG_LEVEL),
                ): vol.In(LOG_LEVELS),
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
