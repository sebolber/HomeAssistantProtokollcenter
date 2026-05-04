"""Iter UX-4: KnxRecommendationLlmTestView — Provider-Verbindungstest.

AST-Tests pinnen den View-Vertrag (Auth, Rate-Limit, Audit, URL-
Whitelist). Verhaltens-Test fuer ``_resolve_test_config`` direkt —
HA-frei, deterministisch.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

from custom_components.messagehub.processing.recommendation_provider import (
    ProviderConfig,
)


_SRC = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "messagehub"
    / "api"
    / "knx_stats.py"
)


def _find_class(name: str) -> ast.ClassDef:
    tree = ast.parse(_SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == name:
            return node
    raise AssertionError(f"Klasse {name} nicht gefunden")


def _find_function(name: str) -> ast.FunctionDef:
    tree = ast.parse(_SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == name:
            return node
    raise AssertionError(f"Funktion {name} nicht gefunden")


# ---------------------------------------------------------------------------
# View-AST-Vertrag
# ---------------------------------------------------------------------------


def test_view_url_and_name() -> None:
    cls = _find_class("KnxRecommendationLlmTestView")
    assigns = {
        n.targets[0].id: ast.literal_eval(n.value)
        for n in cls.body
        if isinstance(n, ast.Assign)
        and len(n.targets) == 1
        and isinstance(n.targets[0], ast.Name)
        and isinstance(n.value, ast.Constant)
    }
    assert assigns.get("url") == "/api/messagehub/knx-recommend/llm-test"


def test_view_uses_post_method() -> None:
    cls = _find_class("KnxRecommendationLlmTestView")
    methods = {
        n.name for n in cls.body if isinstance(n, ast.AsyncFunctionDef)
    }
    assert "post" in methods


def test_view_calls_check_admin() -> None:
    cls = _find_class("KnxRecommendationLlmTestView")
    post = next(
        n for n in cls.body
        if isinstance(n, ast.AsyncFunctionDef) and n.name == "post"
    )
    assert "_check_admin" in ast.unparse(post)


def test_view_uses_rate_limiter() -> None:
    cls = _find_class("KnxRecommendationLlmTestView")
    post = next(
        n for n in cls.body
        if isinstance(n, ast.AsyncFunctionDef) and n.name == "post"
    )
    body_src = ast.unparse(post)
    assert "_llm_test_limiter" in body_src
    assert ".allow(" in body_src
    assert "status=429" in body_src


def test_view_writes_audit_log_with_redacted_key() -> None:
    cls = _find_class("KnxRecommendationLlmTestView")
    post = next(
        n for n in cls.body
        if isinstance(n, ast.AsyncFunctionDef) and n.name == "post"
    )
    body_src = ast.unparse(post)
    assert "audit(" in body_src
    assert "knx_recommend_llm_test" in body_src
    # api_key_set: bool im Audit, NIEMALS Klartext
    assert "api_key_set" in body_src


def test_view_delegates_to_test_runner() -> None:
    """Iter R4: Der View ruft ``run_provider_test`` aus dem HA-freien
    Helfer auf — die deterministischen Inputs leben dort und sind ein
    Modul-Konstanten-Vertrag (separat getestet).
    """
    cls = _find_class("KnxRecommendationLlmTestView")
    post = next(
        n for n in cls.body
        if isinstance(n, ast.AsyncFunctionDef) and n.name == "post"
    )
    body_src = ast.unparse(post)
    assert "run_provider_test" in body_src
    assert "serialize_test_result" in body_src
    assert "incomplete_config_result" in body_src


def test_runner_pins_deterministic_inputs() -> None:
    """Pinning: kein User-Datenleck zum LLM. Inputs muessen statisch sein."""
    from custom_components.messagehub.processing.recommendation_test_runner import (  # noqa: PLC0415
        DETERMINISTIC_TEST_CONTEXT,
        DETERMINISTIC_TEST_DPT,
        DETERMINISTIC_TEST_MANUFACTURER,
        DETERMINISTIC_TEST_MODEL,
    )
    assert DETERMINISTIC_TEST_DPT == "9.001"
    assert DETERMINISTIC_TEST_MANUFACTURER == "test"
    assert DETERMINISTIC_TEST_MODEL == "test"
    assert DETERMINISTIC_TEST_CONTEXT["test_request"] is True


def test_view_returns_400_for_incomplete_config() -> None:
    cls = _find_class("KnxRecommendationLlmTestView")
    post = next(
        n for n in cls.body
        if isinstance(n, ast.AsyncFunctionDef) and n.name == "post"
    )
    body_src = ast.unparse(post)
    assert "incomplete_config" in body_src


def test_view_registered() -> None:
    src = (_SRC.parent / "messages.py").read_text(encoding="utf-8")
    assert src.count("KnxRecommendationLlmTestView") >= 2

    self_src = _SRC.read_text(encoding="utf-8")
    register_section = self_src[
        self_src.index("def register_knx_stats_views"):
    ]
    assert "KnxRecommendationLlmTestView()" in register_section


def test_rate_limiter_capacity_is_five() -> None:
    """Pinning: 5/min, sonst keine Cost-Schutz-Wirkung."""
    src = _SRC.read_text(encoding="utf-8")
    assert "_llm_test_limiter = TokenBucketLimiter(capacity=5.0" in src
    assert "refill_per_minute=5.0" in src


# ---------------------------------------------------------------------------
# _resolve_test_config (Verhalten)
# ---------------------------------------------------------------------------


def _stored() -> ProviderConfig:
    return ProviderConfig(
        enabled=False,
        base_url="https://api.openai.com/v1",
        model="gpt-4o-mini",
        api_key="sk-stored",
        timeout_s=15.0,
        max_tokens=800,
        system_prompt_override="",
    )


class TestResolveTestConfig:
    def test_no_overrides_returns_stored_values(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (
            merge_test_config as _resolve_test_config,
        )
        result = _resolve_test_config(_stored(), {})
        assert result.base_url == "https://api.openai.com/v1"
        assert result.api_key == "sk-stored"
        assert result.enabled is True  # Test forciert enabled

    def test_override_replaces_field(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (
            merge_test_config as _resolve_test_config,
        )
        result = _resolve_test_config(
            _stored(),
            {"base_url": "https://api.groq.com/openai/v1"},
        )
        assert result.base_url == "https://api.groq.com/openai/v1"
        # Stored Schluessel bleibt
        assert result.api_key == "sk-stored"

    def test_api_key_omitted_keeps_stored(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (
            merge_test_config as _resolve_test_config,
        )
        result = _resolve_test_config(
            _stored(),
            {"base_url": "https://other.com/v1"},
        )
        assert result.api_key == "sk-stored"

    def test_api_key_empty_string_clears(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (
            merge_test_config as _resolve_test_config,
        )
        result = _resolve_test_config(_stored(), {"api_key": ""})
        assert result.api_key == ""

    def test_url_validation_rejects_file_scheme(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (
            merge_test_config as _resolve_test_config,
        )
        with pytest.raises(ValueError, match="scheme"):
            _resolve_test_config(
                _stored(),
                {"base_url": "file:///etc/passwd"},
            )

    def test_url_validation_accepts_localhost_ollama(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (
            merge_test_config as _resolve_test_config,
        )
        result = _resolve_test_config(
            _stored(),
            {"base_url": "http://localhost:11434/v1"},
        )
        assert result.base_url == "http://localhost:11434/v1"
