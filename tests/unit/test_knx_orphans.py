"""Iter 14 (QS-g): Verwaiste GAs (Projekt vs Realitaet)."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_stats_service import KnxStatsService
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


def _ts(offset_min: float) -> str:
    base = datetime(2026, 5, 2, 12, 0, 0, tzinfo=UTC)
    return (base + timedelta(minutes=offset_min)).isoformat(timespec="seconds")


async def _insert(db: Database, *, ts: str, ga: str, label: str = "x") -> None:
    metadata = {
        "knx_ga": ga,
        "knx_dpt": "1.001",
        "knx_label": label,
        "knx_source": "1.1.5",
        "knx_value": 1,
        "knx_telegramtype": "GroupValueWrite",
    }
    await db.execute(
        "INSERT INTO messages "
        "(timestamp, severity, source, text, metadata, fingerprint, "
        " count, first_seen, last_seen, status) "
        "VALUES (?, 'info', 'knx-bus', ?, ?, ?, 1, ?, ?, 'new')",
        (ts, "x", json.dumps(metadata), f"fp-{ts}-{ga}", ts, ts),
    )


class TestComputeOrphans:
    @pytest.mark.asyncio
    async def test_empty_inputs(self, db: Database) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        out = await svc.compute_orphans(_ts(0), _ts(60), project_gas=[])
        assert out["missing_in_log"] == []
        assert out["extra_in_log"] == []
        assert out["project_total"] == 0
        assert out["log_total"] == 0

    @pytest.mark.asyncio
    async def test_project_only_appears_as_missing(self, db: Database) -> None:
        # GA 1/2/3 ist im Projekt, aber kein Telegramm gesehen
        svc = KnxStatsService(KnxStatsRepository(db))
        out = await svc.compute_orphans(
            _ts(0), _ts(60),
            project_gas=[{"address": "1/2/3", "name": "Wohnzimmer", "dpt": "1.001"}],
        )
        assert len(out["missing_in_log"]) == 1
        assert out["missing_in_log"][0]["address"] == "1/2/3"
        assert out["extra_in_log"] == []

    @pytest.mark.asyncio
    async def test_log_only_appears_as_extra(self, db: Database) -> None:
        # GA 5/2/14 wurde gesehen, ist aber nicht im Projekt
        await _insert(db, ts=_ts(10), ga="5/2/14")
        svc = KnxStatsService(KnxStatsRepository(db))
        out = await svc.compute_orphans(
            _ts(0), _ts(60), project_gas=[]
        )
        assert out["missing_in_log"] == []
        assert len(out["extra_in_log"]) == 1
        assert out["extra_in_log"][0]["address"] == "5/2/14"

    @pytest.mark.asyncio
    async def test_intersection_disappears(self, db: Database) -> None:
        await _insert(db, ts=_ts(10), ga="1/2/3", label="Wohnzimmer")
        svc = KnxStatsService(KnxStatsRepository(db))
        out = await svc.compute_orphans(
            _ts(0), _ts(60),
            project_gas=[{"address": "1/2/3", "name": "Wohnzimmer", "dpt": "1.001"}],
        )
        assert out["missing_in_log"] == []
        assert out["extra_in_log"] == []
        assert out["project_total"] == 1
        assert out["log_total"] == 1
