"""Iter 42 (Feature N): Audit-Log fuer sicherheitssensitive GAs.

Admins markieren GAs (z. B. Tuerschloss, Alarmanlage) per is_sensitive-
Flag. Diese Iter liefert ein Lese-API + Aggregation pro GA fuer den
Stats-Tab — KEIN zusaetzliches Schema fuer die Telegramme selbst,
sondern JOIN auf knx_raw_telegrams.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

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


def _ts(offset_min: float) -> str:
    base = datetime(2026, 5, 2, 12, 0, 0, tzinfo=UTC)
    return (base + timedelta(minutes=offset_min)).isoformat(timespec="seconds")


async def _mark_sensitive(db: Database, ga: str) -> None:
    """Setzt is_sensitive=1 auf einen bestehenden GA-Eintrag."""
    await db.execute(
        "UPDATE knx_group_addresses SET is_sensitive = 1 WHERE address = ?",
        (ga,),
    )


class TestSensitiveListing:
    @pytest.mark.asyncio
    async def test_returns_only_sensitive_addresses(self, db: Database) -> None:
        # Drei GAs mit Label, eine als sensitiv markiert
        await insert_raw_telegram(db, ts=_ts(0), ga="1/1/1", label="Tuerschloss")
        await insert_raw_telegram(db, ts=_ts(1), ga="2/2/2", label="Wohnzimmer")
        await insert_raw_telegram(db, ts=_ts(2), ga="3/3/3", label="Garage")
        await _mark_sensitive(db, "1/1/1")
        await _mark_sensitive(db, "3/3/3")

        repo = KnxStatsRepository(db)
        gas = await repo.sensitive_addresses()
        assert sorted([g["ga"] for g in gas]) == ["1/1/1", "3/3/3"]
        assert all(g.get("label") for g in gas)

    @pytest.mark.asyncio
    async def test_empty_when_none_marked(self, db: Database) -> None:
        await insert_raw_telegram(db, ts=_ts(0), ga="1/1/1", label="X")
        repo = KnxStatsRepository(db)
        assert await repo.sensitive_addresses() == []


class TestSensitiveTelegrams:
    @pytest.mark.asyncio
    async def test_returns_only_telegrams_for_sensitive_gas(self, db: Database) -> None:
        await insert_raw_telegram(db, ts=_ts(0), ga="1/1/1", label="Tuer", value=1)
        await insert_raw_telegram(db, ts=_ts(1), ga="1/1/1", value=0)
        await insert_raw_telegram(db, ts=_ts(2), ga="2/2/2", label="Licht", value=1)
        await _mark_sensitive(db, "1/1/1")

        repo = KnxStatsRepository(db)
        rows = await repo.sensitive_telegrams(_ts(-60), _ts(60))
        # Nur die zwei Tuer-Telegramme
        assert len(rows) == 2
        assert all(r["ga"] == "1/1/1" for r in rows)
        # Sortiert: neuestes zuerst (DESC)
        assert rows[0]["ts"] >= rows[1]["ts"]

    @pytest.mark.asyncio
    async def test_period_filter(self, db: Database) -> None:
        await insert_raw_telegram(db, ts=_ts(0), ga="1/1/1", label="Tuer")
        await insert_raw_telegram(db, ts=_ts(120), ga="1/1/1")
        await _mark_sensitive(db, "1/1/1")

        repo = KnxStatsRepository(db)
        # Periode 0..60 -> nur erstes Telegramm
        rows = await repo.sensitive_telegrams(_ts(-1), _ts(60))
        assert len(rows) == 1

    @pytest.mark.asyncio
    async def test_respects_limit(self, db: Database) -> None:
        for i in range(10):
            await insert_raw_telegram(db, ts=_ts(i), ga="1/1/1", label="Tuer")
        await _mark_sensitive(db, "1/1/1")

        repo = KnxStatsRepository(db)
        rows = await repo.sensitive_telegrams(_ts(-1), _ts(60), limit=3)
        assert len(rows) == 3


class TestSetSensitive:
    @pytest.mark.asyncio
    async def test_set_creates_or_updates_flag(self, db: Database) -> None:
        await insert_raw_telegram(db, ts=_ts(0), ga="1/1/1", label="Test")
        repo = KnxStatsRepository(db)

        await repo.set_sensitive("1/1/1", sensitive=True)
        assert [g["ga"] for g in await repo.sensitive_addresses()] == ["1/1/1"]

        await repo.set_sensitive("1/1/1", sensitive=False)
        assert await repo.sensitive_addresses() == []

    @pytest.mark.asyncio
    async def test_set_creates_minimal_row_for_unknown_ga(self, db: Database) -> None:
        # GA noch nicht in knx_group_addresses -> Repo muss minimalen
        # Eintrag anlegen, damit das Flag persistiert. Das ist wichtig:
        # admin will GAs schon markieren, bevor sie das erste Mal senden.
        repo = KnxStatsRepository(db)
        await repo.set_sensitive("9/9/9", sensitive=True)
        rows = await repo.sensitive_addresses()
        assert [g["ga"] for g in rows] == ["9/9/9"]


class TestServiceSensitiveLog:
    @pytest.mark.asyncio
    async def test_returns_addresses_and_telegrams(self, db: Database) -> None:
        await insert_raw_telegram(db, ts=_ts(0), ga="1/1/1", label="Tuer", value=1)
        await insert_raw_telegram(db, ts=_ts(1), ga="2/2/2", label="Licht")
        await _mark_sensitive(db, "1/1/1")

        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.sensitive_log(from_iso=_ts(-1), to_iso=_ts(60))
        assert len(result["addresses"]) == 1
        assert result["addresses"][0]["ga"] == "1/1/1"
        assert len(result["telegrams"]) == 1
        assert result["telegrams"][0]["ga"] == "1/1/1"
