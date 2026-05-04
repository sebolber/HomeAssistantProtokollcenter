"""Iter UX-1.0: Stille-Detector + Alarm-Service mit Geraete-Details.

- enrich_silence_with_devices: ETS-Mapping + GA-Liste pro Source
- evaluate_alarms: silence_alarm bekommt details.devices
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_stats_service import (
    KnxStatsService,
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


async def _insert_silence_test_data(db: Database) -> None:
    """Source 1.1.10 mit 2 GAs, alle Telegramme weit zurueck (>= 24 h)
    sodass silence_detect das als Alarm flaggt."""
    now = _ts(0)
    for ga, label, dpt in (
        ("1/2/3", "Wohnzimmer Temp", "9.001"),
        ("1/2/4", "Wohnzimmer Lux", "9.004"),
    ):
        await db.execute(
            "INSERT INTO knx_group_addresses "
            "(address, label, dpt, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (ga, label, dpt, now, now),
        )
    # Zwei Telegramme vor 2 Tagen (= 2880 Min stumm)
    for ga in ("1/2/3", "1/2/4"):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                _ts(-2 * 86400), ga, "1.1.10",
                "GroupValueWrite", json.dumps(21.5), 0,
            ),
        )


# ---------------------------------------------------------------------------
# enrich_silence_with_devices
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_enrich_silence_adds_manufacturer_and_gas(
    db: Database,
) -> None:
    await _insert_silence_test_data(db)
    svc = KnxStatsService(KnxStatsRepository(db))
    rows = await KnxStatsRepository(db).silence_detect(
        _ts(-3 * 86400), _ts(60),
        now_iso=_ts(0), max_silence_minutes=1440,
    )
    enriched = await svc.enrich_silence_with_devices(
        rows,
        from_iso=_ts(-3 * 86400), to_iso=_ts(60),
        ets_devices={
            "1.1.10": {
                "manufacturer": "hoermann",
                "name": "Garagentor",
                "product": "garage-control",
            },
        },
    )
    assert len(enriched) >= 1
    entry = next(r for r in enriched if r["dev_source"] == "1.1.10")
    assert entry["manufacturer"] == "hoermann"
    assert entry["device_name"] == "Garagentor"
    # GA-Liste enthaelt beide GAs
    gas = entry["gas"]
    assert len(gas) == 2
    addresses = sorted(g["ga"] for g in gas)
    assert addresses == ["1/2/3", "1/2/4"]
    assert entry["ga_count"] == 2


@pytest.mark.asyncio
async def test_enrich_silence_without_ets_keeps_none_fields(
    db: Database,
) -> None:
    await _insert_silence_test_data(db)
    svc = KnxStatsService(KnxStatsRepository(db))
    rows = await KnxStatsRepository(db).silence_detect(
        _ts(-3 * 86400), _ts(60),
        now_iso=_ts(0), max_silence_minutes=1440,
    )
    enriched = await svc.enrich_silence_with_devices(
        rows, from_iso=_ts(-3 * 86400), to_iso=_ts(60),
        ets_devices=None,
    )
    entry = next(r for r in enriched if r["dev_source"] == "1.1.10")
    assert entry["manufacturer"] is None
    assert entry["device_name"] is None
    assert entry["ga_count"] >= 1


@pytest.mark.asyncio
async def test_enrich_silence_does_not_mutate_input(
    db: Database,
) -> None:
    await _insert_silence_test_data(db)
    svc = KnxStatsService(KnxStatsRepository(db))
    rows = await KnxStatsRepository(db).silence_detect(
        _ts(-3 * 86400), _ts(60),
        now_iso=_ts(0), max_silence_minutes=1440,
    )
    original_keys = set(rows[0].keys())
    await svc.enrich_silence_with_devices(
        rows, from_iso=_ts(-3 * 86400), to_iso=_ts(60),
    )
    # Originale Liste hat keine neuen Felder bekommen
    assert set(rows[0].keys()) == original_keys


# ---------------------------------------------------------------------------
# evaluate_alarms — silence_alarm details.devices
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_silence_alarm_includes_device_details(
    db: Database,
) -> None:
    await _insert_silence_test_data(db)
    svc = KnxStatsService(KnxStatsRepository(db))
    alarms = await svc.evaluate_alarms(
        _ts(-3 * 86400), _ts(60),
        busload_pct_threshold=99.0,
        repeat_rate_pct_threshold=99.0,
        silence_count_threshold=1,
        max_silence_minutes=1440,
        ets_devices={
            "1.1.10": {
                "manufacturer": "hoermann",
                "name": "Garagentor",
                "product": "garage-control",
            },
        },
    )
    silence = next(a for a in alarms if a["rule"] == "silence_alarm")
    assert silence["triggered"] is True
    devices = silence["details"]["devices"]
    assert len(devices) == 1
    dev = devices[0]
    assert dev["dev_source"] == "1.1.10"
    assert dev["manufacturer"] == "hoermann"
    assert dev["device_name"] == "Garagentor"
    assert {g["ga"] for g in dev["gas"]} == {"1/2/3", "1/2/4"}


@pytest.mark.asyncio
async def test_silence_alarm_details_empty_when_no_alarms(
    db: Database,
) -> None:
    """Keine stillen Geraete im Period → details.devices ist leer."""
    svc = KnxStatsService(KnxStatsRepository(db))
    alarms = await svc.evaluate_alarms(
        _ts(-3600), _ts(60),
        busload_pct_threshold=99.0,
        repeat_rate_pct_threshold=99.0,
        silence_count_threshold=1,
        max_silence_minutes=1440,
        ets_devices=None,
    )
    silence = next(a for a in alarms if a["rule"] == "silence_alarm")
    assert silence["details"]["devices"] == []


@pytest.mark.asyncio
async def test_silence_alarm_details_skip_for_unalarmed_sources(
    db: Database,
) -> None:
    """Source mit fresh Telegrammen wird nicht in details.devices
    aufgenommen — nur die wirklich alarmierten."""
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        ("1/2/3", "Wohnzimmer Temp", "9.001", now, now),
    )
    # Source A: stumm (Telegramm vor 2 Tagen)
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            _ts(-2 * 86400), "1/2/3", "1.1.10",
            "GroupValueWrite", json.dumps(21.5), 0,
        ),
    )
    # Source B: aktiv (Telegramm vor 5 Min)
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            _ts(-300), "1/2/3", "1.1.20",
            "GroupValueWrite", json.dumps(22.0), 0,
        ),
    )
    svc = KnxStatsService(KnxStatsRepository(db))
    alarms = await svc.evaluate_alarms(
        _ts(-3 * 86400), _ts(60),
        busload_pct_threshold=99.0,
        repeat_rate_pct_threshold=99.0,
        silence_count_threshold=1,
        max_silence_minutes=1440,
    )
    silence = next(a for a in alarms if a["rule"] == "silence_alarm")
    assert silence["triggered"] is True
    devices = silence["details"]["devices"]
    sources = {d["dev_source"] for d in devices}
    assert sources == {"1.1.10"}  # nur die wirklich stumme Source
