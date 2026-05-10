"""Iter 13 (QS-c): Stille-Detector pro Source-Address."""

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
    dev_source: str,
) -> None:
    await insert_raw_telegram(db, ts=ts, ga=ga, dev_source=dev_source)


class TestSilenceDetect:
    @pytest.mark.asyncio
    async def test_empty_returns_empty(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        out = await repo.silence_detect(_ts(0), _ts(60), now_iso=_ts(60), max_silence_minutes=10)
        assert out == []

    @pytest.mark.asyncio
    async def test_recent_activity_no_alarm(self, db: Database) -> None:
        # last seen vor 1 Min (in einer 60-Min-Periode)
        await _insert(db, ts=_ts(59), ga="1/2/3", dev_source="1.1.5")
        repo = KnxStatsRepository(db)
        out = await repo.silence_detect(_ts(0), _ts(60), now_iso=_ts(60), max_silence_minutes=10)
        assert len(out) == 1
        assert out[0]["dev_source"] == "1.1.5"
        assert out[0]["alarm"] is False
        assert out[0]["silent_minutes"] == pytest.approx(1.0, rel=0.1)

    @pytest.mark.asyncio
    async def test_old_activity_triggers_alarm(self, db: Database) -> None:
        # last seen vor 30 Min, max_silence = 10 Min → alarm
        await _insert(db, ts=_ts(30), ga="1/2/3", dev_source="1.1.5")
        repo = KnxStatsRepository(db)
        out = await repo.silence_detect(_ts(0), _ts(60), now_iso=_ts(60), max_silence_minutes=10)
        assert len(out) == 1
        assert out[0]["alarm"] is True
        assert out[0]["silent_minutes"] == pytest.approx(30.0, rel=0.1)

    @pytest.mark.asyncio
    async def test_groups_per_dev_source(self, db: Database) -> None:
        await _insert(db, ts=_ts(10), ga="1/2/3", dev_source="1.1.5")
        await _insert(db, ts=_ts(40), ga="1/2/3", dev_source="1.1.5")
        await _insert(db, ts=_ts(20), ga="2/2/2", dev_source="1.1.7")
        repo = KnxStatsRepository(db)
        out = await repo.silence_detect(_ts(0), _ts(60), now_iso=_ts(60), max_silence_minutes=10)
        assert len(out) == 2
        sources = {row["dev_source"] for row in out}
        assert sources == {"1.1.5", "1.1.7"}

    @pytest.mark.asyncio
    async def test_orders_by_last_seen_asc(self, db: Database) -> None:
        # 1.1.5 zuletzt vor 5 min, 1.1.7 zuletzt vor 30 min — 1.1.7 zuerst
        await _insert(db, ts=_ts(55), ga="1/2/3", dev_source="1.1.5")
        await _insert(db, ts=_ts(30), ga="2/2/2", dev_source="1.1.7")
        repo = KnxStatsRepository(db)
        out = await repo.silence_detect(_ts(0), _ts(60), now_iso=_ts(60), max_silence_minutes=10)
        assert out[0]["dev_source"] == "1.1.7"
        assert out[1]["dev_source"] == "1.1.5"
