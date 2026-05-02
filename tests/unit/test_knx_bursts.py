"""Iter 40 (Feature C): Burst-Detector — kurze Telegrammfluten erkennen.

Use-Case: '10 Rolladen gleichzeitig' bei Sturm — kurze Spitzen, die im
Period-Avg untergehen, aber den Bus blockieren. Sliding-Window-basiert
ueber knx_raw_telegrams.
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


class TestBurstDetectRepo:
    @pytest.mark.asyncio
    async def test_no_bursts_when_below_threshold(self, db: Database) -> None:
        # 10 Telegramme in 5s = 2/s ≈ 4% Buslast — kein Burst
        for i in range(10):
            await insert_raw_telegram(db, ts=_ts(i * 0.5), ga="1/2/3")
        repo = KnxStatsRepository(db)
        bursts = await repo.burst_detect(
            _ts(0),
            _ts(60),
            window_seconds=5,
            threshold_pct=30.0,
        )
        assert bursts == []

    @pytest.mark.asyncio
    async def test_detects_burst_above_threshold(self, db: Database) -> None:
        # 80 Telegramme in 5s -> ~33% Buslast (Threshold 30%) -> Burst
        # Plus 10 normale Telegramme drumherum
        for i in range(10):
            await insert_raw_telegram(db, ts=_ts(i * 5), ga="1/2/3")
        for i in range(80):
            await insert_raw_telegram(
                db,
                ts=_ts(60 + i * 0.05),
                ga=f"1/2/{i % 10}",
                dev_source=f"1.1.{(i % 10) + 100}",
            )
        repo = KnxStatsRepository(db)
        bursts = await repo.burst_detect(
            _ts(0),
            _ts(180),
            window_seconds=5,
            threshold_pct=30.0,
        )
        assert len(bursts) >= 1
        peak = bursts[0]
        assert peak["telegrams"] >= 60
        assert peak["busload_pct"] >= 30.0
        assert peak["ga_count"] >= 1
        assert peak["source_count"] >= 1

    @pytest.mark.asyncio
    async def test_busload_pct_matches_formula(self, db: Database) -> None:
        # 72 Telegramme in 5s -> exakt 30% (Threshold-Grenze)
        for i in range(72):
            await insert_raw_telegram(db, ts=_ts(i * 0.05), ga="1/2/3")
        repo = KnxStatsRepository(db)
        bursts = await repo.burst_detect(
            _ts(0),
            _ts(60),
            window_seconds=5,
            threshold_pct=30.0,
        )
        assert len(bursts) == 1
        b = bursts[0]
        # 72 * 200 / (5 * 9600) * 100 = 30.0
        expected = round(72 * KNX_AVG_TELEGRAM_BITS / (5 * KNX_TP_BAUDRATE_BPS) * 100.0, 2)
        assert b["busload_pct"] == expected
        assert b["telegrams"] == 72

    @pytest.mark.asyncio
    async def test_orders_by_busload_desc_and_respects_limit(self, db: Database) -> None:
        # Drei Bursts unterschiedlicher Hoehe in 3 verschiedenen Fenstern
        # Burst 1 @ t=0..5  -> 100 Tel
        for i in range(100):
            await insert_raw_telegram(db, ts=_ts(i * 0.04), ga="1/2/3")
        # Burst 2 @ t=10..15 -> 150 Tel (groesster)
        for i in range(150):
            await insert_raw_telegram(db, ts=_ts(10 + i * 0.03), ga="2/3/4")
        # Burst 3 @ t=20..25 -> 80 Tel
        for i in range(80):
            await insert_raw_telegram(db, ts=_ts(20 + i * 0.05), ga="3/4/5")
        repo = KnxStatsRepository(db)
        bursts = await repo.burst_detect(
            _ts(0),
            _ts(60),
            window_seconds=5,
            threshold_pct=30.0,
            limit=2,
        )
        assert len(bursts) == 2
        # Hoechster Burst zuerst
        assert bursts[0]["telegrams"] == 150
        assert bursts[1]["telegrams"] == 100

    @pytest.mark.asyncio
    async def test_clamps_negative_window(self, db: Database) -> None:
        await insert_raw_telegram(db, ts=_ts(0), ga="1/2/3")
        repo = KnxStatsRepository(db)
        # window_seconds < 1 -> wird auf 1 geklippt, kein Crash
        bursts = await repo.burst_detect(_ts(0), _ts(60), window_seconds=0, threshold_pct=99.0)
        assert isinstance(bursts, list)


class TestBurstDetectService:
    @pytest.mark.asyncio
    async def test_service_passes_through_with_defaults(self, db: Database) -> None:
        for i in range(80):
            await insert_raw_telegram(db, ts=_ts(i * 0.05), ga="1/2/3")
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.bursts(from_iso=_ts(0), to_iso=_ts(60))
        assert result["window_seconds"] == 5
        assert result["threshold_pct"] == 30.0
        assert isinstance(result["bursts"], list)
        assert len(result["bursts"]) >= 1

    @pytest.mark.asyncio
    async def test_clamps_threshold_into_valid_range(self, db: Database) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        # 200% wird auf 100% geklippt; 0% auf 1%
        r1 = await svc.bursts(from_iso=_ts(0), to_iso=_ts(60), threshold_pct=200.0)
        assert r1["threshold_pct"] == 100.0
        r2 = await svc.bursts(from_iso=_ts(0), to_iso=_ts(60), threshold_pct=0.0)
        assert r2["threshold_pct"] == 1.0
