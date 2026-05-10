"""Iter 16: Schatten-Counter (Phase-2-Vorbereitung)."""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner


@pytest.fixture
async def db(tmp_path: Path) -> Database:
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


class TestIncrementCounter:
    @pytest.mark.asyncio
    async def test_initial_increment_creates_row(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        await repo.increment_counter("1/2/3", "2026-05-02T12:00:00")
        n = await repo.counter_total_for_ga("1/2/3", "2026-05-02T00:00:00", "2026-05-02T23:00:00")
        assert n == 1

    @pytest.mark.asyncio
    async def test_repeated_increments_sum_up(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        for _ in range(5):
            await repo.increment_counter("1/2/3", "2026-05-02T12:00:00")
        n = await repo.counter_total_for_ga("1/2/3", "2026-05-02T00:00:00", "2026-05-02T23:00:00")
        assert n == 5

    @pytest.mark.asyncio
    async def test_different_buckets_not_summed_in_short_range(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        await repo.increment_counter("1/2/3", "2026-05-02T12:00:00")
        await repo.increment_counter("1/2/3", "2026-05-02T14:00:00")
        # Range deckt nur 12:00 - 13:00 ab
        n = await repo.counter_total_for_ga("1/2/3", "2026-05-02T12:00:00", "2026-05-02T13:00:00")
        assert n == 1

    @pytest.mark.asyncio
    async def test_different_gas_isolated(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        await repo.increment_counter("1/2/3", "2026-05-02T12:00:00")
        await repo.increment_counter("5/2/14", "2026-05-02T12:00:00")
        n_a = await repo.counter_total_for_ga("1/2/3", "2026-05-02T00:00:00", "2026-05-02T23:00:00")
        n_b = await repo.counter_total_for_ga(
            "5/2/14", "2026-05-02T00:00:00", "2026-05-02T23:00:00"
        )
        assert n_a == 1
        assert n_b == 1
