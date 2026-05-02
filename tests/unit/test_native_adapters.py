"""Tests fuer native_adapters (telegram, pushover, ntfy).

Verifizieren:
- Credentials werden korrekt aus channel.config gelesen
- Endpunkt-URLs entsprechen der jeweiligen API
- Severity-Mapping (Pushover priority, ntfy priority+tag)
- Fehlt eine Pflicht-Credential, wird _LOGGER.warning gerufen statt Crash
- HTTP-Errors werden gefangen und nur geloggt

Mock-Strategie: aiohttp.ClientSession wird komplett gepatcht. So
testen wir die Adapter-Logik ohne echte HTTP-Calls.
"""

from __future__ import annotations

import logging
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest

from custom_components.messagehub.notifications.forwarder import ChannelConfig
from custom_components.messagehub.notifications.native_adapters import (
    _ntfy_priority,
    _ntfy_tag,
    ntfy_send,
    pushover_send,
    telegram_send,
)
from custom_components.messagehub.storage import Message, Severity


def _make_msg(
    severity: Severity = Severity.WARNING,
    source: str = "tests",
    text: str = "hallo welt",
) -> Message:
    return Message(severity=severity, source=source, text=text)


class _MockResponse:
    def __init__(self, status: int = 200, body: str = "") -> None:
        self.status = status
        self._body = body

    async def text(self) -> str:
        return self._body

    async def __aenter__(self) -> _MockResponse:
        return self

    async def __aexit__(self, *_: Any) -> None:
        return None


class _MockSession:
    """Sammelt POST-Aufrufe in self.calls und liefert konfigurierte Response."""

    def __init__(self, response: _MockResponse | None = None) -> None:
        self._response = response or _MockResponse()
        self.calls: list[dict[str, Any]] = []

    def post(self, url: str, **kwargs: Any) -> _MockResponse:
        self.calls.append({"url": url, **kwargs})
        return self._response

    async def __aenter__(self) -> _MockSession:
        return self

    async def __aexit__(self, *_: Any) -> None:
        return None


# ─── Telegram ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_telegram_skips_when_credentials_missing(caplog: pytest.LogCaptureFixture) -> None:
    channel = ChannelConfig(name="t1", channel_type="telegram", config={"chat_id": "123"})
    with caplog.at_level(logging.WARNING):
        await telegram_send(channel, _make_msg())
    assert "bot_token + chat_id missing" in caplog.text


@pytest.mark.asyncio
async def test_telegram_posts_to_bot_api() -> None:
    channel = ChannelConfig(
        name="t1",
        channel_type="telegram",
        config={"bot_token": "BOT123:abc", "chat_id": "999"},
    )
    session = _MockSession()
    with patch(
        "custom_components.messagehub.notifications.native_adapters.aiohttp.ClientSession",
        return_value=session,
    ):
        await telegram_send(channel, _make_msg(severity=Severity.ERROR, source="ha", text="boom"))

    assert len(session.calls) == 1
    call = session.calls[0]
    assert call["url"] == "https://api.telegram.org/botBOT123:abc/sendMessage"
    payload = call["json"]
    assert payload["chat_id"] == "999"
    assert payload["parse_mode"] == "Markdown"
    assert "[error] ha" in payload["text"]
    assert "boom" in payload["text"]


@pytest.mark.asyncio
async def test_telegram_logs_http_error(caplog: pytest.LogCaptureFixture) -> None:
    channel = ChannelConfig(
        name="t1",
        channel_type="telegram",
        config={"bot_token": "x", "chat_id": "y"},
    )
    session = _MockSession(response=_MockResponse(status=429, body="rate limited"))
    with (
        patch(
            "custom_components.messagehub.notifications.native_adapters.aiohttp.ClientSession",
            return_value=session,
        ),
        caplog.at_level(logging.WARNING),
    ):
        await telegram_send(channel, _make_msg())
    assert "telegram t1 -> 429" in caplog.text


@pytest.mark.asyncio
async def test_telegram_swallows_client_errors(caplog: pytest.LogCaptureFixture) -> None:
    channel = ChannelConfig(
        name="t1",
        channel_type="telegram",
        config={"bot_token": "x", "chat_id": "y"},
    )
    raising_session = MagicMock()
    raising_session.__aenter__ = AsyncMock(side_effect=aiohttp.ClientError("network down"))
    raising_session.__aexit__ = AsyncMock(return_value=None)
    with (
        patch(
            "custom_components.messagehub.notifications.native_adapters.aiohttp.ClientSession",
            return_value=raising_session,
        ),
        caplog.at_level(logging.WARNING),
    ):
        # darf nicht raisen
        await telegram_send(channel, _make_msg())
    assert "telegram t1 failed" in caplog.text


# ─── Pushover ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_pushover_skips_when_credentials_missing(caplog: pytest.LogCaptureFixture) -> None:
    channel = ChannelConfig(name="p1", channel_type="pushover", config={"app_token": "x"})
    with caplog.at_level(logging.WARNING):
        await pushover_send(channel, _make_msg())
    assert "app_token + user_key missing" in caplog.text


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("severity", "expected_priority"),
    [
        (Severity.DEBUG, -1),
        (Severity.INFO, -1),
        (Severity.WARNING, 0),
        (Severity.ERROR, 1),
    ],
)
async def test_pushover_priority_maps_per_severity(
    severity: Severity, expected_priority: int
) -> None:
    channel = ChannelConfig(
        name="p1",
        channel_type="pushover",
        config={"app_token": "tok", "user_key": "usr"},
    )
    session = _MockSession()
    with patch(
        "custom_components.messagehub.notifications.native_adapters.aiohttp.ClientSession",
        return_value=session,
    ):
        await pushover_send(channel, _make_msg(severity=severity))

    assert len(session.calls) == 1
    payload = session.calls[0]["data"]
    assert payload["priority"] == expected_priority
    assert payload["token"] == "tok"
    assert payload["user"] == "usr"


@pytest.mark.asyncio
async def test_pushover_includes_optional_device() -> None:
    channel = ChannelConfig(
        name="p1",
        channel_type="pushover",
        config={"app_token": "x", "user_key": "y", "device": "iphone"},
    )
    session = _MockSession()
    with patch(
        "custom_components.messagehub.notifications.native_adapters.aiohttp.ClientSession",
        return_value=session,
    ):
        await pushover_send(channel, _make_msg())
    assert session.calls[0]["data"]["device"] == "iphone"


# ─── ntfy ────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_ntfy_skips_without_topic(caplog: pytest.LogCaptureFixture) -> None:
    channel = ChannelConfig(name="n1", channel_type="ntfy", config={})
    with caplog.at_level(logging.WARNING):
        await ntfy_send(channel, _make_msg())
    assert "topic missing" in caplog.text


@pytest.mark.asyncio
async def test_ntfy_uses_default_base_url_and_topic_in_path() -> None:
    channel = ChannelConfig(
        name="n1",
        channel_type="ntfy",
        config={"topic": "alerts"},
    )
    session = _MockSession()
    with patch(
        "custom_components.messagehub.notifications.native_adapters.aiohttp.ClientSession",
        return_value=session,
    ):
        await ntfy_send(channel, _make_msg(text="hallo"))
    call = session.calls[0]
    assert call["url"] == "https://ntfy.sh/alerts"
    assert call["data"] == b"hallo"
    assert call["headers"]["Title"].startswith("[warning]")
    assert "Authorization" not in call["headers"]


@pytest.mark.asyncio
async def test_ntfy_uses_custom_base_url_and_token() -> None:
    channel = ChannelConfig(
        name="n1",
        channel_type="ntfy",
        config={"base_url": "https://my.ntfy.server/", "topic": "x", "token": "secret"},
    )
    session = _MockSession()
    with patch(
        "custom_components.messagehub.notifications.native_adapters.aiohttp.ClientSession",
        return_value=session,
    ):
        await ntfy_send(channel, _make_msg())
    call = session.calls[0]
    assert call["url"] == "https://my.ntfy.server/x"
    assert call["headers"]["Authorization"] == "Bearer secret"


def test_ntfy_priority_per_severity() -> None:
    assert _ntfy_priority("debug") == "1"
    assert _ntfy_priority("info") == "3"
    assert _ntfy_priority("warning") == "4"
    assert _ntfy_priority("error") == "5"
    assert _ntfy_priority("anything-else") == "3"


def test_ntfy_tag_per_severity() -> None:
    assert _ntfy_tag("error") == "rotating_light"
    assert _ntfy_tag("warning") == "warning"
    assert _ntfy_tag("info") == "information_source"
    assert _ntfy_tag("debug") == "speech_balloon"
    assert _ntfy_tag("foo") == "information_source"
