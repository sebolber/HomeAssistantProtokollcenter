"""Iter 76 / CR-17: Alarm-Eventbus-Dedup-Cache."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from custom_components.messagehub.api._alarm_dedup import AlarmDedupCache


def test_first_call_for_rule_fires() -> None:
    cache = AlarmDedupCache()
    assert cache.should_fire("busload") is True


def test_second_call_same_minute_does_not_fire() -> None:
    cache = AlarmDedupCache()
    now = datetime(2026, 5, 2, 12, 30, 15, tzinfo=UTC)
    assert cache.should_fire("busload", now=now) is True
    assert cache.should_fire("busload", now=now) is False
    # Auch leicht spaetere Sekunden in derselben Minute zaehlen als
    # selbe Bucket -> kein Fire.
    assert cache.should_fire("busload", now=now + timedelta(seconds=30)) is False


def test_different_rules_independent() -> None:
    cache = AlarmDedupCache()
    now = datetime(2026, 5, 2, 12, 30, 15, tzinfo=UTC)
    assert cache.should_fire("busload", now=now) is True
    assert cache.should_fire("repeat_rate", now=now) is True
    # Wieder beide gefired -> beide blockiert.
    assert cache.should_fire("busload", now=now) is False
    assert cache.should_fire("repeat_rate", now=now) is False


def test_minute_bucket_change_fires_again() -> None:
    cache = AlarmDedupCache()
    now = datetime(2026, 5, 2, 12, 30, 15, tzinfo=UTC)
    assert cache.should_fire("busload", now=now) is True
    later = now + timedelta(minutes=1)
    assert cache.should_fire("busload", now=later) is True


def test_ttl_cleanup_removes_old_entries() -> None:
    cache = AlarmDedupCache(ttl_seconds=10)
    base = datetime(2026, 5, 2, 12, 30, 15, tzinfo=UTC)
    cache.should_fire("busload", now=base)
    assert len(cache) == 1
    # 30 s spaeter: TTL abgelaufen.
    cache.should_fire("repeat_rate", now=base + timedelta(seconds=30))
    # busload-Eintrag ist abgelaufen, repeat_rate ist neu.
    assert len(cache) == 1


def test_reset_clears_all() -> None:
    cache = AlarmDedupCache()
    cache.should_fire("a")
    cache.should_fire("b")
    cache.reset()
    assert len(cache) == 0
    assert cache.should_fire("a") is True
