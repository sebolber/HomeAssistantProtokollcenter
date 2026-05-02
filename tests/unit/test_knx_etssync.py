"""Iter 46 (N4): Intelligenter ETS-Projektdatei-Abgleich.

Beim Re-Import der ETS-Projektdatei sollen User-Konfigurationen
(log_enabled, log_severity, severity_on_true/false) erhalten bleiben,
solange sich label oder dpt nicht geaendert haben. Bei Aenderung des
ETS-Inhalts wird die User-Config bewusst zurueckgesetzt — denn die
Semantik der GA hat sich geaendert.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_repo import (
    KnxAddress,
    KnxAddressRepository,
    compute_etssync_plan,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.migrations import MigrationRunner


@pytest.fixture
async def db(tmp_path: Path) -> Database:
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


class TestComputeSyncPlan:
    def test_empty_db_and_empty_ets(self) -> None:
        plan = compute_etssync_plan(db_addresses=[], ets_items=[])
        assert plan == {"add": [], "update": [], "delete": [], "keep": []}

    def test_new_in_ets_goes_to_add(self) -> None:
        plan = compute_etssync_plan(
            db_addresses=[],
            ets_items=[{"address": "1/1/1", "name": "Tor", "dpt": "1.001"}],
        )
        assert len(plan["add"]) == 1
        assert plan["add"][0]["address"] == "1/1/1"
        assert plan["add"][0]["label"] == "Tor"
        assert plan["add"][0]["dpt"] == "1.001"

    def test_unchanged_goes_to_keep(self) -> None:
        plan = compute_etssync_plan(
            db_addresses=[
                {"address": "1/1/1", "label": "Tor", "dpt": "1.001"},
            ],
            ets_items=[{"address": "1/1/1", "name": "Tor", "dpt": "1.001"}],
        )
        assert plan["keep"] == ["1/1/1"]
        assert plan["update"] == []
        assert plan["delete"] == []
        assert plan["add"] == []

    def test_label_change_goes_to_update(self) -> None:
        plan = compute_etssync_plan(
            db_addresses=[
                {"address": "1/1/1", "label": "Tor", "dpt": "1.001"},
            ],
            ets_items=[{"address": "1/1/1", "name": "Tor Garage", "dpt": "1.001"}],
        )
        assert len(plan["update"]) == 1
        u = plan["update"][0]
        assert u["address"] == "1/1/1"
        assert u["label"] == "Tor Garage"
        assert u["old_label"] == "Tor"
        assert u["dpt"] == "1.001"
        assert u["old_dpt"] == "1.001"

    def test_dpt_change_goes_to_update(self) -> None:
        plan = compute_etssync_plan(
            db_addresses=[
                {"address": "1/1/1", "label": "Tor", "dpt": "1.001"},
            ],
            ets_items=[{"address": "1/1/1", "name": "Tor", "dpt": "5.001"}],
        )
        assert len(plan["update"]) == 1
        assert plan["update"][0]["dpt"] == "5.001"
        assert plan["update"][0]["old_dpt"] == "1.001"

    def test_removed_in_ets_goes_to_delete(self) -> None:
        plan = compute_etssync_plan(
            db_addresses=[
                {"address": "1/1/1", "label": "Tor", "dpt": "1.001"},
                {"address": "2/2/2", "label": "Licht", "dpt": "1.001"},
            ],
            ets_items=[{"address": "1/1/1", "name": "Tor", "dpt": "1.001"}],
        )
        assert len(plan["delete"]) == 1
        assert plan["delete"][0]["address"] == "2/2/2"
        assert plan["delete"][0]["label"] == "Licht"
        assert plan["keep"] == ["1/1/1"]

    def test_null_dpt_treated_as_empty(self) -> None:
        # DB hat dpt=None, ETS-Item hat dpt=None -> keep, kein update
        plan = compute_etssync_plan(
            db_addresses=[{"address": "1/1/1", "label": "X", "dpt": None}],
            ets_items=[{"address": "1/1/1", "name": "X", "dpt": None}],
        )
        assert plan["keep"] == ["1/1/1"]

    def test_mixed_scenario(self) -> None:
        plan = compute_etssync_plan(
            db_addresses=[
                {"address": "1/0/0", "label": "Alt", "dpt": "1.001"},  # update
                {"address": "1/0/1", "label": "Bleibt", "dpt": "1.001"},  # keep
                {"address": "1/0/2", "label": "Weg", "dpt": "1.001"},  # delete
            ],
            ets_items=[
                {"address": "1/0/0", "name": "Neu", "dpt": "1.001"},  # update
                {"address": "1/0/1", "name": "Bleibt", "dpt": "1.001"},  # keep
                {"address": "1/0/3", "name": "Frisch", "dpt": "1.001"},  # add
            ],
        )
        assert {a["address"] for a in plan["add"]} == {"1/0/3"}
        assert {u["address"] for u in plan["update"]} == {"1/0/0"}
        assert {d["address"] for d in plan["delete"]} == {"1/0/2"}
        assert set(plan["keep"]) == {"1/0/1"}


class TestApplySyncPlan:
    @pytest.mark.asyncio
    async def test_add_uses_warning_default_severity(self, db: Database) -> None:
        repo = KnxAddressRepository(db)
        plan = {
            "add": [{"address": "1/1/1", "label": "Tor", "dpt": "1.001"}],
            "update": [],
            "delete": [],
            "keep": [],
        }
        counts = await repo.apply_etssync_plan(plan)
        assert counts == {"added": 1, "updated": 0, "deleted": 0}

        items = await repo.list_all()
        assert len(items) == 1
        assert items[0].log_severity == "warning"
        assert items[0].log_enabled is False

    @pytest.mark.asyncio
    async def test_update_resets_user_config(self, db: Database) -> None:
        repo = KnxAddressRepository(db)
        # Vorhanden mit User-Config
        await repo.upsert(
            KnxAddress(
                address="1/1/1",
                label="Tor alt",
                dpt="1.001",
                log_enabled=True,
                log_severity="error",
                severity_on_true="error",
                severity_on_false="info",
            )
        )
        plan = {
            "add": [],
            "update": [
                {
                    "address": "1/1/1",
                    "label": "Tor neu",
                    "dpt": "5.001",
                    "old_label": "Tor alt",
                    "old_dpt": "1.001",
                }
            ],
            "delete": [],
            "keep": [],
        }
        counts = await repo.apply_etssync_plan(plan)
        assert counts == {"added": 0, "updated": 1, "deleted": 0}

        items = await repo.list_all()
        assert len(items) == 1
        # ETS-Felder uebernommen
        assert items[0].label == "Tor neu"
        assert items[0].dpt == "5.001"
        # User-Config zurueckgesetzt — die Semantik der GA hat sich geaendert
        assert items[0].log_enabled is False
        assert items[0].log_severity == "warning"
        assert items[0].severity_on_true is None
        assert items[0].severity_on_false is None

    @pytest.mark.asyncio
    async def test_delete_removes_row(self, db: Database) -> None:
        repo = KnxAddressRepository(db)
        await repo.upsert(KnxAddress(address="9/9/9", label="Weg"))
        plan = {
            "add": [],
            "update": [],
            "delete": [{"address": "9/9/9", "label": "Weg"}],
            "keep": [],
        }
        counts = await repo.apply_etssync_plan(plan)
        assert counts == {"added": 0, "updated": 0, "deleted": 1}
        assert await repo.list_all() == []

    @pytest.mark.asyncio
    async def test_keep_preserves_user_config(self, db: Database) -> None:
        """KRITISCH: bei unveraendertem ETS-Eintrag bleibt User-Config bestehen."""
        repo = KnxAddressRepository(db)
        await repo.upsert(
            KnxAddress(
                address="1/1/1",
                label="Tor",
                dpt="1.001",
                log_enabled=True,
                log_severity="error",
                severity_on_true="error",
                severity_on_false="info",
            )
        )
        plan = {
            "add": [],
            "update": [],
            "delete": [],
            "keep": ["1/1/1"],
        }
        counts = await repo.apply_etssync_plan(plan)
        assert counts == {"added": 0, "updated": 0, "deleted": 0}

        items = await repo.list_all()
        # Komplett unveraendert
        assert items[0].log_enabled is True
        assert items[0].log_severity == "error"
        assert items[0].severity_on_true == "error"
        assert items[0].severity_on_false == "info"
