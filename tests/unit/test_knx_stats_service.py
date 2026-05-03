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
    async def test_marks_has_findings_for_constant_value_spam_iter63(
        self, db: Database
    ) -> None:
        # Iter 63 / U13: Hoermann-Tor sendet wiederholt DPT-9.x = 0
        # (Konstant-Wert-Spam) — TopRow.has_findings soll True sein.
        # Kein DPT vom ETS, Werte alle 0.0 (Float, also 9.x).
        for i in range(20):
            await _insert_knx(
                db, ts=_ts(i), ga="22/3/43", dpt=None, value=0.0
            )
        # Vergleichs-GA mit variierenden Werten: keine Findings.
        for i in range(20):
            await _insert_knx(
                db, ts=_ts(i), ga="1/3/5", dpt="9.001", value=21.5 + i * 0.1
            )
        svc = KnxStatsService(KnxStatsRepository(db))
        rows = await svc.compute_top(_ts(0), _ts(60), limit=10)
        by_ga = {r.ga: r for r in rows}
        assert by_ga["22/3/43"].has_findings is True
        assert by_ga["1/3/5"].has_findings is False

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


class TestComputeHeatmap:
    @pytest.mark.asyncio
    async def test_returns_empty_when_no_telegrams(self, db: Database) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.compute_heatmap(_ts(0), _ts(60))
        assert result["gas"] == []
        assert result["buckets"] == []
        assert result["matrix"] == []

    @pytest.mark.asyncio
    async def test_includes_top_gas_with_label_and_total(self, db: Database) -> None:
        # GA "5/2/14" mit 100 Telegrammen, "1/3/5" mit 30, "9/9/9" mit 5.
        for i in range(100):
            await _insert_knx(db, ts=_ts(i / 2), ga="5/2/14")
        for i in range(30):
            await _insert_knx(db, ts=_ts(i), ga="1/3/5")
        for i in range(5):
            await _insert_knx(db, ts=_ts(i * 5), ga="9/9/9")

        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.compute_heatmap(_ts(0), _ts(60), top_n=2, bucket_minutes=10)
        # Nur Top-2: 5/2/14 + 1/3/5 (9/9/9 ist drittstaerkster).
        assert len(result["gas"]) == 2
        ga_codes = [g["ga"] for g in result["gas"]]
        assert "5/2/14" in ga_codes
        assert "1/3/5" in ga_codes
        assert "9/9/9" not in ga_codes
        assert result["bucket_minutes"] == 10

    @pytest.mark.asyncio
    async def test_matrix_dimensions_match_gas_x_buckets(self, db: Database) -> None:
        for i in range(20):
            await _insert_knx(db, ts=_ts(i * 2), ga="1/0/1")
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.compute_heatmap(_ts(0), _ts(60), top_n=5, bucket_minutes=10)
        assert len(result["matrix"]) == len(result["gas"])
        for row in result["matrix"]:
            assert len(row) == len(result["buckets"])

    @pytest.mark.asyncio
    async def test_top_n_capped_at_30(self, db: Database) -> None:
        # Hard-Cap top_n=30. Mit top_n=999 sollten max 30 zurueckkommen.
        for i in range(50):
            await _insert_knx(db, ts=_ts(0), ga=f"1/0/{i + 1}")
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.compute_heatmap(_ts(0), _ts(60), top_n=999)
        assert len(result["gas"]) <= 30


class TestComputeTrend:
    @pytest.mark.asyncio
    async def test_compares_current_to_previous_period(self, db: Database) -> None:
        # Iter 67 / WR-I: aktuelle Periode 60-120, Vorperiode 0-60.
        # GA "5/2/14": prev=5, now=15 -> delta_abs=+10, delta_pct=+200 %.
        # GA "1/3/5": prev=10, now=10 -> delta_abs=0, kein Anstieg.
        # GA "0/1/1": prev=0, now=8 -> delta_pct=None (neu).
        # GA "9/9/9": prev=12, now=0 -> komplett verstummt.
        for i in range(5):
            await _insert_knx(db, ts=_ts(i), ga="5/2/14")
        for i in range(15):
            await _insert_knx(db, ts=_ts(60 + i), ga="5/2/14")
        for i in range(10):
            await _insert_knx(db, ts=_ts(i), ga="1/3/5")
        for i in range(10):
            await _insert_knx(db, ts=_ts(60 + i), ga="1/3/5")
        for i in range(8):
            await _insert_knx(db, ts=_ts(60 + i), ga="0/1/1")
        for i in range(12):
            await _insert_knx(db, ts=_ts(i), ga="9/9/9")

        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.compute_trend(_ts(60), _ts(120), top_n=5)

        assert result["period_minutes"] == 60
        assert result["total_now"] == 33  # 15+10+8
        assert result["total_prev"] == 27  # 5+10+12

        # Anstiege: groesste delta_abs zuerst.
        ups = result["top_increase"]
        ga_5_2_14 = next(t for t in ups if t["ga"] == "5/2/14")
        assert ga_5_2_14["delta_abs"] == 10
        assert ga_5_2_14["delta_pct"] == 200.0

        # Neuer GA: count_prev=0 -> delta_pct=None
        ga_0_1_1 = next(t for t in ups if t["ga"] == "0/1/1")
        assert ga_0_1_1["count_prev"] == 0
        assert ga_0_1_1["delta_pct"] is None
        assert ga_0_1_1["delta_abs"] == 8

        # Abnahmen: 9/9/9 verstummt komplett.
        downs = result["top_decrease"]
        ga_9_9_9 = next(t for t in downs if t["ga"] == "9/9/9")
        assert ga_9_9_9["count_now"] == 0
        assert ga_9_9_9["count_prev"] == 12
        assert ga_9_9_9["delta_abs"] == -12
        assert ga_9_9_9["delta_pct"] == -100.0

    @pytest.mark.asyncio
    async def test_empty_periods_return_zero(self, db: Database) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.compute_trend(_ts(60), _ts(120))
        assert result["total_now"] == 0
        assert result["total_prev"] == 0
        assert result["total_delta_pct"] is None
        assert result["top_increase"] == []
        assert result["top_decrease"] == []

    @pytest.mark.asyncio
    async def test_top_n_capped(self, db: Database) -> None:
        # 100 GAs in der aktuellen Periode -> top_n=3 darf nur 3 zurueckgeben.
        for i in range(100):
            await _insert_knx(db, ts=_ts(60), ga=f"1/0/{i + 1}")
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.compute_trend(_ts(60), _ts(120), top_n=3)
        assert len(result["top_increase"]) == 3

    @pytest.mark.asyncio
    async def test_long_period_reads_from_counter_not_raw(self, db: Database) -> None:
        """Iter aiohttp-error-ZU9UA / Trend-Fix B+C: bei Perioden >= 48h
        soll compute_trend die Counter-Tabelle benutzen. Test schreibt
        NUR in counter (kein raw) und prueft, dass die Trend-Berechnung
        trotzdem Daten liefert.
        """
        repo = KnxStatsRepository(db)
        base = datetime(2026, 5, 1, 0, 0, 0, tzinfo=UTC)
        # Prev-Periode: tag 1-7, now-Periode: tag 8-14.
        # GA "1/0/1": prev=49 (7 Buckets * 7), now=98 (7 Buckets * 14)
        # GA "1/0/2": prev=35 (7 Buckets * 5), now=0 (verstummt)
        for offset_h in range(7 * 24):
            ts = (base + timedelta(hours=offset_h)).strftime(
                "%Y-%m-%dT%H:00:00"
            )
            if offset_h % 24 == 0:
                for _ in range(7):
                    await repo.increment_counter("1/0/1", ts)
                for _ in range(5):
                    await repo.increment_counter("1/0/2", ts)
        for offset_h in range(7 * 24):
            ts = (base + timedelta(days=7, hours=offset_h)).strftime(
                "%Y-%m-%dT%H:00:00"
            )
            if offset_h % 24 == 0:
                for _ in range(14):
                    await repo.increment_counter("1/0/1", ts)
        from_iso = (base + timedelta(days=7)).isoformat()
        to_iso = (base + timedelta(days=14)).isoformat()
        svc = KnxStatsService(repo)
        result = await svc.compute_trend(from_iso, to_iso, top_n=10)
        # Periode = 7 Tage = 10080 Min, also Counter-Source.
        assert result["period_minutes"] == 10080
        # Wir haben NIE raw geschrieben — wenn Werte da sind, ist es Counter.
        assert result["total_now"] == 98
        assert result["total_prev"] == 49 + 35  # 84
        ups = {t["ga"]: t for t in result["top_increase"]}
        assert ups["1/0/1"]["count_now"] == 98
        assert ups["1/0/1"]["count_prev"] == 49
        assert ups["1/0/1"]["delta_abs"] == 49
        downs = {t["ga"]: t for t in result["top_decrease"]}
        assert downs["1/0/2"]["count_now"] == 0
        assert downs["1/0/2"]["count_prev"] == 35

    @pytest.mark.asyncio
    async def test_short_period_still_reads_from_raw(self, db: Database) -> None:
        """Iter aiohttp-error-ZU9UA / Trend-Fix B+C: bei Perioden < 48h
        soll compute_trend weiter die Raw-Telegramme nutzen. Test
        schreibt NUR raw (keine Counter-Inserts) — wenn das Resultat
        Daten enthaelt, ist raw die Quelle.
        """
        for i in range(10):
            await _insert_knx(db, ts=_ts(70 + i), ga="1/0/1")
        for i in range(5):
            await _insert_knx(db, ts=_ts(10 + i), ga="1/0/1")
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.compute_trend(_ts(60), _ts(120), top_n=10)
        assert result["period_minutes"] == 60
        assert result["total_now"] == 10
        assert result["total_prev"] == 5


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
