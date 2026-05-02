"""Konstanten fuer die messagehub-Integration."""

from __future__ import annotations

from typing import Any, Final

DOMAIN: Final = "messagehub"

# Device-Registry-Metadaten — alle Entitaeten haengen am gleichen Geraet,
# damit der HA-Standard-"Zu Dashboard hinzufuegen"-Knopf erscheint und
# alle Sensoren als zusammenhaengende Gruppe gelistet werden.
DEVICE_MANUFACTURER: Final = "Message Hub"
DEVICE_MODEL: Final = "Custom Integration"
DEVICE_NAME: Final = "Message Hub"


def build_device_info(entry_id: str) -> dict[str, Any]:
    """Gemeinsames DeviceInfo fuer alle messagehub-Entitaeten.

    HA gruppiert damit alle Sensoren + Binary-Sensoren unter einem
    Geraet — der "Zu Dashboard hinzufuegen"-Knopf in
    Geraete & Dienste -> Message Hub -> Geraet listet sie automatisch
    und schiebt sie als Stack in die ausgewaehlte Lovelace-View.

    Rueckgabe-Typ ist dict statt DeviceInfo-TypedDict, damit das Modul
    ohne homeassistant-Framework testbar bleibt — HA akzeptiert beide
    strukturell.
    """
    return {
        "identifiers": {(DOMAIN, entry_id)},
        "name": DEVICE_NAME,
        "manufacturer": DEVICE_MANUFACTURER,
        "model": DEVICE_MODEL,
        "configuration_url": f"homeassistant://navigate/{DOMAIN}",
    }

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

# Options (Iteration 7)
OPT_RETENTION_DEBUG_DAYS: Final = "retention_debug_days"
OPT_RETENTION_INFO_DAYS: Final = "retention_info_days"
OPT_RETENTION_WARNING_DAYS: Final = "retention_warning_days"
OPT_RETENTION_ERROR_DAYS: Final = "retention_error_days"
OPT_HARD_CAP_TOTAL: Final = "hard_cap_total"
OPT_LOG_LEVEL: Final = "log_level"
OPT_AGGREGATION_WINDOW_MINUTES: Final = "aggregation_window_minutes"

DEFAULT_RETENTION_DEBUG_DAYS: Final = 7
DEFAULT_RETENTION_INFO_DAYS: Final = 30
DEFAULT_RETENTION_WARNING_DAYS: Final = 90
DEFAULT_RETENTION_ERROR_DAYS: Final = 365
DEFAULT_HARD_CAP_TOTAL: Final = 100_000
DEFAULT_LOG_LEVEL: Final = "INFO"
DEFAULT_AGGREGATION_WINDOW_MINUTES: Final = 10
