"""Iter A1: Batch-Inserts fuer knx_raw_telegrams + knx_telegram_counters.

executemany statt N einzelner execute-Calls — eine fsync pro Bulk
statt N. Das ist der Hot-Path fuer KnxIngestWorker.
"""

from __future__ import annotations

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import (
    MigrationRunner,
    discover_migrations,
)


@pytest.fixture
async def repo(tmp_path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "test.db")
    await db.open()
    runner = MigrationRunner(db, migrations=discover_migrations())
    await runner.run()
    try:
        yield KnxStatsRepository(db)
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_insert_raw_batch_persists_all_rows(repo: KnxStatsRepository) -> None:
    rows = [
        {
            "timestamp": f"2026-05-08T10:0{i}:00",
            "destination": f"1/2/{i}",
            "source": "1.1.5",
            "telegramtype": "GroupValueWrite",
            "value": i,
            "repeated": False,
        }
        for i in range(5)
    ]
    await repo.insert_raw_batch(rows)
    summary = await repo.summary("2026-05-08T00:00:00", "2026-05-09T00:00:00")
    assert summary["total_telegrams"] == 5
    assert summary["active_gas"] == 5


@pytest.mark.asyncio
async def test_insert_raw_batch_handles_empty_list(repo: KnxStatsRepository) -> None:
    """Idempotent: leere Liste darf kein Crash."""
    await repo.insert_raw_batch([])
    summary = await repo.summary("2026-05-08T00:00:00", "2026-05-09T00:00:00")
    assert summary["total_telegrams"] == 0


@pytest.mark.asyncio
async def test_increment_counter_batch_aggregates(repo: KnxStatsRepository) -> None:
    items = [
        ("1/2/3", "2026-05-08T10:00:00"),
        ("1/2/3", "2026-05-08T10:00:00"),  # gleiche Bucket, +1
        ("1/2/4", "2026-05-08T10:00:00"),
        ("1/2/3", "2026-05-08T11:00:00"),  # andere Bucket
    ]
    await repo.increment_counter_batch(items)
    total_3 = await repo.counter_total_for_ga("1/2/3", "2026-05-08T00:00:00", "2026-05-09T00:00:00")
    assert total_3 == 3
    total_4 = await repo.counter_total_for_ga("1/2/4", "2026-05-08T00:00:00", "2026-05-09T00:00:00")
    assert total_4 == 1


@pytest.mark.asyncio
async def test_increment_counter_batch_handles_empty(repo: KnxStatsRepository) -> None:
    await repo.increment_counter_batch([])
    total = await repo.counter_total_for_ga("1/2/3", "2026-05-08T00:00:00", "2026-05-09T00:00:00")
    assert total == 0


@pytest.mark.asyncio
async def test_insert_raw_batch_serialises_value_as_json(
    repo: KnxStatsRepository,
) -> None:
    """Wert soll wie bei insert_raw als JSON-Repr abgelegt werden."""
    rows = [
        {
            "timestamp": "2026-05-08T10:00:00",
            "destination": "1/2/3",
            "source": "1.1.5",
            "telegramtype": "GroupValueWrite",
            "value": {"red": 100, "green": 50, "blue": 0},
            "repeated": False,
        }
    ]
    await repo.insert_raw_batch(rows)
    samples = await repo.ga_samples("1/2/3", "2026-05-08T00:00:00", "2026-05-09T00:00:00")
    assert len(samples) == 1
    assert samples[0]["value"] == {"red": 100, "green": 50, "blue": 0}
