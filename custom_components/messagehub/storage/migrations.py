"""Migration-Runner fuer messagehub.

Liest SQL-Dateien aus `migrations/`, fuehrt sie idempotent aus und
trackt den aktuellen Schema-Stand in `schema_version`.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .database import Database

_LOGGER = logging.getLogger(__name__)

_MIGRATIONS_DIR = Path(__file__).parent / "sql"
_FILENAME_PATTERN = re.compile(r"^(\d{4})_(.+)\.sql$")


@dataclass(frozen=True, slots=True)
class Migration:
    """Eine einzelne Migrations-Definition."""

    version: int
    name: str
    sql: str

    @classmethod
    def from_path(cls, path: Path) -> Migration:
        match = _FILENAME_PATTERN.match(path.name)
        if not match:
            raise ValueError(
                f"Migration filename {path.name!r} does not match pattern NNNN_name.sql"
            )
        return cls(
            version=int(match.group(1)),
            name=match.group(2),
            sql=path.read_text(encoding="utf-8"),
        )


def discover_migrations(directory: Path = _MIGRATIONS_DIR) -> list[Migration]:
    """Liest alle Migrations-Dateien aus dem Verzeichnis und sortiert sie nach Version."""
    if not directory.is_dir():
        return []
    files = sorted(p for p in directory.iterdir() if p.suffix == ".sql")
    migrations = [Migration.from_path(p) for p in files]
    versions = [m.version for m in migrations]
    if len(versions) != len(set(versions)):
        raise ValueError(f"Duplicate migration version numbers in {directory}")
    return migrations


class MigrationRunner:
    """Fuehrt SQL-Migrations aus, idempotent."""

    def __init__(
        self,
        database: Database,
        migrations: list[Migration] | None = None,
    ) -> None:
        self._db = database
        self._migrations = (
            sorted(migrations, key=lambda m: m.version)
            if migrations is not None
            else discover_migrations()
        )

    async def run(self) -> int:
        """Wendet noch nicht angewandte Migrationen an. Gibt aktuelle Version zurueck."""
        await self._ensure_version_table()
        current = await self.current_version()
        applied = 0
        for migration in self._migrations:
            if migration.version <= current:
                continue
            _LOGGER.info("Applying migration %04d_%s", migration.version, migration.name)
            await self._db.executescript(migration.sql)
            await self._db.execute(
                "INSERT INTO schema_version (version, name, applied_at) VALUES (?, ?, ?)",
                (
                    migration.version,
                    migration.name,
                    datetime.now(UTC).isoformat(timespec="seconds"),
                ),
            )
            applied += 1
        if applied:
            _LOGGER.info("Applied %d migration(s)", applied)
        return await self.current_version()

    async def current_version(self) -> int:
        """Liefert die hoechste applied Version oder 0, wenn noch nichts angewandt wurde."""
        await self._ensure_version_table()
        row = await self._db.fetch_one("SELECT MAX(version) AS v FROM schema_version")
        if row is None:
            return 0
        value = row["v"]
        return int(value) if value is not None else 0

    async def _ensure_version_table(self) -> None:
        await self._db.executescript(
            """
            CREATE TABLE IF NOT EXISTS schema_version (
                version    INTEGER PRIMARY KEY,
                name       TEXT    NOT NULL,
                applied_at TEXT    NOT NULL
            );
            """
        )
