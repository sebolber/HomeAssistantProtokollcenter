"""Iter L3.2: E2E-Smoke fuer kombinierten Layer-3-Override
(Buslast + Findings gleichzeitig aktiv).

Vollstaendige Pipeline: echte SQLite, GA-Telegramme, Buslast-Spam,
Findings-Eintrag — Recommendation-DTO muss beide Layer-3-Effekte
zeigen + Reasoning beider Marker enthalten.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings import Finding
from custom_components.messagehub.processing.knx_recommend_service import (
    compute_device_recommendation,
    device_recommendation_to_dict,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.findings_repo import FindingsRepository
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


@pytest.mark.asyncio
async def test_buslast_and_finding_both_present_in_reasoning(
    db: Database,
) -> None:
    """Mit hoher Buslast UND einem aktiven SEND_CYCLE_DRIFT-Finding
    auf einer GA muessen beide Layer-3-Effekte greifen:
    - Cycle-Korridor verlaengert (Buslast)
    - GA-Severity = deviation (Finding)
    - Reasoning-Liste enthaelt beide Marker
    """
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        ("1/2/3", "Temp", "9.001", now, now),
    )
    # GA-Telegramme im 60-s-Fenster fuer cyclic-Klassifikation
    for i in range(40):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, "
            "value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-60 + i * 1.5), "1/2/3", "1.1.10",
                "GroupValueWrite", json.dumps(21.5), 0,
            ),
        )
    # Buslast-Spam ueber 60 s
    for i in range(1500):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, "
            "value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-60 + i * 0.04), "9/9/9", "1.1.99",
                "GroupValueWrite", json.dumps(0), 0,
            ),
        )
    # Aktives Finding
    findings_repo = FindingsRepository(db)
    await findings_repo.record(
        Finding(
            code="SEND_CYCLE_DRIFT",
            schema_version=1,
            severity="warning",
            ga="1/2/3",
            source="1.1.10",
            first_seen=datetime(2026, 5, 3, 6, 0, 0),
            last_seen=datetime(2026, 5, 3, 7, 0, 0),
            detector_version="SEND_CYCLE_DRIFT/v1",
        )
    )

    repo = KnxStatsRepository(db)
    devices_repo = KnxDeviceRepository(db)

    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-60), _ts(1),
        devices_repo=devices_repo,
        findings_repo=findings_repo,
    )

    assert reco is not None
    assert len(reco.ga_recommendations) == 1
    ga = reco.ga_recommendations[0]
    assert ga.severity == "deviation"  # Finding-Boost
    # Cycle ist verlaengert (vorher 5-15 fuer DPT 9.001)
    assert ga.recommended_cycle_minutes is not None
    new_min, new_max = ga.recommended_cycle_minutes
    assert new_min > 5
    assert new_max > 15
    # Reasoning-Liste enthaelt BEIDE Layer-3-Marker
    layer3_entries = [r for r in reco.reasoning if "Layer 3" in r]
    assert len(layer3_entries) >= 2
    assert any("Bus-Avg-Last" in r for r in layer3_entries)
    assert any("SEND_CYCLE_DRIFT" in r for r in layer3_entries)


@pytest.mark.asyncio
async def test_dto_serialization_with_layer3_overrides(
    db: Database,
) -> None:
    """Schema-Contract-Smoke: DTO mit Layer-3-Daten ist JSON-serialisierbar."""
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
            "(timestamp, destination, source, telegramtype, "
            "value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-3600 + i * 60), "1/2/3", "1.1.10",
                "GroupValueWrite", json.dumps(21.5), 0,
            ),
        )

    repo = KnxStatsRepository(db)
    findings_repo = FindingsRepository(db)
    await findings_repo.record(
        Finding(
            code="REPEAT_APPROXIMATION",
            schema_version=1,
            severity="warning",
            ga="1/2/3",
            source="1.1.10",
            first_seen=datetime(2026, 5, 3, 6, 0, 0),
            last_seen=datetime(2026, 5, 3, 7, 0, 0),
            detector_version="REPEAT_APPROXIMATION/v1",
        )
    )

    reco = await compute_device_recommendation(
        repo, "1.1.10", _ts(-3700), _ts(60),
        findings_repo=findings_repo,
    )
    assert reco is not None

    payload = device_recommendation_to_dict(reco)
    encoded = json.dumps(payload)
    decoded = json.loads(encoded)
    assert decoded["ga_recommendations"][0]["severity"] == "deviation"
    assert any(
        "REPEAT_APPROXIMATION" in r for r in decoded["reasoning"]
    )
