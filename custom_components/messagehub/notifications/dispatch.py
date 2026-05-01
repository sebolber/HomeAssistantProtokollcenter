"""Dispatch-Wire-up: bei jedem persistierten Message → konfigurierte Channels."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from .forwarder import ChannelConfig, Forwarder

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from ..storage import Message
    from .repository import Channel, ChannelRepository

_LOGGER = logging.getLogger(__name__)


async def _ha_notify_handler(ch: ChannelConfig, msg: Message) -> None:
    """Default-Handler: ruft hass.services.async_call('notify', <service>, ...).

    Channel-Config:
      service: Name des notify-Services (z. B. 'telegram', 'pushover_admin')
      title:   Optionale title-Vorlage (Default: '[severity] source')
      target:  Optional, channel-spezifisch
    """
    cfg = ch.config or {}
    service = cfg.get("service")
    hass = cfg.get("_hass")
    if service is None or hass is None:
        return
    title = cfg.get("title") or f"[{msg.severity.value}] {msg.source}"
    payload: dict[str, Any] = {
        "title": title,
        "message": msg.text[:1024],
    }
    if "target" in cfg:
        payload["target"] = cfg["target"]
    if "data" in cfg and isinstance(cfg["data"], dict):
        payload["data"] = cfg["data"]
    try:
        await hass.services.async_call("notify", service, payload, blocking=False)
    except (RuntimeError, ValueError) as err:
        _LOGGER.warning("notify.%s failed: %s", service, err)


def build_forwarder_for_channels(hass: HomeAssistant, channels: list[Channel]) -> Forwarder:
    """Konvertiert DB-Channels in Forwarder-Configs und registriert Handler."""
    fwd = Forwarder()
    for ch in channels:
        if not ch.enabled:
            continue
        cfg_with_hass = dict(ch.config or {})
        cfg_with_hass["_hass"] = hass
        fwd.add_channel(
            ChannelConfig(
                name=ch.name,
                channel_type=ch.channel_type,
                enabled=ch.enabled,
                severity_threshold=ch.severity_threshold,
                quiet_start=ch.quiet_start,
                quiet_end=ch.quiet_end,
                quiet_bypass_error=ch.quiet_bypass_error,
                throttle_seconds=ch.throttle_seconds,
                config=cfg_with_hass,
            )
        )
    # Alle Typen werden auf den HA-notify-Pfad gemappt — der konkrete Service
    # wird per channel.config.service unterschieden.
    for channel_type in ("telegram", "pushover", "ntfy", "signal", "notify"):
        fwd.register_handler(channel_type, _ha_notify_handler)
    return fwd


class DispatchManager:
    """Verwaltet einen aktuellen Forwarder und reload, wenn Channels sich aendern."""

    def __init__(self, hass: HomeAssistant, channel_repo: ChannelRepository) -> None:
        self._hass = hass
        self._repo = channel_repo
        self._forwarder: Forwarder | None = None

    async def reload(self) -> None:
        channels = await self._repo.list_enabled()
        self._forwarder = build_forwarder_for_channels(self._hass, channels)

    async def dispatch(self, msg: Message) -> list[str]:
        if self._forwarder is None:
            await self.reload()
        if self._forwarder is None:
            return []
        return await self._forwarder.dispatch(msg)
