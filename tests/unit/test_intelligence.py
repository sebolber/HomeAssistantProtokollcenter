"""Tests fuer FTS5, Trace, Heartbeat, Anomaly (Iter 33-36)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.anomaly import (
    SourceMetric,
    SourceMetricsRepository,
    is_anomaly,
    update,
)
from custom_components.messagehub.processing.heartbeat import (
    HeartbeatRepository,
    HeartbeatSource,
    is_silent,
)
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
async def test_fts_finds_substring(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    await repo.insert(Message(severity=Severity.ERROR, source="x", text="DNS query timeout"))
    await repo.insert(Message(severity=Severity.INFO, source="x", text="Update finished"))

    rows = await db.fetch_all(
        "SELECT id FROM messages WHERE id IN "
        "(SELECT rowid FROM messages_fts WHERE messages_fts MATCH ?)",
        ("DNS",),
    )
    assert len(rows) == 1


@pytest.mark.asyncio
async def test_silent_source_triggers_warning() -> None:
    now = datetime.now(UTC)
    hb = HeartbeatSource(
        source="aktor",
        expected_interval_seconds=3600,
        last_seen=now - timedelta(hours=2),
    )
    assert is_silent(hb, now=now) is True


def test_heartbeat_within_window_not_silent() -> None:
    now = datetime.now(UTC)
    hb = HeartbeatSource(
        source="aktor",
        expected_interval_seconds=3600,
        last_seen=now - timedelta(minutes=30),
    )
    assert is_silent(hb, now=now) is False


@pytest.mark.asyncio
async def test_heartbeat_repo_upsert_and_touch(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, _ = db_repo
    repo = HeartbeatRepository(db)
    await repo.upsert(HeartbeatSource(source="x", expected_interval_seconds=60))
    await repo.touch("x")
    items = await repo.list_all()
    assert len(items) == 1
    assert items[0].last_seen is not None


def test_ewma_baseline_stable_over_time() -> None:
    metric = SourceMetric(source="x")
    for _ in range(20):
        metric = update(metric, 5)
    # Sollte sich nahe 5 einpendeln
    assert 4.0 < metric.ewma_rate < 6.0


def test_burst_triggers_anomaly() -> None:
    metric = SourceMetric(source="x")
    for _ in range(20):
        metric = update(metric, 1)
    # Bei 50 sollten wir weit ueber dem Mittel + 3 sigma sein
    assert is_anomaly(metric, 50) is True


def test_anomaly_needs_minimum_samples() -> None:
    metric = SourceMetric(source="x")
    metric = update(metric, 100)
    assert is_anomaly(metric, 100) is False


@pytest.mark.asyncio
async def test_source_metrics_persistence(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, _ = db_repo
    repo = SourceMetricsRepository(db)
    metric = SourceMetric(source="x", ewma_rate=4.2, ewma_variance=2.0, samples=15)
    await repo.save(metric)
    loaded = await repo.get("x")
    assert loaded.ewma_rate == pytest.approx(4.2)
    assert loaded.samples == 15


@pytest.mark.asyncio
async def test_trace_id_filter(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    mid = await repo.insert(Message(severity=Severity.INFO, source="x", text="a"))
    await db.execute("UPDATE messages SET trace_id = ? WHERE id = ?", ("abc-123", mid))
    await repo.insert(Message(severity=Severity.INFO, source="x", text="b"))
    items = await repo.list_filtered(trace_id="abc-123")
    assert len(items) == 1
