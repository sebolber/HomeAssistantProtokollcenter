"""Iter topn-3 (Sprint A / Phase 8): Bus-Health-View liest `limit` aus Query.

Vorher rief KnxStatsBusHealthView.get den Repo mit hardcoded
`limit=20` auf — der Card-Selektor topNBusHealth wirkte nur kosmetisch
auf das DOM-Slice. Jetzt:
- View liest `limit` per parse_int_param (Default 20, max 500)
- Repo-Cap (max 100) wird auf 500 erhoeht, damit Werte > 100
  durchschlagen
- Frontend reicht topNBusHealth durch

Dieser Test pinnt die View-Struktur (AST + String), der Verhaltens-
Test fuer den erhoehten Repo-Cap liegt in test_knx_bus_health.py.
"""

from __future__ import annotations

import ast
from pathlib import Path

_SRC = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "messagehub"
    / "api"
    / "knx_stats.py"
)


def _find_class(class_name: str) -> ast.ClassDef:
    tree = ast.parse(_SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == class_name:
            return node
    raise AssertionError(f"Klasse {class_name} nicht gefunden")


def test_bus_health_view_get_uses_parse_int_param_for_limit() -> None:
    """View muss `limit` per parse_int_param aus der Query lesen."""
    cls = _find_class("KnxStatsBusHealthView")
    get = next(
        s for s in cls.body if isinstance(s, ast.AsyncFunctionDef) and s.name == "get"
    )
    body_src = ast.unparse(get)
    # ast.unparse normalisiert Strings auf single-quotes — beide
    # Schreibweisen akzeptieren, falls jemand den Source-Code mal direkt
    # liest.
    assert (
        "parse_int_param(request.query, 'limit'" in body_src
        or 'parse_int_param(request.query, "limit"' in body_src
    ), (
        "View muss `limit` per parse_int_param aus der Query lesen — "
        "vorher hardcoded 20 im bus_health_per_ga-Aufruf."
    )


def test_bus_health_view_passes_limit_to_repo() -> None:
    """Der gelesene `limit`-Wert muss an `bus_health_per_ga` durchgereicht
    werden — nicht der hardcoded Default."""
    cls = _find_class("KnxStatsBusHealthView")
    get = next(
        s for s in cls.body if isinstance(s, ast.AsyncFunctionDef) and s.name == "get"
    )
    body_src = ast.unparse(get)
    assert "bus_health_per_ga" in body_src
    assert "limit=limit" in body_src, (
        "Repo-Aufruf muss limit=<aus-Query-gelesen> bekommen, nicht "
        "hardcoded 20."
    )


def test_bus_health_view_admin_protected() -> None:
    """View bleibt _check_admin-protected (Regression-Schutz)."""
    cls = _find_class("KnxStatsBusHealthView")
    get = next(
        s for s in cls.body if isinstance(s, ast.AsyncFunctionDef) and s.name == "get"
    )
    assert "_check_admin" in ast.unparse(get)


def test_bus_health_view_max_limit_500() -> None:
    """max_value soll _HARD_TOP_LIMIT (500) sein — konsistent mit anderen
    Top-N-Endpunkten (Bursts, LongTerm, Top, TopBySource)."""
    cls = _find_class("KnxStatsBusHealthView")
    get = next(
        s for s in cls.body if isinstance(s, ast.AsyncFunctionDef) and s.name == "get"
    )
    body_src = ast.unparse(get)
    assert "max_value=_HARD_TOP_LIMIT" in body_src or "max_value=500" in body_src, (
        "limit max_value muss _HARD_TOP_LIMIT (500) sein — sonst kann "
        "der UI-Card-Selektor (max 200) nicht durchschlagen."
    )
