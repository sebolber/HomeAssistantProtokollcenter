"""Iter 5: KnxStatsService — Orchestrierung Repo+Engine."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_stats_service import (
    KnxStatsService,
    estimate_busload_pct,
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
    await insert_raw_telegram(
        db,
        ts=ts,
        ga=ga,
        dpt=dpt,
        label=label,
        dev_source=dev_source,
        value=value,
        telegramtype=telegramtype,
    )


class TestEstimateBusload:
    def test_zero_telegrams_returns_zero(self) -> None:
        assert estimate_busload_pct(0, 60.0) == 0.0

    def test_zero_period_returns_zero(self) -> None:
        assert estimate_busload_pct(100, 0.0) == 0.0

    def test_50_per_sec_returns_above_100pct(self) -> None:
        # Iter 36: ETS-konformes Modell (200 Bit/Telegramm inkl. Pause).
        # 50 Tel/s * 200 Bit / 9600 bit/s = ~104.2 %.
        load = estimate_busload_pct(50, 1.0)
        assert 100 < load < 110


class TestComputeSummary:
    @pytest.mark.asyncio
    async def test_empty_returns_zero_busload(self, db: Database) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        s = await svc.compute_summary(_ts(0), _ts(60))
        assert s["total_telegrams"] == 0
        assert s["estimated_busload_pct"] == 0.0
        assert s["counts_by_severity"] == {"green": 0, "yellow": 0, "orange": 0, "red": 0}

    @pytest.mark.asyncio
    async def test_includes_period_and_classifies(self, db: Database) -> None:
        # 60 Telegramme in 60 Minuten = 1/Min — bei DPT 9.001 (Soll 2/Min) green
        for i in range(60):
            await _insert_knx(db, ts=_ts(i), ga="1/2/3", dpt="9.001")
        svc = KnxStatsService(KnxStatsRepository(db))
        s = await svc.compute_summary(_ts(0), _ts(60))
        assert s["total_telegrams"] == 60
        assert s["counts_by_severity"]["green"] == 1


class TestComputeTop:
    @pytest.mark.asyncio
    async def test_classifies_red_for_overactive_ga(self, db: Database) -> None:
        # 700 Telegramme in 60 Min = 11.67/Min, DPT 9.001 (Soll 2) → ratio 5.83 → red
        for i in range(700):
            await _insert_knx(db, ts=_ts(i / 12), ga="5/2/14", dpt="9.001")
        svc = KnxStatsService(KnxStatsRepository(db))
        rows = await svc.compute_top(_ts(0), _ts(60), limit=10)
        assert len(rows) == 1
        assert rows[0].severity == "red"
        assert rows[0].rate_per_min > 10.0

    @pytest.mark.asyncio
    async def test_filters_below_min_rate(self, db: Database) -> None:
        await _insert_knx(db, ts=_ts(0), ga="1/2/3", dpt="9.001")  # 1 in 60 min
        svc = KnxStatsService(KnxStatsRepository(db))
        rows = await svc.compute_top(_ts(0), _ts(60), limit=10, min_rate_per_min=1.0)
        assert rows == []

    @pytest.mark.asyncio
    async def test_marks_acknowledged(self, db: Database) -> None:
        for i in range(10):
            await _insert_knx(db, ts=_ts(i), ga="5/2/14")
        repo = KnxStatsRepository(db)
        await repo.ack_set("5/2/14", note="bekannt")
        svc = KnxStatsService(repo)
        rows = await svc.compute_top(_ts(0), _ts(60), limit=10)
        assert rows[0].acknowledged is True

    @pytest.mark.asyncio
    async def test_excludes_acknowledged_when_flag_false(self, db: Database) -> None:
        for i in range(10):
            await _insert_knx(db, ts=_ts(i), ga="5/2/14")
        await _insert_knx(db, ts=_ts(20), ga="1/2/3")
        repo = KnxStatsRepository(db)
        await repo.ack_set("5/2/14")
        svc = KnxStatsService(repo)
        rows = await svc.compute_top(_ts(0), _ts(60), limit=10, include_acknowledged=False)
        gas = {r.ga for r in rows}
        assert "5/2/14" not in gas
        assert "1/2/3" in gas

    @pytest.mark.asyncio
    async def test_infers_dpt_for_rows_without_etstype_iter62(
        self, db: Database
    ) -> None:
        # Iter 62 / WR-T: GA ohne DPT in ETS (z. B. Hörmann-Tor mit
        # Default-Werten) wird per Heuristik geraten.
        # Boolean-GA mit nur 0/1-Werten -> 1.001 (Schalten).
        for i in range(20):
            await _insert_knx(db, ts=_ts(i), ga="0/1/1", dpt=None, value=i % 2)
        # Float-GA mit Temperatur-Werten -> 9.x (generisch).
        for i in range(20):
            await _insert_knx(db, ts=_ts(i), ga="1/3/5", dpt=None, value=21.5 + i * 0.1)
        # ETS-DPT bleibt unangetastet, wenn vorhanden.
        for i in range(20):
            await _insert_knx(db, ts=_ts(i), ga="2/4/6", dpt="9.004", value=300 + i)
        svc = KnxStatsService(KnxStatsRepository(db))
        rows = await svc.compute_top(_ts(0), _ts(60), limit=10)
        by_ga = {r.ga: r for r in rows}
        assert by_ga["0/1/1"].dpt == "1.001"
        assert by_ga["0/1/1"].dpt_inferred is True
        assert by_ga["1/3/5"].dpt == "9.x"
        assert by_ga["1/3/5"].dpt_inferred is True
        # ETS-DPT bleibt
        assert by_ga["2/4/6"].dpt == "9.004"
        assert by_ga["2/4/6"].dpt_inferred is False
        # Soll-Rate folgt dem inferierten DPT (1.001 -> 1.0, 9.x -> 9.001=2.0).
        assert by_ga["0/1/1"].recommended_rate == 1.0
        assert by_ga["1/3/5"].recommended_rate == 2.0


class TestComputeGaDetail:
    @pytest.mark.asyncio
    async def test_empty_returns_none(self, db: Database) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        d = await svc.compute_ga_detail("1/2/3", _ts(0), _ts(60))
        assert d is None

    @pytest.mark.asyncio
    async def test_returns_detail_with_recommendation(self, db: Database) -> None:
        for i in range(120):
            await _insert_knx(db, ts=_ts(i / 2), ga="5/2/14", dpt="9.004", value=12)
        svc = KnxStatsService(KnxStatsRepository(db))
        d = await svc.compute_ga_detail("5/2/14", _ts(0), _ts(60))
        assert d is not None
        assert d.ga == "5/2/14"
        assert d.dpt == "9.004"
        # 120 in 60 min = 2/min — bei Soll 2 → green oder leicht darueber
        assert d.recommendation is not None

    @pytest.mark.asyncio
    async def test_includes_findings_for_constant_value(self, db: Database) -> None:
        # 15 Werte alle gleich → constant_value Finding
        for i in range(15):
            await _insert_knx(db, ts=_ts(i), ga="22/3/43", dpt="9.001", value=0.0)
        svc = KnxStatsService(KnxStatsRepository(db))
        d = await svc.compute_ga_detail("22/3/43", _ts(0), _ts(60))
        assert d is not None
        kinds = {f.kind for f in d.findings}
        assert "constant_value" in kinds

    @pytest.mark.asyncio
    async def test_includes_dev_source(self, db: Database) -> None:
        await _insert_knx(db, ts=_ts(0), ga="1/2/3", dev_source="1.1.220")
        svc = KnxStatsService(KnxStatsRepository(db))
        d = await svc.compute_ga_detail("1/2/3", _ts(0), _ts(60))
        assert d is not None
        assert d.dev_source == "1.1.220"

    @pytest.mark.asyncio
    async def test_lists_sibling_gas_same_source(self, db: Database) -> None:
        # Geraet 1.1.220 sendet auf 3 GAs
        for i in range(2):
            await _insert_knx(db, ts=_ts(i), ga="22/3/43", dev_source="1.1.220", label="Temp")
        for i in range(5):
            await _insert_knx(
                db, ts=_ts(10 + i), ga="22/3/44", dev_source="1.1.220", label="Feuchte"
            )
        for i in range(3):
            await _insert_knx(
                db, ts=_ts(20 + i), ga="22/3/45", dev_source="1.1.220", label="Taupunkt"
            )
        svc = KnxStatsService(KnxStatsRepository(db))
        d = await svc.compute_ga_detail("22/3/43", _ts(0), _ts(60))
        assert d is not None
        # 22/3/43 ist nicht in siblings, aber 22/3/44 und 22/3/45
        gas = {s.ga for s in d.sibling_gas}
        assert gas == {"22/3/44", "22/3/45"}

    @pytest.mark.asyncio
    async def test_value_history_capped_at_200_points(self, db: Database) -> None:
        for i in range(500):
            await _insert_knx(db, ts=_ts(i / 10), ga="1/2/3", value=i)
        svc = KnxStatsService(KnxStatsRepository(db))
        d = await svc.compute_ga_detail("1/2/3", _ts(0), _ts(60))
        assert d is not None
        assert len(d.value_history) <= 200
        # erste Werte chronologisch
        assert d.value_history[0]["value"] in (0, "0")
