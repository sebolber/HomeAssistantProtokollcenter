"""Tests fuer den Panel-Cache-Buster."""

from __future__ import annotations

import os
import time
from pathlib import Path

from custom_components.messagehub import _bundle_cache_buster


def test_bundle_cache_buster_uses_mtime(tmp_path: Path) -> None:
    """Der Buster spiegelt die mtime der Bundle-Datei wider."""
    bundle = tmp_path / "messagehub-panel.js"
    bundle.write_bytes(b"// dummy")
    fixed = 1_700_000_000
    os.utime(bundle, (fixed, fixed))

    assert _bundle_cache_buster(bundle) == str(fixed)


def test_bundle_cache_buster_changes_when_file_rebuilt(tmp_path: Path) -> None:
    """Nach einem Rebuild liefert der Buster einen neuen Wert."""
    bundle = tmp_path / "messagehub-panel.js"
    bundle.write_bytes(b"// v1")
    os.utime(bundle, (1_700_000_000, 1_700_000_000))
    before = _bundle_cache_buster(bundle)

    time.sleep(0.01)
    bundle.write_bytes(b"// v2")
    os.utime(bundle, (1_700_000_100, 1_700_000_100))
    after = _bundle_cache_buster(bundle)

    assert before != after
    assert int(after) > int(before)


def test_bundle_cache_buster_falls_back_when_missing(tmp_path: Path) -> None:
    """Fehlt das Bundle, liefert der Buster einen stabilen Fallback."""
    missing = tmp_path / "does-not-exist.js"
    assert _bundle_cache_buster(missing) == "0"
