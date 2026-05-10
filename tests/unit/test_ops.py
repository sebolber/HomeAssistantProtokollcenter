"""Tests fuer Runbooks, Audit-Log, Export (Iter 43-45)."""

from __future__ import annotations

import io
import zipfile
from pathlib import Path

import pytest

from custom_components.messagehub.api.audit import AuditRepository
from custom_components.messagehub.api.export import (
    build_forensic_bundle,
    messages_to_csv,
    messages_to_jsonl,
)
from custom_components.messagehub.processing.runbooks import Runbook, RunbookRepository
from custom_components.messagehub.storage import (
    Database,
    Message,
    MessageRepository,
    MigrationRunner,
    Severity,
)


@pytest.fixture
async def db_repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield db, MessageRepository(db)
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_runbook_matched_by_source(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, _ = db_repo
    repo = RunbookRepository(db)
    await repo.add(
        Runbook(
            id=None,
            source_pattern="pihole",
            fingerprint=None,
            title="DNS",
            markdown="check pi-hole",
        )
    )
    rb = await repo.find_for("pihole", fingerprint=None)
    assert rb is not None
    assert rb.title == "DNS"


@pytest.mark.asyncio
async def test_runbook_specific_fingerprint_overrides_generic(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, _ = db_repo
    repo = RunbookRepository(db)
    await repo.add(
        Runbook(id=None, source_pattern="pihole", fingerprint=None, title="GEN", markdown="g")
    )
    await repo.add(
        Runbook(id=None, source_pattern="pihole", fingerprint="abc123", title="SPEC", markdown="s")
    )
    rb = await repo.find_for("pihole", fingerprint="abc123")
    assert rb is not None
    assert rb.title == "SPEC"


@pytest.mark.asyncio
async def test_audit_log_persists_actions(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, _ = db_repo
    audit = AuditRepository(db)
    await audit.record(actor="user1", action="delete", target_type="message", target_id="42")
    await audit.record(actor="user1", action="ack", target_type="message", target_id="42")
    items = await audit.list_recent()
    assert len(items) == 2
    assert items[0]["target_id"] == "42"


@pytest.mark.asyncio
async def test_audit_delete_all_clears_table_and_returns_count(db_repo) -> None:  # type: ignore[no-untyped-def]
    """Iter 44 (N5): Audit-Log loeschen liefert Anzahl + leert Tabelle."""
    db, _ = db_repo
    audit = AuditRepository(db)
    await audit.record(actor="u", action="a", target_type="t", target_id="1")
    await audit.record(actor="u", action="b", target_type="t", target_id="2")
    await audit.record(actor="u", action="c", target_type="t", target_id="3")

    deleted = await audit.delete_all()
    assert deleted == 3
    assert await audit.list_recent() == []


@pytest.mark.asyncio
async def test_audit_delete_all_on_empty_returns_zero(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, _ = db_repo
    audit = AuditRepository(db)
    assert await audit.delete_all() == 0


@pytest.mark.asyncio
async def test_export_jsonl_streams_chunked() -> None:
    msgs = [Message(severity=Severity.INFO, source="x", text=f"#{i}") for i in range(3)]
    out = messages_to_jsonl(msgs)
    assert out.count("\n") == 3
    assert "#0" in out
    assert "#1" in out
    assert "#2" in out


@pytest.mark.asyncio
async def test_export_csv_has_header_and_rows() -> None:
    msgs = [Message(severity=Severity.WARNING, source="x", text="hi")]
    csv_text = messages_to_csv(msgs)
    lines = csv_text.strip().splitlines()
    assert lines[0].startswith("id,timestamp,severity")
    assert "warning" in lines[1]


def test_iter80_csv_header_line_matches_full_export() -> None:
    """Iter 80 / CR-18: header_line + per-Row-Encoder muessen
    identisches Output zu messages_to_csv geben — Streaming darf nichts
    am Format aendern.
    """
    from custom_components.messagehub.api.export import (
        csv_header_line,
        message_to_csv_line,
    )

    msgs = [
        Message(severity=Severity.INFO, source="x", text="hi"),
        Message(severity=Severity.WARNING, source="y", text="ho"),
    ]
    streamed = csv_header_line() + "".join(message_to_csv_line(m) for m in msgs)
    full = messages_to_csv(msgs)
    assert streamed == full


def test_iter80_jsonl_per_row_matches_full_export() -> None:
    from custom_components.messagehub.api.export import message_to_jsonl_line

    msgs = [
        Message(severity=Severity.INFO, source="x", text="hi"),
        Message(severity=Severity.WARNING, source="y", text="ho"),
    ]
    streamed = "".join(message_to_jsonl_line(m) for m in msgs)
    full = messages_to_jsonl(msgs)
    assert streamed == full


def test_iter80_message_to_csv_line_quotes_special_characters() -> None:
    from custom_components.messagehub.api.export import message_to_csv_line

    m = Message(severity=Severity.INFO, source="x", text='line with, comma and "quote"')
    line = message_to_csv_line(m)
    # CSV-Quoting: Komma und " innerhalb Werten muessen escapet sein.
    assert '"line with, comma and ""quote"""' in line


def test_forensic_bundle_contains_all_artifacts() -> None:
    msgs = [Message(severity=Severity.ERROR, source="x", text="hi")]
    payload = build_forensic_bundle(msgs, config={"version": "1"})
    with zipfile.ZipFile(io.BytesIO(payload)) as zf:
        names = set(zf.namelist())
        assert {"messages.jsonl", "config.json"} == names
