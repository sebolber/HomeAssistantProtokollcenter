"""Token-Bucket Rate-Limiter (Iter 11)."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from threading import Lock


@dataclass
class _Bucket:
    capacity: float
    refill_per_second: float
    tokens: float = 0.0
    last_refill: float = field(default_factory=time.monotonic)


class TokenBucketLimiter:
    """Pro-Key Token-Bucket. Default 60 Tokens/Min = 1/s, Burst 60.

    Thread-safe via Lock; reines Sync, weil HA-Webhook-Handler async sind und
    diese Pruefung trivial schnell ist.
    """

    def __init__(self, capacity: float = 60.0, refill_per_minute: float = 60.0) -> None:
        self._capacity = capacity
        self._refill = refill_per_minute / 60.0
        self._buckets: dict[str, _Bucket] = {}
        self._lock = Lock()

    def allow(self, key: str, tokens: float = 1.0) -> bool:
        """True, wenn `tokens` aus dem Bucket entnommen werden konnten."""
        now = time.monotonic()
        with self._lock:
            bucket = self._buckets.get(key)
            if bucket is None:
                bucket = _Bucket(
                    capacity=self._capacity,
                    refill_per_second=self._refill,
                    tokens=self._capacity,
                    last_refill=now,
                )
                self._buckets[key] = bucket
            else:
                elapsed = now - bucket.last_refill
                bucket.tokens = min(
                    bucket.capacity, bucket.tokens + elapsed * bucket.refill_per_second
                )
                bucket.last_refill = now

            if bucket.tokens >= tokens:
                bucket.tokens -= tokens
                return True
            return False

    def reset(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._buckets.clear()
            else:
                self._buckets.pop(key, None)
