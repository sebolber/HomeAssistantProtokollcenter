"""Tests fuer Counter-Sensoren."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)


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
async def test_total_increments_on_insert(repo: MessageRepository) -> None:
    assert await repo.count_total() == 0
    await repo.insert(Message(severity=Severity.INFO, source="x", text="a"))
    await repo.insert(Message(severity=Severity.ERROR, source="x", text="b"))
    assert await repo.count_total() == 2


@pytest.mark.asyncio
async def test_errors_24h_excludes_older_messages(repo: MessageRepository) -> None:
    now = datetime.now(UTC)
    old = now - timedelta(hours=25)
    fresh = now - timedelta(hours=1)
    await repo.insert(Message(severity=Severity.ERROR, source="x", text="old", timestamp=old))
    await repo.insert(Message(severity=Severity.ERROR, source="x", text="fresh", timestamp=fresh))
    await repo.insert(Message(severity=Severity.INFO, source="x", text="info", timestamp=fresh))

    cutoff = (now - timedelta(hours=24)).isoformat(timespec="seconds")
    assert await repo.count_by_severity_since("error", cutoff) == 1


@pytest.mark.asyncio
async def test_last_message_returns_most_recent(repo: MessageRepository) -> None:
    base = datetime(2026, 5, 1, tzinfo=UTC)
    for i in range(3):
        await repo.insert(
            Message(
                severity=Severity.INFO,
                source="x",
                text=f"#{i}",
                timestamp=base + timedelta(minutes=i),
            )
        )
    recent = await repo.list_recent(limit=1)
    assert len(recent) == 1
    assert recent[0].text == "#2"
