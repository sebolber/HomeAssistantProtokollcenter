"""Iter R4: HA-freie Logik fuer den LLM-Verbindungstest.

Trennt LLM-Orchestrierung (deterministische Inputs, Latenz-Messung,
Fehler-Kategorisierung, Response-Serialisierung) von den HTTP-Anliegen
(Auth, Rate-Limit, Audit), die im ``KnxRecommendationLlmTestView``
verbleiben.

Vorteile
- Pure-Function-Helfer sind ohne ``aiohttp``/``HomeAssistant`` testbar
  (``run_provider_test`` arbeitet auf einem ``RecommendationProvider``-
  Protokoll, das in Tests durch Doubles ersetzbar ist).
- Deterministische Test-Inputs sind als Modul-Konstanten zentral
  gepflegt — ein Test pinnt sie, statt dass der View-Source-Code
  durch AST gegriffen werden muss.
- Latenz-Berechnung ist ueber ``monotonic_factory`` injizierbar,
  damit Tests reproduzierbar sind.
"""

from __future__ import annotations

import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal

if TYPE_CHECKING:
    from .knx_dpt_recommendations import DptRecommendation
    from .recommendation_provider import RecommendationProvider


# Deterministische Test-Inputs: kein Datenleck zum LLM, identisches
# DPT-Profil ueber Aufrufe — Latenz/Erfolg sind dadurch vergleichbar.
DETERMINISTIC_TEST_DPT: str = "9.001"
DETERMINISTIC_TEST_MANUFACTURER: str = "test"
DETERMINISTIC_TEST_MODEL: str = "test"
DETERMINISTIC_TEST_CONTEXT: dict[str, Any] = {
    "test_request": True,
    "observed_mode": "cyclic",
    "median_interval_minutes": 1.0,
    "sample_count": 30,
}

ErrorCategory = Literal[
    "incomplete_config", "exception", "invalid_response",
]


_INVALID_RESPONSE_MESSAGE = (
    "Provider hat keine Empfehlung geliefert "
    "(rate-limited, ungueltige Antwort oder leerer "
    "Output). Server-Log fuer Details pruefen."
)

_INCOMPLETE_CONFIG_MESSAGE = (
    "Konfiguration unvollstaendig — base_url, model "
    "und api_key sind Pflicht."
)


@dataclass(frozen=True)
class ProviderTestResult:
    """Strukturiertes Ergebnis eines LLM-Verbindungstests."""

    ok: bool
    latency_ms: float
    response: DptRecommendation | None
    error: str | None
    error_category: ErrorCategory | None


async def run_provider_test(
    provider: RecommendationProvider,
    *,
    monotonic: Callable[[], float] = time.monotonic,
) -> ProviderTestResult:
    """Schickt einen deterministischen Test-Request und liefert das
    Resultat strukturiert zurueck.

    ``monotonic`` ist als Dependency-Injection-Hook fuer Tests
    (Default: ``time.monotonic``).
    """
    start = monotonic()
    try:
        response = await provider.fetch(
            dpt=DETERMINISTIC_TEST_DPT,
            manufacturer=DETERMINISTIC_TEST_MANUFACTURER,
            model=DETERMINISTIC_TEST_MODEL,
            context=DETERMINISTIC_TEST_CONTEXT,
        )
    except Exception as err:
        elapsed = round((monotonic() - start) * 1000.0, 1)
        return ProviderTestResult(
            ok=False,
            latency_ms=elapsed,
            response=None,
            error=f"{type(err).__name__}: {err}",
            error_category="exception",
        )
    elapsed = round((monotonic() - start) * 1000.0, 1)
    if response is None:
        return ProviderTestResult(
            ok=False,
            latency_ms=elapsed,
            response=None,
            error=_INVALID_RESPONSE_MESSAGE,
            error_category="invalid_response",
        )
    return ProviderTestResult(
        ok=True,
        latency_ms=elapsed,
        response=response,
        error=None,
        error_category=None,
    )


def incomplete_config_result() -> ProviderTestResult:
    """Pre-Flight-Resultat fuer fehlende Pflichtfelder (base_url/model/
    api_key). Vom View-Pfad genutzt, bevor ein Provider gebaut wird.
    """
    return ProviderTestResult(
        ok=False,
        latency_ms=0.0,
        response=None,
        error=_INCOMPLETE_CONFIG_MESSAGE,
        error_category="incomplete_config",
    )


def serialize_test_result(result: ProviderTestResult) -> dict[str, Any]:
    """Serialisiert das Test-Resultat ins HTTP-Response-Schema.

    Format ist als oeffentlicher Vertrag dokumentiert:
    {
      "ok": bool,
      "latency_ms": float,
      "response": dict | null,
      "error": str | null,
      "error_category": "incomplete_config" | "exception" |
                        "invalid_response" | null,
    }
    """
    payload: dict[str, Any] = {
        "ok": result.ok,
        "latency_ms": result.latency_ms,
        "response": None,
        "error": result.error,
        "error_category": result.error_category,
    }
    if result.response is not None:
        payload["response"] = {
            "mode": result.response.mode,
            "cycle_minutes_min": result.response.cycle_minutes_min,
            "cycle_minutes_max": result.response.cycle_minutes_max,
            "hysteresis": result.response.hysteresis,
            "max_rate_per_min": result.response.max_rate_per_min,
            "rationale": result.response.rationale,
        }
    return payload
