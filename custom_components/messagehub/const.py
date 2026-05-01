"""Konstanten fuer die messagehub-Integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "messagehub"

# Datenbank-Pfad relativ zu hass.config.path
DB_DIRNAME: Final = "messagehub"
DB_FILENAME: Final = "messages.db"

# Severity-Whitelist (siehe docs/messagehub_konzept.md §2.1)
SEVERITY_DEBUG: Final = "debug"
SEVERITY_INFO: Final = "info"
SEVERITY_WARNING: Final = "warning"
SEVERITY_ERROR: Final = "error"

SEVERITIES: Final = (
    SEVERITY_DEBUG,
    SEVERITY_INFO,
    SEVERITY_WARNING,
    SEVERITY_ERROR,
)

# Limits laut Konzept §4.3
DEFAULT_BODY_LIMIT_BYTES: Final = 64 * 1024
DEFAULT_RATE_LIMIT_PER_MINUTE: Final = 60
TEXT_MAX_BYTES: Final = 8 * 1024
SOURCE_PATTERN: Final = r"^[a-z0-9._-]{1,64}$"

# Eventbus
EVENT_MESSAGE_ADDED: Final = "messagehub_message_added"
EVENT_MESSAGE_DELETED: Final = "messagehub_message_deleted"
EVENT_THRESHOLD_EXCEEDED: Final = "messagehub_threshold_exceeded"
