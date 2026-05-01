"""Native HTTP-Adapter fuer Notification-Channels (v0.3).

Senden direkt an die jeweilige API (Telegram-Bot, Pushover, ntfy)
mit Credentials aus channel.config — ohne Umweg ueber HA-`notify`.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import aiohttp

if TYPE_CHECKING:
    from ..storage import Message
    from .forwarder import ChannelConfig

_LOGGER = logging.getLogger(__name__)

_HTTP_OK_CEILING = 400
_TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"
_PUSHOVER_API = "https://api.pushover.net/1/messages.json"


def _format_text(msg: Message) -> tuple[str, str]:
    """Liefert (title, body)."""
    title = f"[{msg.severity.value}] {msg.source}"
    body = msg.text[:1024]
    return title, body


async def telegram_send(channel: ChannelConfig, msg: Message) -> None:
    cfg = channel.config or {}
    token = cfg.get("bot_token")
    chat_id = cfg.get("chat_id")
    if not token or not chat_id:
        _LOGGER.warning("telegram channel %s: bot_token + chat_id missing", channel.name)
        return
    title, body = _format_text(msg)
    text = f"*{title}*\n{body}"
    url = _TELEGRAM_API.format(token=token)
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    timeout = aiohttp.ClientTimeout(total=8)
    try:
        async with (
            aiohttp.ClientSession(timeout=timeout) as session,
            session.post(url, json=payload) as resp,
        ):
            if resp.status >= _HTTP_OK_CEILING:
                err = await resp.text()
                _LOGGER.warning("telegram %s -> %d: %s", channel.name, resp.status, err[:200])
    except (aiohttp.ClientError, TimeoutError) as err:
        _LOGGER.warning("telegram %s failed: %s", channel.name, err)


async def pushover_send(channel: ChannelConfig, msg: Message) -> None:
    cfg = channel.config or {}
    app_token = cfg.get("app_token")
    user_key = cfg.get("user_key")
    if not app_token or not user_key:
        _LOGGER.warning("pushover %s: app_token + user_key missing", channel.name)
        return
    title, body = _format_text(msg)
    priority_map = {"debug": -1, "info": -1, "warning": 0, "error": 1}
    payload = {
        "token": app_token,
        "user": user_key,
        "title": title,
        "message": body,
        "priority": priority_map.get(msg.severity.value, 0),
    }
    if "device" in cfg:
        payload["device"] = cfg["device"]
    timeout = aiohttp.ClientTimeout(total=8)
    try:
        async with (
            aiohttp.ClientSession(timeout=timeout) as session,
            session.post(_PUSHOVER_API, data=payload) as resp,
        ):
            if resp.status >= _HTTP_OK_CEILING:
                err = await resp.text()
                _LOGGER.warning("pushover %s -> %d: %s", channel.name, resp.status, err[:200])
    except (aiohttp.ClientError, TimeoutError) as err:
        _LOGGER.warning("pushover %s failed: %s", channel.name, err)


async def ntfy_send(channel: ChannelConfig, msg: Message) -> None:
    cfg = channel.config or {}
    base_url = (cfg.get("base_url") or "https://ntfy.sh").rstrip("/")
    topic = cfg.get("topic")
    if not topic:
        _LOGGER.warning("ntfy %s: topic missing", channel.name)
        return
    title, body = _format_text(msg)
    headers = {
        "Title": title,
        "Priority": _ntfy_priority(msg.severity.value),
        "Tags": _ntfy_tag(msg.severity.value),
    }
    if cfg.get("token"):
        headers["Authorization"] = f"Bearer {cfg['token']}"
    timeout = aiohttp.ClientTimeout(total=8)
    url = f"{base_url}/{topic}"
    try:
        async with (
            aiohttp.ClientSession(timeout=timeout) as session,
            session.post(url, data=body.encode("utf-8"), headers=headers) as resp,
        ):
            if resp.status >= _HTTP_OK_CEILING:
                err = await resp.text()
                _LOGGER.warning("ntfy %s -> %d: %s", channel.name, resp.status, err[:200])
    except (aiohttp.ClientError, TimeoutError) as err:
        _LOGGER.warning("ntfy %s failed: %s", channel.name, err)


def _ntfy_priority(severity: str) -> str:
    return {"debug": "1", "info": "3", "warning": "4", "error": "5"}.get(severity, "3")


def _ntfy_tag(severity: str) -> str:
    return {
        "debug": "speech_balloon",
        "info": "information_source",
        "warning": "warning",
        "error": "rotating_light",
    }.get(severity, "information_source")
