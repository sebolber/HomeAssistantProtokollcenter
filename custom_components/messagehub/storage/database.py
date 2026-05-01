"""Async SQLite Connection-Manager fuer messagehub.

Stellt eine zentrale, langlebige Verbindung zur SQLite-Datei und sorgt
fuer korrekte PRAGMAs (`foreign_keys`, `journal_mode=WAL`).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

import aiosqlite

from ..const import DB_DIRNAME, DB_FILENAME

if TYPE_CHECKING:
    from collections.abc import Iterable
    from types import TracebackType

_LOGGER = logging.getLogger(__name__)


class Database:
    """Async-SQLite-Wrapper.

    Lebenszyklus:
        db = Database(path)
        await db.open()
        ...
        await db.close()

    Oder als Async-Context-Manager:
        async with Database(path) as db:
            ...
    """

    def __init__(self, path: Path | str) -> None:
        self._path: Path = Path(path)
        self._conn: aiosqlite.Connection | None = None

    @classmethod
    def for_config_dir(cls, config_dir: Path | str) -> Database:
        """Konstruktor: nutzt das HA-Config-Verzeichnis und ergaenzt Unterordner."""
        directory = Path(config_dir) / DB_DIRNAME
        return cls(directory / DB_FILENAME)

    @property
    def path(self) -> Path:
        return self._path

    @property
    def connection(self) -> aiosqlite.Connection:
        if self._conn is None:
            raise RuntimeError("Database is not open; call open() first")
        return self._conn

    async def open(self) -> None:
        """Oeffnet die Verbindung (idempotent) und legt Datei + Ordner an."""
        if self._conn is not None:
            return
        self._path.parent.mkdir(parents=True, exist_ok=True)
        _LOGGER.debug("Opening messagehub database at %s", self._path)
        self._conn = await aiosqlite.connect(self._path)
        self._conn.row_factory = aiosqlite.Row
        await self._conn.execute("PRAGMA foreign_keys = ON")
        await self._conn.execute("PRAGMA journal_mode = WAL")
        await self._conn.execute("PRAGMA synchronous = NORMAL")
        await self._conn.commit()

    async def close(self) -> None:
        """Schliesst die Verbindung (idempotent)."""
        if self._conn is None:
            return
        await self._conn.close()
        self._conn = None

    async def execute(
        self,
        sql: str,
        parameters: Iterable[object] | None = None,
    ) -> None:
        """Fuehrt ein einzelnes Statement aus und committet."""
        await self.connection.execute(sql, parameters or ())
        await self.connection.commit()

    async def executescript(self, sql: str) -> None:
        """Fuehrt ein Multi-Statement-Skript in einer Transaktion aus."""
        await self.connection.executescript(sql)
        await self.connection.commit()

    async def fetch_one(
        self,
        sql: str,
        parameters: Iterable[object] | None = None,
    ) -> aiosqlite.Row | None:
        cursor = await self.connection.execute(sql, parameters or ())
        try:
            return await cursor.fetchone()
        finally:
            await cursor.close()

    async def fetch_all(
        self,
        sql: str,
        parameters: Iterable[object] | None = None,
    ) -> list[aiosqlite.Row]:
        cursor = await self.connection.execute(sql, parameters or ())
        try:
            return list(await cursor.fetchall())
        finally:
            await cursor.close()

    async def __aenter__(self) -> Database:
        await self.open()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        await self.close()
