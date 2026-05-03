"""Iter L2.0: Tests fuer KnxDeviceRepository + Migration 0029."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_devices_repo import (
    KnxDeviceRepository,
    normalize_manufacturer,
)
from custom_components.messagehub.storage.migrations import MigrationRunner


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
async def test_migration_creates_knx_devices_table(db: Database) -> None:
    rows = await db.fetch_all(
        "SELECT name FROM sqlite_master "
        "WHERE type='table' AND name='knx_devices'"
    )
    assert rows
    cols = await db.fetch_all("PRAGMA table_info(knx_devices)")
    col_names = {row["name"] for row in cols}
    expected = {
        "dev_source", "manufacturer", "model", "notes",
        "last_seen", "created_at", "updated_at",
    }
    assert expected.issubset(col_names)


@pytest.mark.asyncio
async def test_migration_creates_manufacturer_model_index(
    db: Database,
) -> None:
    rows = await db.fetch_all(
        "SELECT name FROM sqlite_master "
        "WHERE type='index' AND tbl_name='knx_devices'"
    )
    names = {r["name"] for r in rows}
    assert "idx_knx_devices_manufacturer_model" in names


# ---------------------------------------------------------------------------
# Repository CRUD
# ---------------------------------------------------------------------------


class TestRepoGet:
    @pytest.mark.asyncio
    async def test_returns_none_for_unknown(self, db: Database) -> None:
        repo = KnxDeviceRepository(db)
        assert await repo.get("9.9.9") is None

    @pytest.mark.asyncio
    async def test_empty_returns_none(self, db: Database) -> None:
        repo = KnxDeviceRepository(db)
        assert await repo.get("") is None


class TestRepoUpsert:
    @pytest.mark.asyncio
    async def test_insert_creates_row(self, db: Database) -> None:
        repo = KnxDeviceRepository(db)
        result = await repo.upsert(
            dev_source="1.1.220",
            manufacturer="hoermann",
            model="garage-control",
            notes="Hauptanschluss",
        )
        assert result["dev_source"] == "1.1.220"
        assert result["manufacturer"] == "hoermann"
        assert result["model"] == "garage-control"
        assert result["notes"] == "Hauptanschluss"
        assert result["created_at"] == result["updated_at"]

    @pytest.mark.asyncio
    async def test_update_only_changes_provided_fields(
        self, db: Database
    ) -> None:
        repo = KnxDeviceRepository(db)
        await repo.upsert(
            dev_source="1.1.220",
            manufacturer="hoermann",
            model="garage-control",
        )
        # Nur model aendern, manufacturer unberuehrt lassen
        result = await repo.upsert(dev_source="1.1.220", model="garage-pro")
        assert result["manufacturer"] == "hoermann"
        assert result["model"] == "garage-pro"

    @pytest.mark.asyncio
    async def test_empty_string_clears_field_to_null(
        self, db: Database
    ) -> None:
        repo = KnxDeviceRepository(db)
        await repo.upsert(
            dev_source="1.1.220",
            manufacturer="hoermann",
            model="garage-control",
        )
        result = await repo.upsert(dev_source="1.1.220", manufacturer="")
        assert result["manufacturer"] is None
        # Andere Felder bleiben
        assert result["model"] == "garage-control"

    @pytest.mark.asyncio
    async def test_empty_dev_source_raises(self, db: Database) -> None:
        repo = KnxDeviceRepository(db)
        with pytest.raises(ValueError, match="dev_source"):
            await repo.upsert(dev_source="")


class TestRepoLastSeen:
    @pytest.mark.asyncio
    async def test_update_last_seen_on_existing_row(
        self, db: Database
    ) -> None:
        repo = KnxDeviceRepository(db)
        await repo.upsert(dev_source="1.1.220")
        ok = await repo.update_last_seen(
            "1.1.220", "2026-05-03T08:00:00"
        )
        assert ok is True
        entry = await repo.get("1.1.220")
        assert entry is not None
        assert entry["last_seen"] == "2026-05-03T08:00:00"

    @pytest.mark.asyncio
    async def test_update_last_seen_on_missing_returns_false(
        self, db: Database
    ) -> None:
        repo = KnxDeviceRepository(db)
        ok = await repo.update_last_seen("9.9.9", "2026-05-03T08:00:00")
        assert ok is False


class TestRepoDelete:
    @pytest.mark.asyncio
    async def test_delete_existing(self, db: Database) -> None:
        repo = KnxDeviceRepository(db)
        await repo.upsert(dev_source="1.1.220", manufacturer="hoermann")
        ok = await repo.delete("1.1.220")
        assert ok is True
        assert await repo.get("1.1.220") is None

    @pytest.mark.asyncio
    async def test_delete_missing_returns_false(self, db: Database) -> None:
        repo = KnxDeviceRepository(db)
        ok = await repo.delete("9.9.9")
        assert ok is False


class TestRepoList:
    @pytest.mark.asyncio
    async def test_list_returns_sorted(self, db: Database) -> None:
        repo = KnxDeviceRepository(db)
        await repo.upsert(dev_source="1.1.220", manufacturer="hoermann")
        await repo.upsert(dev_source="1.1.10", manufacturer="mdt")
        await repo.upsert(dev_source="2.1.5", manufacturer="abb")
        items = await repo.list_all()
        assert [i["dev_source"] for i in items] == [
            "1.1.10", "1.1.220", "2.1.5",
        ]


# ---------------------------------------------------------------------------
# Normalisierung
# ---------------------------------------------------------------------------


class TestNormalize:
    def test_lowercase_and_strip(self) -> None:
        assert normalize_manufacturer("  Hörmann  ") == "hörmann"

    def test_none_passthrough(self) -> None:
        assert normalize_manufacturer(None) is None

    def test_empty_returns_none(self) -> None:
        assert normalize_manufacturer("") is None
        assert normalize_manufacturer("   ") is None
