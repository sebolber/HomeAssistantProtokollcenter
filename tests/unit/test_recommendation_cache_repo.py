"""Iter L4.0: Tests fuer RecommendationCacheRepository + Migration."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.migrations import MigrationRunner
from custom_components.messagehub.storage.recommendation_cache_repo import (
    RecommendationCacheRepository,
    make_cache_key,
)


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_migration_creates_cache_table(db: Database) -> None:
    rows = await db.fetch_all(
        "SELECT name FROM sqlite_master "
        "WHERE type='table' AND name='knx_recommendation_cache'"
    )
    assert rows


@pytest.mark.asyncio
async def test_migration_creates_expires_index(db: Database) -> None:
    rows = await db.fetch_all(
        "SELECT name FROM sqlite_master "
        "WHERE type='index' AND tbl_name='knx_recommendation_cache'"
    )
    names = {r["name"] for r in rows}
    assert "idx_knx_reco_cache_expires" in names


# ---------------------------------------------------------------------------
# make_cache_key
# ---------------------------------------------------------------------------


class TestCacheKey:
    def test_same_inputs_same_key(self) -> None:
        a = make_cache_key(
            provider="openai_chat",
            model="gpt-4o-mini",
            dpt="9.001",
            manufacturer="hoermann",
            device_model="garage-control",
        )
        b = make_cache_key(
            provider="openai_chat",
            model="gpt-4o-mini",
            dpt="9.001",
            manufacturer="hoermann",
            device_model="garage-control",
        )
        assert a == b

    def test_different_dpt_different_key(self) -> None:
        a = make_cache_key(
            provider="openai_chat",
            model="gpt-4o-mini",
            dpt="9.001",
            manufacturer=None,
            device_model=None,
        )
        b = make_cache_key(
            provider="openai_chat",
            model="gpt-4o-mini",
            dpt="9.004",
            manufacturer=None,
            device_model=None,
        )
        assert a != b

    def test_different_provider_different_key(self) -> None:
        a = make_cache_key(
            provider="openai_chat", model="x",
            dpt="1.001", manufacturer=None, device_model=None,
        )
        b = make_cache_key(
            provider="ollama", model="x",
            dpt="1.001", manufacturer=None, device_model=None,
        )
        assert a != b

    def test_prompt_version_invalidates(self) -> None:
        a = make_cache_key(
            provider="x", model="y",
            dpt="1.001", manufacturer=None, device_model=None,
            prompt_version="v1",
        )
        b = make_cache_key(
            provider="x", model="y",
            dpt="1.001", manufacturer=None, device_model=None,
            prompt_version="v2",
        )
        assert a != b

    def test_keys_are_hex_sha256(self) -> None:
        key = make_cache_key(
            provider="x", model="y", dpt=None,
            manufacturer=None, device_model=None,
        )
        assert len(key) == 64
        int(key, 16)  # MUSS valid hex sein


# ---------------------------------------------------------------------------
# Repository CRUD
# ---------------------------------------------------------------------------


class TestRepoGet:
    @pytest.mark.asyncio
    async def test_miss_returns_none(self, db: Database) -> None:
        repo = RecommendationCacheRepository(db)
        assert await repo.get("missing") is None

    @pytest.mark.asyncio
    async def test_empty_key_returns_none(self, db: Database) -> None:
        repo = RecommendationCacheRepository(db)
        assert await repo.get("") is None


class TestRepoSet:
    @pytest.mark.asyncio
    async def test_set_then_get(self, db: Database) -> None:
        repo = RecommendationCacheRepository(db)
        await repo.set(
            cache_key="abc",
            response={"mode": "on_change", "rationale": "test"},
            provider="openai_chat",
            model="gpt-4o-mini",
        )
        got = await repo.get("abc")
        assert got is not None
        assert got["response"] == {"mode": "on_change", "rationale": "test"}
        assert got["provider"] == "openai_chat"
        assert got["model"] == "gpt-4o-mini"

    @pytest.mark.asyncio
    async def test_set_overwrites_same_key(self, db: Database) -> None:
        repo = RecommendationCacheRepository(db)
        await repo.set(
            cache_key="abc", response={"v": 1},
            provider="openai_chat", model="x",
        )
        await repo.set(
            cache_key="abc", response={"v": 2},
            provider="openai_chat", model="x",
        )
        got = await repo.get("abc")
        assert got is not None
        assert got["response"] == {"v": 2}

    @pytest.mark.asyncio
    async def test_expired_entry_not_returned(self, db: Database) -> None:
        repo = RecommendationCacheRepository(db)
        # Direkt einen abgelaufenen Eintrag in die DB schreiben
        await db.execute(
            "INSERT INTO knx_recommendation_cache "
            "(cache_key, response, provider, model, created_at, expires_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                "expired",
                json.dumps({"v": 1}),
                "x", "y",
                "2020-01-01T00:00:00+00:00",
                "2020-02-01T00:00:00+00:00",
            ),
        )
        assert await repo.get("expired") is None


class TestRepoCleanup:
    @pytest.mark.asyncio
    async def test_cleanup_removes_only_expired(self, db: Database) -> None:
        repo = RecommendationCacheRepository(db)
        # Frisch
        await repo.set(
            cache_key="fresh", response={"v": 1},
            provider="x", model="y",
        )
        # Abgelaufen direkt in die DB
        await db.execute(
            "INSERT INTO knx_recommendation_cache "
            "(cache_key, response, provider, model, created_at, expires_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                "expired",
                json.dumps({"v": 1}),
                "x", "y",
                "2020-01-01T00:00:00+00:00",
                "2020-02-01T00:00:00+00:00",
            ),
        )
        deleted = await repo.cleanup_expired()
        assert deleted == 1
        # Frisch ist noch da
        assert await repo.get("fresh") is not None

    @pytest.mark.asyncio
    async def test_cleanup_on_empty(self, db: Database) -> None:
        repo = RecommendationCacheRepository(db)
        assert await repo.cleanup_expired() == 0


class TestRepoClear:
    @pytest.mark.asyncio
    async def test_clear_removes_all(self, db: Database) -> None:
        repo = RecommendationCacheRepository(db)
        await repo.set(
            cache_key="a", response={}, provider="x", model="y",
        )
        await repo.set(
            cache_key="b", response={}, provider="x", model="y",
        )
        await repo.clear()
        assert await repo.get("a") is None
        assert await repo.get("b") is None


# ---------------------------------------------------------------------------
# Provider-Protocol
# ---------------------------------------------------------------------------


def test_provider_config_is_frozen() -> None:
    from custom_components.messagehub.processing.recommendation_provider import (
        ProviderConfig,
    )
    cfg = ProviderConfig(
        enabled=False,
        base_url="https://api.openai.com/v1",
        model="gpt-4o-mini",
        api_key="sk-test",
    )
    with pytest.raises(AttributeError):
        cfg.enabled = True  # type: ignore[misc]


def test_provider_config_default_timeout_15s() -> None:
    from custom_components.messagehub.processing.recommendation_provider import (
        ProviderConfig,
    )
    cfg = ProviderConfig(
        enabled=False, base_url="x", model="y", api_key="z",
    )
    assert cfg.timeout_s == 15.0
    assert cfg.max_tokens == 800
    assert cfg.system_prompt_override == ""
