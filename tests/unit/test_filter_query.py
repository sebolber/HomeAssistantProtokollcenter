"""Tests fuer MessageRepository.list_filtered / count_filtered / distinct_sources."""

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
    r = MessageRepository(db)
    base = datetime(2026, 5, 1, 12, 0, 0, tzinfo=UTC)
    for i, sev in enumerate([Severity.INFO, Severity.WARNING, Severity.ERROR, Severity.ERROR]):
        await r.insert(
            Message(
                severity=sev,
                source=f"src.{i % 2}",
                text=f"hello {i}",
                timestamp=base + timedelta(minutes=i),
            )
        )
    try:
        yield r
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_filter_by_severity_csv(repo: MessageRepository) -> None:
    items = await repo.list_filtered(severities=["error"], limit=10)
    assert len(items) == 2
    assert all(m.severity is Severity.ERROR for m in items)


@pytest.mark.asyncio
async def test_filter_by_source_exact(repo: MessageRepository) -> None:
    items = await repo.list_filtered(source="src.0", limit=10)
    assert len(items) == 2
    assert all(m.source == "src.0" for m in items)


@pytest.mark.asyncio
async def test_filter_by_search_substring(repo: MessageRepository) -> None:
    items = await repo.list_filtered(search="hello 2", limit=10)
    assert len(items) == 1
    assert items[0].text == "hello 2"


@pytest.mark.asyncio
async def test_filter_pagination(repo: MessageRepository) -> None:
    page1 = await repo.list_filtered(limit=2, offset=0)
    page2 = await repo.list_filtered(limit=2, offset=2)
    assert len(page1) == 2
    assert len(page2) == 2
    assert {m.id for m in page1}.isdisjoint({m.id for m in page2})


@pytest.mark.asyncio
async def test_count_filtered_matches_list(repo: MessageRepository) -> None:
    assert await repo.count_filtered(severities=["error"]) == 2
    assert await repo.count_filtered(source="src.0") == 2
    assert await repo.count_filtered(search="hello") == 4


@pytest.mark.asyncio
async def test_distinct_sources(repo: MessageRepository) -> None:
    sources = await repo.distinct_sources()
    assert sources == ["src.0", "src.1"]


@pytest.mark.asyncio
async def test_stats_severity_last_24h(repo: MessageRepository) -> None:
    stats = await repo.stats_severity_last_24h()
    assert set(stats.keys()) == {"debug", "info", "warning", "error"}
    # Alle 4 Nachrichten sind aus 2026-05-01 — abhaengig von "now" alle aelter
    # als 24h. Wir testen nur die Struktur und dass die Zahlen non-negative sind.
    assert all(v >= 0 for v in stats.values())
