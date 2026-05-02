"""Iter 24: Retention-Cleanup fuer knx_raw_telegrams + knx_telegram_counters."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner
from tests.conftest import insert_raw_telegram


@pytest.fixture
async def db(tmp_path: Path) -> Database:
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


def _ts(offset_min: float) -> str:
    base = datetime(2026, 5, 2, 12, 0, 0, tzinfo=UTC)
    return (base + timedelta(minutes=offset_min)).isoformat(timespec="seconds")


class TestCleanupRawOlderThan:
    @pytest.mark.asyncio
    async def test_no_old_rows_deletes_nothing(self, db: Database) -> None:
        await insert_raw_telegram(db, ts=_ts(50), ga="1/2/3")
        repo = KnxStatsRepository(db)
        deleted = await repo.cleanup_raw_older_than(_ts(0))
        assert deleted == 0

    @pytest.mark.asyncio
    async def test_old_rows_get_deleted(self, db: Database) -> None:
        await insert_raw_telegram(db, ts=_ts(-100), ga="1/2/3")
        await insert_raw_telegram(db, ts=_ts(-50), ga="1/2/3")
        await insert_raw_telegram(db, ts=_ts(10), ga="1/2/3")
        repo = KnxStatsRepository(db)
        deleted = await repo.cleanup_raw_older_than(_ts(0))
        assert deleted == 2
        # Junges Telegramm bleibt
        s = await repo.summary(_ts(0), _ts(20))
        assert s["total_telegrams"] == 1


class TestCleanupRawHardCap:
    @pytest.mark.asyncio
    async def test_under_cap_deletes_nothing(self, db: Database) -> None:
        for i in range(5):
            await insert_raw_telegram(db, ts=_ts(i), ga="1/2/3")
        repo = KnxStatsRepository(db)
        deleted = await repo.cleanup_raw_hard_cap(max_rows=10)
        assert deleted == 0

    @pytest.mark.asyncio
    async def test_over_cap_deletes_oldest(self, db: Database) -> None:
        # 10 Telegramme einfuegen, hard_cap=4 → 6 sollten weg
        for i in range(10):
            await insert_raw_telegram(db, ts=_ts(i), ga="1/2/3")
        repo = KnxStatsRepository(db)
        deleted = await repo.cleanup_raw_hard_cap(max_rows=4)
        assert deleted == 6
        # Die juengsten 4 muessen bleiben
        s = await repo.summary(_ts(0), _ts(60))
        assert s["total_telegrams"] == 4

    @pytest.mark.asyncio
    async def test_zero_cap_is_noop(self, db: Database) -> None:
        await insert_raw_telegram(db, ts=_ts(0), ga="1/2/3")
        repo = KnxStatsRepository(db)
        deleted = await repo.cleanup_raw_hard_cap(max_rows=0)
        assert deleted == 0


class TestCleanupCounters:
    @pytest.mark.asyncio
    async def test_old_buckets_deleted(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        await repo.increment_counter("1/2/3", "2025-01-01T00:00:00")
        await repo.increment_counter("1/2/3", "2026-05-02T00:00:00")
        deleted = await repo.cleanup_counters_older_than("2026-01-01T00:00:00")
        assert deleted == 1
        n = await repo.counter_total_for_ga(
            "1/2/3", "2025-01-01T00:00:00", "2027-01-01T00:00:00"
        )
        assert n == 1
