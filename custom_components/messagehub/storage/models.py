"""Typisierte Modelle und Validatoren fuer messagehub.

Spec: docs/messagehub_konzept.md §2 sowie ergaenzende Hinweise im Runbook §6.3.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any, Final

from ..const import SOURCE_PATTERN, TEXT_MAX_BYTES

WEBHOOK_ID_MIN_LENGTH: Final = 16


class Severity(StrEnum):
    """Severity-Stufen mit Normalisierung externer Schreibweisen."""

    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"

    @classmethod
    def normalise(cls, value: object) -> Severity:
        """Mapt externe Schreibweisen (`ERR`, `5`, `WARN`, ...) auf einen kanonischen Wert.

        Strategie:
            1. Falls bereits gueltiges Severity-Member -> direkt zurueck
            2. Strings werden in Kleinbuchstaben konvertiert und gegen eine
               Synonym-Tabelle gematcht
            3. Numerische Werte mappen auf die Standard-Syslog-Stufen
            4. Unbekanntes -> INFO (Default-Fallback laut Konzept §4.2)
        """
        if isinstance(value, cls):
            return value
        if isinstance(value, str):
            key = value.strip().lower()
            if key in _STRING_SYNONYMS:
                return _STRING_SYNONYMS[key]
            if key.isdigit():
                return _SYSLOG_LEVEL_MAP.get(int(key), cls.INFO)
        if isinstance(value, bool):
            # bool ist Subtyp von int, deshalb vor int abfangen
            return cls.INFO
        if isinstance(value, int):
            return _SYSLOG_LEVEL_MAP.get(value, cls.INFO)
        return cls.INFO


_STRING_SYNONYMS: Final[dict[str, Severity]] = {
    "debug": Severity.DEBUG,
    "dbg": Severity.DEBUG,
    "trace": Severity.DEBUG,
    "verbose": Severity.DEBUG,
    "info": Severity.INFO,
    "informational": Severity.INFO,
    "notice": Severity.INFO,
    "note": Severity.INFO,
    "warn": Severity.WARNING,
    "warning": Severity.WARNING,
    "err": Severity.ERROR,
    "error": Severity.ERROR,
    "fail": Severity.ERROR,
    "failure": Severity.ERROR,
    "fatal": Severity.ERROR,
    "crit": Severity.ERROR,
    "critical": Severity.ERROR,
    "alert": Severity.ERROR,
    "emerg": Severity.ERROR,
    "emergency": Severity.ERROR,
    "p1": Severity.ERROR,
    "p2": Severity.WARNING,
    "p3": Severity.INFO,
    "p4": Severity.DEBUG,
}


# Mapping nach RFC-5424 Severity-Levels (0=Emergency .. 7=Debug).
# Wir haben nur 4 Stufen, also gruppieren wir.
_SYSLOG_LEVEL_MAP: Final[dict[int, Severity]] = {
    0: Severity.ERROR,
    1: Severity.ERROR,
    2: Severity.ERROR,
    3: Severity.ERROR,
    4: Severity.WARNING,
    5: Severity.INFO,
    6: Severity.INFO,
    7: Severity.DEBUG,
}


_SOURCE_RE: Final = re.compile(SOURCE_PATTERN)


def validate_source(value: str) -> str:
    """Akzeptiert nur lowercase / Ziffern / Punkte / Bindestriche / Unterstriche, max 64."""
    if not isinstance(value, str):
        raise TypeError(f"source must be str, got {type(value).__name__}")
    if not _SOURCE_RE.fullmatch(value):
        raise ValueError(
            f"Invalid source {value!r}: must match {SOURCE_PATTERN} "
            "(lowercase letters, digits, '.', '_', '-', 1..64 chars)"
        )
    return value


def validate_text(value: str) -> str:
    """Stellt sicher, dass `text` nicht leer ist und das Byte-Limit einhaelt."""
    if not isinstance(value, str):
        raise TypeError(f"text must be str, got {type(value).__name__}")
    if not value:
        raise ValueError("text must not be empty")
    encoded = value.encode("utf-8")
    if len(encoded) > TEXT_MAX_BYTES:
        raise ValueError(f"text exceeds {TEXT_MAX_BYTES} bytes (got {len(encoded)} bytes)")
    return value


@dataclass(slots=True)
class Message:
    """In-Memory Repraesentation einer Nachricht.

    Persistierung erfolgt ueber `storage.repositories.MessageRepository`.
    """

    severity: Severity
    source: str
    text: str
    metadata: dict[str, Any] | None = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    webhook_id: str | None = None
    id: int | None = None

    def __post_init__(self) -> None:
        self.severity = Severity.normalise(self.severity)
        validate_source(self.source)
        validate_text(self.text)
        if self.timestamp.tzinfo is None:
            self.timestamp = self.timestamp.replace(tzinfo=UTC)

    @property
    def metadata_json(self) -> str | None:
        if self.metadata is None:
            return None
        return json.dumps(self.metadata, separators=(",", ":"), sort_keys=True)

    @property
    def timestamp_iso(self) -> str:
        return self.timestamp.astimezone(UTC).isoformat(timespec="seconds")


@dataclass(slots=True)
class WebhookConfig:
    """Konfiguration eines eingehenden Webhooks."""

    name: str
    webhook_id: str
    default_source: str
    default_severity: Severity = Severity.INFO
    field_map: dict[str, str] | None = None
    enabled: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    id: int | None = None

    def __post_init__(self) -> None:
        self.default_severity = Severity.normalise(self.default_severity)
        validate_source(self.default_source)
        if not self.name or not self.name.strip():
            raise ValueError("name must not be empty")
        if not self.webhook_id or len(self.webhook_id) < WEBHOOK_ID_MIN_LENGTH:
            raise ValueError(f"webhook_id must be at least {WEBHOOK_ID_MIN_LENGTH} characters long")
        if self.created_at.tzinfo is None:
            self.created_at = self.created_at.replace(tzinfo=UTC)

    @property
    def field_map_json(self) -> str | None:
        if self.field_map is None:
            return None
        return json.dumps(self.field_map, separators=(",", ":"), sort_keys=True)
