"""Regression: API-Views muessen URL-Path-Parameter als kwarg akzeptieren.

Hintergrund (Bug aiohttp-error-ZU9UA): Home Assistant ruft View-Handler
ueber ``handler(request, **request.match_info)`` auf
(``homeassistant/helpers/http.py``). Wenn eine View-URL einen Path-
Parameter wie ``/{ga}`` deklariert, der ``get``/``post``/``put``/
``delete``-Handler aber nur ``(self, request)`` akzeptiert, schlaegt
jeder Aufruf mit ::

    TypeError: KnxStatsGaDetailView.get() got an unexpected keyword
        argument 'ga'

fehl — das Frontend bekommt 500 statt der eigentlichen Antwort.

Dieser Test parsed die API-Sourcen mit ``ast``, damit er ohne
installierten HA-Stack laeuft, und stellt sicher: Fuer jede View-Klasse
in ``custom_components/messagehub/api/`` muss jede HTTP-Methode jeden
in ``url`` deklarierten Path-Parameter als benannten Parameter
akzeptieren (oder ``**kwargs`` haben).
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

import pytest

_API_DIR = Path(__file__).resolve().parents[2] / "custom_components" / "messagehub" / "api"
_HTTP_METHODS = {"get", "post", "put", "delete", "patch"}
_URL_VAR_RE = re.compile(r"\{(\w+)(?::[^}]+)?\}")


def _url_path_params(url: str) -> set[str]:
    """``"/foo/{bar}/{baz:[^/]+}"`` -> ``{"bar", "baz"}``."""
    return set(_URL_VAR_RE.findall(url))


def _method_accepts(func: ast.AsyncFunctionDef | ast.FunctionDef, name: str) -> bool:
    """True wenn ``func`` einen Parameter ``name`` (positional/kw-only)
    oder ``**kwargs`` deklariert.
    """
    args = func.args
    declared = {a.arg for a in args.args} | {a.arg for a in args.kwonlyargs}
    if name in declared:
        return True
    return args.kwarg is not None


def _iter_view_classes() -> list[tuple[str, str, ast.ClassDef]]:
    """Yields ``(file_name, class_name, class_node)`` fuer jede Klasse in
    ``api/*.py``, deren ``url``-Klassenattribut Path-Parameter enthaelt.
    """
    out: list[tuple[str, str, ast.ClassDef]] = []
    for py_file in sorted(_API_DIR.glob("*.py")):
        if py_file.name.startswith("_"):
            continue
        tree = ast.parse(py_file.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if not isinstance(node, ast.ClassDef):
                continue
            url = _class_url(node)
            if url is None or not _url_path_params(url):
                continue
            out.append((py_file.name, node.name, node))
    return out


def _class_url(cls: ast.ClassDef) -> str | None:
    for stmt in cls.body:
        if (
            isinstance(stmt, ast.Assign)
            and len(stmt.targets) == 1
            and isinstance(stmt.targets[0], ast.Name)
            and stmt.targets[0].id == "url"
            and isinstance(stmt.value, ast.Constant)
            and isinstance(stmt.value.value, str)
        ):
            return stmt.value.value
    return None


def _http_methods(cls: ast.ClassDef) -> list[ast.AsyncFunctionDef | ast.FunctionDef]:
    return [
        stmt
        for stmt in cls.body
        if isinstance(stmt, (ast.AsyncFunctionDef, ast.FunctionDef)) and stmt.name in _HTTP_METHODS
    ]


_CASES: list[tuple[str, str, str, str]] = [
    # (file, class, http_method, expected_kwarg)
    (file, cls.name, m.name, param)
    for file, _cls_name, cls in _iter_view_classes()
    for m in _http_methods(cls)
    for param in _url_path_params(_class_url(cls) or "")
]


@pytest.mark.parametrize(
    ("file_name", "class_name", "method_name", "param"),
    _CASES,
    ids=[f"{f}::{c}.{m}({p})" for f, c, m, p in _CASES],
)
def test_view_method_accepts_url_path_param(
    file_name: str, class_name: str, method_name: str, param: str
) -> None:
    """Jede HTTP-Methode einer View muss jeden URL-Path-Parameter als
    Argument akzeptieren — sonst feuert HA ``TypeError: ... got an
    unexpected keyword argument ...``.
    """
    tree = ast.parse((_API_DIR / file_name).read_text(encoding="utf-8"))
    cls = next(n for n in ast.walk(tree) if isinstance(n, ast.ClassDef) and n.name == class_name)
    method = next(m for m in _http_methods(cls) if m.name == method_name)
    assert _method_accepts(method, param), (
        f"{file_name}::{class_name}.{method_name} akzeptiert "
        f"den URL-Path-Parameter '{param}' nicht — HA wird mit "
        f"TypeError abbrechen."
    )
