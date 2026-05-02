"""Tests fuer das gemeinsame DeviceInfo aller messagehub-Entitaeten.

Sicherstellt, dass alle Sensoren und der Binary-Sensor unter dem gleichen
Geraet gruppiert werden — Voraussetzung dafuer, dass HA in der "Geraete
& Dienste"-UI den "Zu Dashboard hinzufuegen"-Knopf anzeigt und alle
Entitaeten auf einen Klick als zusammenhaengende Karten-Gruppe einfuegt.
"""

from __future__ import annotations

from custom_components.messagehub.const import (
    DEVICE_MANUFACTURER,
    DEVICE_MODEL,
    DEVICE_NAME,
    DOMAIN,
    build_device_info,
)


def test_build_device_info_uses_entry_id_as_identifier() -> None:
    info = build_device_info("entry-abc")
    assert info["identifiers"] == {(DOMAIN, "entry-abc")}


def test_build_device_info_carries_metadata() -> None:
    info = build_device_info("entry-1")
    assert info["name"] == DEVICE_NAME
    assert info["manufacturer"] == DEVICE_MANUFACTURER
    assert info["model"] == DEVICE_MODEL
    assert info["configuration_url"] == "homeassistant://navigate/messagehub"


def test_build_device_info_is_consistent_across_calls() -> None:
    """Zwei Aufrufe mit demselben entry_id muessen gleichwertig sein —
    HA matched Entities ueber die identifiers, die muessen stabil sein."""
    a = build_device_info("entry-x")
    b = build_device_info("entry-x")
    assert a == b


def test_build_device_info_separates_different_entries() -> None:
    """Bei zwei Integration-Instanzen (z. B. zweite messagehub-Installation)
    muessen die identifiers unterschiedlich sein, damit HA die Geraete
    auseinanderhalten kann."""
    a = build_device_info("entry-x")
    b = build_device_info("entry-y")
    assert a["identifiers"] != b["identifiers"]
