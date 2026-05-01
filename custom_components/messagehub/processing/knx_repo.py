"""KNX-Gruppenadress-Repository (Iter 48 — UI-Variante).

Loest die CSV-Konfiguration ab. Verwaltung erfolgt komplett ueber das
Panel-UI, optional mit einmaligem ETS-CSV-Bulk-Import.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..storage import Database


_GA_PATTERN = re.compile(r"^\d{1,2}/\d{1,2}/\d{1,3}$")


@dataclass(slots=True)
class KnxAddress:
    address: str
    label: str
    dpt: str | None = None
    description: str | None = None


def validate_address(value: str) -> str:
    if not _GA_PATTERN.fullmatch(value):
        raise ValueError(f"invalid KNX group address {value!r}: must match N/N/N (1-2/1-2/1-3)")
    return value


class KnxAddressRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def upsert(self, item: KnxAddress) -> None:
        validate_address(item.address)
        if not item.label.strip():
            raise ValueError("label must not be empty")
        now = datetime.now(UTC).isoformat(timespec="seconds")
        await self._db.execute(
            "INSERT INTO knx_group_addresses "
            "(address, label, dpt, description, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(address) DO UPDATE SET "
            "label = excluded.label, "
            "dpt = excluded.dpt, "
            "description = excluded.description, "
            "updated_at = excluded.updated_at",
            (item.address, item.label.strip(), item.dpt, item.description, now, now),
        )

    async def delete(self, address: str) -> bool:
        cursor = await self._db.connection.execute(
            "DELETE FROM knx_group_addresses WHERE address = ?", (address,)
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount > 0
        await cursor.close()
        return deleted

    async def list_all(self) -> list[KnxAddress]:
        rows = await self._db.fetch_all("SELECT * FROM knx_group_addresses ORDER BY address")
        return [
            KnxAddress(
                address=str(row["address"]),
                label=str(row["label"]),
                dpt=row["dpt"],
                description=row["description"],
            )
            for row in rows
        ]

    async def lookup(self, address: str) -> str | None:
        row = await self._db.fetch_one(
            "SELECT label FROM knx_group_addresses WHERE address = ?",
            (address,),
        )
        return str(row["label"]) if row is not None else None

    async def bulk_import_csv(self, csv_content: str) -> dict[str, int]:
        """Importiert ETS-CSV-Inhalt. Liefert {imported, skipped, errors}."""
        from .knx import load_ets_csv  # noqa: PLC0415

        mapping = load_ets_csv(csv_content)
        imported = 0
        skipped = 0
        errors = 0
        for address, label in mapping.items():
            try:
                await self.upsert(KnxAddress(address=address, label=label))
                imported += 1
            except ValueError:
                errors += 1
            except RuntimeError:
                skipped += 1
        return {"imported": imported, "skipped": skipped, "errors": errors}
