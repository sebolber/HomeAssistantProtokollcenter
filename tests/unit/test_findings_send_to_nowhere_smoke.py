"""Iter 31 (knx-findings): SEND_TO_NOWHERE End-to-End-Smoke-Test.

Vertrag: der Detector wird im per-GA-Runner einsortiert (analog zu
DPT_MISMATCH/MULTI_RESPONDER/etc.). Caller-Pflicht damit erfuellt.

Naming-Konvention `test_<feature>_visible_after_<trigger>`.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.findings_runner import (
    run_per_ga_detectors,
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


def _ts(offset_seconds: float) -> str:
    base = datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return (base + timedelta(seconds=offset_seconds)).isoformat(timespec="seconds")


async def _insert_telegram(
    db: Database,
    *,
    ga: str,
    ts: str,
    value: object = 1,
    source: str = "1.1.10",
    telegramtype: str = "GroupValueWrite",
) -> None:
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, 0)",
        (ts, ga, source, telegramtype, json.dumps(value, default=str)),
    )


async def _insert_ga(db: Database, *, ga: str, dpt: str = "1.001") -> None:
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (ga, "Sensor", dpt, now, now),
    )


class TestSendToNowhereSmoke:
    @pytest.mark.asyncio
    async def test_send_to_nowhere_finding_visible_via_api_after_write_without_status(
        self, db: Database
    ) -> None:
        # Arrange — Write ohne Status-Echo, Schreibzeit weit vor "now".
        ga = "13/0/0"
        await _insert_ga(db, ga=ga)
        await _insert_telegram(db, ga=ga, ts=_ts(0), value=1)

        # Act — Per-GA-Runner ueber 24-h-Periode triggern.
        await run_per_ga_detectors(
            ga=ga,
            findings_repo=FindingsRepository(db),
            address_repo=KnxAddressRepository(db),
            stats_repo=KnxStatsRepository(db),
            period_from=_ts(-3600),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )

        # Assert — Finding sichtbar via API.
        resp = await list_findings_response(
            FindingsRepository(db), ga=ga, code="SEND_TO_NOWHERE",
        )
        assert resp["total"] == 1, resp
        assert resp["items"][0]["code"] == "SEND_TO_NOWHERE"

    @pytest.mark.asyncio
    async def test_no_finding_when_write_followed_by_status(
        self, db: Database
    ) -> None:
        ga = "13/0/1"
        await _insert_ga(db, ga=ga)
        await _insert_telegram(db, ga=ga, ts=_ts(0), value=1)
        await _insert_telegram(
            db, ga=ga, ts=_ts(1), value=0,
            source="1.1.20",
        )

        await run_per_ga_detectors(
            ga=ga,
            findings_repo=FindingsRepository(db),
            address_repo=KnxAddressRepository(db),
            stats_repo=KnxStatsRepository(db),
            period_from=_ts(-3600),
            period_to=_ts(3600),
            now=datetime(2026, 5, 3, 9, 0, 0, tzinfo=UTC),
        )

        resp = await list_findings_response(
            FindingsRepository(db), ga=ga, code="SEND_TO_NOWHERE",
        )
        assert resp["total"] == 0
