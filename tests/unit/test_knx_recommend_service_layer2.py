"""Iter L2.2: Layer-2-Pipeline (Modell-Override) im Service-Lauf."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_recommend_service import (
    compute_device_recommendation,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_devices_repo import (
    KnxDeviceRepository,
)
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


async def _seed_garage_door(
    db: Database, *, dev_source: str, dpt: str = "9.001"
) -> None:
    """Hoermann-Tor-Profil: GA mit DPT 9.001 (Klima-Temp), 40 Telegramme,
    konstanter Wert 0.0 — typisches Hoermann-Default-Verhalten ohne
    angeschlossene Sensorik."""
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        ("1/0/1", "Tor Klima Temp", dpt, now, now),
    )
    for i in range(40):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-3600 + i * 60), "1/0/1", dev_source,
                "GroupValueWrite", json.dumps(0.0), 0,
            ),
        )


@pytest.mark.asyncio
async def test_layer2_override_changes_recommendation_for_known_model(
    db: Database,
) -> None:
    """Wetterstation-Profil mit DPT 9.001: ohne Modell hybrid (5-15 Min);
    mit hoermann/garage-control wird der Eintrag fuer 9.001 ueberschrieben
    (on_change, max_rate 0.5/Min)."""
    await _seed_garage_door(db, dev_source="1.1.220")
    devices = KnxDeviceRepository(db)
    await devices.upsert(
        dev_source="1.1.220",
        manufacturer="hoermann",
        model="garage-control",
    )
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.220", _ts(-3700), _ts(60),
        devices_repo=devices,
    )

    assert reco is not None
    ga = reco.ga_recommendations[0]
    # Layer-2-Override fuer DPT 9.001 → on_change.
    assert ga.recommended_mode == "on_change"
    # Iter UX-6: source markiert die Override-Quelle.
    assert ga.source == "device_model"
    # Reasoning enthaelt Layer-2-Marker
    assert any("Layer 2" in r for r in reco.reasoning)
    assert any("hoermann" in r for r in reco.reasoning)
    assert any("hoermann.de" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_layer2_falls_back_to_layer1_when_no_devices_repo(
    db: Database,
) -> None:
    """devices_repo=None -> ausschliesslich Layer 1 (DPT-Standard).

    Backwards-Compat zum L1-Pfad: Tests aus L1.2 muessen weiter
    funktionieren, wenn devices_repo nicht uebergeben wird."""
    await _seed_garage_door(db, dev_source="1.1.220")
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.220", _ts(-3700), _ts(60),
    )

    assert reco is not None
    ga = reco.ga_recommendations[0]
    assert ga.recommended_mode == "hybrid"  # Layer 1
    assert not any("Layer 2" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_layer2_falls_back_to_layer1_when_no_device_profile(
    db: Database,
) -> None:
    """devices_repo gegeben, aber kein Eintrag fuer dev_source -> Layer 1."""
    await _seed_garage_door(db, dev_source="1.1.220")
    devices = KnxDeviceRepository(db)
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.220", _ts(-3700), _ts(60),
        devices_repo=devices,
    )

    assert reco is not None
    ga = reco.ga_recommendations[0]
    assert ga.recommended_mode == "hybrid"  # Layer 1
    assert not any("Layer 2" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_layer2_unknown_model_adds_hint_to_reasoning(
    db: Database,
) -> None:
    """Hersteller/Modell sind im Profil gepflegt, aber die Tabelle
    kennt das Modell nicht -> Layer 1 greift, plus ein Reasoning-
    Hinweis 'kein kuratierter Override'."""
    await _seed_garage_door(db, dev_source="1.1.220")
    devices = KnxDeviceRepository(db)
    await devices.upsert(
        dev_source="1.1.220",
        manufacturer="acme",
        model="quantum-thingy",
    )
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.220", _ts(-3700), _ts(60),
        devices_repo=devices,
    )

    assert reco is not None
    ga = reco.ga_recommendations[0]
    assert ga.recommended_mode == "hybrid"  # Layer 1
    assert any(
        "Layer 2" in r and "kuratierten Override" in r
        for r in reco.reasoning
    )


@pytest.mark.asyncio
async def test_layer2_only_overrides_matching_dpts(db: Database) -> None:
    """Wenn das Geraet mehrere GAs unterschiedlicher DPTs hat und das
    Modell-Override nur fuer EINEN DPT existiert, bekommen nur diese
    GAs die Layer-2-Werte; die anderen behalten Layer 1."""
    # Geraet mit DPT 9.001 (uebernommen von Layer 2) und DPT 9.005 (Wind,
    # nicht im Hoermann-Override -> Layer 1 hybrid).
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        ("1/0/1", "Tor Temp", "9.001", now, now),
    )
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        ("1/0/2", "Tor Wind", "9.005", now, now),
    )
    for ga in ("1/0/1", "1/0/2"):
        for i in range(40):
            await db.execute(
                "INSERT INTO knx_raw_telegrams "
                "(timestamp, destination, source, telegramtype, "
                " value, repeated) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (
                    _ts(-3600 + i * 60), ga, "1.1.220",
                    "GroupValueWrite", json.dumps(0.0), 0,
                ),
            )

    devices = KnxDeviceRepository(db)
    await devices.upsert(
        dev_source="1.1.220",
        manufacturer="hoermann",
        model="garage-control",
    )
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.220", _ts(-3700), _ts(60),
        devices_repo=devices,
    )

    assert reco is not None
    by_ga = {g.ga: g for g in reco.ga_recommendations}
    # 9.001 overridden -> on_change
    assert by_ga["1/0/1"].recommended_mode == "on_change"
    # 9.005 NOT overridden -> Layer 1 hybrid
    assert by_ga["1/0/2"].recommended_mode == "hybrid"


@pytest.mark.asyncio
async def test_layer2_reasoning_lists_layers_in_order(db: Database) -> None:
    """Layer-Reasoning wird in der Pipeline-Reihenfolge appended:
    Layer 1 → Layer 2 → ggf. weitere. Test pinnt die Reihenfolge."""
    await _seed_garage_door(db, dev_source="1.1.220")
    devices = KnxDeviceRepository(db)
    await devices.upsert(
        dev_source="1.1.220",
        manufacturer="hoermann",
        model="garage-control",
    )
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.220", _ts(-3700), _ts(60),
        devices_repo=devices,
    )

    assert reco is not None
    layer_indices = []
    for i, entry in enumerate(reco.reasoning):
        if "Layer 1" in entry:
            layer_indices.append(("L1", i))
        elif "Layer 2" in entry:
            layer_indices.append(("L2", i))
    assert layer_indices, "Mindestens Layer-1-Marker erwartet"
    # L1 vor L2, falls beide vorhanden
    if len(layer_indices) >= 2:
        assert layer_indices[0][0] == "L1"
        assert layer_indices[1][0] == "L2"
