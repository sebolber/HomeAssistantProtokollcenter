"""Tests fuer KnxWhitelistCache — TTL-Cache mit Invalidation."""

from __future__ import annotations

import asyncio
from typing import Any
from unittest.mock import AsyncMock

import pytest

from custom_components.messagehub.processing.knx_cache import KnxWhitelistCache
from custom_components.messagehub.processing.knx_repo import KnxAddress


def _addr(ga: str, label: str = "test", log_enabled: bool = True) -> KnxAddress:
    return KnxAddress(address=ga, label=label, log_enabled=log_enabled)


@pytest.mark.asyncio
async def test_cache_lookup_hit_und_miss() -> None:
    repo = AsyncMock()
    repo.list_logged = AsyncMock(return_value={"1/2/3": _addr("1/2/3")})
    cache = KnxWhitelistCache(repo)

    hit = await cache.get("1/2/3")
    assert hit is not None
    assert hit.address == "1/2/3"

    miss = await cache.get("9/9/9")
    assert miss is None


@pytest.mark.asyncio
async def test_cache_loads_repo_einmal_innerhalb_ttl() -> None:
    repo = AsyncMock()
    repo.list_logged = AsyncMock(return_value={"1/2/3": _addr("1/2/3")})
    cache = KnxWhitelistCache(repo, ttl_seconds=300)

    await cache.get("1/2/3")
    await cache.get("1/2/3")
    await cache.get("9/9/9")

    repo.list_logged.assert_awaited_once()


@pytest.mark.asyncio
async def test_cache_refresht_nach_invalidation() -> None:
    repo = AsyncMock()
    repo.list_logged = AsyncMock(return_value={"1/2/3": _addr("1/2/3")})
    cache = KnxWhitelistCache(repo, ttl_seconds=300)

    await cache.get("1/2/3")
    cache.invalidate()
    await cache.get("1/2/3")

    assert repo.list_logged.await_count == 2


@pytest.mark.asyncio
async def test_cache_refresht_nach_ttl_ablauf() -> None:
    repo = AsyncMock()
    repo.list_logged = AsyncMock(return_value={"1/2/3": _addr("1/2/3")})
    cache = KnxWhitelistCache(repo, ttl_seconds=0.01)

    await cache.get("1/2/3")
    await asyncio.sleep(0.02)
    await cache.get("1/2/3")

    assert repo.list_logged.await_count == 2


@pytest.mark.asyncio
async def test_concurrent_refresh_serialisiert() -> None:
    """Bei gleichzeitigem Cache-Miss soll der Refresh nur einmal laufen."""
    call_count = 0

    async def slow_load() -> dict[str, KnxAddress]:
        nonlocal call_count
        call_count += 1
        await asyncio.sleep(0.05)
        return {"1/2/3": _addr("1/2/3")}

    repo: Any = AsyncMock()
    repo.list_logged = slow_load
    cache = KnxWhitelistCache(repo)

    # 5 Lookups parallel — soll genau 1x refresh ausloesen
    results = await asyncio.gather(*[cache.get("1/2/3") for _ in range(5)])

    assert call_count == 1
    assert all(r is not None for r in results)


@pytest.mark.asyncio
async def test_warmup_laedt_und_zaehlt_size() -> None:
    repo = AsyncMock()
    repo.list_logged = AsyncMock(
        return_value={
            "1/2/3": _addr("1/2/3"),
            "1/2/4": _addr("1/2/4"),
            "5/0/100": _addr("5/0/100"),
        }
    )
    cache = KnxWhitelistCache(repo)

    assert cache.size == 0
    await cache.warmup()
    assert cache.size == 3


@pytest.mark.asyncio
async def test_initial_refresh_runs_regardless_of_short_uptime() -> None:
    """Iter aiohttp-error-ZU9UA / Tech-Debt: Regression gegen flackerndes
    Verhalten bei System-Uptime < TTL. Vorher war `_loaded_at = 0.0`
    initial; in Containern/Sandboxes mit Uptime < 300s war
    `monotonic() - 0.0 <= TTL` und der erste Refresh wurde
    uebersprungen. Jetzt -inf-Sentinel: erster Refresh laeuft immer,
    unabhaengig vom monotonic-Anker.
    """
    repo = AsyncMock()
    repo.list_logged = AsyncMock(return_value={"1/2/3": _addr("1/2/3")})
    # TTL absichtlich riesig (waere bei kurzem monotonic-Anker fatal).
    cache = KnxWhitelistCache(repo, ttl_seconds=86400 * 365)

    # Erster Lookup MUSS den Repo treffen, sonst war der Sentinel falsch.
    assert cache.size == 0
    hit = await cache.get("1/2/3")
    assert hit is not None
    repo.list_logged.assert_awaited_once()
    assert cache.size == 1


@pytest.mark.asyncio
async def test_invalidate_forces_reload_regardless_of_short_uptime() -> None:
    """Auch nach `invalidate()` muss der naechste Lookup neu laden,
    egal wie kurz die Uptime ist (analog zum Init-Sentinel-Fall).
    """
    repo = AsyncMock()
    repo.list_logged = AsyncMock(return_value={"1/2/3": _addr("1/2/3")})
    cache = KnxWhitelistCache(repo, ttl_seconds=86400 * 365)

    await cache.warmup()
    repo.list_logged.assert_awaited_once()
    cache.invalidate()
    await cache.get("1/2/3")
    assert repo.list_logged.await_count == 2
