"""Iter 29b (knx-findings): Bus-wide-Detector-Runner — Smoke-Test.

Vertrag: Bus-weite Detektoren (HEALTH_*, RECONNECT_STORM,
SEND_CYCLE_DRIFT, MULTI_TIME_MASTER, ORPHAN_GA, STALE_GA) laufen
periodisch (alle 15 Min default) ueber einen Job, NICHT on-demand.
Der Smoke-Test triggert den Job-Tick manuell und prueft, dass die
Findings via API sichtbar werden.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings_runner import (
    run_bus_wide_detectors,
)
from custom_components.messagehub.processing.findings_service import (
    list_findings_response,
)
from custom_components.messagehub.processing.knx_repo import KnxAddressRepository
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.findings_repo import FindingsRepository
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


async def _insert_telegram(
    db: Database,
    *,
    ga: str,
    ts: str,
    value: object = 1,
    dev_source: str = "1.1.5",
    telegramtype: str = "GroupValueWrite",
    repeated: bool = False,
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            ts, ga, dev_source, telegramtype,
            json.dumps(value, default=str), 1 if repeated else 0,
        ),
    )


async def _insert_ga(
    db: Database, *, ga: str, dpt: str | None = None, label: str = "Sensor"
) -> None:
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (ga, label, dpt, now, now),
    )


class TestBusWideDetectorRunnerSmoke:
    @pytest.mark.asyncio
    async def test_health_busload_finding_visible_via_api_after_periodic_tick(
        self, db: Database
    ) -> None:
        """Iter 29b-Smoke: Hohe Buslast -> HEALTH_BUSLOAD via API."""
        # Arrange — kuenstlich ueber Schwelle: viele Telegramme pro Bucket.
        # Die Buslast wird aus knx_raw_telegrams aggregiert.
        ga = "1/1/1"
        await _insert_ga(db, ga=ga)
        # ~1000 Telegramme in 60 s = 16.67 t/s ~ Maximalbus, aber wir
        # brauchen relativ zur Bus-Kapazitaet >20% (HEALTH_BUSLOAD-Schwelle).
        for i in range(1500):
            await _insert_telegram(db, ga=ga, ts=_ts(i / 25.0))

        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        now = datetime(2026, 5, 3, 8, 5, 0, tzinfo=UTC)
        period_from = _ts(-3600)
        period_to = _ts(3600)

        # Act — periodischer Job-Tick.
        await run_bus_wide_detectors(
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=period_from,
            period_to=period_to,
            now=now,
        )

        # Assert — HEALTH_BUSLOAD finding sichtbar via Service-Layer.
        resp = await list_findings_response(repo, code="HEALTH_BUSLOAD")
        assert resp["total"] >= 1, resp

    @pytest.mark.asyncio
    async def test_orphan_ga_finding_visible_after_run_for_silent_whitelist_entry(
        self, db: Database
    ) -> None:
        """Iter 24-Wiring: Whitelist-GA ohne Telegramme -> ORPHAN_GA."""
        # Arrange — GA in Whitelist, aber kein einziges Telegramm.
        await _insert_ga(db, ga="2/0/0", dpt="1.001", label="Stiller Schalter")
        # Plus eine GA mit Telegrammen (Kontroll-Probe; soll keinen ORPHAN
        # ausloesen).
        await _insert_ga(db, ga="2/0/1", dpt="1.001", label="Aktiver Schalter")
        await _insert_telegram(db, ga="2/0/1", ts=_ts(0))

        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        await run_bus_wide_detectors(
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=_ts(-86400),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )

        resp = await list_findings_response(repo, code="ORPHAN_GA")
        assert resp["total"] == 1
        assert resp["items"][0]["ga"] == "2/0/0"

    @pytest.mark.asyncio
    async def test_stale_ga_finding_for_long_silent_address(
        self, db: Database
    ) -> None:
        """Iter 25-Wiring: GA mit altem letzten Telegramm -> STALE_GA."""
        # Arrange — GA mit letztem Telegramm vor 40 Tagen.
        await _insert_ga(db, ga="3/0/0", dpt="1.001", label="Letztes mal aktiv")
        forty_days_ago = (
            datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) - timedelta(days=40)
        ).isoformat(timespec="seconds")
        await _insert_telegram(db, ga="3/0/0", ts=forty_days_ago)

        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        await run_bus_wide_detectors(
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=(
                datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC) - timedelta(days=60)
            ).isoformat(timespec="seconds"),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC),
        )

        resp = await list_findings_response(repo, code="STALE_GA")
        assert resp["total"] == 1
        assert resp["items"][0]["evidence"]["days_silent"] >= 30

    @pytest.mark.asyncio
    async def test_multi_time_master_finding_for_two_sources_on_clock_dpt(
        self, db: Database
    ) -> None:
        """Iter 18-Wiring: 2 Sources schreiben auf DPT 10.001 -> MULTI_TIME_MASTER."""
        ga = "4/0/0"
        await _insert_ga(db, ga=ga, dpt="10.001", label="Zeit")
        await _insert_telegram(db, ga=ga, ts=_ts(0), dev_source="1.1.10")
        await _insert_telegram(db, ga=ga, ts=_ts(60), dev_source="1.1.20")

        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        await run_bus_wide_detectors(
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=_ts(-3600),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )

        resp = await list_findings_response(repo, code="MULTI_TIME_MASTER")
        assert resp["total"] == 1
        sources = resp["items"][0]["evidence"]["sources"]
        assert "1.1.10" in sources
        assert "1.1.20" in sources

    @pytest.mark.asyncio
    async def test_runner_safe_for_empty_db(self, db: Database) -> None:
        """Defensiv: leerer Bus darf den Runner nicht crashen."""
        repo = FindingsRepository(db)
        knx_repo = KnxAddressRepository(db)
        stats_repo = KnxStatsRepository(db)
        await run_bus_wide_detectors(
            findings_repo=repo,
            address_repo=knx_repo,
            stats_repo=stats_repo,
            period_from=_ts(-3600),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )
        resp = await list_findings_response(repo)
        assert resp["total"] == 0


class _FakeHass:
    """Minimaler hass-Stub fuer den Tick-Test (Iter A3)."""

    def __init__(self, bus_analysis_enabled: bool = True) -> None:
        from custom_components.messagehub.const import (
            DOMAIN,
            HASS_KEY_KNX_BUS_ANALYSIS,
        )

        self.data = {
            DOMAIN: {HASS_KEY_KNX_BUS_ANALYSIS: bus_analysis_enabled}
        }


class TestBusWideJobTick:
    """Iter 29b: periodischer Job-Wrapper schluckt Exceptions."""

    @pytest.mark.asyncio
    async def test_tick_calls_runner_and_records_findings(
        self, db: Database
    ) -> None:
        from custom_components.messagehub.jobs.periodic import (
            _run_findings_bus_wide_tick,
        )

        # Setze einen ORPHAN_GA-Trigger.
        await _insert_ga(db, ga="5/0/0", dpt="1.001")

        await _run_findings_bus_wide_tick(_FakeHass(), db)

        repo = FindingsRepository(db)
        resp = await list_findings_response(repo, code="ORPHAN_GA")
        assert resp["total"] == 1
        assert resp["items"][0]["ga"] == "5/0/0"

    @pytest.mark.asyncio
    async def test_tick_swallows_runtime_errors(self, db: Database) -> None:
        """Defensiv: Tick darf bei DB-Fehler nicht crashen."""
        from custom_components.messagehub.jobs.periodic import (
            _run_findings_bus_wide_tick,
        )

        # Schliesse die DB, damit Repo-Aufrufe RuntimeError werfen.
        await db.close()
        try:
            # Soll _LOGGER.warning ausloesen, aber NICHT raisen.
            await _run_findings_bus_wide_tick(_FakeHass(), db)
        finally:
            await db.open()

    @pytest.mark.asyncio
    async def test_tick_emits_analysis_disabled_when_toggle_off(
        self, db: Database
    ) -> None:
        """Iter A3: Wenn Bus-Analyse-Toggle aus ist, soll der Tick nur
        ein ANALYSIS_DISABLED-Finding schreiben — nicht alle Detektoren
        durchlaufen."""
        from custom_components.messagehub.jobs.periodic import (
            _run_findings_bus_wide_tick,
        )

        await _insert_ga(db, ga="5/0/0", dpt="1.001")  # Trigger ORPHAN

        await _run_findings_bus_wide_tick(
            _FakeHass(bus_analysis_enabled=False), db
        )

        repo = FindingsRepository(db)
        resp = await list_findings_response(repo)
        codes = {it["code"] for it in resp["items"]}
        assert codes == {"ANALYSIS_DISABLED"}
