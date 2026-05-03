"""Iter L3.0: Layer-3-Buslast-Override im Service-Lauf."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_recommend_service import (
    BUSLOAD_OVERRIDE_FACTOR,
    BUSLOAD_OVERRIDE_THRESHOLD_PCT,
    _apply_busload_override,
    compute_device_recommendation,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner


_NOW = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


def _ts(offset_s: float) -> str:
    return (_NOW + timedelta(seconds=offset_s)).isoformat(timespec="seconds")


# ---------------------------------------------------------------------------
# _apply_busload_override (Pure-Logic-Tests)
# ---------------------------------------------------------------------------


def _build_ga_reco(
    cycle: tuple[int, int] | None = (5, 15),
) -> object:
    from custom_components.messagehub.processing.knx_recommend_service import (
        GaRecommendation,
        SendModeObservation,
    )
    obs = SendModeObservation(
        mode="cyclic",
        confidence="high",
        sample_count=40,
        value_changes=0,
        median_interval_s=60.0,
        stdev_interval_s=1.0,
    )
    return GaRecommendation(
        ga="1/2/3",
        label="test",
        dpt="9.001",
        observed=obs,
        recommended_mode="hybrid",
        recommended_cycle_minutes=cycle,
        recommended_hysteresis=">= 0.2 K",
        severity="warn",
        rationale="...",
    )


class TestApplyBusloadOverride:
    def test_below_threshold_returns_unchanged(self) -> None:
        ga = _build_ga_reco((5, 15))
        result, flag = _apply_busload_override(
            [ga], avg_busload_pct=BUSLOAD_OVERRIDE_THRESHOLD_PCT - 0.01
        )
        assert flag is False
        assert result[0].recommended_cycle_minutes == (5, 15)  # type: ignore[union-attr]

    def test_above_threshold_extends_cycle_by_factor(self) -> None:
        ga = _build_ga_reco((10, 20))
        result, flag = _apply_busload_override(
            [ga], avg_busload_pct=35.0
        )
        assert flag is True
        new_min, new_max = result[0].recommended_cycle_minutes  # type: ignore[union-attr]
        assert new_min == round(10 * BUSLOAD_OVERRIDE_FACTOR)  # 15
        assert new_max == round(20 * BUSLOAD_OVERRIDE_FACTOR)  # 30

    def test_no_cycle_minutes_passthrough(self) -> None:
        ga = _build_ga_reco(None)
        result, flag = _apply_busload_override(
            [ga], avg_busload_pct=99.0
        )
        # on_change-Empfehlungen ohne Zyklus bleiben unangetastet,
        # flag bleibt False (kein eigentliches Override).
        assert flag is False
        assert result[0].recommended_cycle_minutes is None  # type: ignore[union-attr]

    def test_min_floor_at_one(self) -> None:
        """Cycle-Minute kleiner als 1 ist sinnlos — Floor auf 1."""
        # Setze cycle = (1, 1), Faktor 1.5 → round 1.5=2 jeweils.
        ga = _build_ga_reco((1, 1))
        result, _flag = _apply_busload_override(
            [ga], avg_busload_pct=50.0
        )
        new_min, new_max = result[0].recommended_cycle_minutes  # type: ignore[union-attr]
        assert new_min >= 1
        assert new_max >= new_min

    def test_max_not_below_min_after_rounding(self) -> None:
        ga = _build_ga_reco((1, 2))
        result, _flag = _apply_busload_override(
            [ga], avg_busload_pct=50.0
        )
        new_min, new_max = result[0].recommended_cycle_minutes  # type: ignore[union-attr]
        assert new_max >= new_min


# ---------------------------------------------------------------------------
# Service-Roundtrip mit echter SQLite + Buslast
# ---------------------------------------------------------------------------


async def _seed_temperature(
    db: Database, *, ga: str, source: str, in_seconds: int = 3600
) -> None:
    """Seedet 40 Tel auf einer GA, gleichmaessig verteilt im
    ``in_seconds``-Fenster vor _NOW."""
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (ga, "Temp", "9.001", now, now),
    )
    step = in_seconds / 40
    for i in range(40):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-in_seconds + i * step), ga, source,
                "GroupValueWrite", json.dumps(21.5), 0,
            ),
        )


async def _seed_high_busload(
    db: Database, *, total_seconds: int = 60, count: int = 1500,
) -> None:
    """Massive Telegramm-Last gleichmaessig ueber ``total_seconds`` Sekunden.

    Bei count=1500 / 60 s = 25 Tel/s → ~104 % Buslast, geclippt auf
    100 %. Pro 10 s-Bucket also 250 Tel = 100 % avg.
    """
    if count <= 0 or total_seconds <= 0:
        return
    step = total_seconds / count
    for i in range(count):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-total_seconds + i * step), "9/9/9", "1.1.99",
                "GroupValueWrite", json.dumps(0), 0,
            ),
        )


@pytest.mark.asyncio
async def test_low_busload_no_layer3_reasoning(db: Database) -> None:
    await _seed_temperature(db, ga="1/2/3", source="1.1.10")
    repo = KnxStatsRepository(db)
    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-3700), _ts(60)
    )
    assert reco is not None
    assert not any("Layer 3" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_high_busload_extends_cycle_and_adds_reasoning(
    db: Database,
) -> None:
    # Beides im 60-s-Fenster, damit gas_for_source GA findet UND
    # avg-Buslast > 30 %.
    await _seed_temperature(
        db, ga="1/2/3", source="1.1.10", in_seconds=60
    )
    await _seed_high_busload(db, total_seconds=60, count=1500)
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-60), _ts(1)
    )

    assert reco is not None
    # Reasoning enthaelt Layer-3-Marker
    assert any("Layer 3" in r for r in reco.reasoning)
    assert any("Bus-Avg-Last" in r for r in reco.reasoning)
    # Cycle ist verlaengert (vorher 5-15 fuer DPT 9.001 → > 5-15)
    ga = reco.ga_recommendations[0]
    assert ga.recommended_cycle_minutes is not None
    new_min, new_max = ga.recommended_cycle_minutes
    assert new_min > 5
    assert new_max > 15


@pytest.mark.asyncio
async def test_busload_override_keeps_recommended_mode(
    db: Database,
) -> None:
    """Layer 3 modifiziert den Cycle, NICHT den Modus."""
    await _seed_temperature(
        db, ga="1/2/3", source="1.1.10", in_seconds=60
    )
    await _seed_high_busload(db, total_seconds=60, count=1500)
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-60), _ts(1)
    )
    assert reco is not None
    ga = reco.ga_recommendations[0]
    # Modus bleibt "hybrid" (Layer 1 fuer DPT 9.001), wird nicht
    # durch Layer 3 ueberschrieben.
    assert ga.recommended_mode == "hybrid"
