"""F-009: Manifest-Hygiene — websocket_api-Dependency entfernt.

Audit-Befund: manifest.json deklarierte 'websocket_api' als Dependency,
aber kein Code (kein @websocket_api.websocket_command, kein
async_register_command) nutzte sie. HA laedt Dependencies eager —
ungenutzte Dependencies vergeuden Speicher und vergroessern den Setup-
Footprint.

Iter +9: Dependency entfernt. Diese Tests fixieren die Aenderung
und verhindern eine versehentliche Wiedereinfuehrung, solange kein
Code WS-Commands registriert.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

_PKG_DIR = (
    Path(__file__).resolve().parents[2] / "custom_components" / "messagehub"
)
_MANIFEST = _PKG_DIR / "manifest.json"


def test_manifest_does_not_declare_websocket_api() -> None:
    manifest = json.loads(_MANIFEST.read_text(encoding="utf-8"))
    deps = manifest.get("dependencies", [])
    assert "websocket_api" not in deps, (
        "websocket_api wurde wieder in manifest.json eingefuegt — wenn das "
        "absichtlich ist, brauchst du dazu mindestens einen "
        "@websocket_api.websocket_command-Decorator im Code. Sonst "
        "Dependency wieder rausnehmen oder Test loeschen mit Begruendung."
    )


def test_manifest_keeps_required_deps() -> None:
    """Schutz gegen versehentliche Mit-Loeschung anderer Deps."""
    manifest = json.loads(_MANIFEST.read_text(encoding="utf-8"))
    deps = manifest.get("dependencies", [])
    for required in ("http", "frontend", "webhook"):
        assert required in deps, (
            f"Pflicht-Dependency {required!r} fehlt — HA-Setup wuerde brechen."
        )


def test_no_websocket_api_decorator_used() -> None:
    """Wenn ein Decorator wieder auftaucht, muss die Dependency zurueck."""
    pattern = re.compile(r"@websocket_api\.\w+|async_register_command")
    for py_file in _PKG_DIR.rglob("*.py"):
        if "__pycache__" in py_file.parts:
            continue
        content = py_file.read_text(encoding="utf-8")
        match = pattern.search(content)
        assert match is None, (
            f"Datei {py_file.relative_to(_PKG_DIR)} nutzt {match.group()} — "
            "websocket_api muss dann wieder in manifest.json:dependencies."
        )
