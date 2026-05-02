"""Iter 76 / CR-17: Eventbus-Dedup fuer KNX-Alarm-Trigger.

`KnxStatsAlarmsView` feuert pro triggered Alarm einen HA-Eventbus-
Event. Bei aktivem Polling (z. B. alle 30 s) wird derselbe Alarm
mehrfach pro Stunde gefeuert — die Automations am anderen Ende
laufen entsprechend oft. Hier: Dedup-Key pro (rule, bucketed_minute);
nur beim ersten Hit innerhalb eines Minute-Buckets wird gefeuert.

Pure Funktionen, modul-local State (set + Cleanup), HA-frei testbar.
"""

from __future__ import annotations

from datetime import UTC, datetime
from threading import Lock

# Lebensdauer eines Dedup-Eintrags: 1 Stunde reicht aus, damit ein
# Alarm-Trigger nur ~60 mal pro Stunde maximal feuert. Hash-Set bleibt
# damit klein.
_DEDUP_TTL_SECONDS: int = 3600


class AlarmDedupCache:
    """Set-basierter TTL-Cache fuer Alarm-Trigger.

    Key-Format: `(rule_kind, bucketed_minute_iso)`. bucketed_minute_iso
    ist der ISO-Zeitstempel auf Minutenebene (Sekunden gestrippt) →
    Alarme vom selben rule_kind innerhalb derselben Minute werden
    nur einmal durchgelassen.

    Cleanup laeuft inline beim Lookup — kein Hintergrund-Job noetig.
    """

    def __init__(self, ttl_seconds: int = _DEDUP_TTL_SECONDS) -> None:
        self._entries: dict[tuple[str, str], float] = {}
        self._ttl = ttl_seconds
        self._lock = Lock()

    def should_fire(self, rule_kind: str, *, now: datetime | None = None) -> bool:
        """True, wenn der Trigger zum ersten Mal in der aktuellen Minute
        kommt; False, wenn bereits gefeuert.
        """
        now_dt = now if now is not None else datetime.now(UTC)
        bucket = now_dt.replace(second=0, microsecond=0).isoformat()
        ts = now_dt.timestamp()
        key = (rule_kind, bucket)
        with self._lock:
            self._cleanup(ts)
            if key in self._entries:
                return False
            self._entries[key] = ts
            return True

    def _cleanup(self, now_ts: float) -> None:
        """Entfernt Eintraege aelter als TTL. Inline-Cleanup statt
        Hintergrund-Job — minimal Memory-Overhead."""
        cutoff = now_ts - self._ttl
        # In-place delete via Liste der zu entfernenden Keys, weil
        # dict-iter waehrend del nicht erlaubt ist.
        expired = [k for k, v in self._entries.items() if v < cutoff]
        for k in expired:
            del self._entries[k]

    def reset(self) -> None:
        """Fuer Tests: alle Eintraege wegwerfen."""
        with self._lock:
            self._entries.clear()

    def __len__(self) -> int:
        return len(self._entries)
