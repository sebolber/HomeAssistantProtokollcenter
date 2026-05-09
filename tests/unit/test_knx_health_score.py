"""Iter 37 (Feature K): Bus-Health-Score 0-100.

Aggregiert die bestehenden KPIs (Wiederhol-Quote, Buslast-Spitze,
Stille-Geraete, offene Alarme) zu einem Single-Glance-Score mit
Befunden. Reine Funktion ohne IO — testbar pro Komponente.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_stats import (
    HealthFinding,
    HealthScoreInput,
    compute_health_score,
)
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


class TestComputeHealthScorePure:
    def test_perfect_health_returns_100_green_no_findings(self) -> None:
        result = compute_health_score(
            HealthScoreInput(
                repeat_ratio_pct=0.0,
                busload_max_pct=0.0,
                silent_devices=0,
                open_alarms=0,
            )
        )
        assert result["score"] == 100
        assert result["severity"] == "green"
        assert result["findings"] == []
        assert result["components"] == {
            "repeat": 100,
            "busload": 100,
            "silence": 100,
            "alarms": 100,
        }

    def test_high_repeat_rate_drops_score_and_emits_finding(self) -> None:
        result = compute_health_score(
            HealthScoreInput(
                repeat_ratio_pct=5.0,
                busload_max_pct=0.0,
                silent_devices=0,
                open_alarms=0,
            )
        )
        # Iter B3: weights {repeat: 0.10, busload: 0.40, silence: 0.25, alarms: 0.25}
        # 5% repeats -> repeat_health = 100 - 5*10 = 50, gewichtet 0.10
        # final = 0.10*50 + 0.40*100 + 0.25*100 + 0.25*100 = 5+40+25+25 = 95
        assert result["score"] == 95
        assert result["severity"] == "green"
        codes = [f["code"] for f in result["findings"]]
        assert "high-repeat-rate" in codes

    def test_high_busload_drops_score(self) -> None:
        result = compute_health_score(
            HealthScoreInput(
                repeat_ratio_pct=0.0,
                busload_max_pct=30.0,
                silent_devices=0,
                open_alarms=0,
            )
        )
        # 30% busload -> health = 100 - 30*2 = 40, gewichtet 0.40
        # final = 0.10*100 + 0.40*40 + 0.25*100 + 0.25*100 = 10+16+25+25 = 76
        assert result["score"] == 76
        assert result["severity"] == "yellow"
        codes = [f["code"] for f in result["findings"]]
        assert "high-busload" in codes

    def test_silent_devices_drop_score(self) -> None:
        result = compute_health_score(
            HealthScoreInput(
                repeat_ratio_pct=0.0,
                busload_max_pct=0.0,
                silent_devices=3,
                open_alarms=0,
            )
        )
        # 3 silent -> health = 100 - 3*10 = 70, gewichtet 0.25
        # final = 0.10*100 + 0.40*100 + 0.25*70 + 0.25*100 = 10+40+17.5+25 = 92.5 → 93 (rounded)
        # Tatsaechlich: round-Halb-Banker => 92 oder 93 je Implementation; round() nutzt banker's,
        # 92.5 → 92.
        assert result["score"] == 92
        assert result["severity"] == "green"
        codes = [f["code"] for f in result["findings"]]
        assert "silent-devices" in codes

    def test_open_alarms_drop_score(self) -> None:
        result = compute_health_score(
            HealthScoreInput(
                repeat_ratio_pct=0.0,
                busload_max_pct=0.0,
                silent_devices=0,
                open_alarms=4,
            )
        )
        # 4 alarms -> health = 100 - 4*5 = 80, gewichtet 0.25
        # final = 0.10*100 + 0.40*100 + 0.25*100 + 0.25*80 = 10+40+25+20 = 95
        assert result["score"] == 95
        assert result["severity"] == "green"
        codes = [f["code"] for f in result["findings"]]
        assert "open-alarms" in codes

    def test_combined_critical_returns_red(self) -> None:
        # Worst-Case: 10% repeats, 50% busload, 10 stumme, 20 Alarme
        # alle Komponenten -> 0
        result = compute_health_score(
            HealthScoreInput(
                repeat_ratio_pct=10.0,
                busload_max_pct=50.0,
                silent_devices=10,
                open_alarms=20,
            )
        )
        assert result["score"] == 0
        assert result["severity"] == "red"
        codes = {f["code"] for f in result["findings"]}
        assert codes == {"high-repeat-rate", "high-busload", "silent-devices", "open-alarms"}

    def test_components_clamp_at_zero(self) -> None:
        # > Limits sollten clampen, nicht negativ werden
        result = compute_health_score(
            HealthScoreInput(
                repeat_ratio_pct=99.0,  # weit ueber Limit 10%
                busload_max_pct=200.0,  # weit ueber Limit 50%
                silent_devices=999,
                open_alarms=999,
            )
        )
        assert result["score"] == 0
        assert all(c == 0 for c in result["components"].values())

    def test_score_severity_thresholds(self) -> None:
        # Iter B3 weights: 0.10*100+0.40*100+0.25*100+0.25*alarm_health
        # = 75 + 0.25*alarm_health.
        # alarms=8 -> alarm_health=60 -> score=75+15=90 (green)
        # alarms=12 -> alarm_health=40 -> score=75+10=85 (yellow)
        for alarms, expected_score, expected_sev in [
            (8, 90, "green"),
            (12, 85, "yellow"),
        ]:
            r = compute_health_score(
                HealthScoreInput(
                    repeat_ratio_pct=0.0,
                    busload_max_pct=0.0,
                    silent_devices=0,
                    open_alarms=alarms,
                )
            )
            assert r["score"] == expected_score
            assert r["severity"] == expected_sev


class TestHealthFindingShape:
    def test_finding_has_severity_code_message(self) -> None:
        result = compute_health_score(
            HealthScoreInput(
                repeat_ratio_pct=2.0,
                busload_max_pct=0.0,
                silent_devices=0,
                open_alarms=0,
            )
        )
        assert len(result["findings"]) == 1
        f: HealthFinding = result["findings"][0]
        assert "severity" in f
        assert "code" in f
        assert "message" in f
        # Message enthaelt den Wert
        assert "2,00" in f["message"] or "2.00" in f["message"]


class TestServiceHealthScoreWiring:
    @pytest.mark.asyncio
    async def test_empty_db_yields_perfect_score(self, db: Database) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.health_score(
            from_iso=_ts(0),
            to_iso=_ts(60),
            now_iso=_ts(60),
            max_silence_minutes=120,
        )
        assert result["score"] == 100
        assert result["severity"] == "green"
        assert result["findings"] == []

    @pytest.mark.asyncio
    async def test_repeated_telegrams_lower_score(self, db: Database) -> None:
        # 5 normal, 5 repeated -> 50% repeat ratio (clamped to limit -> repeat=0)
        for i in range(5):
            await insert_raw_telegram(db, ts=_ts(i), ga="1/2/3", repeated=False)
        for i in range(5):
            await insert_raw_telegram(db, ts=_ts(10 + i), ga="1/2/3", repeated=True)
        svc = KnxStatsService(KnxStatsRepository(db))
        result = await svc.health_score(
            from_iso=_ts(0),
            to_iso=_ts(60),
            now_iso=_ts(60),
            max_silence_minutes=120,
        )
        # Iter B3 weights: 0.10*0 + 0.40*100 + 0.25*100 + 0.25*100 = 90.
        # Repeat-Quote 50% bringt nur noch 10% Score-Verlust statt 30%.
        # Score 90 = grenze gruen/gelb; >= 90 -> green per
        # _SCORE_GREEN_MIN. Repeat-KPI ist Approximation; das Finding
        # ``high-repeat-rate`` bleibt im Output, der User sieht den Hinweis.
        assert result["score"] == 90
        assert result["severity"] == "green"
        codes = [f["code"] for f in result["findings"]]
        assert "high-repeat-rate" in codes
