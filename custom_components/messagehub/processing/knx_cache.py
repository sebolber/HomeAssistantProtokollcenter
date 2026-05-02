"""TTL-Cache fuer die KNX-Whitelist im Hot-Path.

Hintergrund: der KNX-Listener bekommt pro Telegramm einen Callback. Ohne
Cache wuerde er pro Telegramm einen DB-SELECT auf knx_group_addresses
machen — bei einem aktiven KNX-Bus mit 50-200 Telegrammen/Sek ist das
massive Verschwendung, weil sich die Whitelist nur aendert, wenn ein
Admin im Panel etwas konfiguriert (Stunden-/Tage-Skala).

Strategie: in-memory dict[str, KnxAddress] mit TTL. Invalidation
explizit beim CRUD (upsert/delete) — TTL ist nur Sicherheits-Netz, falls
ein Pfad die Invalidation vergisst.
"""

from __future__ import annotations

import asyncio
from time import monotonic
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .knx_repo import KnxAddress, KnxAddressRepository


class KnxWhitelistCache:
    """Cached die `log_enabled=1`-Adressen — single source of truth fuer den Listener.

    Lookups (`get(ga)`) sind synchron und zero-cost im Steady-State.
    Refresh laeuft genau einmal pro TTL — gleichzeitige Aufrufer warten
    auf denselben Refresh ueber `asyncio.Lock`.
    """

    DEFAULT_TTL_SECONDS = 300.0

    def __init__(
        self,
        repo: KnxAddressRepository,
        *,
        ttl_seconds: float = DEFAULT_TTL_SECONDS,
    ) -> None:
        self._repo = repo
        self._ttl = ttl_seconds
        self._items: dict[str, KnxAddress] = {}
        self._loaded_at: float = 0.0
        self._lock = asyncio.Lock()

    async def get(self, address: str) -> KnxAddress | None:
        """Liefert die GA-Konfig oder None. Refresht den Cache bei TTL-Ablauf."""
        if monotonic() - self._loaded_at > self._ttl:
            await self._refresh()
        return self._items.get(address)

    async def _refresh(self) -> None:
        """Laedt die aktuelle Whitelist neu — exklusiv via Lock."""
        async with self._lock:
            # Doppelt gepruefte Sperre: ein anderer Aufrufer kann uns
            # zuvor gekommen sein, dann ist der Cache schon frisch.
            if monotonic() - self._loaded_at <= self._ttl:
                return
            self._items = await self._repo.list_logged()
            self._loaded_at = monotonic()

    def invalidate(self) -> None:
        """Markiert den Cache als veraltet — naechster Lookup laedt neu.

        Wird vom CRUD-Pfad (upsert/delete) aufgerufen, damit der Listener
        ohne TTL-Verzoegerung die neue Konfiguration sieht.
        """
        self._loaded_at = 0.0

    async def warmup(self) -> None:
        """Explizites Erst-Laden — vom Setup aufrufbar, damit der erste
        Lookup im Steady-State zero-cost ist."""
        await self._refresh()

    @property
    def size(self) -> int:
        """Anzahl gecachter Adressen — fuer Diagnose/Tests."""
        return len(self._items)
