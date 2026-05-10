"""Iter A (knx-detail-panes): Repo-Methoden fuer Source-Detail.

Vertrag aus `docs/messagehub_knx_detail_panes_konzept.md`:
- `last_seen_for_source(dev_source)` ohne Period-Filter (echter Status).
- `count_for_source(dev_source, from, to)` Bus-Anteil-Basis.
- `repeat_ratio_for_source(dev_source, from, to)` source-spezifisch.
- `gas_for_source` erweitert um dpt + last_seen pro GA.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


def _ts(offset_seconds: float, *, base: datetime | None = None) -> str:
    base_dt = base or datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return (base_dt + timedelta(seconds=offset_seconds)).isoformat(timespec="seconds")


async def _insert_telegram(
    db: Database,
    *,
    ga: str,
    ts: str,
    source: str = "1.1.5",
    value: object = 1,
    telegramtype: str = "GroupValueWrite",
    repeated: bool = False,
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            ts,
            ga,
            source,
            telegramtype,
            json.dumps(value, default=str),
            1 if repeated else 0,
        ),
    )


async def _insert_ga(
    db: Database,
    *,
    ga: str,
    label: str = "Sensor",
    dpt: str | None = None,
) -> None:
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (ga, label, dpt, now, now),
    )


class TestLastSeenForSource:
    @pytest.mark.asyncio
    async def test_last_seen_returns_max_timestamp_independent_of_period(
        self, db: Database
    ) -> None:
        # Arrange — drei Telegramme, eines vor Period-Start.
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        await _insert_telegram(db, ga="1/1/1", ts=_ts(60), source="1.1.10")
        await _insert_telegram(db, ga="1/1/2", ts=_ts(120), source="1.1.10")

        repo = KnxStatsRepository(db)
        result = await repo.last_seen_for_source("1.1.10")

        assert result is not None
        # MAX(timestamp) — unabhaengig vom Period-Filter.
        assert result.startswith("2026-05-03T08:02")

    @pytest.mark.asyncio
    async def test_last_seen_returns_none_for_unknown_source(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        assert await repo.last_seen_for_source("9.9.9") is None

    @pytest.mark.asyncio
    async def test_last_seen_returns_none_for_empty_dev_source(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        assert await repo.last_seen_for_source("") is None


class TestCountForSource:
    @pytest.mark.asyncio
    async def test_count_includes_only_in_period_telegrams(self, db: Database) -> None:
        # Arrange — eines im Period, eines davor, eines danach.
        await _insert_telegram(db, ga="1/1/1", ts=_ts(-10), source="1.1.10")
        await _insert_telegram(db, ga="1/1/1", ts=_ts(60), source="1.1.10")
        await _insert_telegram(db, ga="1/1/1", ts=_ts(3700), source="1.1.10")

        repo = KnxStatsRepository(db)
        result = await repo.count_for_source(
            "1.1.10",
            _ts(0),
            _ts(3600),
        )

        assert result == 1

    @pytest.mark.asyncio
    async def test_count_zero_for_unknown_source(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        result = await repo.count_for_source("9.9.9", _ts(0), _ts(3600))
        assert result == 0

    @pytest.mark.asyncio
    async def test_count_zero_for_empty_dev_source(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        result = await repo.count_for_source("", _ts(0), _ts(3600))
        assert result == 0


class TestRepeatRatioForSource:
    @pytest.mark.asyncio
    async def test_repeat_ratio_pct_with_mixed_repeated_flag(self, db: Database) -> None:
        # 4 Telegramme, davon 1 repeated -> 25%.
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        await _insert_telegram(db, ga="1/1/1", ts=_ts(60), source="1.1.10")
        await _insert_telegram(
            db,
            ga="1/1/1",
            ts=_ts(120),
            source="1.1.10",
            repeated=True,
        )
        await _insert_telegram(db, ga="1/1/1", ts=_ts(180), source="1.1.10")

        repo = KnxStatsRepository(db)
        result = await repo.repeat_ratio_for_source(
            "1.1.10",
            _ts(-1),
            _ts(3600),
        )

        assert result["total"] == 4
        assert result["repeated"] == 1
        assert result["ratio_pct"] == 25.0

    @pytest.mark.asyncio
    async def test_repeat_ratio_zero_when_no_telegrams(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        result = await repo.repeat_ratio_for_source(
            "9.9.9",
            _ts(0),
            _ts(3600),
        )
        assert result == {"total": 0, "repeated": 0, "ratio_pct": 0.0}

    @pytest.mark.asyncio
    async def test_repeat_ratio_filters_other_sources(self, db: Database) -> None:
        # Eine Source mit allen normalen, eine mit allen repeated —
        # darf nicht gemischt werden.
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        await _insert_telegram(
            db,
            ga="1/1/1",
            ts=_ts(60),
            source="1.1.20",
            repeated=True,
        )

        repo = KnxStatsRepository(db)
        result = await repo.repeat_ratio_for_source(
            "1.1.10",
            _ts(-1),
            _ts(3600),
        )
        assert result["total"] == 1
        assert result["repeated"] == 0


class TestGasForSourceExtended:
    @pytest.mark.asyncio
    async def test_gas_for_source_returns_dpt_and_last_seen(self, db: Database) -> None:
        await _insert_ga(db, ga="1/1/1", label="Schalter", dpt="1.001")
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        await _insert_telegram(db, ga="1/1/1", ts=_ts(60), source="1.1.10")

        repo = KnxStatsRepository(db)
        rows = await repo.gas_for_source("1.1.10", _ts(-1), _ts(3600))

        assert len(rows) == 1
        row = rows[0]
        assert row["ga"] == "1/1/1"
        assert row["label"] == "Schalter"
        assert row["dpt"] == "1.001"
        assert row["count"] == 2
        assert row["last_seen"] is not None
        assert row["last_seen"].startswith("2026-05-03T08:01")

    @pytest.mark.asyncio
    async def test_gas_for_source_handles_missing_whitelist(self, db: Database) -> None:
        # GA ohne Whitelist-Eintrag -> dpt + label = None.
        await _insert_telegram(db, ga="1/1/9", ts=_ts(0), source="1.1.10")

        repo = KnxStatsRepository(db)
        rows = await repo.gas_for_source("1.1.10", _ts(-1), _ts(3600))

        assert len(rows) == 1
        assert rows[0]["dpt"] is None
        assert rows[0]["label"] is None
        assert rows[0]["count"] == 1
