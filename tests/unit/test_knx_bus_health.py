"""Iter 12: bus_health-Queries (Wiederhol-Quote)."""

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


async def _insert(
    db: Database,
    *,
    ts: str,
    ga: str,
    repeated: bool = False,
    label: str = "Test",
) -> None:
    await insert_raw_telegram(
        db, ts=ts, ga=ga, label=label, dpt="1.001", repeated=repeated
    )


class TestBusHealth:
    @pytest.mark.asyncio
    async def test_empty_returns_zeros(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        h = await repo.bus_health(_ts(0), _ts(60))
        assert h == {"total": 0, "repeated": 0, "ratio_pct": 0.0}

    @pytest.mark.asyncio
    async def test_zero_repeated_means_zero_pct(self, db: Database) -> None:
        for i in range(10):
            await _insert(db, ts=_ts(i), ga="1/2/3")
        repo = KnxStatsRepository(db)
        h = await repo.bus_health(_ts(0), _ts(60))
        assert h["total"] == 10
        assert h["repeated"] == 0
        assert h["ratio_pct"] == 0.0

    @pytest.mark.asyncio
    async def test_some_repeated_returns_correct_ratio(self, db: Database) -> None:
        for i in range(8):
            await _insert(db, ts=_ts(i), ga="1/2/3", repeated=False)
        for i in range(2):
            await _insert(db, ts=_ts(10 + i), ga="1/2/3", repeated=True)
        repo = KnxStatsRepository(db)
        h = await repo.bus_health(_ts(0), _ts(60))
        assert h["total"] == 10
        assert h["repeated"] == 2
        assert h["ratio_pct"] == 20.0


class TestBusHealthPerGa:
    @pytest.mark.asyncio
    async def test_only_returns_gas_with_repeats(self, db: Database) -> None:
        for i in range(10):
            await _insert(db, ts=_ts(i), ga="1/2/3", repeated=False)
        for i in range(3):
            await _insert(db, ts=_ts(20 + i), ga="5/2/14", repeated=True)
        await _insert(db, ts=_ts(30), ga="5/2/14", repeated=False)
        repo = KnxStatsRepository(db)
        rows = await repo.bus_health_per_ga(_ts(0), _ts(60), limit=10)
        assert len(rows) == 1
        assert rows[0]["ga"] == "5/2/14"
        assert rows[0]["repeated"] == 3
        assert rows[0]["total"] == 4
        assert rows[0]["ratio_pct"] == 75.0

    @pytest.mark.asyncio
    async def test_limit_above_100_returns_more_than_100_gas(
        self, db: Database
    ) -> None:
        """Iter topn-3: Repo-Cap muss limit > 100 zulassen.

        Vorher: bus_health_per_ga cappte limit intern via min(limit, 100)
        — damit konnte der UI-Card-Selektor (max 200) nie mehr als 100
        GAs anzeigen, selbst wenn der View limit=200 schickte. Jetzt:
        Cap bei 500 (konsistent mit _HARD_TOP_LIMIT der anderen
        Top-N-Endpunkte).
        """
        for ga_idx in range(150):
            ga = f"1/{ga_idx // 8}/{ga_idx % 8}"
            await _insert(db, ts=_ts(ga_idx * 0.1), ga=ga, repeated=False)
            await _insert(db, ts=_ts(ga_idx * 0.1 + 0.05), ga=ga, repeated=True)
        repo = KnxStatsRepository(db)
        rows = await repo.bus_health_per_ga(_ts(0), _ts(60), limit=150)
        assert len(rows) == 150, (
            f"Repo-Cap blockiert limit > 100 — erwartet 150 GAs, bekam {len(rows)}"
        )
