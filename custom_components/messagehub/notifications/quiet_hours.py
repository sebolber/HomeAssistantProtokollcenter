"""Iter 31: Quiet-Hours-Pruefung."""

from __future__ import annotations

from datetime import time


def parse_hhmm(value: str | None) -> time | None:
    if value is None:
        return None
    try:
        h, m = value.split(":")
        return time(int(h), int(m))
    except (ValueError, AttributeError):
        return None


def is_in_quiet_hours(now: time, start: time | None, end: time | None) -> bool:
    """True, wenn `now` im Intervall [start, end) liegt (kreuzt Mitternacht)."""
    if start is None or end is None:
        return False
    if start == end:
        return False
    if start < end:
        return start <= now < end
    # Kreuzt Mitternacht
    return now >= start or now < end
