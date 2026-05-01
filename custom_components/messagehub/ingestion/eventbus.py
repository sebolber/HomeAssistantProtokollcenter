"""Iter 38: Adapter, der HA-Events in Messages umwandelt."""

from __future__ import annotations

from typing import Any

from ..storage import Severity


def map_system_log_event(payload: dict[str, Any]) -> tuple[Severity, str, str]:
    """Mappt system_log_event-Payload auf (severity, source, text)."""
    level = str(payload.get("level", "INFO")).upper()
    severity = Severity.normalise(level)
    src = str(payload.get("name", "system_log"))
    src = _safe_source(src)
    msg = str(payload.get("message", ""))
    return severity, src, msg


def map_state_changed_unavailable(payload: dict[str, Any]) -> tuple[Severity, str, str] | None:
    """Wenn ein Entity auf unavailable/unknown wechselt: erzeuge ERROR-Message."""
    new_state = payload.get("new_state")
    if not isinstance(new_state, dict):
        return None
    state = str(new_state.get("state", "")).lower()
    if state not in {"unavailable", "unknown"}:
        return None
    entity = str(payload.get("entity_id", "unknown"))
    return Severity.ERROR, _safe_source("state_changed"), f"{entity} -> {state}"


def map_logbook_entry(payload: dict[str, Any]) -> tuple[Severity, str, str]:
    domain = str(payload.get("domain", "logbook"))
    text = f"{payload.get('name', '')}: {payload.get('message', '')}".strip()
    return Severity.INFO, _safe_source(domain), text or str(payload)


_SAFE_RE = __import__("re").compile(r"[^a-z0-9._-]+")


def _safe_source(value: str) -> str:
    out = _SAFE_RE.sub("-", value.lower())[:64]
    return out or "system"
