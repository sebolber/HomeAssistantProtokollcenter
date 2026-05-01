"""Tests fuer storage.database und storage.migrations."""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from custom_components.messagehub.storage import Database, MigrationRunner


@pytest.mark.asyncio
async def test_database_creates_file_on_first_open(tmp_path: Path) -> None:
    """Database.open() legt Datei und Verzeichnis idempotent an."""
    db_path = tmp_path / "subdir" / "messages.db"
    db = Database(db_path)
    assert not db_path.exists()

    await db.open()
    try:
        assert db_path.exists()
        assert db_path.parent.is_dir()
        # Re-open ist idempotent.
        await db.open()
        assert db_path.exists()
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_database_pragmas_applied(tmp_path: Path) -> None:
    """Foreign Keys sind aktiv und WAL-Journal-Mode ist gesetzt."""
    async with Database(tmp_path / "m.db") as db:
        fk_row = await db.fetch_one("PRAGMA foreign_keys")
        assert fk_row is not None
        assert fk_row[0] == 1
        jm_row = await db.fetch_one("PRAGMA journal_mode")
        assert jm_row is not None
        assert str(jm_row[0]).lower() == "wal"


@pytest.mark.asyncio
async def test_migrations_idempotent(tmp_path: Path) -> None:
    """Zweiter run() wendet nichts erneut an, Version bleibt stabil."""
    async with Database(tmp_path / "m.db") as db:
        runner = MigrationRunner(db)

        first = await runner.run()
        second = await runner.run()

        assert first >= 1
        assert first == second

        rows = await db.fetch_all("SELECT version FROM schema_version ORDER BY version ASC")
        versions = [int(r["version"]) for r in rows]
        assert versions == sorted(set(versions))


@pytest.mark.asyncio
async def test_schema_version_after_initial_migration(tmp_path: Path) -> None:
    """Initial-Migration legt messages und webhook_configs an, schema_version=1."""
    async with Database(tmp_path / "m.db") as db:
        runner = MigrationRunner(db)
        version = await runner.run()

        assert version == 1

        tables = await db.fetch_all(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        names = {row["name"] for row in tables}
        assert {"messages", "webhook_configs", "schema_version"}.issubset(names)

        # messages-Schema enthaelt die erwarteten Spalten.
        cols = await db.fetch_all("PRAGMA table_info(messages)")
        col_names = {row["name"] for row in cols}
        expected = {"id", "timestamp", "severity", "source", "text", "metadata", "webhook_id"}
        assert col_names == expected

        # Indizes
        indexes = await db.fetch_all(
            "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='messages'"
        )
        index_names = {row["name"] for row in indexes}
        assert "idx_messages_timestamp_desc" in index_names
        assert "idx_messages_severity_timestamp" in index_names
        assert "idx_messages_source_timestamp" in index_names


@pytest.mark.asyncio
async def test_severity_check_constraint(tmp_path: Path) -> None:
    """Insert mit unzulaessiger Severity wirft ein DB-Constraint-Error."""
    async with Database(tmp_path / "m.db") as db:
        await MigrationRunner(db).run()
        with pytest.raises(sqlite3.IntegrityError):
            await db.execute(
                "INSERT INTO messages (timestamp, severity, source, text) VALUES (?, ?, ?, ?)",
                ("2026-05-01T00:00:00Z", "panic", "test.source", "x"),
            )
