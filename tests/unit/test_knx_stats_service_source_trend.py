"""Iter I (knx-detail-panes): Trend-Compare im Source-Detail.

Vertrag aus `docs/messagehub_knx_detail_panes_handover.md`:
- Source-Detail liefert detail.trend mit count_now / count_prev /
  delta_pct, falls Period >= 24h.
- Bei kuerzeren Perioden ist trend=None.
- Aggregat ueber knx_raw_telegrams, gefiltert auf source.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_stats_service import (
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


def _ts(dt: datetime) -> str:
    return dt.isoformat(timespec="seconds")


async def _insert_telegram(
    db: Database, *, ga: str, ts: str, source: str = "1.1.10",
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (ts, ga, source, "GroupValueWrite", '"1"', 0),
    )


class TestSourceTrendLongPeriod:
    @pytest.mark.asyncio
    async def test_source_detail_includes_trend_when_period_long_enough(
        self, db: Database
    ) -> None:
        # 24h-Period: now - 24h ... now. Vorperiode: now - 48h ... now - 24h.
        now = datetime(2026, 5, 3, 12, 0, 0, tzinfo=UTC)
        from_dt = now - timedelta(hours=24)
        to_dt = now
        # Aktuelle Periode: 5 Telegramme
        for i in range(5):
            await _insert_telegram(
                db, ga="1/1/1",
                ts=_ts(from_dt + timedelta(minutes=i + 1)),
                source="1.1.10",
            )
        # Vorperiode: 2 Telegramme
        prev_from = from_dt - timedelta(hours=24)
        for i in range(2):
            await _insert_telegram(
                db, ga="1/1/1",
                ts=_ts(prev_from + timedelta(minutes=i + 1)),
                source="1.1.10",
            )

        svc = KnxStatsService(KnxStatsRepository(db))
        detail = await svc.compute_source_detail(
            "1.1.10", _ts(from_dt), _ts(to_dt),
        )

        assert detail is not None
        assert detail.trend is not None
        assert detail.trend.count_now == 5
        assert detail.trend.count_prev == 2
        # delta_abs = 3, delta_pct = 150 %
        assert detail.trend.delta_abs == 3
        assert detail.trend.delta_pct == 150.0

    @pytest.mark.asyncio
    async def test_source_trend_delta_pct_is_none_when_prev_zero(
        self, db: Database
    ) -> None:
        # Aktuelle Periode hat Telegramme, Vorperiode leer => delta_pct=None.
        now = datetime(2026, 5, 3, 12, 0, 0, tzinfo=UTC)
        from_dt = now - timedelta(hours=24)
        to_dt = now
        for i in range(3):
            await _insert_telegram(
                db, ga="1/1/1",
                ts=_ts(from_dt + timedelta(minutes=i + 1)),
                source="1.1.10",
            )

        svc = KnxStatsService(KnxStatsRepository(db))
        detail = await svc.compute_source_detail(
            "1.1.10", _ts(from_dt), _ts(to_dt),
        )
        assert detail is not None
        assert detail.trend is not None
        assert detail.trend.count_now == 3
        assert detail.trend.count_prev == 0
        assert detail.trend.delta_abs == 3
        # Division durch 0 -> None.
        assert detail.trend.delta_pct is None


class TestSourceTrendShortPeriod:
    @pytest.mark.asyncio
    async def test_source_detail_trend_none_for_short_period(
        self, db: Database
    ) -> None:
        # 6h-Period: zu kurz fuer Trend-Compare (Schwelle 24h).
        now = datetime(2026, 5, 3, 12, 0, 0, tzinfo=UTC)
        from_dt = now - timedelta(hours=6)
        to_dt = now
        await _insert_telegram(
            db, ga="1/1/1", ts=_ts(from_dt + timedelta(minutes=1)),
            source="1.1.10",
        )

        svc = KnxStatsService(KnxStatsRepository(db))
        detail = await svc.compute_source_detail(
            "1.1.10", _ts(from_dt), _ts(to_dt),
        )
        assert detail is not None
        assert detail.trend is None


class TestSourceTrendSerialisation:
    @pytest.mark.asyncio
    async def test_source_detail_to_dict_includes_trend_key(
        self, db: Database
    ) -> None:
        now = datetime(2026, 5, 3, 12, 0, 0, tzinfo=UTC)
        from_dt = now - timedelta(hours=24)
        to_dt = now
        await _insert_telegram(
            db, ga="1/1/1",
            ts=_ts(from_dt + timedelta(minutes=1)),
            source="1.1.10",
        )

        svc = KnxStatsService(KnxStatsRepository(db))
        detail = await svc.compute_source_detail(
            "1.1.10", _ts(from_dt), _ts(to_dt),
        )
        assert detail is not None
        result = source_detail_to_dict(detail)
        assert "trend" in result
        assert result["trend"] is not None
        for key in ("count_now", "count_prev", "delta_abs", "delta_pct"):
            assert key in result["trend"]
