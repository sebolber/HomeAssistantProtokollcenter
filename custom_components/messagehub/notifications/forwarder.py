"""Notification-Forwarder mit Channel-Plugin-Pattern (Iter 30).

Quiet Hours + Throttling werden in Iter 31 hier integriert.
"""

from __future__ import annotations

import logging
import time as time_module
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import datetime
from datetime import time as dt_time
from typing import TYPE_CHECKING, Any, TypeAlias

from ..storage import Severity
from .quiet_hours import is_in_quiet_hours, parse_hhmm

if TYPE_CHECKING:
    from ..storage import Message

_LOGGER = logging.getLogger(__name__)

SEVERITY_RANK = {"debug": 0, "info": 1, "warning": 2, "error": 3}


@dataclass(slots=True)
class ChannelConfig:
    name: str
    channel_type: str
    enabled: bool = True
    severity_threshold: str = "warning"
    quiet_start: str | None = None
    quiet_end: str | None = None
    quiet_bypass_error: bool = True
    throttle_seconds: int = 600
    config: dict[str, Any] | None = None


SendFn: TypeAlias = Callable[[ChannelConfig, "Message"], Awaitable[None]]  # noqa: UP040


class Forwarder:
    def __init__(self) -> None:
        self._channels: list[ChannelConfig] = []
        self._handlers: dict[str, SendFn] = {}
        self._last_per_source_per_channel: dict[tuple[str, str], float] = {}

    def add_channel(self, channel: ChannelConfig) -> None:
        self._channels.append(channel)

    def register_handler(self, channel_type: str, fn: SendFn) -> None:
        self._handlers[channel_type] = fn

    async def dispatch(self, msg: Message, *, now: datetime | None = None) -> list[str]:
        """Schickt msg an alle passenden Channels. Liefert Liste der Channel-Namen."""
        if now is None:
            now = datetime.now()
        delivered: list[str] = []
        for ch in self._channels:
            if not ch.enabled:
                continue
            if not self._severity_passes(ch, msg.severity):
                continue
            if self._quiet_blocked(ch, now.time(), msg.severity):
                continue
            if self._throttled(ch.name, msg.source):
                continue
            handler = self._handlers.get(ch.channel_type)
            if handler is None:
                _LOGGER.warning("no handler for channel_type %s", ch.channel_type)
                continue
            try:
                await handler(ch, msg)
                delivered.append(ch.name)
                self._last_per_source_per_channel[(ch.name, msg.source)] = time_module.monotonic()
            except (RuntimeError, ValueError, ConnectionError) as err:
                _LOGGER.warning("dispatch to %s failed: %s", ch.name, err)
        return delivered

    @staticmethod
    def _severity_passes(ch: ChannelConfig, sev: Severity) -> bool:
        return SEVERITY_RANK[sev.value] >= SEVERITY_RANK.get(ch.severity_threshold, 1)

    @staticmethod
    def _quiet_blocked(ch: ChannelConfig, now: dt_time, sev: Severity) -> bool:
        start = parse_hhmm(ch.quiet_start)
        end = parse_hhmm(ch.quiet_end)
        if not is_in_quiet_hours(now, start, end):
            return False
        return not (sev is Severity.ERROR and ch.quiet_bypass_error)

    def _throttled(self, channel_name: str, source: str) -> bool:
        last = self._last_per_source_per_channel.get((channel_name, source))
        if last is None:
            return False
        ch = next((c for c in self._channels if c.name == channel_name), None)
        if ch is None:
            return False
        return (time_module.monotonic() - last) < ch.throttle_seconds


async def telegram_handler(ch: ChannelConfig, msg: Message) -> None:  # NOSONAR: Channel-Handler-Polymorphismus, gemeinsame async-Signatur mit pushover/ntfy/notify
    """Iter 30: Telegram via HA-notify.telegram. Stub fuer Tests; in HA wird
    dispatch ueber hass.services aufgerufen — siehe async_register_telegram_handler."""
    cfg = ch.config or {}
    target = cfg.get("chat_id", "?")
    _LOGGER.info("[telegram %s -> %s] %s", ch.name, target, msg.text[:80])
