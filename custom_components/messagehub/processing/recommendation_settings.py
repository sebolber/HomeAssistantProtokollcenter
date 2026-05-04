"""Iter L4.1: LLM-Provider-Settings + Stub-Provider.

Settings werden im messagehub_settings-Key/Value-Store persistiert
(SettingsRepository). Schluessel-Praefix ``knx_recommend_llm.``,
gleiche Konvention wie andere Toggle-Settings.

Ein StubProvider liefert immer ``None`` und dient als Default —
solange kein User-Opt-in via Settings erfolgt ist, wird Layer 4
NICHT aufgerufen.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from .recommendation_provider import ProviderConfig, RecommendationProvider

if TYPE_CHECKING:
    from ..storage.settings_repo import SettingsRepository
    from .knx_dpt_recommendations import DptRecommendation


# Settings-Keys (Public, fuer Tests + UI)
SETTINGS_KEY_LLM_ENABLED = "knx_recommend_llm.enabled"
SETTINGS_KEY_LLM_BASE_URL = "knx_recommend_llm.base_url"
SETTINGS_KEY_LLM_MODEL = "knx_recommend_llm.model"
SETTINGS_KEY_LLM_API_KEY = "knx_recommend_llm.api_key"
SETTINGS_KEY_LLM_TIMEOUT_S = "knx_recommend_llm.timeout_s"
SETTINGS_KEY_LLM_MAX_TOKENS = "knx_recommend_llm.max_tokens"
SETTINGS_KEY_LLM_SYSTEM_PROMPT = "knx_recommend_llm.system_prompt_override"

DEFAULT_LLM_TIMEOUT_S = 15.0
DEFAULT_LLM_MAX_TOKENS = 800

# Whitelist erlaubter URL-Schemes — verhindert ``file://``,
# ``ftp://``, JavaScript-Injektion via Setting.
ALLOWED_LLM_URL_SCHEMES: frozenset[str] = frozenset({"http", "https"})


def _validate_url(value: str) -> str:
    """Whitelist-Schema-Check + Trim. Wirft ValueError bei
    ungueltigem Wert (Caller behandelt das als 400-Response).
    """
    cleaned = (value or "").strip()
    if not cleaned:
        raise ValueError("base_url must not be empty")
    lower = cleaned.lower()
    matched = False
    for scheme in ALLOWED_LLM_URL_SCHEMES:
        if lower.startswith(f"{scheme}://"):
            matched = True
            break
    if not matched:
        raise ValueError(
            f"base_url scheme must be one of {sorted(ALLOWED_LLM_URL_SCHEMES)}"
        )
    return cleaned


def _coerce_float(raw: str | None, *, default: float) -> float:
    if raw is None:
        return default
    try:
        return float(raw)
    except (TypeError, ValueError):
        return default


def _coerce_int(raw: str | None, *, default: int) -> int:
    if raw is None:
        return default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


async def load_provider_config(
    settings_repo: "SettingsRepository",
) -> ProviderConfig:
    """Liest die Provider-Konfiguration aus dem Settings-Store.

    Default ``enabled=False`` — kein Layer-4-Aufruf, solange der User
    nicht explizit aktiviert hat. Bei aktivem Toggle aber fehlenden
    Pflichtfeldern (base_url/model/api_key leer) wird der Provider als
    *disabled* zurueckgegeben + Reasoning-Eintrag im Service-Pfad.
    """
    enabled = await settings_repo.get_bool(
        SETTINGS_KEY_LLM_ENABLED, default=False
    )
    base_url = (await settings_repo.get(SETTINGS_KEY_LLM_BASE_URL)) or ""
    model = (await settings_repo.get(SETTINGS_KEY_LLM_MODEL)) or ""
    api_key = (await settings_repo.get(SETTINGS_KEY_LLM_API_KEY)) or ""
    timeout_s = _coerce_float(
        await settings_repo.get(SETTINGS_KEY_LLM_TIMEOUT_S),
        default=DEFAULT_LLM_TIMEOUT_S,
    )
    max_tokens = _coerce_int(
        await settings_repo.get(SETTINGS_KEY_LLM_MAX_TOKENS),
        default=DEFAULT_LLM_MAX_TOKENS,
    )
    system_prompt = (
        await settings_repo.get(SETTINGS_KEY_LLM_SYSTEM_PROMPT)
    ) or ""

    # Self-Disable bei unvollstaendiger Konfig — Service muss nicht
    # selbst pruefen, der ProviderConfig.enabled=False liefert das
    # konsistente Verhalten.
    effective_enabled = (
        enabled and bool(base_url) and bool(model) and bool(api_key)
    )
    return ProviderConfig(
        enabled=effective_enabled,
        base_url=base_url,
        model=model,
        api_key=api_key,
        timeout_s=timeout_s,
        max_tokens=max_tokens,
        system_prompt_override=system_prompt,
    )


async def save_provider_config(
    settings_repo: "SettingsRepository",
    *,
    enabled: bool,
    base_url: str,
    model: str,
    api_key: str | None = None,
    timeout_s: float | None = None,
    max_tokens: int | None = None,
    system_prompt_override: str | None = None,
) -> None:
    """Persistiert die Provider-Konfiguration.

    ``api_key`` ist optional — wenn ``None``, bleibt der bestehende
    Schluessel im Store. So muss der User beim UI-Edit nicht jedes
    Mal den vollen Key eintippen.

    URL wird gegen ALLOWED_LLM_URL_SCHEMES geprueft, sonst
    ``ValueError``.
    """
    if base_url:
        base_url = _validate_url(base_url)
    await settings_repo.set_bool(SETTINGS_KEY_LLM_ENABLED, enabled)
    await settings_repo.set(SETTINGS_KEY_LLM_BASE_URL, base_url)
    await settings_repo.set(SETTINGS_KEY_LLM_MODEL, model)
    if api_key is not None:
        await settings_repo.set(SETTINGS_KEY_LLM_API_KEY, api_key)
    if timeout_s is not None:
        await settings_repo.set(
            SETTINGS_KEY_LLM_TIMEOUT_S, str(float(timeout_s))
        )
    if max_tokens is not None:
        await settings_repo.set(
            SETTINGS_KEY_LLM_MAX_TOKENS, str(int(max_tokens))
        )
    if system_prompt_override is not None:
        await settings_repo.set(
            SETTINGS_KEY_LLM_SYSTEM_PROMPT, system_prompt_override
        )


def redact_for_response(config: ProviderConfig) -> dict[str, Any]:
    """Liefert die Settings fuer das Frontend OHNE den API-Key.

    Frontend bekommt nur ein Boolean ``api_key_set``, sodass der
    Pflege-Dialog "API-Key vorhanden / leer" anzeigen kann, ohne
    den Klartext-Key durch das HTTP-Logging zu schicken.

    Iter UX-7: ``default_system_prompt`` wird mitgeliefert, damit das
    Frontend den Default-Prompt im Editor-Feld vorbefuellen kann (statt
    den User vor einem leeren Textfeld stehen zu lassen). Read-only —
    Aenderung des System-Prompts geht nur ueber ``system_prompt_override``.
    """
    # Lokaler Import vermeidet Cycle (openai_chat_provider importiert
    # ProviderConfig aus recommendation_provider).
    from .openai_chat_provider import DEFAULT_SYSTEM_PROMPT  # noqa: PLC0415

    return {
        "enabled": config.enabled,
        "base_url": config.base_url,
        "model": config.model,
        "api_key_set": bool(config.api_key),
        "timeout_s": config.timeout_s,
        "max_tokens": config.max_tokens,
        "system_prompt_override": config.system_prompt_override,
        "default_system_prompt": DEFAULT_SYSTEM_PROMPT,
    }


class StubRecommendationProvider:
    """Default-Provider — liefert immer ``None``.

    Wird genutzt, solange Layer 4 deaktiviert ist (``enabled=False``)
    oder die Settings unvollstaendig sind. Dadurch hat
    ``compute_device_recommendation`` immer einen non-None Provider
    zum Aufrufen, ohne mit None-Checks gespickt zu sein.
    """

    name = "stub"

    async def fetch(
        self,
        *,
        dpt: str | None,
        manufacturer: str | None,
        model: str | None,
        context: dict[str, Any],
    ) -> "DptRecommendation | None":
        return None


def stub_provider() -> RecommendationProvider:
    """Public-Factory — Tests + Pipeline-Default."""
    return StubRecommendationProvider()


def _coerce_optional_str(
    value: object, *, max_len: int,
) -> str | None:
    """Robust gegen non-str (None passthrough, leerer String OK)."""
    if value is None:
        return None
    if not isinstance(value, str):
        return None
    if len(value) > max_len:
        # Konsistent mit validate_note: zu lang -> Fehler. Caller
        # entscheidet, ob das ein 400 ist.
        raise ValueError(f"value exceeds {max_len} chars")
    return value


def merge_test_config(
    stored: ProviderConfig, override: dict[str, Any],
) -> ProviderConfig:
    """Iter UX-4: mischt Override-Felder ueber die gespeicherte Konfig
    fuer den Test-Endpoint.

    Verhalten:
    - ``api_key`` NICHT im Override -> behaelt den gespeicherten Wert
      (typisches UX: User testet andere Felder ohne den Key neu zu
      tippen).
    - ``api_key`` mit Leerstring -> setzt explizit auf leer (loescht).
    - ``base_url`` muss http/https sein (sonst ValueError).
    - ``enabled=True`` wird forciert — der Test soll auch laufen,
      wenn der Master-Toggle noch off ist.
    """
    if "base_url" in override:
        base_url_raw = _coerce_optional_str(
            override.get("base_url"), max_len=500,
        )
        base_url = (base_url_raw or "").strip()
        if base_url:
            lower = base_url.lower()
            if not any(
                lower.startswith(f"{scheme}://")
                for scheme in ALLOWED_LLM_URL_SCHEMES
            ):
                raise ValueError(
                    f"base_url scheme must be one of "
                    f"{sorted(ALLOWED_LLM_URL_SCHEMES)}"
                )
    else:
        base_url = stored.base_url
    if "model" in override:
        model_raw = _coerce_optional_str(
            override.get("model"), max_len=200,
        )
        model = (model_raw or "").strip()
    else:
        model = stored.model
    if "api_key" in override:
        api_key_raw = _coerce_optional_str(
            override.get("api_key"), max_len=2000,
        )
        api_key = api_key_raw if api_key_raw is not None else ""
    else:
        api_key = stored.api_key
    raw_timeout = override.get("timeout_s")
    if isinstance(raw_timeout, (int, float)):
        timeout_s = float(raw_timeout)
    else:
        timeout_s = stored.timeout_s or DEFAULT_LLM_TIMEOUT_S
    raw_max_tokens = override.get("max_tokens")
    if isinstance(raw_max_tokens, int) and not isinstance(
        raw_max_tokens, bool
    ):
        max_tokens = raw_max_tokens
    else:
        max_tokens = stored.max_tokens or DEFAULT_LLM_MAX_TOKENS
    if "system_prompt_override" in override:
        sp_raw = _coerce_optional_str(
            override.get("system_prompt_override"), max_len=4000,
        )
        system_prompt = sp_raw or ""
    else:
        system_prompt = stored.system_prompt_override
    return ProviderConfig(
        enabled=True,
        base_url=base_url,
        model=model,
        api_key=api_key,
        timeout_s=timeout_s,
        max_tokens=max_tokens,
        system_prompt_override=system_prompt,
    )
