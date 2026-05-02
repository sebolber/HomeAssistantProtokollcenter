"""Iter 4: KnxStatsRepository — Aggregate + Acknowledge."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner


@pytest.fixture
async def db(tmp_path: Path) -> Database:
    """Frische DB mit allen Migrations angewandt."""
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


async def _insert_knx(
    db: Database,
    *,
    ts: str,
    ga: str,
    dpt: str | None = "9.001",
    label: str = "Test",
    dev_source: str = "1.1.5",
    value: object = 21.5,
    telegramtype: str = "GroupValueWrite",
) -> None:
    metadata = {
        "knx_ga": ga,
        "knx_dpt": dpt,
        "knx_label": label,
        "knx_source": dev_source,
        "knx_value": value,
        "knx_telegramtype": telegramtype,
    }
    await db.execute(
        "INSERT INTO messages "
        "(timestamp, severity, source, text, metadata, fingerprint, "
        " count, first_seen, last_seen, status) "
        "VALUES (?, 'info', 'knx-bus', ?, ?, ?, 1, ?, ?, 'new')",
        (
            ts,
            f"{label} = {value}",
            json.dumps(metadata),
            f"fp-{ts}-{ga}",
            ts,
            ts,
        ),
    )


class TestSummary:
    @pytest.mark.asyncio
    async def test_empty_period_returns_zeros(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        s = await repo.summary(_ts(0), _ts(60))
        assert s == {"total_telegrams": 0, "active_gas": 0, "active_devices": 0}

    @pytest.mark.asyncio
    async def test_counts_distinct_gas_and_devices(self, db: Database) -> None:
        await _insert_knx(db, ts=_ts(1), ga="1/2/3", dev_source="1.1.5")
        await _insert_knx(db, ts=_ts(2), ga="1/2/3", dev_source="1.1.5")
        await _insert_knx(db, ts=_ts(3), ga="1/2/4", dev_source="1.1.6")
        repo = KnxStatsRepository(db)
        s = await repo.summary(_ts(0), _ts(10))
        assert s == {"total_telegrams": 3, "active_gas": 2, "active_devices": 2}


class TestTopByGa:
    @pytest.mark.asyncio
    async def test_groups_and_orders_by_count_desc(self, db: Database) -> None:
        for i in range(5):
            await _insert_knx(db, ts=_ts(i), ga="5/2/14", label="LUX")
        for i in range(2):
            await _insert_knx(db, ts=_ts(i), ga="1/2/3", label="Light")
        repo = KnxStatsRepository(db)
        rows = await repo.top_by_ga(_ts(0), _ts(60), limit=10)
        assert len(rows) == 2
        assert rows[0]["ga"] == "5/2/14"
        assert rows[0]["count"] == 5
        assert rows[1]["ga"] == "1/2/3"
        assert rows[1]["count"] == 2

    @pytest.mark.asyncio
    async def test_respects_limit(self, db: Database) -> None:
        for i in range(3):
            await _insert_knx(db, ts=_ts(i), ga=f"1/0/{i}", label=f"GA{i}")
        repo = KnxStatsRepository(db)
        rows = await repo.top_by_ga(_ts(0), _ts(60), limit=2)
        assert len(rows) == 2

    @pytest.mark.asyncio
    async def test_includes_dpt_label_dev_source(self, db: Database) -> None:
        await _insert_knx(
            db, ts=_ts(0), ga="9/1/1", dpt="9.004", label="Wetter", dev_source="1.1.220"
        )
        repo = KnxStatsRepository(db)
        rows = await repo.top_by_ga(_ts(0), _ts(60), limit=10)
        assert rows[0]["dpt"] == "9.004"
        assert rows[0]["label"] == "Wetter"
        assert rows[0]["dev_source"] == "1.1.220"


class TestTopBySource:
    @pytest.mark.asyncio
    async def test_aggregates_per_dev_source(self, db: Database) -> None:
        # 1.1.220 sendet 3 Telegramme auf 2 GAs
        await _insert_knx(db, ts=_ts(0), ga="22/3/43", dev_source="1.1.220")
        await _insert_knx(db, ts=_ts(1), ga="22/3/44", dev_source="1.1.220")
        await _insert_knx(db, ts=_ts(2), ga="22/3/43", dev_source="1.1.220")
        # 1.1.5 sendet 1
        await _insert_knx(db, ts=_ts(3), ga="1/2/3", dev_source="1.1.5")
        repo = KnxStatsRepository(db)
        rows = await repo.top_by_source(_ts(0), _ts(60), limit=10)
        assert rows[0]["dev_source"] == "1.1.220"
        assert rows[0]["count"] == 3
        assert rows[0]["ga_count"] == 2


class TestGaSamples:
    @pytest.mark.asyncio
    async def test_orders_by_timestamp_asc(self, db: Database) -> None:
        await _insert_knx(db, ts=_ts(2), ga="1/2/3", value=2)
        await _insert_knx(db, ts=_ts(0), ga="1/2/3", value=0)
        await _insert_knx(db, ts=_ts(1), ga="1/2/3", value=1)
        repo = KnxStatsRepository(db)
        samples = await repo.ga_samples("1/2/3", _ts(0), _ts(60))
        assert [s["value"] for s in samples] == [0, 1, 2]


class TestTimeline:
    @pytest.mark.asyncio
    async def test_buckets_by_10_minutes(self, db: Database) -> None:
        # Ein Telegramm bei min 1, eins bei min 11 — sollten in 2 Buckets fallen
        await _insert_knx(db, ts=_ts(1), ga="1/2/3")
        await _insert_knx(db, ts=_ts(11), ga="1/2/3")
        await _insert_knx(db, ts=_ts(12), ga="1/2/3")
        repo = KnxStatsRepository(db)
        rows = await repo.timeline(_ts(0), _ts(60), gas=["1/2/3"], bucket_minutes=10)
        assert len(rows) == 2
        assert sum(r["count"] for r in rows) == 3

    @pytest.mark.asyncio
    async def test_empty_gas_returns_empty(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        rows = await repo.timeline(_ts(0), _ts(60), gas=[], bucket_minutes=10)
        assert rows == []


class TestAcknowledge:
    @pytest.mark.asyncio
    async def test_set_and_get(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        await repo.ack_set("5/2/14", note="bekannt — Wetterstation, im Plan")
        ack = await repo.ack_get("5/2/14")
        assert ack is not None
        assert ack["note"] == "bekannt — Wetterstation, im Plan"

    @pytest.mark.asyncio
    async def test_clear_returns_true_when_existed(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        await repo.ack_set("5/2/14")
        assert await repo.ack_clear("5/2/14") is True
        assert await repo.ack_clear("5/2/14") is False

    @pytest.mark.asyncio
    async def test_active_set_excludes_expired(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        # ablaufen lassen: expiry_days = -1 -> wir simulieren, indem wir
        # ack_set ohne expiry und manuell expires_at zurueckdatieren.
        await repo.ack_set("5/2/14", expiry_days=90)
        await repo.ack_set("1/2/3")  # sticky
        # Manuell zurueckdatieren
        past = (datetime.now(UTC) - timedelta(days=1)).isoformat(timespec="seconds")
        await db.execute(
            "UPDATE knx_ga_acknowledgements SET expires_at = ? WHERE ga = ?",
            (past, "5/2/14"),
        )
        active = await repo.ack_active_set()
        assert "1/2/3" in active
        assert "5/2/14" not in active

    @pytest.mark.asyncio
    async def test_set_with_expiry_persists_expires_at(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        await repo.ack_set("5/2/14", expiry_days=90)
        ack = await repo.ack_get("5/2/14")
        assert ack is not None
        assert ack["expires_at"] is not None

    @pytest.mark.asyncio
    async def test_set_without_expiry_is_sticky(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        await repo.ack_set("5/2/14")
        ack = await repo.ack_get("5/2/14")
        assert ack is not None
        assert ack["expires_at"] is None
