"""Iter C (knx-detail-panes): API-View KnxStatsSourceDetailView.

Smoke-Test: laedt Telegramme, ruft die Service-Methode (= View-Body)
und prueft, dass das JSON-DTO die erwarteten Felder enthaelt. Plus
ast-basiert: View-URL + HTTP-Methoden-Signatur (gleiche Strategie wie
test_api_view_kwarg_signatures.py).
"""

from __future__ import annotations

import ast
import json
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


def _ts(offset_seconds: float, *, base: datetime | None = None) -> str:
    base_dt = base or datetime(2026, 5, 3, 8, 0, 0, tzinfo=UTC)
    return (base_dt + timedelta(seconds=offset_seconds)).isoformat(timespec="seconds")


async def _seed(db: Database, *, ga: str, source: str = "1.1.10") -> None:
    now = _ts(0)
    await db.execute(
        "INSERT INTO knx_group_addresses "
        "(address, label, dpt, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (ga, "GA", "1.001", now, now),
    )
    for i in range(5):
        await db.execute(
            "INSERT INTO knx_raw_telegrams "
            "(timestamp, destination, source, telegramtype, value, repeated) "
            "VALUES (?, ?, ?, ?, ?, 0)",
            (_ts(i), ga, source, "GroupValueWrite", json.dumps(1)),
        )


class TestSourceDetailViewIntegration:
    @pytest.mark.asyncio
    async def test_view_response_contains_required_fields(self, db: Database) -> None:
        """Spiegelt den View-Body: compute_source_detail + dict-Wrap +
        device/manufacturer_hints. Wir testen den Service-Pfad direkt,
        weil der HA-aiohttp-Stack im Unit-Test nicht aktiv ist.
        """
        await _seed(db, ga="1/1/1")
        svc = KnxStatsService(KnxStatsRepository(db))
        from_iso = _ts(-60)
        to_iso = _ts(3600)
        detail = await svc.compute_source_detail("1.1.10", from_iso, to_iso)
        assert detail is not None

        result = source_detail_to_dict(detail)
        # Felder, die der API-View zusaetzlich beifuegt:
        result["from"] = from_iso
        result["to"] = to_iso
        result["device"] = None  # ohne ETS-Projekt
        result["manufacturer_hints"] = None

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
            "from",
            "to",
            "device",
            "manufacturer_hints",
        ):
            assert key in result, f"missing key {key} in API response"

        # JSON-serialisierbar (kein datetime/Decimal/bytes).
        json.dumps(result)


class TestSourceDetailViewStaticContract:
    """ast-basiert: kein HA-Stack noetig.

    Spiegelt die Strategie aus test_api_view_kwarg_signatures.py.
    """

    def test_view_url_includes_dev_source_path_param(self) -> None:
        view_src = (
            Path(__file__).resolve().parents[2]
            / "custom_components"
            / "messagehub"
            / "api"
            / "knx_stats.py"
        ).read_text(encoding="utf-8")
        tree = ast.parse(view_src)
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == "KnxStatsSourceDetailView":
                url_assigns = [
                    s
                    for s in node.body
                    if isinstance(s, ast.Assign)
                    and any(isinstance(t, ast.Name) and t.id == "url" for t in s.targets)
                ]
                assert url_assigns, "KnxStatsSourceDetailView muss `url` setzen"
                url_value = url_assigns[0].value
                assert isinstance(url_value, ast.Constant)
                assert "{dev_source}" in str(url_value.value), url_value.value
                return
        raise AssertionError("KnxStatsSourceDetailView nicht gefunden")

    def test_view_get_accepts_dev_source_kwarg(self) -> None:
        """Spiegelt aiohttp-error-ZU9UA-Regression: HA ruft den Handler
        ueber `handler(request, **request.match_info)` auf.
        """
        view_src = (
            Path(__file__).resolve().parents[2]
            / "custom_components"
            / "messagehub"
            / "api"
            / "knx_stats.py"
        ).read_text(encoding="utf-8")
        tree = ast.parse(view_src)
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == "KnxStatsSourceDetailView":
                methods = {
                    m.name: m
                    for m in node.body
                    if isinstance(m, (ast.AsyncFunctionDef, ast.FunctionDef))
                }
                assert "get" in methods
                args = methods["get"].args
                names = {a.arg for a in args.args} | {a.arg for a in args.kwonlyargs}
                assert "dev_source" in names, names
                return
        raise AssertionError("KnxStatsSourceDetailView nicht gefunden")

    def test_view_registered_in_async_register_views(self) -> None:
        """Iter C: View muss in api/messages.py:async_register_views
        eingebunden sein, sonst rendert HA den Endpoint nicht.
        """
        msg_src = (
            Path(__file__).resolve().parents[2]
            / "custom_components"
            / "messagehub"
            / "api"
            / "messages.py"
        ).read_text(encoding="utf-8")
        assert "KnxStatsSourceDetailView" in msg_src
