"""Tests fuer Repair-Issue-Helper.

v0.10 (S3): HA-Repair-Issues lassen den User direkt sehen, wenn
KNX/MQTT-Listener ihre Voraussetzungen nicht erfuellen — statt nur
einer stillen Log-Zeile.
"""

from __future__ import annotations

import sys
import types
from typing import Any
from unittest.mock import MagicMock

import pytest

from custom_components.messagehub import repair


def _fake_hass() -> Any:
    return MagicMock()


@pytest.fixture
def fake_ir():
    """Stubt homeassistant.helpers.issue_registry so, dass das lazy-Import
    in repair.py den Mock einsammelt, statt am ImportError zu scheitern."""
    fake_module = types.ModuleType("homeassistant.helpers.issue_registry")
    fake_module.async_create_issue = MagicMock()
    fake_module.async_delete_issue = MagicMock()
    fake_module.IssueSeverity = lambda x: x

    # Parent-Pakete muessen existieren, damit `from homeassistant.helpers
    # import issue_registry` funktioniert.
    parents = {
        "homeassistant": types.ModuleType("homeassistant"),
        "homeassistant.helpers": types.ModuleType("homeassistant.helpers"),
        "homeassistant.helpers.issue_registry": fake_module,
    }
    parents["homeassistant.helpers"].issue_registry = fake_module  # type: ignore[attr-defined]

    saved = {k: sys.modules.get(k) for k in parents}
    sys.modules.update(parents)
    try:
        yield fake_module
    finally:
        for k, v in saved.items():
            if v is None:
                sys.modules.pop(k, None)
            else:
                sys.modules[k] = v


def test_report_knx_unavailable_calls_create_issue(fake_ir) -> None:
    """report_knx_unavailable ruft async_create_issue mit erwarteten Argumenten."""
    hass = _fake_hass()
    repair.report_knx_unavailable(hass)
    assert fake_ir.async_create_issue.called
    args, kwargs = fake_ir.async_create_issue.call_args
    assert args[0] is hass
    assert args[2] == "knx_unavailable"
    assert kwargs["translation_key"] == "knx_unavailable"
    assert kwargs["is_fixable"] is False


def test_report_mqtt_unavailable_calls_create_issue(fake_ir) -> None:
    hass = _fake_hass()
    repair.report_mqtt_unavailable(hass)
    assert fake_ir.async_create_issue.called
    args, kwargs = fake_ir.async_create_issue.call_args
    assert args[2] == "mqtt_unavailable"
    assert kwargs["translation_key"] == "mqtt_unavailable"


def test_clear_knx_unavailable_calls_delete_issue(fake_ir) -> None:
    hass = _fake_hass()
    repair.clear_knx_unavailable(hass)
    assert fake_ir.async_delete_issue.called
    args, _ = fake_ir.async_delete_issue.call_args
    assert args[0] is hass
    assert args[2] == "knx_unavailable"


def test_clear_mqtt_unavailable_calls_delete_issue(fake_ir) -> None:
    hass = _fake_hass()
    repair.clear_mqtt_unavailable(hass)
    assert fake_ir.async_delete_issue.called
    args, _ = fake_ir.async_delete_issue.call_args
    assert args[2] == "mqtt_unavailable"


def test_create_issue_swallows_import_error() -> None:
    """Fehlende issue_registry-Helper crashen das Setup nicht
    (HA ist im Test-Env gar nicht installiert)."""
    hass = _fake_hass()
    # Darf nicht crashen, auch ohne fake_ir-Fixture.
    repair.report_knx_unavailable(hass)
    repair.clear_knx_unavailable(hass)
    repair.report_mqtt_unavailable(hass)
    repair.clear_mqtt_unavailable(hass)
