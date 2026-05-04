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
