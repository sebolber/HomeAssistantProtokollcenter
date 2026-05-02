"""Iter 65 / P2-3: Rate-Limit fuer /knx-stats/alarms.

Der Endpoint feuert HA-Eventbus-Events fuer triggered Alarms; ein Admin-
User koennte damit absichtlich Eventspam erzeugen. Token-Bucket-Limiter
mit Capacity 5, Refill 12/Min (= 1 Token alle 5 s).

Smoke-Test, der die TokenBucketLimiter-Konfiguration aus dem Modul
nimmt und das Verhalten unter Burst plus Recovery prueft. Voller
HTTP-Roundtrip braucht HA-Test-Stack — das deckt test_v04_e2e ab.
"""

from __future__ import annotations

import time

import pytest

from custom_components.messagehub.processing.rate_limit import TokenBucketLimiter

# Soll-Werte (aus api/knx_stats.py) — der Modul-Import zieht den HA-
# Stack mit, was im Sandbox nicht verfuegbar ist. Wir spiegeln die
# Konfiguration hier und pruefen nur das Limiter-Verhalten. Bei
# Aenderung in api/knx_stats.py muss diese Konstante mit angepasst
# werden; CI faengt das ueber HA-basierte E2E-Tests separat ab.
_ALARMS_RATE_CAPACITY = 5.0
_ALARMS_RATE_PER_MINUTE = 12.0


def test_burst_then_drop_after_capacity_exhausted() -> None:
    # Frischer Limiter mit gleicher Konfiguration (kein State-Sharing
    # mit dem Modul-Limiter — sonst leaked auf andere Tests).
    limiter = TokenBucketLimiter(
        capacity=_ALARMS_RATE_CAPACITY, refill_per_minute=_ALARMS_RATE_PER_MINUTE
    )
    key = "user:test-burst"
    # 5 Requests gehen durch.
    for _ in range(5):
        assert limiter.allow(key) is True
    # 6. ist drueber.
    assert limiter.allow(key) is False


def test_isolated_per_key() -> None:
    # Ein User der throttled ist blockiert nicht andere User.
    limiter = TokenBucketLimiter(
        capacity=_ALARMS_RATE_CAPACITY, refill_per_minute=_ALARMS_RATE_PER_MINUTE
    )
    for _ in range(5):
        limiter.allow("user:a")
    assert limiter.allow("user:a") is False
    assert limiter.allow("user:b") is True


def test_refill_after_wait(monkeypatch: pytest.MonkeyPatch) -> None:
    # Statt echtem sleep monotonic-Wert manipulieren — robust + schnell.
    fake_clock = [0.0]

    def _fake_monotonic() -> float:
        return fake_clock[0]

    monkeypatch.setattr(time, "monotonic", _fake_monotonic)

    limiter = TokenBucketLimiter(
        capacity=_ALARMS_RATE_CAPACITY, refill_per_minute=_ALARMS_RATE_PER_MINUTE
    )
    key = "user:refill"
    for _ in range(5):
        assert limiter.allow(key) is True
    assert limiter.allow(key) is False

    # 5 Sekunden vergehen — 1 Token kommt wieder rein.
    fake_clock[0] = 5.0
    assert limiter.allow(key) is True
    # Direkt danach kein Burst mehr moeglich.
    assert limiter.allow(key) is False
