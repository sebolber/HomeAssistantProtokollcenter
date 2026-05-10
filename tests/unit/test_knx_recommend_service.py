"""Iter L1.2: DeviceRecommendationService.

E2E auf Service-Ebene: echte SQLite, echtes Repository,
``compute_device_recommendation`` aufgerufen — assertions auf das
DTO. Keine HTTP-Schicht (kommt in L1.3).
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_recommend_service import (
    compute_device_recommendation,
    device_recommendation_to_dict,
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


async def _insert_ga(db: Database, *, ga: str, dpt: str | None, label: str = "GA") -> None:
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (ga, label, dpt, now, now),
    )


async def _insert_telegram(
    db: Database,
    *,
    ga: str,
    ts: str,
    source: str = "1.1.10",
    value: object = 1,
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (ts, ga, source, "GroupValueWrite", json.dumps(value), 0),
    )


async def _seed_cyclic_temperature(db: Database, *, ga: str, source: str = "1.1.10") -> None:
    """Sender simuliert: alle 60 s identische 21.5 deg, > 30 Telegramme."""
    await _insert_ga(db, ga=ga, dpt="9.001", label="Wohnzimmer Temperatur")
    for i in range(40):
        await _insert_telegram(db, ga=ga, ts=_ts(-3600 + i * 60), source=source, value=21.5)


async def _seed_on_change_switch(db: Database, *, ga: str, source: str = "1.1.10") -> None:
    """Schalt-GA mit langen Pausen + Wertwechsel."""
    await _insert_ga(db, ga=ga, dpt="1.001", label="Wohnzimmer Licht")
    base = -86400  # 24 h zurueck
    pattern = [
        (10, 1),
        (20, 0),  # Burst
        (3600, 1),
        (3700, 0),  # 1h Pause
        (7200, 1),
        (7300, 0),
        (10800, 1),
        (10900, 0),
        (14400, 1),
        (14500, 0),
        (18000, 1),
        (18100, 0),
    ]
    for offset, val in pattern:
        await _insert_telegram(db, ga=ga, ts=_ts(base + offset), source=source, value=val)


class TestComputeDeviceRecommendation:
    @pytest.mark.asyncio
    async def test_unknown_source_returns_none(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        result = await compute_device_recommendation(repo, "9.9.9", _ts(-86400), _ts(0))
        assert result is None

    @pytest.mark.asyncio
    async def test_empty_source_returns_none(self, db: Database) -> None:
        repo = KnxStatsRepository(db)
        result = await compute_device_recommendation(repo, "", _ts(-86400), _ts(0))
        assert result is None

    @pytest.mark.asyncio
    async def test_cyclic_temperature_flagged_as_deviation_to_hybrid(self, db: Database) -> None:
        """Konstante 21.5 deg alle 60 s → cyclic. DPT 9.001 empfiehlt
        hybrid → severity=warn (cyclic vs hybrid)."""
        await _seed_cyclic_temperature(db, ga="1/2/3")
        repo = KnxStatsRepository(db)

        result = await compute_device_recommendation(repo, "1.1.10", _ts(-3700), _ts(60))

        assert result is not None
        assert result.dev_source == "1.1.10"
        assert len(result.ga_recommendations) == 1
        ga = result.ga_recommendations[0]
        assert ga.ga == "1/2/3"
        assert ga.observed.mode == "cyclic"
        assert ga.recommended_mode == "hybrid"
        assert ga.severity == "warn"
        assert ga.recommended_cycle_minutes == (5, 15)
        assert ga.recommended_hysteresis is not None
        assert ga.rationale is not None
        # Iter UX-6: dpt_standard ist die Quelle (kein Modell-Override
        # in diesem Test, kein LLM-Fallback noetig).
        assert ga.source == "dpt_standard"

    @pytest.mark.asyncio
    async def test_on_change_switch_matches_recommendation(self, db: Database) -> None:
        """Schalt-GA mit Wertwechsel → on_change. DPT 1.001 empfiehlt
        on_change → severity=ok."""
        await _seed_on_change_switch(db, ga="1/2/3")
        repo = KnxStatsRepository(db)

        result = await compute_device_recommendation(repo, "1.1.10", _ts(-86400), _ts(0))

        assert result is not None
        ga = result.ga_recommendations[0]
        # Mit 12 Telegrammen + Pausen: kann hybrid oder on_change sein,
        # entscheidend ist nur, dass die Empfehlung "on_change" ist.
        assert ga.recommended_mode == "on_change"

    @pytest.mark.asyncio
    async def test_silent_source_when_no_recent_telegrams(self, db: Database) -> None:
        """GA in Whitelist aber keine Telegramme im Periode -> beim
        gas_for_source-Aufruf (Live-Quelle) werden gar keine GAs
        zurueckgegeben — Service liefert None."""
        await _insert_ga(db, ga="1/2/3", dpt="1.001")
        repo = KnxStatsRepository(db)

        result = await compute_device_recommendation(repo, "1.1.10", _ts(-86400), _ts(0))
        assert result is None

    @pytest.mark.asyncio
    async def test_multi_ga_aggregation_reasoning(self, db: Database) -> None:
        """Wetterstation-Profil: 3 GAs (Temp/Lux/Wind), alle hybrid-DPT,
        alle senden cyclic → 3 deviations, headline reflektiert das."""
        await _insert_ga(db, ga="1/2/3", dpt="9.001", label="Temp")
        await _insert_ga(db, ga="1/2/4", dpt="9.004", label="Lux")
        await _insert_ga(db, ga="1/2/5", dpt="9.005", label="Wind")
        for ga, value in (("1/2/3", 21.5), ("1/2/4", 250), ("1/2/5", 3.2)):
            for i in range(40):
                await _insert_telegram(db, ga=ga, ts=_ts(-3600 + i * 60), value=value)
        repo = KnxStatsRepository(db)

        result = await compute_device_recommendation(repo, "1.1.10", _ts(-3700), _ts(60))

        assert result is not None
        assert len(result.ga_recommendations) == 3
        assert result.headline_mode == "cyclic"
        # Alle 3 GAs sollten Deviation/Warn sein
        deviations = [r for r in result.ga_recommendations if r.severity != "ok"]
        assert len(deviations) == 3
        # Reasoning enthaelt mind. den DPT-Layer-Eintrag
        assert any("dpt_standard" in r for r in result.reasoning)

    @pytest.mark.asyncio
    async def test_unknown_dpt_no_recommendation_info_severity(self, db: Database) -> None:
        await _insert_ga(db, ga="1/2/3", dpt="99.999", label="Unbekannt")
        for i in range(40):
            await _insert_telegram(db, ga="1/2/3", ts=_ts(-3600 + i * 60), value=1)
        repo = KnxStatsRepository(db)

        result = await compute_device_recommendation(repo, "1.1.10", _ts(-3700), _ts(60))

        assert result is not None
        ga = result.ga_recommendations[0]
        assert ga.recommended_mode is None
        assert ga.severity == "info"

    @pytest.mark.asyncio
    async def test_dto_serialization_roundtrip(self, db: Database) -> None:
        """device_recommendation_to_dict liefert ein vollstaendiges
        JSON-serialisierbares Dict (Schema-Contract fuer Frontend)."""
        await _seed_cyclic_temperature(db, ga="1/2/3")
        repo = KnxStatsRepository(db)
        result = await compute_device_recommendation(repo, "1.1.10", _ts(-3700), _ts(60))
        assert result is not None

        as_dict = device_recommendation_to_dict(result)
        # Round-Trip durch JSON garantiert keine non-serialisierbaren Felder.
        encoded = json.dumps(as_dict)
        decoded = json.loads(encoded)
        assert decoded["dev_source"] == "1.1.10"
        assert decoded["headline_mode"] == "cyclic"
        assert "headline_recommendation" in decoded
        assert decoded["confidence"] in ("high", "medium", "low")
        assert isinstance(decoded["reasoning"], list)
        assert isinstance(decoded["ga_recommendations"], list)
        assert len(decoded["ga_recommendations"]) == 1
        ga_dict = decoded["ga_recommendations"][0]
        # Pruefen aller wichtigen Schluessel — Frontend-Vertrag
        for key in (
            "ga",
            "label",
            "dpt",
            "observed",
            "recommended_mode",
            "recommended_cycle_minutes",
            "recommended_hysteresis",
            "severity",
            "rationale",
            "source",
        ):
            assert key in ga_dict
        for key in (
            "mode",
            "confidence",
            "sample_count",
            "value_changes",
            "median_interval_s",
            "median_interval_minutes",
        ):
            assert key in ga_dict["observed"]

    @pytest.mark.asyncio
    async def test_generated_at_is_iso_string(self, db: Database) -> None:
        await _seed_cyclic_temperature(db, ga="1/2/3")
        repo = KnxStatsRepository(db)
        result = await compute_device_recommendation(repo, "1.1.10", _ts(-3700), _ts(60))
        assert result is not None
        # iso-Format mit Sekunden, naive oder aware
        datetime.fromisoformat(result.generated_at)

    @pytest.mark.asyncio
    async def test_confidence_is_low_when_any_ga_low(self, db: Database) -> None:
        """Pessimist-Aggregation: eine GA mit < 10 Telegrammen drueckt
        die Geraets-Konfidenz auf low, auch wenn andere GAs high sind."""
        # GA 1: 40 Telegramme (high)
        await _insert_ga(db, ga="1/2/3", dpt="9.001")
        for i in range(40):
            await _insert_telegram(db, ga="1/2/3", ts=_ts(-3600 + i * 60))
        # GA 2: 5 Telegramme (low)
        await _insert_ga(db, ga="1/2/4", dpt="9.001")
        for i in range(5):
            await _insert_telegram(db, ga="1/2/4", ts=_ts(-300 + i * 60))
        repo = KnxStatsRepository(db)

        result = await compute_device_recommendation(repo, "1.1.10", _ts(-3700), _ts(60))

        assert result is not None
        # GA 2 ist insufficient, GA 1 ist cyclic — Konfidenz wird low,
        # weil GA 2 die schwaechste Konfidenz hat.
        assert result.confidence == "low"
