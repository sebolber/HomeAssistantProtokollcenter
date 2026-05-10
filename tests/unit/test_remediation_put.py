"""F-006: Tests fuer den Remediation-Hook-PUT-Endpoint.

Vorher hatte RemediationHookDetailView nur DELETE — User mussten
Loeschen + Neu anlegen, ID war nicht stabil. Iter +5 ergaenzt PUT,
sodass Hooks bearbeitet werden koennen.
"""

from __future__ import annotations

import ast
from pathlib import Path

_SRC = (
    Path(__file__).resolve().parents[2] / "custom_components" / "messagehub" / "api" / "messages.py"
)


def _find_class(class_name: str) -> ast.ClassDef:
    tree = ast.parse(_SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == class_name:
            return node
    raise AssertionError(f"Klasse {class_name} nicht gefunden")


def test_remediation_detail_view_has_put() -> None:
    cls = _find_class("RemediationHookDetailView")
    methods = {sub.name for sub in cls.body if isinstance(sub, ast.AsyncFunctionDef)}
    assert "put" in methods, "PUT-Handler fuer Remediation-Edit fehlt"


def test_remediation_put_takes_hook_id_kwarg() -> None:
    cls = _find_class("RemediationHookDetailView")
    put = next(s for s in cls.body if isinstance(s, ast.AsyncFunctionDef) and s.name == "put")
    arg_names = {a.arg for a in put.args.args}
    assert "hook_id" in arg_names


def test_remediation_put_admin_protected() -> None:
    cls = _find_class("RemediationHookDetailView")
    put = next(s for s in cls.body if isinstance(s, ast.AsyncFunctionDef) and s.name == "put")
    assert "_check_admin" in ast.unparse(put)


def test_remediation_put_audit_log() -> None:
    src = _SRC.read_text(encoding="utf-8")
    assert "remediation_update" in src, (
        "PUT muss action='remediation_update' im Audit-Log schreiben"
    )


def test_remediation_put_validates_id() -> None:
    cls = _find_class("RemediationHookDetailView")
    put = next(s for s in cls.body if isinstance(s, ast.AsyncFunctionDef) and s.name == "put")
    body_src = ast.unparse(put)
    assert "int(hook_id)" in body_src
    assert "ERR_INVALID_ID" in body_src


def test_remediation_put_returns_404_for_missing_hook() -> None:
    cls = _find_class("RemediationHookDetailView")
    put = next(s for s in cls.body if isinstance(s, ast.AsyncFunctionDef) and s.name == "put")
    body_src = ast.unparse(put)
    # Ein 404-Pfad muss ueber ERR_NOT_FOUND moeglich sein
    assert "ERR_NOT_FOUND" in body_src
