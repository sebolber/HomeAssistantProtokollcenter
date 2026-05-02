"""Iter 36 (Feature A): Buslast-%-KPI.

KNX TP1 traegt 9600 bps. Ein Durchschnitts-Telegramm belegt inkl. Pausen
ca. 200 Bit. 48 Telegramme in einem 10s-Bucket entsprechen damit etwa
100 % Buslast — gleiches Modell wie der ETS-Indikator.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.const import (
    KNX_AVG_TELEGRAM_BITS,
    KNX_TP_BAUDRATE_BPS,
)
from custom_components.messagehub.processing.knx_stats_service import (
    KnxStatsService,
)
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


def _ts(offset_s: float) -> str:
    base = datetime(2026, 5, 2, 12, 0, 0, tzinfo=UTC)
    return (base + timedelta(seconds=offset_s)).isoformat(timespec="seconds")


class TestBusloadTimeseries:
    @pytest.mark.asyncio
    async def test_empty_period_returns_no_buckets(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        series = await repo.busload_timeseries(_ts(0), _ts(60), bucket_seconds=10)
        assert series == []

    @pytest.mark.asyncio
    async def test_single_bucket_counts_telegrams_and_computes_pct(self, db: Database) -> None:
        # 48 Telegramme/s saettigen den TP1-Bus (~100%). Wir testen mit
        # 48 Telegrammen in 10s = 4.8 Tel/s = ~10% Buslast.
        for i in range(48):
            await insert_raw_telegram(db, ts=_ts(i * 0.2), ga="1/2/3", value=i)
        repo = KnxStatsRepository(db)
        series = await repo.busload_timeseries(_ts(0), _ts(10), bucket_seconds=10)
        assert len(series) == 1
        bucket = series[0]
        assert bucket["telegrams"] == 48
        # 48 * 200 / (10 * 9600) * 100 = 10.0
        expected_pct = round(48 * KNX_AVG_TELEGRAM_BITS / (10 * KNX_TP_BAUDRATE_BPS) * 100.0, 2)
        assert bucket["busload_pct"] == expected_pct
        assert bucket["busload_pct"] == 10.0

    @pytest.mark.asyncio
    async def test_buckets_split_by_window(self, db: Database) -> None:
        # 5 Telegramme in [0, 10), 12 Telegramme in [10, 20)
        for i in range(5):
            await insert_raw_telegram(db, ts=_ts(i), ga="1/2/3")
        for i in range(12):
            await insert_raw_telegram(db, ts=_ts(10 + i * 0.5), ga="1/2/3")
        repo = KnxStatsRepository(db)
        series = await repo.busload_timeseries(_ts(0), _ts(20), bucket_seconds=10)
        assert len(series) == 2
        assert series[0]["telegrams"] == 5
        assert series[1]["telegrams"] == 12
        # 5 * 200 / (10 * 9600) * 100 = 10.42
        assert series[0]["busload_pct"] == round(
            5 * KNX_AVG_TELEGRAM_BITS / (10 * KNX_TP_BAUDRATE_BPS) * 100.0, 2
        )

    @pytest.mark.asyncio
    async def test_period_outside_window_excluded(self, db: Database) -> None:
        # Telegramm 60s vor Periode -> nicht enthalten
        await insert_raw_telegram(db, ts=_ts(-60), ga="1/2/3")
        await insert_raw_telegram(db, ts=_ts(5), ga="1/2/3")
        repo = KnxStatsRepository(db)
        series = await repo.busload_timeseries(_ts(0), _ts(10), bucket_seconds=10)
        assert len(series) == 1
        assert series[0]["telegrams"] == 1


class TestBusloadSummary:
    def test_empty_series_returns_zeros(self) -> None:
        summary = KnxStatsService.compute_busload_summary([])
        assert summary == {
            "current_pct": 0.0,
            "max_pct": 0.0,
            "avg_pct": 0.0,
            "total_telegrams": 0,
            "buckets": 0,
        }

    def test_summary_aggregates_series(self) -> None:
        series = [
            {"bucket": "2026-05-02T12:00:00", "telegrams": 5, "busload_pct": 10.42},
            {"bucket": "2026-05-02T12:00:10", "telegrams": 12, "busload_pct": 25.0},
            {"bucket": "2026-05-02T12:00:20", "telegrams": 1, "busload_pct": 2.08},
        ]
        summary = KnxStatsService.compute_busload_summary(series)
        # current = letzter Bucket
        assert summary["current_pct"] == 2.08
        # max ueber alle Buckets
        assert summary["max_pct"] == 25.0
        # avg = sum(pct) / n
        assert summary["avg_pct"] == round((10.42 + 25.0 + 2.08) / 3, 2)
        assert summary["total_telegrams"] == 18
        assert summary["buckets"] == 3


class TestBusloadServiceWiring:
    @pytest.mark.asyncio
    async def test_service_busload_returns_series_and_summary(self, db: Database) -> None:
        for i in range(10):
            await insert_raw_telegram(db, ts=_ts(i), ga="1/2/3")
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.busload(from_iso=_ts(0), to_iso=_ts(10), bucket_seconds=10)
        assert result["summary"]["total_telegrams"] == 10
        assert result["summary"]["max_pct"] > 0
        assert len(result["series"]) == 1
