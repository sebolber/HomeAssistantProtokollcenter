"""Globale Pytest-Fixtures fuer die messagehub-Tests."""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def _auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Aktiviert das Laden von custom_components fuer alle Tests automatisch."""
    return
