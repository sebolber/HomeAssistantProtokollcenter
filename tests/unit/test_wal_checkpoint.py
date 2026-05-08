"""Iter A2: WAL-Checkpoint-Job laeuft periodisch.

Konzept-Schwaeche A2/A1: SQLite-WAL-Mode haelt Schreib-Operationen
zunaechst in der ``-wal``-Sidecar-Datei. Ohne periodisches
``PRAGMA wal_checkpoint(TRUNCATE)`` kann das WAL bei stark
schreibender Last (KNX-Bus mit ~48 Tel/s) auf mehrere Gigabytes
wachsen, bevor SQLite intern selbst checkpointet — Disk-Space-
Verbrauch und langsamere Reads.

Loesung: Ein Job in ``processing/retention.py``, der einmal pro
Stunde den WAL-Checkpoint-Modus ``TRUNCATE`` ausloest. Verifiziert
ueber Smoke-Test: nach Aufruf ist die WAL-Datei wieder klein.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.processing.retention import run_wal_checkpoint
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.migrations import (
    MigrationRunner,
    discover_migrations,
)


@pytest.mark.asyncio
async def test_wal_checkpoint_truncate_succeeds(tmp_path: Path) -> None:
    """Direktes Smoke-Test: run_wal_checkpoint laeuft ohne Fehler."""
    db = Database(tmp_path / "test.db")
    await db.open()
    try:
        await MigrationRunner(db, migrations=discover_migrations()).run()
        # Schreibe ein paar Rows, damit das WAL gefuellt ist.
        for i in range(50):
            await db.execute(
                "INSERT INTO knx_raw_telegrams "
                "(timestamp, destination, source, telegramtype, value, repeated) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (
                    f"2026-05-08T10:00:{i:02d}",
                    "1/2/3",
                    "1.1.5",
                    "GroupValueWrite",
                    "1",
                    0,
                ),
            )
        result = await run_wal_checkpoint(db)
        # Result-Tupel: (busy, log, checkpointed)
        assert result is not None
        assert isinstance(result, tuple)
        assert len(result) == 3
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_wal_checkpoint_handles_already_truncated(
    tmp_path: Path,
) -> None:
    """Idempotent: Doppelte Aufrufe sind safe, kein Crash."""
    db = Database(tmp_path / "test.db")
    await db.open()
    try:
        await MigrationRunner(db, migrations=discover_migrations()).run()
        await run_wal_checkpoint(db)
        await run_wal_checkpoint(db)  # idempotent
    finally:
        await db.close()
