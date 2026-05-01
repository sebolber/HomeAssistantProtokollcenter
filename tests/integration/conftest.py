"""Pytest-Fixtures fuer HA-Integration-Tests.

Lazy-Aktivierung der Custom-Integration-Loadability ueber das von
`pytest-homeassistant-custom-component` bereitgestellte
`enable_custom_integrations`-Fixture.
"""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def _auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Aktiviert das Laden von custom_components fuer alle HA-Tests automatisch."""
    return
