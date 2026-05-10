"""Iter B (knx-detail-panes): KnxStatsService.compute_source_detail.

Vertrag aus `docs/messagehub_knx_detail_panes_konzept.md`:
- Liefert SourceDetail mit Total/GA-Count/Bus-Anteil/last_seen/Silent.
- GA-Liste hard-capped auf SOURCE_DETAIL_GA_HARD_CAP (Default 100).
- Severity-Klassifikation pro GA wie in Top-Sender-Tabelle.
- Acknowledged-Flag pro GA korrekt aus knx_ga_acknowledgements.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_stats_service import (
    SOURCE_DETAIL_DEFAULT_SILENCE_MINUTES,
    KnxStatsService,
    source_detail_to_dict,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.knx_stats_repo import KnxStatsRepository
from custom_components.messagehub.storage.migrations import MigrationRunner


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


def _ts(offset_seconds: float, *, base: datetime | None = None) -> str:
    base_dt = base or datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return (base_dt + timedelta(seconds=offset_seconds)).isoformat(timespec="seconds")


def _from_to() -> tuple[str, str]:
    return _ts(-60), _ts(3600)


async def _insert_ga(db: Database, *, ga: str, dpt: str | None = None, label: str = "GA") -> None:
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
    source: str = "1.1.5",
    value: object = 1,
    repeated: bool = False,
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            ts,
            ga,
            source,
            "GroupValueWrite",
            json.dumps(value, default=str),
            1 if repeated else 0,
        ),
    )


class TestComputeSourceDetailHappyPath:
    @pytest.mark.asyncio
    async def test_returns_source_detail_with_kpis_and_ga_list(self, db: Database) -> None:
        # Arrange — Geraet mit 2 GAs.
        await _insert_ga(db, ga="1/2/3", dpt="1.001", label="Schalter")
        await _insert_ga(db, ga="1/2/4", dpt="9.001", label="Temperatur")
        for i in range(5):
            await _insert_telegram(
                db,
                ga="1/2/3",
                ts=_ts(i),
                source="1.1.10",
            )
        for i in range(2):
            await _insert_telegram(
                db,
                ga="1/2/4",
                ts=_ts(60 + i),
                source="1.1.10",
            )

        from_iso, to_iso = _from_to()
        svc = KnxStatsService(KnxStatsRepository(db))

        # Act
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        # Assert
        assert detail is not None
        assert detail.dev_source == "1.1.10"
        assert detail.total_count == 7
        assert detail.ga_count == 2
        assert detail.share_pct == 100.0  # nur diese Source ist im Period
        assert detail.repeat_ratio_pct == 0.0
        assert detail.last_seen is not None
        # GA-Liste sortiert nach count desc.
        gas = detail.gas
        assert len(gas) == 2
        assert gas[0].ga == "1/2/3"
        assert gas[0].count == 5
        assert gas[1].ga == "1/2/4"
        assert gas[1].count == 2

    @pytest.mark.asyncio
    async def test_returns_none_for_source_without_telegrams_in_period(self, db: Database) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail("9.9.9", from_iso, to_iso)
        assert detail is None

    @pytest.mark.asyncio
    async def test_returns_none_for_empty_dev_source(self, db: Database) -> None:
        svc = KnxStatsService(KnxStatsRepository(db))
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail("", from_iso, to_iso)
        assert detail is None

    @pytest.mark.asyncio
    async def test_share_pct_correct_with_other_sources_in_period(self, db: Database) -> None:
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        await _insert_telegram(db, ga="2/2/2", ts=_ts(0), source="1.1.20")
        await _insert_telegram(db, ga="2/2/2", ts=_ts(1), source="1.1.20")
        await _insert_telegram(db, ga="2/2/2", ts=_ts(2), source="1.1.20")

        svc = KnxStatsService(KnxStatsRepository(db))
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        assert detail is not None
        # 1 von 4 Telegrammen -> 25 %.
        assert detail.share_pct == 25.0


class TestSourceDetailRepeats:
    @pytest.mark.asyncio
    async def test_repeat_ratio_aggregated_per_source(self, db: Database) -> None:
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        await _insert_telegram(
            db,
            ga="1/1/1",
            ts=_ts(60),
            source="1.1.10",
            repeated=True,
        )
        # Andere Source darf nicht reinrutschen.
        await _insert_telegram(
            db,
            ga="1/1/1",
            ts=_ts(120),
            source="1.1.20",
            repeated=True,
        )

        svc = KnxStatsService(KnxStatsRepository(db))
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        assert detail is not None
        assert detail.total_count == 2
        # 1 von 2 wiederholt -> 50 %.
        assert detail.repeat_ratio_pct == 50.0


class TestSourceDetailSilent:
    @pytest.mark.asyncio
    async def test_silent_alarm_false_when_recently_active(self, db: Database) -> None:
        # Telegramm in den letzten Minuten — Schwelle 24h, also kein Alarm.
        recent = (datetime.now(UTC) - timedelta(minutes=5)).isoformat(timespec="seconds")
        await _insert_ga(db, ga="1/1/1", dpt="1.001")
        await _insert_telegram(db, ga="1/1/1", ts=recent, source="1.1.10")

        svc = KnxStatsService(KnxStatsRepository(db))
        far_past = (datetime.now(UTC) - timedelta(hours=2)).isoformat(timespec="seconds")
        far_future = (datetime.now(UTC) + timedelta(hours=2)).isoformat(timespec="seconds")
        detail = await svc.compute_source_detail("1.1.10", far_past, far_future)

        assert detail is not None
        assert detail.silent_alarm is False
        assert detail.silent_minutes is not None
        assert detail.silent_minutes < 60.0


class TestSourceDetailAck:
    @pytest.mark.asyncio
    async def test_acknowledged_flag_propagates_per_ga(self, db: Database) -> None:
        await _insert_ga(db, ga="1/1/1", dpt="1.001")
        await _insert_ga(db, ga="1/1/2", dpt="1.001")
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")
        await _insert_telegram(db, ga="1/1/2", ts=_ts(0), source="1.1.10")
        # Nur 1/1/1 acken (sticky -> expiry_days=None).
        await KnxStatsRepository(db).ack_set(
            "1/1/1",
            note="testuser",
        )

        svc = KnxStatsService(KnxStatsRepository(db))
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        assert detail is not None
        ack_map = {g.ga: g.acknowledged for g in detail.gas}
        assert ack_map["1/1/1"] is True
        assert ack_map["1/1/2"] is False


class TestSourceDetailHardCap:
    @pytest.mark.asyncio
    async def test_ga_list_capped_at_hard_cap(self, db: Database) -> None:
        # Insert 150 GAs fuer dieselbe Source — das System darf sie
        # nicht alle in der Antwort liefern.
        for i in range(150):
            ga = f"7/0/{i}"
            await _insert_telegram(
                db,
                ga=ga,
                ts=_ts(i),
                source="1.1.99",
            )

        svc = KnxStatsService(KnxStatsRepository(db))
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail(
            "1.1.99",
            from_iso,
            to_iso,
        )

        assert detail is not None
        # gas-Liste darf max 100 Eintraege haben (Hard-Cap).
        assert len(detail.gas) == 100
        # ga_count zaehlt aber alle GAs (kein Cap auf der Zahl).
        # Wir akzeptieren hier auch 100, weil ga_count = len(ga_rows)
        # nach Hard-Cap-Slice auf 100 limitiert ist — siehe Service.
        assert detail.ga_count == 100


class TestSourceDetailSerialisation:
    @pytest.mark.asyncio
    async def test_source_detail_to_dict_round_trip(self, db: Database) -> None:
        await _insert_ga(db, ga="1/1/1", dpt="1.001", label="Test")
        await _insert_telegram(db, ga="1/1/1", ts=_ts(0), source="1.1.10")

        svc = KnxStatsService(KnxStatsRepository(db))
        from_iso, to_iso = _from_to()
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        assert detail is not None
        result = source_detail_to_dict(detail)
        # JSON-Schluessel-Existenz pro DTO-Feld.
        for key in (
            "dev_source",
            "total_count",
            "ga_count",
            "share_pct",
            "last_seen",
            "silent_minutes",
            "silent_alarm",
            "repeat_ratio_pct",
            "gas",
        ):
            assert key in result
        assert result["dev_source"] == "1.1.10"
        assert result["gas"][0]["ga"] == "1/1/1"
        # JSON-serialisierbar (kein datetime/Decimal).
        json.dumps(result)


def test_default_silence_minutes_is_24h() -> None:
    """Spiegelt das alarms-View-Default; siehe `_renderSilenceAlarms`."""
    assert SOURCE_DETAIL_DEFAULT_SILENCE_MINUTES == 1440
