"""Iter L4.0: Persistenter Cache fuer LLM-basierte
Geraete-Empfehlungen.

Speichert die JSON-serialisierte ``DptRecommendation``-Antwort eines
LLM-Aufrufs unter einem deterministischen Cache-Key. Bei Cache-Hit
(noch nicht expired) wird der LLM-Aufruf vermieden.
"""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .database import Database


_DEFAULT_TTL_DAYS = 30


def _now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def _expires_at(ttl_days: int = _DEFAULT_TTL_DAYS) -> str:
    return (
        datetime.now(UTC) + timedelta(days=ttl_days)
    ).isoformat(timespec="seconds")


def make_cache_key(
    *,
    provider: str,
    model: str,
    dpt: str | None,
    manufacturer: str | None,
    device_model: str | None,
    prompt_version: str = "v1",
) -> str:
    """Stabile sha256-Hash-Berechnung fuer den Cache-Key.

    Reihenfolge der Felder ist Teil des Vertrags — Aenderungen hier
    invalidieren ALLE bestehenden Cache-Eintraege. ``prompt_version``
    erlaubt gezielte Invalidierung beim Tunen des System-Prompts.
    """
    parts = [
        provider,
        model,
        dpt or "",
        manufacturer or "",
        device_model or "",
        prompt_version,
    ]
    payload = "\x1f".join(parts).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


class RecommendationCacheRepository:
    """CRUD + Cleanup fuer die ``knx_recommendation_cache``-Tabelle."""

    def __init__(self, db: Database) -> None:
        self._db = db

    async def get(self, cache_key: str) -> dict[str, Any] | None:
        """Liefert den Cache-Eintrag oder ``None`` bei Miss/Ablauf.

        Abgelaufene Eintraege werden NICHT geliefert, aber auch nicht
        sofort geloescht — der Cleanup-Pfad (`cleanup_expired`) holt
        sie periodisch raus, damit dieser Hot-Path schnell bleibt.
        """
        if not cache_key:
            return None
        row = await self._db.fetch_one(
            "SELECT cache_key, response, provider, model, "
            "       created_at, expires_at "
            "FROM knx_recommendation_cache "
            "WHERE cache_key = ? AND expires_at > ?",
            (cache_key, _now_iso()),
        )
        if row is None:
            return None
        return {
            "cache_key": str(row["cache_key"]),
            "response": json.loads(str(row["response"])),
            "provider": str(row["provider"]),
            "model": str(row["model"]),
            "created_at": str(row["created_at"]),
            "expires_at": str(row["expires_at"]),
        }

    async def set(
        self,
        *,
        cache_key: str,
        response: dict[str, Any],
        provider: str,
        model: str,
        ttl_days: int = _DEFAULT_TTL_DAYS,
    ) -> None:
        """Schreibt einen Eintrag (UPSERT).

        Bestehender Key wird ueberschrieben — z. B. nach einer Anpassung
        des Prompts ohne Versionssprung.
        """
        await self._db.execute(
            "INSERT INTO knx_recommendation_cache "
            "(cache_key, response, provider, model, created_at, expires_at) "
            "VALUES (?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(cache_key) DO UPDATE SET "
            "  response = excluded.response, "
            "  provider = excluded.provider, "
            "  model = excluded.model, "
            "  created_at = excluded.created_at, "
            "  expires_at = excluded.expires_at",
            (
                cache_key,
                json.dumps(response, separators=(",", ":"), sort_keys=True),
                provider,
                model,
                _now_iso(),
                _expires_at(ttl_days),
            ),
        )

    async def cleanup_expired(self) -> int:
        """Loescht alle abgelaufenen Eintraege. Returns Loeschanzahl
        (fuer Metriken)."""
        rows = await self._db.fetch_all(
            "SELECT cache_key FROM knx_recommendation_cache "
            "WHERE expires_at <= ?",
            (_now_iso(),),
        )
        if not rows:
            return 0
        await self._db.execute(
            "DELETE FROM knx_recommendation_cache WHERE expires_at <= ?",
            (_now_iso(),),
        )
        return len(rows)

    async def clear(self) -> None:
        """Loescht den ganzen Cache. Wird vom User-Settings-Pfad
        aufgerufen, wenn z. B. der LLM-Provider gewechselt wurde."""
        await self._db.execute("DELETE FROM knx_recommendation_cache")
