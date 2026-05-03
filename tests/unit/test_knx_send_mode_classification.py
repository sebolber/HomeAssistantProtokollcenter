"""Iter L1.1: Sende-Modus-Klassifikation.

Testet sowohl den Repository-Pfad (`samples_for_ga_classification`)
als auch die reine Klassifikations-Heuristik
(`classify_send_mode` + Helpers). Repo-Tests mit echter SQLite,
Klassifikations-Tests pure-data.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_recommend_service import (
    CYCLIC_REGULARITY_MAX_RATIO,
    SEND_MODE_HIGH_CONFIDENCE_THRESHOLD,
    SEND_MODE_INSUFFICIENT_THRESHOLD,
    classify_send_mode,
    count_value_changes,
    intervals_from_timestamps,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner


# ---------------------------------------------------------------------------
# Pure-Data-Tests fuer die Helpers
# ---------------------------------------------------------------------------


class TestIntervalsFromTimestamps:
    def test_empty_list_returns_empty(self) -> None:
        assert intervals_from_timestamps([]) == []

    def test_single_timestamp_returns_empty(self) -> None:
        assert intervals_from_timestamps(["2026-05-03T08:00:00"]) == []

    def test_two_timestamps_one_interval(self) -> None:
        result = intervals_from_timestamps(
            ["2026-05-03T08:00:00", "2026-05-03T08:00:30"]
        )
        assert result == [30.0]

    def test_unsorted_input_is_sorted(self) -> None:
        result = intervals_from_timestamps(
            ["2026-05-03T08:00:30", "2026-05-03T08:00:00"]
        )
        assert result == [30.0]

    def test_duplicate_timestamps_yield_zero_interval(self) -> None:
        result = intervals_from_timestamps(
            ["2026-05-03T08:00:00", "2026-05-03T08:00:00"]
        )
        assert result == [0.0]


class TestCountValueChanges:
    def test_empty_iterable(self) -> None:
        assert count_value_changes([]) == 0

    def test_single_value_no_changes(self) -> None:
        assert count_value_changes(["1"]) == 0

    def test_all_identical_no_changes(self) -> None:
        assert count_value_changes(["1", "1", "1", "1"]) == 0

    def test_alternating_values_count_changes(self) -> None:
        assert count_value_changes(["0", "1", "0", "1"]) == 3

    def test_null_values_skipped(self) -> None:
        # NULL zwischen identischen Werten -> kein Change-Counter-Tick.
        assert count_value_changes(["1", None, "1"]) == 0

    def test_json_decoded_for_comparison(self) -> None:
        # Whitespace-Differenzen im JSON-Encoding duerfen nicht zaehlen.
        assert count_value_changes(['{"a": 1}', '{"a":1}']) == 0


# ---------------------------------------------------------------------------
# Klassifikation
# ---------------------------------------------------------------------------


class TestClassifySendMode:
    def test_zero_telegrams_returns_silent(self) -> None:
        result = classify_send_mode([], sample_count=0, value_changes=0)
        assert result.mode == "silent"
        assert result.confidence == "high"
        assert result.median_interval_s is None

    def test_few_telegrams_returns_insufficient(self) -> None:
        result = classify_send_mode(
            [60.0] * 4, sample_count=5, value_changes=0
        )
        assert result.mode == "insufficient"
        assert result.confidence == "low"
        assert result.median_interval_s == 60.0

    def test_regular_intervals_classify_as_cyclic(self) -> None:
        # 60-Sekunden-Zyklus mit minimaler Streuung
        intervals = [60.0, 60.5, 59.8, 60.2, 60.1] * 7  # 35 Intervalle
        result = classify_send_mode(
            intervals, sample_count=36, value_changes=0
        )
        assert result.mode == "cyclic"
        assert result.confidence == "high"
        assert result.median_interval_s is not None
        assert 59 < result.median_interval_s < 61

    def test_irregular_with_value_changes_returns_on_change(self) -> None:
        # Realistisches on_change: kurze Reaktions-Bursts mit langen
        # Pausen dazwischen (z. B. Bewegungsmelder). Damit p95/median
        # > 10 belastbar ist, muss die Stichprobe einen relevanten
        # Anteil langer Intervalle enthalten — sonst trifft p95 noch
        # die kurzen Werte.
        intervals = [1.0, 2.0, 3.0, 1.5, 2.5] * 4 + [3600.0] * 6
        result = classify_send_mode(
            intervals, sample_count=27, value_changes=25
        )
        assert result.mode == "on_change"

    def test_hybrid_when_no_clear_pattern(self) -> None:
        # Mittlere Streuung, wenige Wertwechsel - weder cyclic noch on_change.
        intervals = [10.0, 30.0, 50.0, 80.0, 20.0, 40.0, 60.0, 90.0] * 4
        result = classify_send_mode(
            intervals, sample_count=33, value_changes=5
        )
        assert result.mode == "hybrid"

    def test_high_confidence_threshold_pinned(self) -> None:
        """Pinning-Test: > 30 Telegramme gibt 'high' Konfidenz."""
        intervals = [60.0] * (SEND_MODE_HIGH_CONFIDENCE_THRESHOLD)
        result = classify_send_mode(
            intervals,
            sample_count=SEND_MODE_HIGH_CONFIDENCE_THRESHOLD + 1,
            value_changes=0,
        )
        assert result.confidence == "high"

    def test_medium_confidence_just_below_high_threshold(self) -> None:
        intervals = [60.0] * 20
        result = classify_send_mode(
            intervals, sample_count=21, value_changes=0
        )
        # 21 < 30 -> medium; > 10 -> nicht insufficient
        assert result.confidence == "medium"
        assert result.mode == "cyclic"

    def test_insufficient_threshold_pinned(self) -> None:
        result = classify_send_mode(
            [60.0] * 8,
            sample_count=SEND_MODE_INSUFFICIENT_THRESHOLD - 1,
            value_changes=0,
        )
        assert result.mode == "insufficient"

    def test_zero_median_falls_back_to_hybrid(self) -> None:
        # Alle Telegramme zur gleichen Zeit -> median=0.
        intervals = [0.0] * 20
        result = classify_send_mode(
            intervals, sample_count=21, value_changes=10
        )
        assert result.mode == "hybrid"

    def test_median_interval_minutes_property(self) -> None:
        intervals = [60.0] * 35
        result = classify_send_mode(
            intervals, sample_count=36, value_changes=0
        )
        assert result.median_interval_s == 60.0
        assert result.median_interval_minutes == 1.0


# ---------------------------------------------------------------------------
# Repository-Pfad mit echter SQLite
# ---------------------------------------------------------------------------


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


def _ts(offset_s: float, *, base: datetime | None = None) -> str:
    base_dt = base or datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return (base_dt + timedelta(seconds=offset_s)).isoformat(timespec="seconds")


async def _insert_raw(
    db: Database, *, ga: str, ts: str, value: object = 1
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (ts, ga, "1.1.10", "GroupValueWrite", json.dumps(value), 0),
    )


class TestSamplesForGaClassification:
    @pytest.mark.asyncio
    async def test_empty_ga_returns_empty(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        result = await repo.samples_for_ga_classification(
            "", _ts(-3600), _ts(0)
        )
        assert result == []

    @pytest.mark.asyncio
    async def test_no_telegrams_returns_empty(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        result = await repo.samples_for_ga_classification(
            "1/2/3", _ts(-3600), _ts(0)
        )
        assert result == []

    @pytest.mark.asyncio
    async def test_returns_chronological_order(self, db: Database) -> None:
        # Insertion-Order: rueckwaerts; Lieferung soll vorwaerts sein.
        await _insert_raw(db, ga="1/2/3", ts=_ts(50), value=3)
        await _insert_raw(db, ga="1/2/3", ts=_ts(0), value=1)
        await _insert_raw(db, ga="1/2/3", ts=_ts(25), value=2)
        repo = KnxStatsRepository(db)
        result = await repo.samples_for_ga_classification(
            "1/2/3", _ts(-1), _ts(100)
        )
        timestamps = [r["timestamp"] for r in result]
        assert timestamps == sorted(timestamps)

    @pytest.mark.asyncio
    async def test_only_returns_telegrams_in_period(
        self, db: Database
    ) -> None:
        await _insert_raw(db, ga="1/2/3", ts=_ts(-7200), value=1)  # vor Periode
        await _insert_raw(db, ga="1/2/3", ts=_ts(0), value=1)
        await _insert_raw(db, ga="1/2/3", ts=_ts(60), value=1)
        await _insert_raw(db, ga="1/2/3", ts=_ts(7200), value=1)  # nach Periode
        repo = KnxStatsRepository(db)
        result = await repo.samples_for_ga_classification(
            "1/2/3", _ts(-1), _ts(120)
        )
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_does_not_return_other_gas(self, db: Database) -> None:
        await _insert_raw(db, ga="1/2/3", ts=_ts(0))
        await _insert_raw(db, ga="9/9/9", ts=_ts(30))
        repo = KnxStatsRepository(db)
        result = await repo.samples_for_ga_classification(
            "1/2/3", _ts(-1), _ts(60)
        )
        assert len(result) == 1
        assert json.loads(result[0]["value"]) == 1

    @pytest.mark.asyncio
    async def test_hard_cap_respected(self, db: Database) -> None:
        for i in range(150):
            await _insert_raw(db, ga="1/2/3", ts=_ts(i))
        repo = KnxStatsRepository(db)
        result = await repo.samples_for_ga_classification(
            "1/2/3", _ts(-1), _ts(300), limit=50
        )
        assert len(result) == 50

    @pytest.mark.asyncio
    async def test_hard_cap_clamped_to_safety_max(
        self, db: Database
    ) -> None:
        """Caller darf keinen unbegrenzten Limit setzen — interner
        Ceiling auf 50 000 schuetzt vor Memory-Blowup."""
        repo = KnxStatsRepository(db)
        # Smoke-Lauf: limit jenseits des Caps darf keinen Fehler werfen.
        result = await repo.samples_for_ga_classification(
            "1/2/3", _ts(-1), _ts(60), limit=10_000_000
        )
        assert result == []  # leere Tabelle, aber kein Crash
