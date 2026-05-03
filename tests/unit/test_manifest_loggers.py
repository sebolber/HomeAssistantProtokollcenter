"""Regression: manifest.json deklariert `loggers` fuer HA-Logger-UI.

Hintergrund (Bug aiohttp-error-ZU9UA, Diagnostic-Folgemeldung): das
HA-Log-Filter-UI (Einstellungen -> System -> Protokolle, Dropdown
oben rechts) listet nur Integrationen, deren Manifest ein `loggers`-
Feld deklariert. Ohne dieses Feld ist messagehub im Filter unsichtbar
und der User kann kein Debug-Logging via UI aktivieren — Bugs werden
unauffindbar.

HA-Doku: https://developers.home-assistant.io/docs/creating_integration_manifest/

Dieser Test stellt sicher: messagehub deklariert sowohl seinen
eigenen Custom-Components-Namespace als auch alle in `requirements`
gepinnten Library-Namen, die ueber `logging.getLogger(...)` loggen.
"""

from __future__ import annotations

import json
from pathlib import Path

_MANIFEST_PATH = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "messagehub"
    / "manifest.json"
)


def _load_manifest() -> dict[str, object]:
    return json.loads(_MANIFEST_PATH.read_text(encoding="utf-8"))


def test_manifest_declares_loggers_field() -> None:
    """`loggers` MUSS vorhanden sein, sonst ist messagehub im
    HA-Log-Filter unsichtbar und Debug-Logging via UI funktioniert
    nicht.
    """
    manifest = _load_manifest()
    assert "loggers" in manifest, (
        "manifest.json braucht ein `loggers`-Feld — sonst taucht die "
        "Integration nicht im HA-Protokoll-Dialog auf und Debug-"
        "Logging via UI ist nicht moeglich."
    )
    loggers = manifest["loggers"]
    assert isinstance(loggers, list)
    assert all(isinstance(name, str) for name in loggers)


def test_manifest_loggers_includes_own_namespace() -> None:
    """Eigener Logger-Namespace muss drin sein, damit das HA-UI alle
    `_LOGGER = logging.getLogger(__name__)`-Aufrufe der Integration
    erkennt und gruppiert.
    """
    manifest = _load_manifest()
    loggers = manifest.get("loggers", [])
    assert "custom_components.messagehub" in loggers, (
        "loggers muss `custom_components.messagehub` enthalten, sonst "
        "werden die Logger der Integration im UI nicht der Integration "
        "zugeordnet."
    )


def test_manifest_loggers_includes_third_party_requirements() -> None:
    """Die in `requirements` gepinnten Pakete loggen auch — ihre
    Top-Level-Namen muessen in `loggers` deklariert sein, damit der
    User Debug-Logging fuer Library-Bugs aktivieren kann (z. B.
    aiosqlite-Locking-Probleme).
    """
    manifest = _load_manifest()
    loggers = set(manifest.get("loggers", []))
    # Spiegel zu manifest.requirements: aiosqlite + jsonpath_ng (NB:
    # PyPI-Name "jsonpath-ng" hat Modul-Name "jsonpath_ng" — das
    # logger-tree nutzt den Modul-Namen).
    expected_libs = {"aiosqlite", "jsonpath_ng"}
    missing = expected_libs - loggers
    assert not missing, (
        f"loggers fehlen Eintraege fuer Drittanbieter-Bibliotheken: {sorted(missing)}"
    )
