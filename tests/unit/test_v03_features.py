"""v0.3-Tests: Pattern-Mining, GeoIP-Resolver, native Notification-Adapter."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from custom_components.messagehub.processing.geoip import GeoIpResolver, extract_ips
from custom_components.messagehub.processing.patterns import detect_patterns
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


# --- Pattern-Mining ---


@pytest.mark.asyncio
async def test_pattern_mining_detects_daily(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    base = datetime.now(UTC) - timedelta(days=10)
    for i in range(8):
        ts = base + timedelta(days=i)
        await repo.insert(
            Message(
                severity=Severity.WARNING,
                source="cron-job",
                text="daily run started",
                timestamp=ts,
            )
        )
    patterns = await detect_patterns(db, days=30)
    assert any(p.period == "daily" for p in patterns)


@pytest.mark.asyncio
async def test_pattern_mining_no_pattern_for_random(db_repo) -> None:  # type: ignore[no-untyped-def]
    db, repo = db_repo
    base = datetime.now(UTC) - timedelta(days=10)
    irregular_offsets_hours = [0, 7, 23, 47, 50, 99, 120]
    for offset in irregular_offsets_hours:
        await repo.insert(
            Message(
                severity=Severity.INFO,
                source="random",
                text="irregular",
                timestamp=base + timedelta(hours=offset),
            )
        )
    patterns = await detect_patterns(db, days=30)
    assert all(p.source != "random" for p in patterns)


# --- GeoIP ---


def test_extract_ips_filters_private() -> None:
    text = "client 8.8.8.8 connected, then 192.168.1.10 internal, also 10.0.0.5"
    ips = extract_ips(text)
    assert ips == ["8.8.8.8"]


def test_extract_ips_no_duplicates() -> None:
    text = "1.1.1.1 then 1.1.1.1 again, plus 9.9.9.9"
    assert extract_ips(text) == ["1.1.1.1", "9.9.9.9"]


def test_geoip_resolver_disabled_without_db() -> None:
    resolver = GeoIpResolver(None)
    assert resolver.enabled is False
    assert resolver.lookup("8.8.8.8") is None


def test_geoip_resolver_disabled_with_missing_file(tmp_path: Path) -> None:
    resolver = GeoIpResolver(tmp_path / "doesnt-exist.mmdb")
    assert resolver.enabled is False


# --- Native Notification-Adapter (Smoke-Test, kein Netzwerk) ---


def test_native_adapters_importable() -> None:
    from custom_components.messagehub.notifications.native_adapters import (  # noqa: PLC0415
        ntfy_send,
        pushover_send,
        telegram_send,
    )

    assert callable(telegram_send)
    assert callable(pushover_send)
    assert callable(ntfy_send)


# --- Migration-Checksums ---


@pytest.mark.asyncio
async def test_migration_records_sha256(tmp_path: Path) -> None:
    db = Database(tmp_path / "m.db")
    await db.open()
    try:
        await MigrationRunner(db).run()
        rows = await db.fetch_all("SELECT version, sha256 FROM schema_version WHERE version = 1")
        assert len(rows) == 1
        assert rows[0]["sha256"] is not None
        assert len(str(rows[0]["sha256"])) == 64
    finally:
        await db.close()
