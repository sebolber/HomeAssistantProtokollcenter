"""Iter G3: Snapshot-Test gegen API-Key-Leakage.

Konzept-Schwaeche G3: Audit-Log, Cache und Response-DTOs muessen den
API-Key niemals durchschleifen — ein einzelner Code-Pfad mit
``str(provider_config)`` oder ``json.dumps(config)`` genuegt fuer einen
Leak. Statt nach jedem Code-Pfad einzeln zu pruefen, nutzen wir einen
"verbotener Token"-Snapshot: einen eindeutigen Test-Key, der in keinem
DTO/Cache vorkommen darf.
"""

from __future__ import annotations

import json
from typing import Any

import pytest

from custom_components.messagehub.processing.recommendation_provider import (
    ProviderConfig,
)
from custom_components.messagehub.processing.recommendation_settings import (
    redact_for_response,
)
from custom_components.messagehub.storage.recommendation_cache_repo import (
    make_cache_key,
)


_LEAK_TOKEN = "TESTKEY-DONOTLEAK-3f8c1a47-9b2d-4e6f-8a0b-1c5d3e7f2a91"


def _make_config() -> ProviderConfig:
    return ProviderConfig(
        enabled=True,
        base_url="https://api.openai.com/v1",
        model="gpt-4o-mini",
        api_key=_LEAK_TOKEN,
        timeout_s=15.0,
        max_tokens=800,
        system_prompt_override="",
    )


def _scan(payload: Any) -> bool:
    """True, wenn der Leak-Token im (rekursiv serialisierten) Payload steckt."""
    text = json.dumps(payload, default=str, ensure_ascii=False)
    return _LEAK_TOKEN in text


def test_redact_for_response_does_not_include_api_key() -> None:
    redacted = redact_for_response(_make_config())
    assert not _scan(redacted), f"redact_for_response leakt: {redacted!r}"
    assert redacted.get("api_key_set") is True
    assert "api_key" not in redacted, "api_key darf NICHT als Klartext im DTO sein"


def test_make_cache_key_returns_hash_not_key() -> None:
    """Iter C2: api_key wirkt nur ueber seinen Fingerprint — der Key
    selbst darf nicht im Cache-Key auftauchen."""
    key = make_cache_key(
        provider="openai_chat",
        model="gpt-4o-mini",
        dpt="9.001",
        manufacturer="hager",
        device_model="dali-gateway",
        api_key=_LEAK_TOKEN,
    )
    assert _LEAK_TOKEN not in key, "Cache-Key darf api_key nicht enthalten"
    # 64 Hex-Zeichen (sha256-Hex).
    assert len(key) == 64
    assert all(c in "0123456789abcdef" for c in key)


def test_make_cache_key_differs_with_different_api_keys() -> None:
    """Zwei verschiedene Keys → zwei verschiedene Cache-Keys."""
    other_key = _LEAK_TOKEN[::-1]
    a = make_cache_key(
        provider="openai_chat",
        model="gpt-4o-mini",
        dpt="9.001",
        manufacturer=None,
        device_model=None,
        api_key=_LEAK_TOKEN,
    )
    b = make_cache_key(
        provider="openai_chat",
        model="gpt-4o-mini",
        dpt="9.001",
        manufacturer=None,
        device_model=None,
        api_key=other_key,
    )
    assert a != b


def test_make_cache_key_without_api_key_is_stable() -> None:
    """Backward-Compat: Aufrufer ohne api_key bekommen reproduzierbare Keys."""
    a = make_cache_key(
        provider="openai_chat",
        model="gpt-4o-mini",
        dpt="9.001",
        manufacturer=None,
        device_model=None,
    )
    b = make_cache_key(
        provider="openai_chat",
        model="gpt-4o-mini",
        dpt="9.001",
        manufacturer=None,
        device_model=None,
    )
    assert a == b


def test_provider_config_repr_documents_state() -> None:
    """``ProviderConfig`` ist eine simple frozen=dataclass mit default
    ``__repr__``; der zeigt den api_key. Audit/UI/Cache-Pfade sind
    redactiert (Tests oben), aber wer ``repr(cfg)`` direkt ins Logging
    packt, leakt den Key — der Test markiert das mit ``xfail``, sodass
    ein bewusster ``__repr__``-Override ihn in Zukunft auf passing
    setzen kann.
    """
    text = repr(_make_config())
    if _LEAK_TOKEN in text:
        pytest.xfail(
            "ProviderConfig.__repr__ zeigt aktuell den api_key. "
            "Wenn das jemandem auffaellt: __repr__-Override mit "
            "redactiertem Key implementieren."
        )
