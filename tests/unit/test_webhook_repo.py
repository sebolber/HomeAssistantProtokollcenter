"""Tests fuer WebhookConfigRepository."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.storage import (
    Database,
    MigrationRunner,
    Severity,
    WebhookConfig,
    WebhookConfigRepository,
)


@pytest.fixture
async def repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield WebhookConfigRepository(db)
    finally:
        await db.close()


def _cfg(name: str = "Pi-hole", **kwargs) -> WebhookConfig:  # type: ignore[no-untyped-def]
    defaults = {
        "name": name,
        "webhook_id": WebhookConfigRepository.generate_webhook_id(),
        "default_source": "pihole",
        "default_severity": Severity.INFO,
    }
    defaults.update(kwargs)
    return WebhookConfig(**defaults)


@pytest.mark.asyncio
async def test_add_and_get(repo: WebhookConfigRepository) -> None:
    cfg = _cfg()
    new_id = await repo.add(cfg)
    assert new_id > 0

    loaded = await repo.get(cfg.webhook_id)
    assert loaded is not None
    assert loaded.name == "Pi-hole"
    assert loaded.default_severity is Severity.INFO


@pytest.mark.asyncio
async def test_update_persists_changes(repo: WebhookConfigRepository) -> None:
    cfg = _cfg()
    await repo.add(cfg)
    cfg.default_severity = Severity.ERROR
    cfg.enabled = False
    await repo.update(cfg)

    loaded = await repo.get(cfg.webhook_id)
    assert loaded is not None
    assert loaded.default_severity is Severity.ERROR
    assert loaded.enabled is False


@pytest.mark.asyncio
async def test_delete_returns_true_when_existed(repo: WebhookConfigRepository) -> None:
    cfg = _cfg()
    await repo.add(cfg)
    assert await repo.delete(cfg.webhook_id) is True
    assert await repo.delete(cfg.webhook_id) is False


@pytest.mark.asyncio
async def test_list_all_returns_all(repo: WebhookConfigRepository) -> None:
    await repo.add(_cfg(name="A"))
    await repo.add(_cfg(name="B"))
    await repo.add(_cfg(name="C"))
    items = await repo.list_all()
    assert len(items) == 3


@pytest.mark.asyncio
async def test_generate_id_url_safe() -> None:
    wid = WebhookConfigRepository.generate_webhook_id()
    assert len(wid) == 32
    assert "/" not in wid
    assert "+" not in wid
    assert "=" not in wid
