"""Iter 38 (Feature B+J): Long-Term-Sicht aus Counter-Tabelle.

Die Counter-Tabelle (Iter 4 + 16) wird vom Listener pro Stunden-Bucket
geschrieben und 365 Tage aufbewahrt. Diese Iteration legt die Lese-
Pfade an: Period-Total, Top-GAs, Hour-/Day-Bucket-Zeitreihe.

Wichtig: Counter-Tabelle hat keinen Source/dpt — degradierter Modus.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_stats_service import (
    KnxStatsService,
)
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


async def _seed(db: Database, ga: str, hour_bucket: str, count: int) -> None:
    """Setzt einen Counter direkt — emuliert N erfolgte increment_counter-Calls."""
    await db.execute(
        "INSERT INTO knx_telegram_counters (ga, hour_bucket, count) VALUES (?, ?, ?)",
        (ga, hour_bucket, count),
    )


class TestCounterTotal:
    @pytest.mark.asyncio
    async def test_empty_returns_zero(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        total = await repo.counter_total("2026-04-01T00:00:00", "2026-05-02T00:00:00")
        assert total == 0

    @pytest.mark.asyncio
    async def test_sums_across_gas_in_window(self, db: Database) -> None:
        await _seed(db, "1/2/3", "2026-04-15T10:00:00", 50)
        await _seed(db, "1/2/3", "2026-04-15T11:00:00", 30)
        await _seed(db, "5/2/14", "2026-04-15T11:00:00", 20)
        await _seed(db, "9/9/9", "2026-03-01T00:00:00", 999)  # vor Periode
        repo = KnxStatsRepository(db)
        total = await repo.counter_total("2026-04-01T00:00:00", "2026-05-02T00:00:00")
        assert total == 100


class TestCounterTopGas:
    @pytest.mark.asyncio
    async def test_orders_by_total_descending(self, db: Database) -> None:
        await _seed(db, "1/2/3", "2026-04-15T10:00:00", 50)
        await _seed(db, "1/2/3", "2026-04-15T11:00:00", 30)  # 80
        await _seed(db, "5/2/14", "2026-04-15T11:00:00", 200)
        await _seed(db, "9/9/9", "2026-04-15T11:00:00", 10)
        repo = KnxStatsRepository(db)
        rows = await repo.counter_top_gas("2026-04-01T00:00:00", "2026-05-02T00:00:00", limit=10)
        assert [r["ga"] for r in rows] == ["5/2/14", "1/2/3", "9/9/9"]
        assert [r["count"] for r in rows] == [200, 80, 10]

    @pytest.mark.asyncio
    async def test_respects_limit(self, db: Database) -> None:
        for i in range(20):
            await _seed(db, f"1/{i}/0", "2026-04-15T10:00:00", 100 - i)
        repo = KnxStatsRepository(db)
        rows = await repo.counter_top_gas("2026-04-01T00:00:00", "2026-05-02T00:00:00", limit=5)
        assert len(rows) == 5
        assert rows[0]["count"] == 100

    @pytest.mark.asyncio
    async def test_clamps_huge_limit(self, db: Database) -> None:
        await _seed(db, "1/2/3", "2026-04-15T10:00:00", 1)
        repo = KnxStatsRepository(db)
        # limit > Hard-Cap -> wird gecappt, keine Exception
        rows = await repo.counter_top_gas(
            "2026-04-01T00:00:00", "2026-05-02T00:00:00", limit=10_000
        )
        assert len(rows) == 1


class TestCounterTimeseries:
    @pytest.mark.asyncio
    async def test_hour_bucket_returns_each_hour(self, db: Database) -> None:
        await _seed(db, "1/2/3", "2026-04-15T10:00:00", 5)
        await _seed(db, "1/2/3", "2026-04-15T11:00:00", 8)
        await _seed(db, "5/2/14", "2026-04-15T11:00:00", 2)
        repo = KnxStatsRepository(db)
        series = await repo.counter_timeseries(
            "2026-04-15T00:00:00", "2026-04-16T00:00:00", bucket="hour"
        )
        # Reihenfolge: aufsteigend
        assert [b["bucket"] for b in series] == [
            "2026-04-15T10:00:00",
            "2026-04-15T11:00:00",
        ]
        assert [b["count"] for b in series] == [5, 10]

    @pytest.mark.asyncio
    async def test_day_bucket_aggregates_24h(self, db: Database) -> None:
        await _seed(db, "1/2/3", "2026-04-15T10:00:00", 5)
        await _seed(db, "1/2/3", "2026-04-15T22:00:00", 8)
        await _seed(db, "1/2/3", "2026-04-16T03:00:00", 7)
        repo = KnxStatsRepository(db)
        series = await repo.counter_timeseries(
            "2026-04-15T00:00:00", "2026-04-17T00:00:00", bucket="day"
        )
        assert [b["bucket"] for b in series] == [
            "2026-04-15T00:00:00",
            "2026-04-16T00:00:00",
        ]
        assert [b["count"] for b in series] == [13, 7]

    @pytest.mark.asyncio
    async def test_filter_by_gas(self, db: Database) -> None:
        await _seed(db, "1/2/3", "2026-04-15T10:00:00", 5)
        await _seed(db, "5/2/14", "2026-04-15T10:00:00", 999)
        repo = KnxStatsRepository(db)
        series = await repo.counter_timeseries(
            "2026-04-15T00:00:00",
            "2026-04-16T00:00:00",
            bucket="hour",
            gas=["1/2/3"],
        )
        assert len(series) == 1
        assert series[0]["count"] == 5

    @pytest.mark.asyncio
    async def test_unknown_bucket_falls_back_to_hour(self, db: Database) -> None:
        await _seed(db, "1/2/3", "2026-04-15T10:00:00", 5)
        repo = KnxStatsRepository(db)
        series = await repo.counter_timeseries(
            "2026-04-15T00:00:00",
            "2026-04-16T00:00:00",
            bucket="invalid",  # type: ignore[arg-type]
        )
        # Defensiv: kein Crash, fallback auf hour
        assert len(series) == 1


class TestServiceLongTerm:
    @pytest.mark.asyncio
    async def test_aggregates_total_top_and_series(self, db: Database) -> None:
        # 7 Tage: 1/2/3 sendet jeden Tag um 12:00, 5/2/14 nur 2x
        for day in range(15, 22):
            await _seed(db, "1/2/3", f"2026-04-{day:02d}T12:00:00", 10)
        await _seed(db, "5/2/14", "2026-04-15T12:00:00", 100)
        await _seed(db, "5/2/14", "2026-04-16T12:00:00", 100)
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.long_term_view(
            from_iso="2026-04-15T00:00:00",
            to_iso="2026-04-22T00:00:00",
            top_limit=10,
            bucket="day",
        )
        assert result["total"] == 70 + 200
        assert len(result["top_gas"]) == 2
        assert result["top_gas"][0]["ga"] == "5/2/14"
        assert result["top_gas"][0]["count"] == 200
        assert result["bucket"] == "day"
        # 7 day-Buckets
        assert len(result["series"]) == 7

    @pytest.mark.asyncio
    async def test_long_period_auto_picks_day_bucket(self, db: Database) -> None:
        # > 14 Tage -> day-Bucket statt hour
        await _seed(db, "1/2/3", "2026-03-01T00:00:00", 1)
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.long_term_view(
            from_iso="2026-03-01T00:00:00",
            to_iso="2026-04-01T00:00:00",
            top_limit=10,
            bucket="auto",
        )
        assert result["bucket"] == "day"
