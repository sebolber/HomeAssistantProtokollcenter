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
        # 5% repeats -> repeat_health = 100 - 5*10 = 50, gewichtet 30%
        # final = 0.30*50 + 0.30*100 + 0.20*100 + 0.20*100 = 15+30+20+20 = 85
        assert result["score"] == 85
        assert result["severity"] == "yellow"
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
        # 30% busload -> health = 100 - 30*2 = 40
        # final = 0.30*100 + 0.30*40 + 0.20*100 + 0.20*100 = 30+12+20+20 = 82
        assert result["score"] == 82
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
        # 3 silent -> health = 100 - 3*10 = 70, gewichtet 20%
        # final = 0.30*100 + 0.30*100 + 0.20*70 + 0.20*100 = 30+30+14+20 = 94
        assert result["score"] == 94
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
        # 4 alarms -> health = 100 - 4*5 = 80, gewichtet 20%
        # final = 0.30*100 + 0.30*100 + 0.20*100 + 0.20*80 = 30+30+20+16 = 96
        assert result["score"] == 96
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
        # Boundary an der Yellow/Green-Grenze: alarm-Komponente hat
        # genug Granularitaet (Limit 20) um exakte Score-Punkte zu treffen.
        # 0.30*100+0.30*100+0.20*100+0.20*alarm_health = 80 + 0.2*alarm_health
        # 10 Alarme -> alarm_health = 50 -> score = 80+10 = 90 (green)
        # 11 Alarme -> alarm_health = 45 -> score = 80+9  = 89 (yellow)
        for alarms, expected_score, expected_sev in [
            (10, 90, "green"),
            (11, 89, "yellow"),
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
        # Repeat ratio = 50% >> limit 10% -> repeat-component=0
        # Buslast bei 10 Telegrammen in 60min = 0.17/min, sehr niedrig -> 100
        # Stille: 1 device hat letzte Tel < 120min ago -> kein Alarm
        # Alarme: 0
        # Score = 0.30*0 + 0.30*100 + 0.20*100 + 0.20*100 = 70
        assert result["score"] == 70
        assert result["severity"] == "yellow"
        codes = [f["code"] for f in result["findings"]]
        assert "high-repeat-rate" in codes
