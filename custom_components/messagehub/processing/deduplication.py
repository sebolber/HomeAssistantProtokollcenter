"""Iter 26-27: Fingerprint-basierte Deduplizierung & Aggregation."""

from __future__ import annotations

import hashlib
import re

_NUMBER_RE = re.compile(r"\d+")
_UUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)
_IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


def normalise_text(text: str) -> str:
    """Ersetzt UUIDs, IPs, Zahlen durch Platzhalter (stabile Fingerprints)."""
    out = _UUID_RE.sub("UUID", text)
    out = _IP_RE.sub("IP", out)
    out = _NUMBER_RE.sub("N", out)
    return out.strip()


def compute_fingerprint(source: str, severity: str, text: str) -> str:
    """SHA-256 (hex) ueber source + severity + normalisierter Text."""
    norm = normalise_text(text)
    h = hashlib.sha256()
    h.update(source.encode("utf-8"))
    h.update(b"\x00")
    h.update(severity.encode("utf-8"))
    h.update(b"\x00")
    h.update(norm.encode("utf-8"))
    return h.hexdigest()
