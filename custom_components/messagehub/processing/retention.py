"""Retention-Job (Iter 24).

Taeglich 03:30 lokal: pro Severity max-Alter und max-Anzahl. Wochen-VACUUM.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Mapping

    from ..storage import Database

_LOGGER = logging.getLogger(__name__)

_DEFAULT_MAX_DAYS: dict[str, int] = {
    "debug": 7,
    "info": 30,
    "warning": 90,
    "error": 365,
}


async def run_retention(
    database: Database,
    *,
    max_days: Mapping[str, int] | None = None,
    hard_cap_total: int | None = 100_000,
) -> dict[str, int]:
    """Loescht abgelaufene Nachrichten. Liefert {"by_severity": ..., "hard_cap": N}."""
    days = dict(_DEFAULT_MAX_DAYS)
    if max_days:
        for sev, val in max_days.items():
            if sev in days and val > 0:
                days[sev] = val

    deleted_by_sev: dict[str, int] = {}
    for sev, max_age in days.items():
        cutoff = (datetime.now(UTC) - timedelta(days=max_age)).isoformat(timespec="seconds")
        cursor = await database.connection.execute(
            "DELETE FROM messages WHERE severity = ? AND timestamp < ?",
            (sev, cutoff),
        )
        await database.connection.commit()
        deleted_by_sev[sev] = cursor.rowcount or 0
        await cursor.close()

    deleted_cap = 0
    if hard_cap_total is not None and hard_cap_total > 0:
        # Loescht die aeltesten ueber dem Cap.
        cursor = await database.connection.execute(
            """
            DELETE FROM messages
            WHERE id IN (
                SELECT id FROM messages
                ORDER BY timestamp ASC, id ASC
                LIMIT MAX(0, (SELECT COUNT(*) FROM messages) - ?)
            )
            """,
            (hard_cap_total,),
        )
        await database.connection.commit()
        deleted_cap = cursor.rowcount or 0
        await cursor.close()

    _LOGGER.info("retention deleted: by_severity=%s hard_cap=%d", deleted_by_sev, deleted_cap)
    return {**deleted_by_sev, "hard_cap": deleted_cap}


async def run_vacuum(database: Database) -> None:
    await database.executescript("VACUUM;")
    _LOGGER.info("VACUUM completed")


async def run_wal_checkpoint(database: Database) -> tuple[int, int, int]:
    """Iter A2: WAL-Checkpoint im TRUNCATE-Modus.

    SQLite-WAL-Mode buffert Schreib-Operationen in der Sidecar-Datei
    ``<db>-wal``. Ohne periodisches Checkpointen kann sie unter starker
    Schreib-Last (KNX-Bus mit ~48 Tel/s) auf mehrere GB wachsen, bevor
    SQLite intern selbst checkpointet — Disk-Verbrauch und langsamere
    Reads. ``TRUNCATE`` schrumpft die WAL-Datei nach erfolgreichem
    Checkpoint auf 0 Byte.

    Liefert das ``PRAGMA wal_checkpoint``-Tupel ``(busy, log, checkpointed)``:
    - busy: 0 wenn erfolgreich, 1 wenn Reader/Writer blockierten.
    - log: Anzahl der Frames im WAL.
    - checkpointed: Anzahl der frames, die in die DB geschrieben wurden.
    """
    cursor = await database.connection.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    try:
        row = await cursor.fetchone()
    finally:
        await cursor.close()
    await database.connection.commit()
    if row is None:
        _LOGGER.debug("wal_checkpoint returned no row")
        return (0, 0, 0)
    busy = int(row[0]) if row[0] is not None else 0
    log = int(row[1]) if row[1] is not None else 0
    checkpointed = int(row[2]) if row[2] is not None else 0
    if busy or checkpointed:
        _LOGGER.debug(
            "wal_checkpoint: busy=%d log=%d checkpointed=%d",
            busy, log, checkpointed,
        )
    return (busy, log, checkpointed)
