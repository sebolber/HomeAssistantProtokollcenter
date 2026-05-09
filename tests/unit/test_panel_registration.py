"""Tests fuer den Panel-Cache-Buster.

Iter F3: Buster basiert jetzt auf SHA-256 des Bundle-Inhalts (gekuerzt),
nicht mehr auf mtime — mtime ist nicht reproduzierbar (Git-Clone,
HACS-Update setzen mtime auf Checkout-Zeit).
"""

from __future__ import annotations

from pathlib import Path

from custom_components.messagehub import _bundle_cache_buster


def test_bundle_cache_buster_is_deterministic_for_same_content(
    tmp_path: Path,
) -> None:
    """Iter F3: Gleicher Inhalt → gleicher Buster, unabhaengig von mtime."""
    bundle = tmp_path / "messagehub-panel.js"
    bundle.write_bytes(b"// dummy content")
    first = _bundle_cache_buster(bundle)
    bundle.write_bytes(b"// dummy content")  # gleicher Inhalt
    second = _bundle_cache_buster(bundle)
    assert first == second
    assert len(first) == 12  # 12 Hex-Zeichen Prefix


def test_bundle_cache_buster_changes_when_file_rebuilt(tmp_path: Path) -> None:
    """Aenderung am Bundle aendert den Buster."""
    bundle = tmp_path / "messagehub-panel.js"
    bundle.write_bytes(b"// v1")
    before = _bundle_cache_buster(bundle)
    bundle.write_bytes(b"// v2")
    after = _bundle_cache_buster(bundle)
    assert before != after


def test_bundle_cache_buster_falls_back_when_missing(tmp_path: Path) -> None:
    """Fehlt das Bundle, liefert der Buster einen stabilen Fallback."""
    missing = tmp_path / "does-not-exist.js"
    assert _bundle_cache_buster(missing) == "0"
