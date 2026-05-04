"""Iter L2.3: AST-Tests fuer KnxDeviceListView/DetailView.

Iter L2.5: Auto-Inferenz aus GA-Labels entfernt — ETS-Discovery
ist die kanonische Quelle. Die View liefert die ETS-Werte als
``ets``-Block im GET-Response, der Frontend-Editor zeigt sie
als Default an, der ``knx_devices``-Eintrag ist optionaler
User-Override.

Verhaltens-Tests fuer Cache-Flush: test_recommendation_cache.py.
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


# ---------------------------------------------------------------------------
# View-AST-Vertrag
# ---------------------------------------------------------------------------


class TestListView:
    def test_url_and_name(self) -> None:
        cls = _find_class("KnxDeviceListView")
        assigns = {
            n.targets[0].id: ast.literal_eval(n.value)
            for n in cls.body
            if isinstance(n, ast.Assign)
            and len(n.targets) == 1
            and isinstance(n.targets[0], ast.Name)
            and isinstance(n.value, ast.Constant)
        }
        assert assigns.get("url") == "/api/messagehub/knx-devices"
        assert assigns.get("name") == "api:messagehub:knx-devices:list"

    def test_get_calls_check_admin(self) -> None:
        cls = _find_class("KnxDeviceListView")
        get = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "get"
        )
        assert "_check_admin" in ast.unparse(get)


class TestDetailView:
    def test_url_template(self) -> None:
        cls = _find_class("KnxDeviceDetailView")
        assigns = {
            n.targets[0].id: ast.literal_eval(n.value)
            for n in cls.body
            if isinstance(n, ast.Assign)
            and len(n.targets) == 1
            and isinstance(n.targets[0], ast.Name)
            and isinstance(n.value, ast.Constant)
        }
        assert assigns.get("url") == (
            "/api/messagehub/knx-devices/{dev_source}"
        )

    def test_has_get_put_delete(self) -> None:
        cls = _find_class("KnxDeviceDetailView")
        methods = {
            n.name for n in cls.body if isinstance(n, ast.AsyncFunctionDef)
        }
        assert {"get", "put", "delete"}.issubset(methods)

    def test_each_method_calls_check_admin_and_validates_dev_source(self) -> None:
        cls = _find_class("KnxDeviceDetailView")
        for method_name in ("get", "put", "delete"):
            method = next(
                n for n in cls.body
                if isinstance(n, ast.AsyncFunctionDef) and n.name == method_name
            )
            body_src = ast.unparse(method)
            assert "_check_admin" in body_src, (
                f"{method_name} fehlt _check_admin"
            )
            assert "validate_knx_individual_address" in body_src, (
                f"{method_name} fehlt dev_source-Validation"
            )

    def test_put_writes_audit_log(self) -> None:
        cls = _find_class("KnxDeviceDetailView")
        put = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "put"
        )
        body_src = ast.unparse(put)
        assert "audit(" in body_src
        assert "knx_device_set" in body_src

    def test_delete_writes_audit_log(self) -> None:
        cls = _find_class("KnxDeviceDetailView")
        delete = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "delete"
        )
        body_src = ast.unparse(delete)
        assert "audit(" in body_src
        assert "knx_device_clear" in body_src

    def test_put_validates_note_for_each_field(self) -> None:
        cls = _find_class("KnxDeviceDetailView")
        put = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "put"
        )
        body_src = ast.unparse(put)
        assert "validate_note" in body_src
        assert "max_length=" in body_src

    def test_delete_returns_404_when_missing(self) -> None:
        cls = _find_class("KnxDeviceDetailView")
        delete = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "delete"
        )
        body_src = ast.unparse(delete)
        assert "ERR_NOT_FOUND" in body_src
        assert "status_code=404" in body_src

    def test_put_flushes_recommendation_cache(self) -> None:
        cls = _find_class("KnxDeviceDetailView")
        put = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "put"
        )
        body_src = ast.unparse(put)
        assert "_flush_recommendation_cache_for" in body_src

    def test_delete_flushes_recommendation_cache(self) -> None:
        cls = _find_class("KnxDeviceDetailView")
        delete = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "delete"
        )
        body_src = ast.unparse(delete)
        assert "_flush_recommendation_cache_for" in body_src

    def test_get_returns_ets_block_as_default(self) -> None:
        """Iter L2.5: GET liefert die ETS-Discovery-Werte als
        ``ets``-Block, sodass der Frontend-Editor sie als Default
        anzeigen kann — kein User-Pflegeaufwand fuer den 99%-Fall."""
        cls = _find_class("KnxDeviceDetailView")
        get = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "get"
        )
        body_src = ast.unparse(get)
        assert "discover_knx_devices" in body_src
        assert "'ets'" in body_src or '"ets"' in body_src

    def test_get_no_label_inference_anymore(self) -> None:
        """Iter L2.5: Auto-Inferenz aus Labels wurde entfernt —
        ETS ist die kanonische Quelle."""
        cls = _find_class("KnxDeviceDetailView")
        get = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "get"
        )
        body_src = ast.unparse(get)
        assert "infer_manufacturer_from_labels" not in body_src
        assert "inferred" not in body_src


def test_views_registered_in_api_messages() -> None:
    src = (_SRC.parent / "messages.py").read_text(encoding="utf-8")
    assert src.count("KnxDeviceListView") >= 2
    assert src.count("KnxDeviceDetailView") >= 2


def test_views_registered_in_register_knx_stats_views() -> None:
    src = _SRC.read_text(encoding="utf-8")
    register_section = src[src.index("def register_knx_stats_views"):]
    assert "KnxDeviceListView()" in register_section
    assert "KnxDeviceDetailView()" in register_section
