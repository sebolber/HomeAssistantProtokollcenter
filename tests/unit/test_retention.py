"""Tests fuer Retention-Job."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.retention import run_retention, run_vacuum
from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)


@pytest.fixture
async def db_repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield db, MessageRepository(db)
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_retention_deletes_old_per_severity(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    now = datetime.now(UTC)
    await repo.insert(
        Message(severity=Severity.DEBUG, source="x", text="old", timestamp=now - timedelta(days=10))
    )
    await repo.insert(Message(severity=Severity.DEBUG, source="x", text="fresh"))
    await repo.insert(
        Message(
            severity=Severity.ERROR, source="x", text="old-err", timestamp=now - timedelta(days=400)
        )
    )

    deleted = await run_retention(db, max_days={"debug": 7, "error": 365})

    assert deleted["debug"] == 1
    assert deleted["error"] == 1
    msgs = await repo.list_recent()
    assert len(msgs) == 1
    assert msgs[0].text == "fresh"


@pytest.mark.asyncio
async def test_hard_cap_keeps_newest(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    base = datetime.now(UTC) - timedelta(hours=1)
    for i in range(10):
        await repo.insert(
            Message(
                severity=Severity.INFO,
                source="x",
                text=f"#{i}",
                timestamp=base + timedelta(seconds=i),
            )
        )
    deleted = await run_retention(db, max_days={"info": 365}, hard_cap_total=5)
    assert deleted["hard_cap"] == 5
    msgs = await repo.list_recent(limit=100)
    assert len(msgs) == 5
    texts = {m.text for m in msgs}
    assert texts == {"#5", "#6", "#7", "#8", "#9"}


@pytest.mark.asyncio
async def test_vacuum_runs_without_error(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, _ = db_repo
    await run_vacuum(db)
