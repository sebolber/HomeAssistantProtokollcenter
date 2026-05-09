"""Iter A4: Public-Methoden fuer Bus-weite Aggregate.

Konzept-Schwaeche A4: ``findings_runner`` greift auf ``stats_repo._db``
privat zu, um drei Aggregate zu lesen (alle Samples, Counts/GA,
Last-Seen/GA). Repository-Pattern war damit gebrochen — SQL streute
durch den Code.

Loesung: Drei Public-Methoden auf ``KnxStatsRepository`` mit klaren
Test-Vertraegen. Der Runner nutzt sie statt Inline-SQL.
"""

from __future__ import annotations

import pytest

from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import (
    MigrationRunner,
    discover_migrations,
)


@pytest.fixture
async def repo(tmp_path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "test.db")
    await db.open()
    await MigrationRunner(db, migrations=discover_migrations()).run()
    try:
        yield KnxStatsRepository(db)
    finally:
        await db.close()


async def _seed(repo: KnxStatsRepository) -> None:
    await repo.insert_raw_batch(
        [
            {
                "timestamp": "2026-05-08T10:00:00",
                "destination": "1/2/3",
                "source": "1.1.5",
                "telegramtype": "GroupValueWrite",
                "value": 1,
                "repeated": False,
            },
            {
                "timestamp": "2026-05-08T10:00:01",
                "destination": "1/2/3",
                "source": "1.1.5",
                "telegramtype": "GroupValueWrite",
                "value": 0,
                "repeated": False,
            },
            {
                "timestamp": "2026-05-08T10:00:02",
                "destination": "1/2/4",
                "source": "1.1.6",
                "telegramtype": "GroupValueRead",
                "value": None,
                "repeated": False,
            },
        ]
    )


@pytest.mark.asyncio
async def test_samples_for_period_all_gas(repo: KnxStatsRepository) -> None:
    await _seed(repo)
    rows = await repo.samples_for_period_all_gas(
        "2026-05-08T00:00:00", "2026-05-09T00:00:00"
    )
    assert len(rows) == 3
    # Reihenfolge nach ts ASC; Werte als Python-Typen decoded.
    assert rows[0]["ga"] == "1/2/3"
    assert rows[0]["value"] == 1
    assert rows[1]["value"] == 0
    assert rows[2]["telegramtype"] == "GroupValueRead"


@pytest.mark.asyncio
async def test_counts_per_ga(repo: KnxStatsRepository) -> None:
    await _seed(repo)
    counts = await repo.counts_per_ga(
        "2026-05-08T00:00:00", "2026-05-09T00:00:00"
    )
    assert counts == {"1/2/3": 2, "1/2/4": 1}


@pytest.mark.asyncio
async def test_last_seen_per_ga(repo: KnxStatsRepository) -> None:
    await _seed(repo)
    map_ = await repo.last_seen_per_ga()
    assert map_["1/2/3"] == "2026-05-08T10:00:01"
    assert map_["1/2/4"] == "2026-05-08T10:00:02"


@pytest.mark.asyncio
async def test_aggregates_handle_empty_db(repo: KnxStatsRepository) -> None:
    rows = await repo.samples_for_period_all_gas(
        "2026-05-08T00:00:00", "2026-05-09T00:00:00"
    )
    assert rows == []
    counts = await repo.counts_per_ga(
        "2026-05-08T00:00:00", "2026-05-09T00:00:00"
    )
    assert counts == {}
    map_ = await repo.last_seen_per_ga()
    assert map_ == {}
