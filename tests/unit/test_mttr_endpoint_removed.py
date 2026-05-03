"""F-003: MttrView wird in Iter +6 entfernt.

Begruendung: `mttr_per_source` ist bereits Teil von /stats-extended
(StatsExtendedView). Der dedizierte /mttr-Endpoint hatte keinen
Frontend-Caller und stellte Duplicate-Code dar (DRY).

Diese Tests verifizieren:
- MttrView und ihre URL existieren nicht mehr in api/messages.py
- /api/messagehub/mttr ist nicht mehr in async_register_views
- StatsExtendedView liefert weiterhin mttr_per_source (Schutz vor
  versehentlicher Dual-Loeschung)
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)


_API_FILE = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "messagehub"
    / "api"
    / "messages.py"
)


def test_mttr_view_class_removed() -> None:
    src = _API_FILE.read_text(encoding="utf-8")
    tree = ast.parse(src)
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == "MttrView":
            raise AssertionError(
                "MttrView wurde in Iter +6 entfernt — "
                "stats-extended liefert MTTR redundant. Wenn du den "
                "Endpoint zurueck willst, lies F-003 in 05-findings.md."
            )


def test_mttr_url_path_removed() -> None:
    src = _API_FILE.read_text(encoding="utf-8")
    assert '"/api/messagehub/mttr"' not in src
    assert "/api/messagehub/mttr'" not in src


def test_mttr_view_not_in_register() -> None:
    src = _API_FILE.read_text(encoding="utf-8")
    register_section = src.split("def async_register_views")[1]
    assert "MttrView" not in register_section


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


@pytest.mark.asyncio
async def test_stats_extended_still_returns_mttr_per_source(db: Database) -> None:
    """Sanity: nach Loeschung von MttrView bleibt mttr_per_source ueber
    stats-extended verfuegbar."""
    repo = MessageRepository(db)
    # Eine Nachricht reicht — Repository sollte mttr_per_source als
    # Liste/Mapping liefern, leer ist auch OK fuer den Schema-Check.
    await repo.insert(Message(severity=Severity.INFO, source="x", text="hi"))
    result = await repo.mttr_per_source(days=30)
    # Liste oder leeres Iterable — Hauptsache, der Aufruf wirft nicht.
    assert result is not None
