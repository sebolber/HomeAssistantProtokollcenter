"""Optionaler Syslog-UDP-Listener (Default off, in Optionen aktivierbar)."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from ..helpers import fire_message_added
from ..ingestion.syslog import parse_rfc3164
from ..storage import Message

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

# v0.10: Default-Bind auf localhost statt 0.0.0.0 — siehe S1 im Architektur-Review.
# 0.0.0.0 oeffnet den Port zum LAN/WAN, ohne Auth ist das Risiko zu hoch.
# Wer aus dem Netz Syslog senden will, setzt 'syslog_bind: 0.0.0.0' explizit.
DEFAULT_SYSLOG_BIND = "127.0.0.1"


async def async_register_syslog_listener(
    hass: HomeAssistant, entry: ConfigEntry, repository: Any
) -> Any:
    """Bindet einen UDP-Datagram-Listener auf den konfigurierten Port."""
    if not entry.options.get("syslog_enabled", False):
        return None
    port = int(entry.options.get("syslog_port", 5514))
    min_port, max_port = 1024, 65535
    if not (min_port <= port <= max_port):
        _LOGGER.warning("syslog_port %d ungueltig (%d-%d), skip", port, min_port, max_port)
        return None

    bind = str(entry.options.get("syslog_bind", DEFAULT_SYSLOG_BIND))
    if bind == "0.0.0.0":
        _LOGGER.warning(
            "messagehub: Syslog-Listener bindet auf 0.0.0.0 — der UDP-Port %d ist "
            "vom LAN/WAN aus erreichbar, ohne Auth. Nur in vertrauenswuerdigen "
            "Netzen aktivieren.",
            port,
        )

    class _SyslogProtocol(asyncio.DatagramProtocol):
        def datagram_received(self, data: bytes, addr: Any) -> None:
            try:
                line = data.decode("utf-8", errors="replace").strip()
                parsed = parse_rfc3164(line)
                msg = Message(
                    severity=parsed.severity,
                    source=f"syslog.{parsed.hostname.lower()}"[:64].replace(" ", "-"),
                    text=parsed.text[:8000] if parsed.text else line[:8000],
                    metadata={"syslog_facility": parsed.facility, "remote": str(addr)},
                )
                hass.async_create_task(repository.insert_or_aggregate(msg, window_minutes=10))
                fire_message_added(hass, msg)
            except (ValueError, UnicodeDecodeError):
                pass

    loop = asyncio.get_event_loop()
    transport, _ = await loop.create_datagram_endpoint(_SyslogProtocol, local_addr=(bind, port))
    _LOGGER.info("syslog UDP listener active on %s:%d", bind, port)

    def _unsub() -> None:
        transport.close()

    return _unsub
