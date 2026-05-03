"""F-005: Tests fuer Heartbeat-Lifecycle (Delete + Enable/Disable).

Vorher hatte HeartbeatRepository nur upsert/touch/list_all/set_silent.
Iter +4 ergaenzt:
- delete(source): entfernt einen Eintrag
- set_enabled(source, enabled): toggelt das enabled-Flag

Plus neuer API-View HeartbeatDetailView mit:
- DELETE /api/messagehub/heartbeats/{source}
- PATCH  /api/messagehub/heartbeats/{source} (Body: {"enabled": bool})

Beide Endpoints sind admin-pflichtig und schreiben in den Audit-Log.
"""

from __future__ import annotations

import ast
import pytest
from pathlib import Path

from custom_components.messagehub.processing.heartbeat import (
    HeartbeatRepository,
    HeartbeatSource,
)
from custom_components.messagehub.storage.database import Database
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


class TestHeartbeatRepositoryDelete:
    @pytest.mark.asyncio
    async def test_delete_removes_existing_source(self, db: Database) -> None:
        repo = HeartbeatRepository(db)
        await repo.upsert(HeartbeatSource(source="raspi-keller", expected_interval_seconds=3600))
        assert len(await repo.list_all()) == 1

        deleted = await repo.delete("raspi-keller")

        assert deleted is True
        assert len(await repo.list_all()) == 0

    @pytest.mark.asyncio
    async def test_delete_returns_false_for_unknown_source(self, db: Database) -> None:
        repo = HeartbeatRepository(db)
        deleted = await repo.delete("does-not-exist")
        assert deleted is False

    @pytest.mark.asyncio
    async def test_delete_only_affects_target_source(self, db: Database) -> None:
        repo = HeartbeatRepository(db)
        await repo.upsert(HeartbeatSource(source="a", expected_interval_seconds=600))
        await repo.upsert(HeartbeatSource(source="b", expected_interval_seconds=600))

        await repo.delete("a")

        remaining = [hb.source for hb in await repo.list_all()]
        assert remaining == ["b"]


class TestHeartbeatRepositorySetEnabled:
    @pytest.mark.asyncio
    async def test_set_enabled_false_disables_source(self, db: Database) -> None:
        repo = HeartbeatRepository(db)
        await repo.upsert(HeartbeatSource(source="a", expected_interval_seconds=600))

        ok = await repo.set_enabled("a", False)

        assert ok is True
        items = {hb.source: hb for hb in await repo.list_all()}
        assert items["a"].enabled is False

    @pytest.mark.asyncio
    async def test_set_enabled_true_reenables_source(self, db: Database) -> None:
        repo = HeartbeatRepository(db)
        await repo.upsert(
            HeartbeatSource(source="a", expected_interval_seconds=600, enabled=False)
        )

        ok = await repo.set_enabled("a", True)

        assert ok is True
        items = {hb.source: hb for hb in await repo.list_all()}
        assert items["a"].enabled is True

    @pytest.mark.asyncio
    async def test_set_enabled_returns_false_for_unknown_source(self, db: Database) -> None:
        repo = HeartbeatRepository(db)
        ok = await repo.set_enabled("ghost", True)
        assert ok is False


class TestHeartbeatDetailViewStatic:
    """Statisches Audit der API-Klasse (kein HA-Stack benoetigt)."""

    @staticmethod
    def _api_src() -> str:
        return (
            Path(__file__).resolve().parents[2]
            / "custom_components"
            / "messagehub"
            / "api"
            / "messages.py"
        ).read_text(encoding="utf-8")

    def test_heartbeat_detail_view_class_exists(self) -> None:
        src = self._api_src()
        assert "HeartbeatDetailView" in src, (
            "HeartbeatDetailView fehlt — F-005 nicht implementiert"
        )

    def test_heartbeat_detail_view_url_template(self) -> None:
        tree = ast.parse(self._api_src())
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == "HeartbeatDetailView":
                for stmt in node.body:
                    if (
                        isinstance(stmt, ast.Assign)
                        and len(stmt.targets) == 1
                        and isinstance(stmt.targets[0], ast.Name)
                        and stmt.targets[0].id == "url"
                        and isinstance(stmt.value, ast.Constant)
                    ):
                        # Path-Param {source}; ohne {} -> falsche URL
                        assert "{source" in stmt.value.value
                        return
        raise AssertionError("HeartbeatDetailView.url-Attribut nicht gefunden")

    def test_heartbeat_detail_view_methods(self) -> None:
        tree = ast.parse(self._api_src())
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == "HeartbeatDetailView":
                method_names = {
                    sub.name
                    for sub in node.body
                    if isinstance(sub, ast.AsyncFunctionDef)
                }
                assert "delete" in method_names, "DELETE-Handler fehlt"
                assert "patch" in method_names, "PATCH-Handler fehlt"
                return
        raise AssertionError("HeartbeatDetailView nicht gefunden")

    def test_heartbeat_detail_view_handlers_take_source_kwarg(self) -> None:
        tree = ast.parse(self._api_src())
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == "HeartbeatDetailView":
                for sub in node.body:
                    if isinstance(sub, ast.AsyncFunctionDef) and sub.name in (
                        "delete",
                        "patch",
                    ):
                        arg_names = {a.arg for a in sub.args.args}
                        assert "source" in arg_names, (
                            f"{sub.name}-Handler muss source als kwarg nehmen "
                            f"(HA ruft handler(request, **request.match_info))"
                        )

    def test_heartbeat_detail_view_admin_protected(self) -> None:
        src = self._api_src()
        tree = ast.parse(src)
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == "HeartbeatDetailView":
                base_names = [
                    base.id if isinstance(base, ast.Name) else getattr(base, "attr", "")
                    for base in node.bases
                ]
                assert any("RequireAdminView" in name for name in base_names)
                return

    def test_heartbeat_detail_view_logs_audit(self) -> None:
        src = self._api_src()
        # delete-Audit-Action und patch-Audit-Action muessen vorkommen
        assert "heartbeat_delete" in src, (
            "DELETE-Handler muss action='heartbeat_delete' im Audit-Log schreiben"
        )
        assert "heartbeat_set_enabled" in src or "heartbeat_enabled" in src, (
            "PATCH-Handler muss eine Audit-Action zum enabled-Toggle schreiben"
        )

    def test_heartbeat_detail_view_registered(self) -> None:
        """Muss in async_register_views auftauchen, sonst 404."""
        src = self._api_src()
        # Suche async_register_views-Tuple
        registered_section = src.split("def async_register_views")[1]
        assert "HeartbeatDetailView" in registered_section, (
            "HeartbeatDetailView nicht in async_register_views — Frontend bekommt 404"
        )
