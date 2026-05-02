"""Iter 15 (QS-l): Default-Alarm-Regeln."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_stats_service import KnxStatsService
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
    dev_source: str = "1.1.5",
    repeated: bool = False,
) -> None:
    await insert_raw_telegram(
        db, ts=ts, ga=ga, dev_source=dev_source, repeated=repeated
    )


class TestEvaluateAlarms:
    @pytest.mark.asyncio
    async def test_empty_returns_three_rules_none_triggered(
        self, db: Database
    ) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        out = await svc.evaluate_alarms(
            _ts(0), _ts(60),
            busload_pct_threshold=25.0,
            repeat_rate_pct_threshold=0.5,
            silence_count_threshold=1,
            max_silence_minutes=10,
        )
        assert len(out) == 3
        rules = {a["rule"] for a in out}
        assert rules == {"bus_load_above", "repeat_rate_above", "silence_alarm"}
        assert all(a["triggered"] is False for a in out)

    @pytest.mark.asyncio
    async def test_high_repeat_rate_triggers(self, db: Database) -> None:
        # 100 normal + 5 repeated → 4.76% Wiederholrate
        for i in range(100):
            await _insert(db, ts=_ts(i / 2), ga="1/2/3")
        for i in range(5):
            await _insert(db, ts=_ts(50 + i / 2), ga="1/2/3", repeated=True)
        svc = KnxStatsService(KnxStatsRepository(db))
        out = await svc.evaluate_alarms(
            _ts(0), _ts(60),
            busload_pct_threshold=99.0,
            repeat_rate_pct_threshold=1.0,
            silence_count_threshold=99,
            max_silence_minutes=120,
        )
        repeat = next(a for a in out if a["rule"] == "repeat_rate_above")
        assert repeat["triggered"] is True
        assert repeat["actual"] > 1.0

    @pytest.mark.asyncio
    async def test_silence_alarm_triggers_with_old_device(self, db: Database) -> None:
        # Geraet hat zuletzt vor 60 min gesendet, max_silence = 10 min,
        # max_silence < (now - last_seen) erforderlich. Wir simulieren now
        # ueber einen sehr alten Insert.
        await _insert(db, ts=_ts(-1000), ga="1/2/3", dev_source="1.1.5")
        svc = KnxStatsService(KnxStatsRepository(db))
        out = await svc.evaluate_alarms(
            _ts(-2000), _ts(0),  # Periode beinhaltet das Insert
            busload_pct_threshold=99.0,
            repeat_rate_pct_threshold=99.0,
            silence_count_threshold=1,
            max_silence_minutes=10,
        )
        silence = next(a for a in out if a["rule"] == "silence_alarm")
        # Wegen now=now() und ts vor langer Zeit ist es definitiv stumm
        assert silence["triggered"] is True
        assert silence["actual"] >= 1
