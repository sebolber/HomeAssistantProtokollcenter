"""Tests fuer TokenBucketLimiter."""

from __future__ import annotations

import time

from custom_components.messagehub.processing.rate_limit import TokenBucketLimiter


def test_allows_within_capacity() -> None:
    limiter = TokenBucketLimiter(capacity=3, refill_per_minute=0.0)
    assert limiter.allow("k") is True
    assert limiter.allow("k") is True
    assert limiter.allow("k") is True
    assert limiter.allow("k") is False


def test_per_key_isolation() -> None:
    limiter = TokenBucketLimiter(capacity=1, refill_per_minute=0.0)
    assert limiter.allow("a") is True
    assert limiter.allow("b") is True
    assert limiter.allow("a") is False
    assert limiter.allow("b") is False


def test_refills_over_time() -> None:
    limiter = TokenBucketLimiter(capacity=2, refill_per_minute=600.0)  # 10/s
    assert limiter.allow("k") is True
    assert limiter.allow("k") is True
    assert limiter.allow("k") is False
    time.sleep(0.25)
    assert limiter.allow("k") is True


def test_reset_clears_bucket() -> None:
    limiter = TokenBucketLimiter(capacity=1, refill_per_minute=0.0)
    limiter.allow("k")
    assert limiter.allow("k") is False
    limiter.reset("k")
    assert limiter.allow("k") is True
