"""Iter 47: Auto-Remediation Hooks (Suggestion vs Auto)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class RemediationHook:
    id: int | None
    name: str
    source_pattern: str
    fingerprint: str | None
    automation_id: str  # script.xxx oder automation.xxx
    confirm_required: bool = True
    enabled: bool = True


def is_auto(hook: RemediationHook) -> bool:
    """True, wenn der Hook automatisch ohne Bestaetigung ausfuehren darf."""
    return hook.enabled and not hook.confirm_required


def matches(hook: RemediationHook, source: str, fingerprint: str | None) -> bool:
    if not hook.enabled:
        return False
    if hook.fingerprint and fingerprint and hook.fingerprint == fingerprint:
        return True
    if "%" in hook.source_pattern:
        import re  # noqa: PLC0415

        regex = re.escape(hook.source_pattern).replace("%", ".*")
        return re.fullmatch(regex, source) is not None
    return hook.source_pattern == source
