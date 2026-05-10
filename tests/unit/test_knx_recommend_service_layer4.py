"""Iter L4.4: End-to-End-Test fuer Layer-4-Pipeline.

Vollstaendiger Round-Trip mit:
- Echter SQLite + Telegrammen
- Geraete-Profil (Layer 2)
- Mock-LLM-Provider (kein echter HTTP-Call)
- Persistenter Cache-Repo
- compute_device_recommendation
- Verifikation: erster Call -> Provider gefragt; zweiter Call ->
  Cache-Hit (kein zweiter Provider-Call)
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from custom_components.messagehub.processing.knx_dpt_recommendations import (
    DptRecommendation,
)
from custom_components.messagehub.processing.knx_recommend_service import (
    compute_device_recommendation,
    device_recommendation_to_dict,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_devices_repo import (
    KnxDeviceRepository,
)
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner
from custom_components.messagehub.storage.recommendation_cache_repo import (
    RecommendationCacheRepository,
)

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


class _CountingProvider:
    """Test-Provider: zaehlt Aufrufe + liefert deterministische Empfehlung."""

    name = "test_provider"

    def __init__(
        self,
        response: DptRecommendation | None,
    ) -> None:
        self.calls: list[dict[str, Any]] = []
        self.response = response

    async def fetch(
        self,
        *,
        dpt: str | None,
        manufacturer: str | None,
        model: str | None,
        context: dict[str, Any],
    ) -> DptRecommendation | None:
        self.calls.append(
            {
                "dpt": dpt,
                "manufacturer": manufacturer,
                "model": model,
                "context": dict(context),
            }
        )
        return self.response


async def _seed_unknown_dpt_telegrams(db: Database) -> None:
    """Geraet mit GA in unbekanntem DPT (99.x) — Layer 1 + 2 koennen
    keine Empfehlung geben → Layer 4 ist der einzige Pfad."""
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        ("1/2/3", "Exotisch", "99.999", now, now),
    )
    for i in range(40):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-3600 + i * 60),
                "1/2/3",
                "1.1.10",
                "GroupValueWrite",
                json.dumps(42),
                0,
            ),
        )


@pytest.mark.asyncio
async def test_layer4_provider_called_when_layers_1_2_have_no_match(
    db: Database,
) -> None:
    """Unbekannter DPT + kein Modell-Override -> Layer 4 wird gefragt."""
    await _seed_unknown_dpt_telegrams(db)
    repo = KnxStatsRepository(db)
    cache_repo = RecommendationCacheRepository(db)
    provider = _CountingProvider(
        DptRecommendation(
            mode="on_change",
            cycle_minutes_min=None,
            cycle_minutes_max=None,
            hysteresis=">= 1 unit",
            max_rate_per_min=1.0,
            rationale="LLM-Vorschlag fuer DPT 99.999.",
        )
    )

    reco = await compute_device_recommendation(
        repo,
        "1.1.10",
        _ts(-3700),
        _ts(60),
        llm_provider=provider,
        llm_cache_repo=cache_repo,
        llm_provider_name="test_provider",
        llm_model="gpt-test",
    )

    assert reco is not None
    assert provider.calls == [
        {
            "dpt": "99.999",
            "manufacturer": None,
            "model": None,
            "context": {
                "observed_mode": "cyclic",
                "median_interval_minutes": 1.0,
                "sample_count": 40,
            },
        }
    ]
    ga = reco.ga_recommendations[0]
    assert ga.recommended_mode == "on_change"
    assert ga.rationale is not None
    # Iter UX-6: kein "[KI]"-Praefix mehr — der explizite source-
    # Marker im DTO ist die saubere Loesung. Rationale enthaelt nur
    # den LLM-Begruendungstext.
    assert not ga.rationale.startswith("[KI]")
    assert ga.source == "llm"
    # Layer-4-Marker im Reasoning
    assert any("Layer 4" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_layer4_cache_hit_skips_provider(db: Database) -> None:
    """Zweiter Aufruf nach gleichem Setup -> Cache-Hit, kein
    erneuter Provider-Call."""
    await _seed_unknown_dpt_telegrams(db)
    repo = KnxStatsRepository(db)
    cache_repo = RecommendationCacheRepository(db)
    provider = _CountingProvider(
        DptRecommendation(
            mode="on_change",
            cycle_minutes_min=None,
            cycle_minutes_max=None,
            hysteresis=None,
            max_rate_per_min=1.0,
            rationale="LLM antwortet.",
        )
    )

    # 1. Aufruf
    await compute_device_recommendation(
        repo,
        "1.1.10",
        _ts(-3700),
        _ts(60),
        llm_provider=provider,
        llm_cache_repo=cache_repo,
        llm_provider_name="test_provider",
        llm_model="gpt-test",
    )
    assert len(provider.calls) == 1

    # 2. Aufruf — gleiche Inputs
    reco_2 = await compute_device_recommendation(
        repo,
        "1.1.10",
        _ts(-3700),
        _ts(60),
        llm_provider=provider,
        llm_cache_repo=cache_repo,
        llm_provider_name="test_provider",
        llm_model="gpt-test",
    )
    # KEIN neuer Provider-Aufruf
    assert len(provider.calls) == 1
    # Aber die Empfehlung ist trotzdem da (aus Cache)
    assert reco_2 is not None
    ga = reco_2.ga_recommendations[0]
    assert ga.recommended_mode == "on_change"


@pytest.mark.asyncio
async def test_layer4_skipped_when_layer1_has_match(db: Database) -> None:
    """Bekannter DPT (9.001) -> Layer 1 hat eine Empfehlung,
    Layer 4 wird NICHT aufgerufen."""
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        ("1/2/3", "Temp", "9.001", now, now),
    )
    for i in range(40):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-3600 + i * 60),
                "1/2/3",
                "1.1.10",
                "GroupValueWrite",
                json.dumps(21.5),
                0,
            ),
        )

    repo = KnxStatsRepository(db)
    cache_repo = RecommendationCacheRepository(db)
    provider = _CountingProvider(None)  # wuerde nichts liefern

    reco = await compute_device_recommendation(
        repo,
        "1.1.10",
        _ts(-3700),
        _ts(60),
        llm_provider=provider,
        llm_cache_repo=cache_repo,
        llm_provider_name="test_provider",
        llm_model="gpt-test",
    )

    assert reco is not None
    # Kein Provider-Call: Layer 1 hat geliefert
    assert provider.calls == []
    # Reasoning enthaelt KEIN Layer-4-Marker
    assert not any("Layer 4" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_layer4_provider_returns_none_no_recommendation(
    db: Database,
) -> None:
    """Provider liefert None (z. B. wegen Rate-Limit oder Disabled).
    Die GA bleibt ohne Empfehlung — kein Crash."""
    await _seed_unknown_dpt_telegrams(db)
    repo = KnxStatsRepository(db)
    cache_repo = RecommendationCacheRepository(db)
    provider = _CountingProvider(None)

    reco = await compute_device_recommendation(
        repo,
        "1.1.10",
        _ts(-3700),
        _ts(60),
        llm_provider=provider,
        llm_cache_repo=cache_repo,
        llm_provider_name="test_provider",
        llm_model="gpt-test",
    )

    assert reco is not None
    assert len(provider.calls) == 1
    ga = reco.ga_recommendations[0]
    assert ga.recommended_mode is None
    # Kein Layer-4-Marker, weil gerade nichts kam
    assert not any("Layer 4" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_layer4_with_device_profile_passes_manufacturer_and_model(
    db: Database,
) -> None:
    """Geraete-Profil wird in den Provider-Aufruf weitergegeben — der
    LLM kann den Hersteller im Prompt nutzen."""
    await _seed_unknown_dpt_telegrams(db)
    devices = KnxDeviceRepository(db)
    await devices.upsert(
        dev_source="1.1.10",
        manufacturer="acme",
        model="quantum-9000",
    )
    repo = KnxStatsRepository(db)
    cache_repo = RecommendationCacheRepository(db)
    provider = _CountingProvider(
        DptRecommendation(
            mode="on_change",
            cycle_minutes_min=None,
            cycle_minutes_max=None,
            hysteresis=None,
            max_rate_per_min=1.0,
            rationale="LLM antwortet.",
        )
    )

    await compute_device_recommendation(
        repo,
        "1.1.10",
        _ts(-3700),
        _ts(60),
        devices_repo=devices,
        llm_provider=provider,
        llm_cache_repo=cache_repo,
        llm_provider_name="test_provider",
        llm_model="gpt-test",
    )

    assert len(provider.calls) == 1
    call = provider.calls[0]
    assert call["manufacturer"] == "acme"
    assert call["model"] == "quantum-9000"


@pytest.mark.asyncio
async def test_layer4_dto_round_trip(db: Database) -> None:
    """DTO-Serialisierung mit Layer-4-Daten (Roundtrip + JSON)."""
    await _seed_unknown_dpt_telegrams(db)
    repo = KnxStatsRepository(db)
    cache_repo = RecommendationCacheRepository(db)
    provider = _CountingProvider(
        DptRecommendation(
            mode="hybrid",
            cycle_minutes_min=10,
            cycle_minutes_max=30,
            hysteresis=">= 1 unit",
            max_rate_per_min=2.0,
            rationale="x.",
        )
    )

    reco = await compute_device_recommendation(
        repo,
        "1.1.10",
        _ts(-3700),
        _ts(60),
        llm_provider=provider,
        llm_cache_repo=cache_repo,
        llm_provider_name="test_provider",
        llm_model="gpt-test",
    )
    assert reco is not None

    payload = device_recommendation_to_dict(reco)
    encoded = json.dumps(payload)
    decoded = json.loads(encoded)
    ga = decoded["ga_recommendations"][0]
    assert ga["recommended_mode"] == "hybrid"
    assert ga["recommended_cycle_minutes"] == [10, 30]
    # Iter UX-6: source="llm" macht den Marker explizit, kein
    # String-Praefix mehr noetig.
    assert ga["source"] == "llm"
