"""Repository fuer KNX-Geraete-Profile (Iter L2.0).

Stellt CRUD-Operationen auf ``knx_devices`` bereit. Wird von der
Empfehlungs-Pipeline (Layer 2) und vom User-Pflege-Endpoint (L2.3)
verwendet.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .database import Database


def _now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def _normalize(value: str | None) -> str | None:
    """Lowercase + Whitespace-Trim. None-tolerant.

    Manufacturer-Namen kommen aus User-Eingaben mit unvorhersehbaren
    Schreibweisen ("MDT", "mdt ", "M.D.T.") — der Lookup arbeitet auf
    der canonical lowercase-Form.
    """
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    return cleaned.lower()


class KnxDeviceRepository:
    """Pflegt das ``knx_devices``-Aggregat.

    NICHT thread-safe — Aufrufe erfolgen sequenziell aus dem aiohttp-
    Loop. Konsistent zum Stil der bestehenden Repos im Projekt.
    """

    def __init__(self, db: Database) -> None:
        self._db = db

    async def get(self, dev_source: str) -> dict[str, Any] | None:
        """Liefert den Eintrag oder ``None``."""
        if not dev_source:
            return None
        row = await self._db.fetch_one(
            "SELECT dev_source, manufacturer, model, notes, "
            "       last_seen, created_at, updated_at "
            "FROM knx_devices WHERE dev_source = ?",
            (dev_source,),
        )
        if row is None:
            return None
        return _row_to_dict(row)

    async def list_all(self) -> list[dict[str, Any]]:
        """Liefert alle Geraete-Profile sortiert nach IA."""
        rows = await self._db.fetch_all(
            "SELECT dev_source, manufacturer, model, notes, "
            "       last_seen, created_at, updated_at "
            "FROM knx_devices ORDER BY dev_source ASC"
        )
        return [_row_to_dict(r) for r in rows]

    async def upsert(
        self,
        *,
        dev_source: str,
        manufacturer: str | None = None,
        model: str | None = None,
        notes: str | None = None,
    ) -> dict[str, Any]:
        """Legt neu an oder aktualisiert die Felder, die nicht ``None``
        sind. Ein expliziter Leerstring loescht das Feld (-> NULL).

        Returns das Ergebnis-Dict (alle Felder, frisch geladen).
        """
        if not dev_source:
            raise ValueError("dev_source must not be empty")
        existing = await self.get(dev_source)
        now = _now_iso()
        if existing is None:
            await self._db.execute(
                "INSERT INTO knx_devices "
                "(dev_source, manufacturer, model, notes, "
                " created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (
                    dev_source,
                    _empty_to_null(manufacturer),
                    _empty_to_null(model),
                    _empty_to_null(notes),
                    now,
                    now,
                ),
            )
        else:
            new_manufacturer = (
                _empty_to_null(manufacturer)
                if manufacturer is not None
                else existing["manufacturer"]
            )
            new_model = _empty_to_null(model) if model is not None else existing["model"]
            new_notes = _empty_to_null(notes) if notes is not None else existing["notes"]
            await self._db.execute(
                "UPDATE knx_devices SET "
                "manufacturer = ?, model = ?, notes = ?, updated_at = ? "
                "WHERE dev_source = ?",
                (new_manufacturer, new_model, new_notes, now, dev_source),
            )
        result = await self.get(dev_source)
        assert result is not None  # gerade upserted
        return result

    async def update_last_seen(self, dev_source: str, ts_iso: str) -> bool:
        """Idempotenter Refresh des ``last_seen``-Feldes.

        Greift NICHT in manufacturer/model ein — nur das Lebenszeichen.
        Returns True bei Update, False wenn der Eintrag fehlt (Caller
        kann dann optional einen leeren upsert anstossen).
        """
        if not dev_source:
            return False
        existing = await self.get(dev_source)
        if existing is None:
            return False
        await self._db.execute(
            "UPDATE knx_devices SET last_seen = ?, updated_at = ? WHERE dev_source = ?",
            (ts_iso, _now_iso(), dev_source),
        )
        return True

    async def delete(self, dev_source: str) -> bool:
        """Loescht einen Eintrag. True bei Erfolg, False wenn der
        Eintrag bereits weg war (idempotent fuer den User)."""
        if not dev_source:
            return False
        existing = await self.get(dev_source)
        if existing is None:
            return False
        await self._db.execute(
            "DELETE FROM knx_devices WHERE dev_source = ?",
            (dev_source,),
        )
        return True


def _empty_to_null(value: str | None) -> str | None:
    """Leerstrings → NULL. Nicht-Strings (z. B. None) bleiben durch."""
    if value is None:
        return None
    if value == "":
        return None
    return value


def _row_to_dict(row: Any) -> dict[str, Any]:
    return {
        "dev_source": str(row["dev_source"]),
        "manufacturer": row["manufacturer"],
        "model": row["model"],
        "notes": row["notes"],
        "last_seen": row["last_seen"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def normalize_manufacturer(value: str | None) -> str | None:
    """Public-Helper: gleiche Normalisierung wie repo-intern.

    Wird von Layer-2-Lookup-Code (knx_device_model_recommendations)
    verwendet, damit Tabellen-Keys + DB-Werte deckungsgleich sind.
    """
    return _normalize(value)
