"""Unit-Tests fuer den Webhook-Handler — direkter Funktionsaufruf,
ohne kompletten HA-Stack."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock

import pytest

from custom_components.messagehub.const import DOMAIN
from custom_components.messagehub.ingestion.webhook import async_handle_webhook
from custom_components.messagehub.storage import (
    Database,
    MessageRepository,
    MigrationRunner,
    Severity,
)


class _FakeRequest:
    def __init__(self, body: bytes) -> None:
        self._body = body
        self.content_length = len(body) if body else 0

    async def read(self) -> bytes:
        return self._body


def _fake_hass(repo: MessageRepository) -> Any:
    hass = MagicMock()
    hass.data = {DOMAIN: {"entry": {"repository": repo}}}
    hass.bus.async_fire = MagicMock()
    return hass


@pytest.fixture
async def repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield MessageRepository(db)
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_webhook_accepts_minimal_json(repo: MessageRepository) -> None:
    body = json.dumps({"severity": "error", "source": "pihole", "text": "DNS down"}).encode()
    req = _FakeRequest(body)
    hass = _fake_hass(repo)

    resp = await async_handle_webhook(hass, "wh-1", req)
    assert resp.status == 204

    msgs = await repo.list_recent()
    assert len(msgs) == 1
    assert msgs[0].severity is Severity.ERROR
    assert msgs[0].source == "pihole"
    assert msgs[0].webhook_id == "wh-1"
    hass.bus.async_fire.assert_called_once()


@pytest.mark.asyncio
async def test_webhook_400_on_empty_body(repo: MessageRepository) -> None:
    req = _FakeRequest(b"")
    resp = await async_handle_webhook(_fake_hass(repo), "wh-1", req)
    assert resp.status == 400


@pytest.mark.asyncio
async def test_webhook_413_on_oversized_body(repo: MessageRepository) -> None:
    big = b"x" * (64 * 1024 + 1)
    req = _FakeRequest(big)
    resp = await async_handle_webhook(_fake_hass(repo), "wh-1", req)
    assert resp.status == 413


@pytest.mark.asyncio
async def test_webhook_falls_back_to_plain_text(repo: MessageRepository) -> None:
    req = _FakeRequest(b"hello plain text")
    resp = await async_handle_webhook(_fake_hass(repo), "wh-1", req)
    assert resp.status == 204
    msgs = await repo.list_recent()
    assert msgs[0].text == "hello plain text"


@pytest.mark.asyncio
async def test_webhook_400_on_invalid_source(repo: MessageRepository) -> None:
    body = json.dumps({"severity": "info", "source": "UPPER", "text": "x"}).encode()
    req = _FakeRequest(body)
    resp = await async_handle_webhook(_fake_hass(repo), "wh-1", req)
    assert resp.status == 400
