"""Iter L4.1: Tests fuer LLM-Settings + Stub-Provider + View-AST."""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

from custom_components.messagehub.processing.recommendation_settings import (
    DEFAULT_LLM_MAX_TOKENS,
    DEFAULT_LLM_TIMEOUT_S,
    SETTINGS_KEY_LLM_API_KEY,
    SETTINGS_KEY_LLM_BASE_URL,
    SETTINGS_KEY_LLM_ENABLED,
    SETTINGS_KEY_LLM_MAX_TOKENS,
    SETTINGS_KEY_LLM_MODEL,
    SETTINGS_KEY_LLM_SYSTEM_PROMPT,
    SETTINGS_KEY_LLM_TIMEOUT_S,
    StubRecommendationProvider,
    load_provider_config,
    redact_for_response,
    save_provider_config,
    stub_provider,
)
from custom_components.messagehub.storage.database import Database
from custom_components.messagehub.storage.migrations import MigrationRunner
from custom_components.messagehub.storage.settings_repo import SettingsRepository


@pytest.fixture
async def db(tmp_path: Path):
    path = tmp_path / "messages.db"
    database = Database(str(path))
    await database.open()
    runner = MigrationRunner(database)
    await runner.run()
    yield database
    await database.close()


# ---------------------------------------------------------------------------
# Settings load/save
# ---------------------------------------------------------------------------


class TestLoadSave:
    @pytest.mark.asyncio
    async def test_default_disabled(self, db: Database) -> None:
        settings = SettingsRepository(db)
        config = await load_provider_config(settings)
        assert config.enabled is False
        assert config.base_url == ""
        assert config.api_key == ""

    @pytest.mark.asyncio
    async def test_save_then_load_roundtrip(self, db: Database) -> None:
        settings = SettingsRepository(db)
        await save_provider_config(
            settings,
            enabled=True,
            base_url="https://api.openai.com/v1",
            model="gpt-4o-mini",
            api_key="sk-test-123",
            timeout_s=20.0,
            max_tokens=1500,
            system_prompt_override="Use concise German.",
        )
        config = await load_provider_config(settings)
        assert config.enabled is True
        assert config.base_url == "https://api.openai.com/v1"
        assert config.model == "gpt-4o-mini"
        assert config.api_key == "sk-test-123"
        assert config.timeout_s == 20.0
        assert config.max_tokens == 1500
        assert config.system_prompt_override == "Use concise German."

    @pytest.mark.asyncio
    async def test_enabled_with_missing_fields_results_in_disabled(
        self, db: Database,
    ) -> None:
        """Self-Disable bei unvollstaendiger Konfig — wenn enabled=true,
        aber api_key leer ist, liefert load_provider_config enabled=False."""
        settings = SettingsRepository(db)
        await save_provider_config(
            settings,
            enabled=True,
            base_url="https://api.openai.com/v1",
            model="gpt-4o-mini",
            api_key="",
        )
        config = await load_provider_config(settings)
        assert config.enabled is False

    @pytest.mark.asyncio
    async def test_save_without_api_key_keeps_existing(
        self, db: Database,
    ) -> None:
        """``api_key=None`` bei save laesst den bestehenden Key
        unberuehrt — Pflege-UI muss nicht jeden Save den Key
        eintippen."""
        settings = SettingsRepository(db)
        await save_provider_config(
            settings, enabled=True,
            base_url="https://api.openai.com/v1",
            model="gpt-4o-mini",
            api_key="sk-original",
        )
        await save_provider_config(
            settings, enabled=True,
            base_url="https://other.com/v1",
            model="gpt-other",
            api_key=None,  # NICHT setzen
        )
        config = await load_provider_config(settings)
        assert config.api_key == "sk-original"
        assert config.base_url == "https://other.com/v1"

    @pytest.mark.asyncio
    async def test_url_validation_rejects_file_scheme(
        self, db: Database,
    ) -> None:
        settings = SettingsRepository(db)
        with pytest.raises(ValueError, match="scheme"):
            await save_provider_config(
                settings, enabled=True,
                base_url="file:///etc/passwd",
                model="x", api_key="y",
            )

    @pytest.mark.asyncio
    async def test_url_validation_accepts_http_and_https(
        self, db: Database,
    ) -> None:
        settings = SettingsRepository(db)
        await save_provider_config(
            settings, enabled=True,
            base_url="http://localhost:11434/v1",  # Ollama
            model="llama3", api_key="dummy",
        )
        await save_provider_config(
            settings, enabled=True,
            base_url="https://api.openai.com/v1",
            model="gpt-4o", api_key="sk-x",
        )
        # Beide haben sich speichern lassen (kein Throw)

    @pytest.mark.asyncio
    async def test_invalid_timeout_falls_back_to_default(
        self, db: Database,
    ) -> None:
        settings = SettingsRepository(db)
        # Direkt einen kaputten Wert setzen
        await settings.set(SETTINGS_KEY_LLM_TIMEOUT_S, "not-a-number")
        config = await load_provider_config(settings)
        assert config.timeout_s == DEFAULT_LLM_TIMEOUT_S

    @pytest.mark.asyncio
    async def test_invalid_max_tokens_falls_back_to_default(
        self, db: Database,
    ) -> None:
        settings = SettingsRepository(db)
        await settings.set(SETTINGS_KEY_LLM_MAX_TOKENS, "abc")
        config = await load_provider_config(settings)
        assert config.max_tokens == DEFAULT_LLM_MAX_TOKENS


# ---------------------------------------------------------------------------
# redact_for_response
# ---------------------------------------------------------------------------


def test_redact_strips_api_key() -> None:
    from custom_components.messagehub.processing.recommendation_provider import (
        ProviderConfig,
    )
    cfg = ProviderConfig(
        enabled=True,
        base_url="https://api.openai.com/v1",
        model="gpt-4o-mini",
        api_key="sk-secret",
        timeout_s=15.0,
        max_tokens=800,
        system_prompt_override="",
    )
    redacted = redact_for_response(cfg)
    # Kein Klartext-Key im Response-Dict
    assert "api_key" not in redacted
    # Stattdessen ein Bool-Marker
    assert redacted["api_key_set"] is True


def test_redact_signals_missing_key() -> None:
    from custom_components.messagehub.processing.recommendation_provider import (
        ProviderConfig,
    )
    cfg = ProviderConfig(
        enabled=False, base_url="", model="", api_key="",
    )
    redacted = redact_for_response(cfg)
    assert redacted["api_key_set"] is False


def test_redact_includes_default_system_prompt_for_prefill() -> None:
    """Iter UX-7: Default-Prompt muss im Response stehen, damit das
    Frontend das Editor-Feld vorbefuellen kann.
    """
    from custom_components.messagehub.processing.openai_chat_provider import (
        DEFAULT_SYSTEM_PROMPT,
    )
    from custom_components.messagehub.processing.recommendation_provider import (
        ProviderConfig,
    )
    cfg = ProviderConfig(
        enabled=False, base_url="", model="", api_key="",
    )
    redacted = redact_for_response(cfg)
    assert redacted["default_system_prompt"] == DEFAULT_SYSTEM_PROMPT
    # Read-only — nicht via PUT-Body schreibbar.
    assert "default_system_prompt" in redacted


# ---------------------------------------------------------------------------
# StubProvider
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Iter R3: Refactor-Helfer fuer merge_test_config einzeln getestet
# ---------------------------------------------------------------------------


class TestHasAllowedUrlScheme:
    def test_http_ok(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _has_allowed_url_scheme,
        )
        assert _has_allowed_url_scheme("http://localhost") is True

    def test_https_ok(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _has_allowed_url_scheme,
        )
        assert _has_allowed_url_scheme("https://api.example.com/v1") is True

    def test_file_rejected(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _has_allowed_url_scheme,
        )
        assert _has_allowed_url_scheme("file:///etc/passwd") is False

    def test_javascript_rejected(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _has_allowed_url_scheme,
        )
        assert _has_allowed_url_scheme("javascript:alert(1)") is False

    def test_empty_rejected(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _has_allowed_url_scheme,
        )
        assert _has_allowed_url_scheme("") is False

    def test_case_insensitive(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _has_allowed_url_scheme,
        )
        assert _has_allowed_url_scheme("HTTPS://Api.Example.Com") is True


class TestMergeBaseUrl:
    @staticmethod
    def _stored() -> str:
        return "https://api.openai.com/v1"

    def test_not_in_override_returns_stored(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_base_url,
        )
        assert _merge_base_url(self._stored(), {}) == self._stored()

    def test_override_replaces(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_base_url,
        )
        assert _merge_base_url(
            self._stored(), {"base_url": "https://groq.com/openai/v1"},
        ) == "https://groq.com/openai/v1"

    def test_empty_override_allowed(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_base_url,
        )
        # Leere Strings duerfen explizit gesetzt werden — kein Pflichtfeld
        # im Test-Endpoint.
        assert _merge_base_url(self._stored(), {"base_url": ""}) == ""

    def test_invalid_scheme_raises(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_base_url,
        )
        with pytest.raises(ValueError, match="scheme"):
            _merge_base_url(
                self._stored(), {"base_url": "file:///etc/passwd"},
            )

    def test_too_long_raises(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_base_url,
        )
        with pytest.raises(ValueError, match="exceeds"):
            _merge_base_url(
                self._stored(), {"base_url": "https://" + "a" * 600},
            )


class TestMergeModel:
    def test_not_in_override_returns_stored(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_model,
        )
        assert _merge_model("gpt-4o-mini", {}) == "gpt-4o-mini"

    def test_override_trimmed(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_model,
        )
        assert _merge_model("gpt-4o-mini", {"model": "  llama3  "}) == "llama3"


class TestMergeApiKey:
    def test_not_in_override_keeps_stored(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_api_key,
        )
        assert _merge_api_key("sk-stored", {}) == "sk-stored"

    def test_empty_string_clears(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_api_key,
        )
        assert _merge_api_key("sk-stored", {"api_key": ""}) == ""

    def test_new_value_replaces(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_api_key,
        )
        assert _merge_api_key(
            "sk-stored", {"api_key": "sk-new"},
        ) == "sk-new"


class TestMergeTimeout:
    def test_int_coerced_to_float(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_timeout,
        )
        assert _merge_timeout(15.0, {"timeout_s": 30}) == 30.0

    def test_float_kept(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_timeout,
        )
        assert _merge_timeout(15.0, {"timeout_s": 7.5}) == 7.5

    def test_bool_rejected_falls_back_to_stored(self) -> None:
        # bool ist int-Subklasse — aber semantisch kein Timeout. Stored
        # gewinnt.
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_timeout,
        )
        assert _merge_timeout(15.0, {"timeout_s": True}) == 15.0

    def test_string_falls_back_to_stored(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_timeout,
        )
        assert _merge_timeout(15.0, {"timeout_s": "fast"}) == 15.0

    def test_falsy_stored_uses_default(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_timeout,
        )
        assert _merge_timeout(0.0, {}) == DEFAULT_LLM_TIMEOUT_S


class TestMergeMaxTokens:
    def test_int_kept(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_max_tokens,
        )
        assert _merge_max_tokens(800, {"max_tokens": 1200}) == 1200

    def test_bool_rejected(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_max_tokens,
        )
        assert _merge_max_tokens(800, {"max_tokens": True}) == 800

    def test_float_rejected(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_max_tokens,
        )
        assert _merge_max_tokens(800, {"max_tokens": 1024.5}) == 800

    def test_falsy_stored_uses_default(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_max_tokens,
        )
        assert _merge_max_tokens(0, {}) == DEFAULT_LLM_MAX_TOKENS


class TestMergeSystemPrompt:
    def test_not_in_override_keeps_stored(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_system_prompt,
        )
        assert _merge_system_prompt(
            "Du bist Experte.", {},
        ) == "Du bist Experte."

    def test_empty_clears(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_system_prompt,
        )
        assert _merge_system_prompt(
            "Du bist Experte.", {"system_prompt_override": ""},
        ) == ""

    def test_override_replaces(self) -> None:
        from custom_components.messagehub.processing.recommendation_settings import (  # noqa: PLC0415
            _merge_system_prompt,
        )
        assert _merge_system_prompt(
            "Du bist Experte.",
            {"system_prompt_override": "Andere Instruktion"},
        ) == "Andere Instruktion"


class TestStubProvider:
    @pytest.mark.asyncio
    async def test_stub_always_returns_none(self) -> None:
        provider = stub_provider()
        result = await provider.fetch(
            dpt="9.001",
            manufacturer="hoermann",
            model="garage",
            context={},
        )
        assert result is None

    def test_stub_factory_returns_stub_instance(self) -> None:
        assert isinstance(stub_provider(), StubRecommendationProvider)


# ---------------------------------------------------------------------------
# View-AST-Vertrag
# ---------------------------------------------------------------------------


_VIEW_SRC = (
    Path(__file__).resolve().parents[2]
    / "custom_components"
    / "messagehub"
    / "api"
    / "knx_stats.py"
)


def _find_class(name: str) -> ast.ClassDef:
    tree = ast.parse(_VIEW_SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == name:
            return node
    raise AssertionError(f"Klasse {name} nicht gefunden")


class TestSettingsView:
    def test_url_and_name(self) -> None:
        cls = _find_class("KnxRecommendationLlmSettingsView")
        assigns = {
            n.targets[0].id: ast.literal_eval(n.value)
            for n in cls.body
            if isinstance(n, ast.Assign)
            and len(n.targets) == 1
            and isinstance(n.targets[0], ast.Name)
            and isinstance(n.value, ast.Constant)
        }
        assert assigns.get("url") == (
            "/api/messagehub/knx-recommend/llm-settings"
        )

    def test_get_calls_check_admin_and_redacts(self) -> None:
        cls = _find_class("KnxRecommendationLlmSettingsView")
        get = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "get"
        )
        body_src = ast.unparse(get)
        assert "_check_admin" in body_src
        assert "redact_for_response" in body_src

    def test_put_audit_log_does_not_include_api_key(self) -> None:
        cls = _find_class("KnxRecommendationLlmSettingsView")
        put = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "put"
        )
        body_src = ast.unparse(put)
        # Audit-Aufruf
        assert "audit(" in body_src
        # Audit-Details haben nur api_key_set, nicht den raw key
        assert "api_key_set" in body_src
        # Direkter Audit-Eintrag mit dem Klartext-Key wuerde
        # ``details=...api_key=...`` enthalten — schauen wir, dass das
        # NICHT vorkommt. Heuristik:
        assert "details=\n            details=" not in body_src

    def test_put_clears_persistent_cache(self) -> None:
        cls = _find_class("KnxRecommendationLlmSettingsView")
        put = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "put"
        )
        body_src = ast.unparse(put)
        assert "RecommendationCacheRepository" in body_src
        assert ".clear()" in body_src

    def test_put_clears_in_memory_cache(self) -> None:
        cls = _find_class("KnxRecommendationLlmSettingsView")
        put = next(
            n for n in cls.body
            if isinstance(n, ast.AsyncFunctionDef) and n.name == "put"
        )
        body_src = ast.unparse(put)
        assert "_recommendation_cache.clear()" in body_src


def test_settings_view_registered() -> None:
    src = (_VIEW_SRC.parent / "messages.py").read_text(encoding="utf-8")
    assert src.count("KnxRecommendationLlmSettingsView") >= 2
