"""Iter L1.3: Tests fuer den HA-freien ``RecommendationCache``."""

from __future__ import annotations

import time

from custom_components.messagehub.processing.recommendation_cache import (
    RecommendationCache,
)


class TestRecommendationCache:
    def test_get_returns_none_for_unknown_key(self) -> None:
        cache = RecommendationCache()
        assert cache.get("missing") is None

    def test_set_then_get_returns_value(self) -> None:
        cache = RecommendationCache()
        cache.set("k1", {"value": 42})
        assert cache.get("k1") == {"value": 42}

    def test_overwrite_replaces_value(self) -> None:
        cache = RecommendationCache()
        cache.set("k1", {"v": 1})
        cache.set("k1", {"v": 2})
        assert cache.get("k1") == {"v": 2}

    def test_ttl_expiry_returns_none(self) -> None:
        cache = RecommendationCache(ttl_s=0.05)
        cache.set("k1", {"x": 1})
        assert cache.get("k1") == {"x": 1}
        time.sleep(0.06)
        assert cache.get("k1") is None
        # Nach get auf abgelaufenem Eintrag: aus dem Store entfernt.
        assert cache.size() == 0

    def test_set_evicts_at_max_entries(self) -> None:
        cache = RecommendationCache(ttl_s=300.0, max_entries=3)
        cache.set("a", {"v": "a"})
        cache.set("b", {"v": "b"})
        cache.set("c", {"v": "c"})
        assert cache.size() == 3
        cache.set("d", {"v": "d"})
        # Eviction-Pfad: ein Eintrag (a) ist raus, neue Einsetzung OK.
        assert cache.size() == 3
        assert cache.get("d") == {"v": "d"}

    def test_eviction_prefers_expired(self) -> None:
        cache = RecommendationCache(ttl_s=0.05, max_entries=3)
        cache.set("a", {"v": "a"})
        cache.set("b", {"v": "b"})
        time.sleep(0.06)  # a + b sind expired
        cache.set("c", {"v": "c"})  # frisch
        cache.set("d", {"v": "d"})  # triggert Eviction
        # Beide expired-Eintraege sollten weg sein, c+d frisch.
        assert cache.get("c") == {"v": "c"}
        assert cache.get("d") == {"v": "d"}

    def test_clear_resets_store(self) -> None:
        cache = RecommendationCache()
        cache.set("k", {"v": 1})
        cache.clear()
        assert cache.size() == 0
        assert cache.get("k") is None

    def test_default_ttl_is_5_minutes(self) -> None:
        cache = RecommendationCache()
        # Pinning-Test: 300 s = 5 Min Default
        assert cache._ttl_s == 300.0  # noqa: SLF001 — bewusster White-Box-Test
