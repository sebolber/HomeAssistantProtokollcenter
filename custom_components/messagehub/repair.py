"""Repair-Issues fuer messagehub.

HA hat ein eingebautes Repair-System (Settings -> Reparaturen). Wir
nutzen es, um dem User aktiv mitzuteilen, wenn etwas fehlt — statt
ihn raten zu lassen, warum keine Nachrichten ankommen.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


def _try_create_issue(
    hass: HomeAssistant,
    issue_id: str,
    *,
    severity: str,
    translation_key: str,
    translation_placeholders: dict[str, str] | None = None,
    learn_more_url: str | None = None,
    is_fixable: bool = False,
) -> None:
    """Best-effort Repair-Issue. Fehlende repair-Helper-Imports werden
    geloggt aber crashen das Setup nicht."""
    try:
        from homeassistant.helpers import issue_registry as ir  # noqa: PLC0415

        ir.async_create_issue(
            hass,
            DOMAIN,
            issue_id,
            is_fixable=is_fixable,
            severity=ir.IssueSeverity(severity) if isinstance(severity, str) else severity,
            translation_key=translation_key,
            translation_placeholders=translation_placeholders or {},
            learn_more_url=learn_more_url,
        )
    except (ImportError, AttributeError, ValueError) as err:
        _LOGGER.debug("Repair-Issue '%s' konnte nicht angelegt werden: %s", issue_id, err)


def _try_delete_issue(hass: HomeAssistant, issue_id: str) -> None:
    """Best-effort Repair-Issue-Loeschung — wenn das Problem geloest ist."""
    try:
        from homeassistant.helpers import issue_registry as ir  # noqa: PLC0415

        ir.async_delete_issue(hass, DOMAIN, issue_id)
    except (ImportError, AttributeError) as err:
        _LOGGER.debug("Repair-Issue '%s' konnte nicht entfernt werden: %s", issue_id, err)


def report_knx_unavailable(hass: HomeAssistant) -> None:
    """Wird bei Setup gerufen, wenn KNX-GAs konfiguriert sind, aber
    HA-KNX-Integration nicht laeuft."""
    _try_create_issue(
        hass,
        issue_id="knx_unavailable",
        severity="warning",
        translation_key="knx_unavailable",
        learn_more_url="https://www.home-assistant.io/integrations/knx/",
    )


def clear_knx_unavailable(hass: HomeAssistant) -> None:
    _try_delete_issue(hass, "knx_unavailable")


def report_mqtt_unavailable(hass: HomeAssistant) -> None:
    """MQTT-Topics konfiguriert aber MQTT-Integration nicht da."""
    _try_create_issue(
        hass,
        issue_id="mqtt_unavailable",
        severity="warning",
        translation_key="mqtt_unavailable",
        learn_more_url="https://www.home-assistant.io/integrations/mqtt/",
    )


def clear_mqtt_unavailable(hass: HomeAssistant) -> None:
    _try_delete_issue(hass, "mqtt_unavailable")
