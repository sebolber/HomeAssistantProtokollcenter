"""Iter L2.5: Layer-2-Pipeline mit ETS-Discovery als Default + User-
Override-Vorrang. Auto-Inferenz wurde entfernt.
"""

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
    db: Database,
    *,
    dev_source: str = "1.1.220",
) -> None:
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        ("1/0/1", "Tor Klima Temp", "9.001", now, now),
    )
    for i in range(40):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-3600 + i * 60),
                "1/0/1",
                dev_source,
                "GroupValueWrite",
                json.dumps(0.0),
                0,
            ),
        )


@pytest.mark.asyncio
async def test_ets_discovery_alone_triggers_layer2_override(
    db: Database,
) -> None:
    """ETS-Daten reichen aus — User muss kein knx_devices-Profil pflegen."""
    await _seed_garage_door(db)
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo,
        "1.1.220",
        _ts(-3700),
        _ts(60),
        ets_devices={
            "1.1.220": {
                "manufacturer": "hoermann",
                "product": "garage-control",
                "name": "Garagen-Tor",
            }
        },
    )

    assert reco is not None
    ga = reco.ga_recommendations[0]
    # Layer-2-Override greift fuer DPT 9.001 → on_change.
    assert ga.recommended_mode == "on_change"
    # Reasoning enthaelt ETS-Marker
    assert any("Layer 2" in r and "ETS-Projekt" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_user_override_wins_over_ets(db: Database) -> None:
    """Wenn knx_devices gepflegt ist, ueberschreibt es die ETS-Werte."""
    await _seed_garage_door(db)
    devices = KnxDeviceRepository(db)
    # User pflegt manufacturer abweichend — z. B. 'mdt' statt ETS-Wert
    # 'unknown-vendor'
    await devices.upsert(
        dev_source="1.1.220",
        manufacturer="mdt",
        model="dimm-aktor",
    )
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo,
        "1.1.220",
        _ts(-3700),
        _ts(60),
        devices_repo=devices,
        ets_devices={
            "1.1.220": {
                "manufacturer": "unknown-vendor",
                "product": "x123",
                "name": "Tor",
            }
        },
    )

    assert reco is not None
    # Reasoning markiert User-Override (NICHT ETS-Projekt)
    layer2 = [r for r in reco.reasoning if "Layer 2" in r]
    assert any("User-Override" in r for r in layer2)
    assert not any("ETS-Projekt" in r for r in layer2)


@pytest.mark.asyncio
async def test_no_ets_no_user_no_layer2(db: Database) -> None:
    """Weder ETS noch User → kein Layer-2-Reasoning."""
    await _seed_garage_door(db)
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo,
        "1.1.220",
        _ts(-3700),
        _ts(60),
        ets_devices=None,
    )

    assert reco is not None
    assert not any("Layer 2" in r for r in reco.reasoning)


@pytest.mark.asyncio
async def test_ets_unknown_manufacturer_adds_hint(db: Database) -> None:
    """ETS hat einen Hersteller, aber kein kuratierter Override —
    Reasoning enthaelt einen Hint mit ETS-Quelle."""
    await _seed_garage_door(db)
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo,
        "1.1.220",
        _ts(-3700),
        _ts(60),
        ets_devices={
            "1.1.220": {
                "manufacturer": "acme",
                "product": "quantum-9000",
                "name": "Test",
            }
        },
    )

    assert reco is not None
    layer2 = [r for r in reco.reasoning if "Layer 2" in r]
    assert any("ETS-Projekt" in r and "acme" in r for r in layer2)


@pytest.mark.asyncio
async def test_user_profile_with_only_notes_does_not_block_ets(
    db: Database,
) -> None:
    """Edge-Case: User pflegt nur Notes (kein manufacturer/model)
    → ETS-Werte greifen weiter."""
    await _seed_garage_door(db)
    devices = KnxDeviceRepository(db)
    await devices.upsert(
        dev_source="1.1.220",
        notes="Wartung 2026-04",
    )
    repo = KnxStatsRepository(db)

    reco = await compute_device_recommendation(
        repo,
        "1.1.220",
        _ts(-3700),
        _ts(60),
        devices_repo=devices,
        ets_devices={
            "1.1.220": {
                "manufacturer": "hoermann",
                "product": "garage-control",
                "name": "Tor",
            }
        },
    )

    assert reco is not None
    ga = reco.ga_recommendations[0]
    assert ga.recommended_mode == "on_change"  # Hoermann-Override aus ETS
    assert any("Layer 2" in r and "ETS-Projekt" in r for r in reco.reasoning)
