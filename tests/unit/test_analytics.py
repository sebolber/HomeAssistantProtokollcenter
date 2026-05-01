"""Tests fuer Health-Score, Stats und Tags (Iter 40-42)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.health import compute_health_score
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
async def test_health_returns_100_when_no_messages(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, _ = db_repo
    assert await compute_health_score(db, "x") == 100


@pytest.mark.asyncio
async def test_health_decreases_with_recent_errors(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    for _ in range(20):
        await repo.insert(Message(severity=Severity.ERROR, source="x", text="boom"))
    score = await compute_health_score(db, "x", window_minutes=60)
    assert score < 100


@pytest.mark.asyncio
async def test_health_clamped_to_zero(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    for _ in range(500):
        await repo.insert(Message(severity=Severity.ERROR, source="x", text="boom"))
    score = await compute_health_score(db, "x", window_minutes=60)
    assert score == 0


@pytest.mark.asyncio
async def test_tag_assignment_roundtrip(db_repo) -> None:  # type: ignore[no-untyped-def]
    _, repo = db_repo
    mid = await repo.insert(Message(severity=Severity.INFO, source="x", text="x"))
    await repo.add_tag(mid, "urlaub")
    await repo.add_tag(mid, "wartung")
    await repo.add_tag(mid, "urlaub")  # idempotent
    tags = await repo.get_tags(mid)
    assert tags == ["urlaub", "wartung"]
    await repo.remove_tag(mid, "urlaub")
    tags = await repo.get_tags(mid)
    assert tags == ["wartung"]


@pytest.mark.asyncio
async def test_top_sources_orders_by_count(db_repo) -> None:  # type: ignore[no-untyped-def]
    _, repo = db_repo
    for _ in range(3):
        await repo.insert(Message(severity=Severity.INFO, source="a", text="x"))
    await repo.insert(Message(severity=Severity.INFO, source="b", text="x"))
    top = await repo.top_sources(limit=10, days=30)
    assert top[0]["source"] == "a"
    assert top[0]["count"] == 3


@pytest.mark.asyncio
async def test_heatmap_returns_aggregates(db_repo) -> None:  # type: ignore[no-untyped-def]
    _, repo = db_repo
    base = datetime.now(UTC)
    for i in range(5):
        await repo.insert(
            Message(
                severity=Severity.INFO,
                source="x",
                text=f"#{i}",
                timestamp=base - timedelta(minutes=i),
            )
        )
    heatmap = await repo.heatmap_hour_weekday(days=30)
    assert heatmap
    assert all("hour" in row and "weekday" in row and "count" in row for row in heatmap)
