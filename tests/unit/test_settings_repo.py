"""Iter 48 (N1): Settings-Repository (Key/Value-Store)."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.migrations import MigrationRunner
from custom_components.messagehub.storage.settings_repo import SettingsRepository


@pytest.fixture
async def db(tmp_path: Path) -> Database:
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


class TestSettingsRepoStringValues:
    @pytest.mark.asyncio
    async def test_get_returns_none_for_missing_key(self, db: Database) -> None:
        repo = SettingsRepository(db)
        assert await repo.get("nope") is None

    @pytest.mark.asyncio
    async def test_set_then_get(self, db: Database) -> None:
        repo = SettingsRepository(db)
        await repo.set("greeting", "hello")
        assert await repo.get("greeting") == "hello"

    @pytest.mark.asyncio
    async def test_set_overwrites_existing(self, db: Database) -> None:
        repo = SettingsRepository(db)
        await repo.set("greeting", "hello")
        await repo.set("greeting", "world")
        assert await repo.get("greeting") == "world"


class TestSettingsRepoBoolHelpers:
    @pytest.mark.asyncio
    async def test_get_bool_returns_default_when_missing(self, db: Database) -> None:
        repo = SettingsRepository(db)
        assert await repo.get_bool("missing", default=True) is True
        assert await repo.get_bool("missing", default=False) is False

    @pytest.mark.asyncio
    async def test_set_bool_then_get_bool_roundtrip(self, db: Database) -> None:
        repo = SettingsRepository(db)
        await repo.set_bool("flag", True)
        assert await repo.get_bool("flag", default=False) is True
        await repo.set_bool("flag", False)
        assert await repo.get_bool("flag", default=True) is False

    @pytest.mark.asyncio
    async def test_get_bool_parses_truthy_strings(self, db: Database) -> None:
        repo = SettingsRepository(db)
        for raw in ("1", "true", "TRUE", "yes", "on"):
            await repo.set("flag", raw)
            assert await repo.get_bool("flag", default=False) is True
        for raw in ("0", "false", "no", "off", ""):
            await repo.set("flag", raw)
            assert await repo.get_bool("flag", default=True) is False
