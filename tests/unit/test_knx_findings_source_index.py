"""Iter Idx (Sprint B / Phase 8): Index auf knx_findings.source.

Findings-Repo filtert beim Source-Detail-Pane via
``list_findings(source=dev_source, limit=200)`` — bei einer grossen
Anlage mit > 100 k Findings ist das ohne Index ein Full-Table-Scan.
Bestehende Indizes greifen `last_seen_desc`, `(severity, last_seen)`
und `(ga, last_seen)` ab — der `source`-Filter blieb bisher ungedeckt.

Iter Idx: dedizierter Index `idx_knx_findings_source`.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.migrations import MigrationRunner


@pytest.mark.asyncio
async def test_idx_knx_findings_source_exists_after_migrations(
    tmp_path: Path,
) -> None:
    """Nach `MigrationRunner.run()` muss der Index in sqlite_master stehen."""
    async with Database(tmp_path / "m.db") as db:
        await MigrationRunner(db).run()
        rows = await db.fetch_all(
            "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'knx_findings'"
        )
        index_names = {row["name"] for row in rows}
        assert "idx_knx_findings_source" in index_names, (
            "Index `idx_knx_findings_source` fehlt — Source-Filter im "
            "Findings-Repo macht ohne ihn Full-Table-Scan."
        )


@pytest.mark.asyncio
async def test_idx_knx_findings_source_covers_source_column(
    tmp_path: Path,
) -> None:
    """Index muss tatsaechlich die `source`-Spalte abdecken — nicht
    nur namentlich existieren."""
    async with Database(tmp_path / "m.db") as db:
        await MigrationRunner(db).run()
        rows = await db.fetch_all("PRAGMA index_info(idx_knx_findings_source)")
        column_names = [row["name"] for row in rows]
        assert "source" in column_names, (
            f"Index deckt nicht die source-Spalte ab — gefunden: {column_names}"
        )
