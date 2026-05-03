"""Iter K (Sprint B / Phase 8): Counter-basierter Source-Aggregat-Pfad.

Vorher las `compute_source_detail` *alle* Source-Aggregate aus
`knx_raw_telegrams` — das hat 48 h Retention. Bei Period > 48 h
zeigte das Source-Detail-Pane drastisch unter-erfasste Counts
(typisch: nur die letzten 48 h, statt der vollen 7-Tage-Auswertung).

Iter K: bei Periode >= 48 h (= Raw-Retention) wechselt der Service auf
den Counter-Pfad — `knx_telegram_counters` hat 365 d Retention, GA-
granular. Die GA-Liste der Source bleibt aus den Live-Daten der
letzten 48 h (dort steht `dev_source`); pro GA werden die Counts via
`counter_totals_for_gas` aus dem Counter aggregiert.

Approximation: ein Geraet, das vor mehreren Tagen still wurde, taucht
nicht mehr in der GA-Liste auf — der vollstaendige
`dev_source`-Counter-Datensatz waere eine Schema-Erweiterung (Iter L+,
nicht in dieser Iter).
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

# Periode-Anker: "Jetzt" in der Test-Welt. Live-48h-Window endet hier.
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


def _iso(dt: datetime) -> str:
    return dt.isoformat(timespec="seconds")


def _hour_iso(dt: datetime) -> str:
    """ISO-Zeit auf Stunden-Bucket (Format des Listeners)."""
    floored = dt.replace(minute=0, second=0, microsecond=0)
    return floored.isoformat(timespec="seconds").split("+")[0]


async def _seed_counter(
    db: Database, *, ga: str, hour: datetime, count: int
) -> None:
    await db.execute(
        "INSERT INTO knx_telegram_counters (ga, hour_bucket, count) "
        "VALUES (?, ?, ?)",
        (ga, _hour_iso(hour), count),
    )


async def _insert_ga(
    db: Database, *, ga: str, dpt: str | None = None, label: str = "GA"
) -> None:
    now = _iso(_NOW)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (ga, label, dpt, now, now),
    )


async def _insert_live_telegram(
    db: Database, *, ga: str, ts: datetime, source: str = "1.1.10"
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            _iso(ts), ga, source, "GroupValueWrite",
            json.dumps(1, default=str), 0,
        ),
    )


class TestCounterTotalsForGas:
    @pytest.mark.asyncio
    async def test_empty_ga_list_returns_empty_dict(self, db: Database) -> None:
        """Leere GA-Liste darf nicht in `IN ()`-SQL muenden."""
        repo = KnxStatsRepository(db)
        result = await repo.counter_totals_for_gas(
            [], "2026-04-26T00:00:00", "2026-05-03T00:00:00"
        )
        assert result == {}

    @pytest.mark.asyncio
    async def test_aggregates_counts_per_ga_in_window(
        self, db: Database
    ) -> None:
        """Mehrere Hour-Buckets pro GA werden aufsummiert; GAs ausserhalb
        der Liste oder ausserhalb der Periode bleiben aussen vor."""
        # GA 1/2/3: 50 + 30 = 80 in Periode, 999 ausserhalb
        await _seed_counter(db, ga="1/2/3", hour=_NOW - timedelta(days=2), count=50)
        await _seed_counter(db, ga="1/2/3", hour=_NOW - timedelta(days=5), count=30)
        await _seed_counter(db, ga="1/2/3", hour=_NOW - timedelta(days=400), count=999)
        # GA 1/2/4: 100 in Periode
        await _seed_counter(db, ga="1/2/4", hour=_NOW - timedelta(days=3), count=100)
        # GA 9/9/9: nicht in Filter-Liste
        await _seed_counter(db, ga="9/9/9", hour=_NOW - timedelta(days=1), count=777)

        repo = KnxStatsRepository(db)
        from_iso = _iso(_NOW - timedelta(days=7))
        to_iso = _iso(_NOW)
        result = await repo.counter_totals_for_gas(
            ["1/2/3", "1/2/4"], from_iso, to_iso
        )
        assert result == {"1/2/3": 80, "1/2/4": 100}

    @pytest.mark.asyncio
    async def test_unknown_ga_absent_from_dict(self, db: Database) -> None:
        """GAs ohne Counter-Bucket fehlen im Ergebnis-Dict (nicht 0)."""
        repo = KnxStatsRepository(db)
        result = await repo.counter_totals_for_gas(
            ["1/2/3", "9/9/9"], "2026-04-26T00:00:00", "2026-05-03T00:00:00"
        )
        assert result == {}


class TestComputeSourceDetailLongTerm:
    @pytest.mark.asyncio
    async def test_long_term_period_uses_counter_for_per_ga_counts(
        self, db: Database
    ) -> None:
        """7-Tage-Periode: Per-GA-Counts kommen aus dem Counter, nicht
        aus den 48-h-Live-Daten."""
        await _insert_ga(db, ga="1/2/3", dpt="1.001", label="Schalter")
        await _insert_ga(db, ga="1/2/4", dpt="9.001", label="Temperatur")
        # Live-Daten der letzten 48h: schluesseln Source -> GAs auf,
        # geben aber nur 2 + 1 Telegramme.
        await _insert_live_telegram(db, ga="1/2/3", ts=_NOW - timedelta(hours=1))
        await _insert_live_telegram(db, ga="1/2/3", ts=_NOW - timedelta(hours=10))
        await _insert_live_telegram(db, ga="1/2/4", ts=_NOW - timedelta(hours=2))
        # Counter-Daten ueber 7 Tage: dramatisch hoeher als Live.
        await _seed_counter(db, ga="1/2/3", hour=_NOW - timedelta(days=1), count=200)
        await _seed_counter(db, ga="1/2/3", hour=_NOW - timedelta(days=4), count=300)
        await _seed_counter(db, ga="1/2/4", hour=_NOW - timedelta(days=2), count=150)
        # Andere Source/GA in Counter — darf nicht reinrutschen.
        await _seed_counter(db, ga="9/9/9", hour=_NOW - timedelta(days=2), count=999)

        from_iso = _iso(_NOW - timedelta(days=7))
        to_iso = _iso(_NOW)
        svc = KnxStatsService(KnxStatsRepository(db))

        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        assert detail is not None
        # Per-GA-Counts kommen aus dem Counter, nicht aus Live.
        gas_by_ga = {ga.ga: ga.count for ga in detail.gas}
        assert gas_by_ga == {"1/2/3": 500, "1/2/4": 150}
        # total_count ist die Summe der Counter-GA-Sums dieser Source.
        assert detail.total_count == 650

    @pytest.mark.asyncio
    async def test_short_term_period_keeps_live_path(
        self, db: Database
    ) -> None:
        """1-h-Periode bleibt auf Raw/Live (Schwelle erst >= 48h)."""
        await _insert_ga(db, ga="1/2/3", dpt="1.001")
        for offset_min in range(1, 6):
            await _insert_live_telegram(
                db, ga="1/2/3", ts=_NOW - timedelta(minutes=offset_min)
            )
        # Counter-Wert grossartig hoch — sollte NICHT verwendet werden.
        await _seed_counter(db, ga="1/2/3", hour=_NOW - timedelta(hours=1), count=99999)

        from_iso = _iso(_NOW - timedelta(hours=1))
        to_iso = _iso(_NOW)
        svc = KnxStatsService(KnxStatsRepository(db))

        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        assert detail is not None
        # 5 Live-Telegramme, NICHT 99999 aus dem Counter.
        assert detail.total_count == 5
        assert detail.gas[0].count == 5

    @pytest.mark.asyncio
    async def test_long_term_share_pct_uses_counter_total(
        self, db: Database
    ) -> None:
        """Im Long-Term-Modus muss auch der Periode-Total aus dem
        Counter kommen, sonst ist `share_pct = source / total`
        inkonsistent (Source aus Counter, Total aus 48h-Live)."""
        await _insert_ga(db, ga="1/2/3", dpt="1.001")
        await _insert_live_telegram(db, ga="1/2/3", ts=_NOW - timedelta(hours=1))
        # Source-GA: 100 Counter-Counts.
        await _seed_counter(db, ga="1/2/3", hour=_NOW - timedelta(days=2), count=100)
        # Andere GA (von anderer Source) in Counter: 300 Counts.
        await _seed_counter(db, ga="5/0/1", hour=_NOW - timedelta(days=2), count=300)
        # Total = 400, Source = 100 -> share_pct = 25.0

        from_iso = _iso(_NOW - timedelta(days=7))
        to_iso = _iso(_NOW)
        svc = KnxStatsService(KnxStatsRepository(db))

        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)

        assert detail is not None
        assert detail.total_count == 100
        assert detail.share_pct == 25.0
