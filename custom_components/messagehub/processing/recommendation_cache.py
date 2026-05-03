"""TTL-Cache fuer Geraete-Recommendations.

Bewusst HA-frei (nur stdlib), damit Tests ohne HA-Stack laufen
koennen. Wird von ``api/knx_stats.py`` als Singleton-Instanz
``_recommendation_cache`` gehalten.
"""

from __future__ import annotations

import time
from typing import Any


class RecommendationCache:
    """Schlanker TTL-Cache mit FIFO-Eviction-Fallback.

    Key-Schema: ``{dev_source}:{from}:{to}`` — pro Periode eigener
    Eintrag, sodass der Drawer beim Periode-Wechsel nicht stale-Daten
    sieht. Default-TTL 5 Min; bei `>= max_entries` werden zuerst alle
    abgelaufenen Eintraege geloescht; falls keiner abgelaufen ist,
    der aelteste lebende.

    NICHT thread-safe — Aufruf erfolgt aus einem einzigen aiohttp-Thread.
    """

    def __init__(self, ttl_s: float = 300.0, max_entries: int = 200) -> None:
        self._ttl_s = ttl_s
        self._max_entries = max_entries
        # value = (expires_at_monotonic, payload)
        self._store: dict[str, tuple[float, dict[str, Any]]] = {}

    def get(self, key: str) -> dict[str, Any] | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() >= expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: dict[str, Any]) -> None:
        if len(self._store) >= self._max_entries:
            self._evict_one()
        self._store[key] = (time.monotonic() + self._ttl_s, value)

    def _evict_one(self) -> None:
        now = time.monotonic()
        expired = [k for k, (exp, _v) in self._store.items() if exp <= now]
        for k in expired:
            self._store.pop(k, None)
        if not expired and self._store:
            oldest_key = min(self._store, key=lambda k: self._store[k][0])
            self._store.pop(oldest_key, None)

    def size(self) -> int:
        return len(self._store)

    def clear(self) -> None:
        self._store.clear()
