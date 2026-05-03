"""F-007: WebhookDetailView.GET wird bewusst beibehalten.

Audit-Befund: Frontend nutzt aktuell keinen Single-Get fuer Webhooks.
Entscheidung: Endpoint bleibt fuer externe Skripte/curl + zukuenftige
Drilldown-UI. Diese Tests dokumentieren die Entscheidung als
ausfuehrbares Statement.
"""

from __future__ import annotations

import ast
from pathlib import Path

_API = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "messagehub"
    / "api"
    / "messages.py"
)


def test_webhook_detail_view_keeps_get_method() -> None:
    """Der GET-Handler darf nicht versehentlich entfernt werden."""
    tree = ast.parse(_API.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == "WebhookDetailView":
            method_names = {
                sub.name
                for sub in node.body
                if isinstance(sub, ast.AsyncFunctionDef)
            }
            assert "get" in method_names, (
                "WebhookDetailView.get wurde entfernt — sollte aber laut "
                "F-007-Entscheidung erhalten bleiben (externe Skripte / "
                "kuenftige Drilldown-UI). Wenn die Loeschung beabsichtigt "
                "ist, diesen Test mit Begruendung loeschen."
            )
            return
    raise AssertionError("WebhookDetailView nicht gefunden")


def test_webhook_detail_view_doc_explains_kept_get() -> None:
    """Der Doc-String enthaelt einen F-007-Hinweis, sodass kuenftige
    Code-Lesende verstehen, warum GET trotz Audit-Befund bleibt."""
    src = _API.read_text(encoding="utf-8")
    # Suche das WebhookDetailView-Class-Body
    tree = ast.parse(src)
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == "WebhookDetailView":
            doc = ast.get_docstring(node) or ""
            assert "F-007" in doc, (
                "WebhookDetailView muss im Doc-String F-007 erwaehnen, damit "
                "Code-Reviewer die bewusste Beibehaltung sehen."
            )
            return
