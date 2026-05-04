"""Iter R4: Tests fuer den HA-freien LLM-Test-Runner.

Verhalten in Isolation: deterministische Inputs, Latenz-Messung,
Exception-Handling, Response-Schema. Kein HA, kein aiohttp.
"""

from __future__ import annotations

from typing import Any

import pytest

from custom_components.messagehub.processing.knx_dpt_recommendations import (
    DptRecommendation,
)
from custom_components.messagehub.processing.recommendation_test_runner import (
    DETERMINISTIC_TEST_CONTEXT,
    DETERMINISTIC_TEST_DPT,
    DETERMINISTIC_TEST_MANUFACTURER,
    DETERMINISTIC_TEST_MODEL,
    ProviderTestResult,
    incomplete_config_result,
    run_provider_test,
    serialize_test_result,
)


class _FakeProvider:
    """Minimaler RecommendationProvider-Double fuer Tests."""

    name = "fake"

    def __init__(
        self,
        *,
        response: DptRecommendation | None = None,
        raises: type[BaseException] | None = None,
    ) -> None:
        self._response = response
        self._raises = raises
        self.last_call: dict[str, Any] | None = None
        self.call_count = 0

    async def fetch(
        self,
        *,
        dpt: str | None,
        manufacturer: str | None,
        model: str | None,
        context: dict[str, Any],
    ) -> DptRecommendation | None:
        self.call_count += 1
        self.last_call = {
            "dpt": dpt,
            "manufacturer": manufacturer,
            "model": model,
            "context": context,
        }
        if self._raises is not None:
            raise self._raises("simulated provider failure")
        return self._response


def _make_clock(values: list[float]) -> Any:
    """Mini-Klock-Generator: konsumiert Werte aus der Liste in
    Aufruf-Reihenfolge (deterministische Latenz fuer Tests).
    """
    def _next() -> float:
        return values.pop(0)
    return _next


# ---------------------------------------------------------------------------
# Deterministische Inputs (Pinning)
# ---------------------------------------------------------------------------


class TestDeterministicInputs:
    def test_dpt_is_temperature(self) -> None:
        # 9.001 = DPT_Value_Temp — gut bekannt, nicht User-spezifisch.
        assert DETERMINISTIC_TEST_DPT == "9.001"

    def test_manufacturer_and_model_are_test_literals(self) -> None:
        assert DETERMINISTIC_TEST_MANUFACTURER == "test"
        assert DETERMINISTIC_TEST_MODEL == "test"

    def test_context_marks_test_request(self) -> None:
        assert DETERMINISTIC_TEST_CONTEXT["test_request"] is True

    def test_context_has_no_user_data(self) -> None:
        # Kein dev_source, kein GA, kein customer label — nur generische
        # Stats. Das ist der Datenschutz-Vertrag des Test-Endpoints.
        forbidden_keys = {
            "dev_source", "ga", "customer", "user_id", "label",
        }
        present = set(DETERMINISTIC_TEST_CONTEXT.keys())
        assert present.isdisjoint(forbidden_keys)


# ---------------------------------------------------------------------------
# run_provider_test
# ---------------------------------------------------------------------------


class TestRunProviderTest:
    @pytest.mark.asyncio
    async def test_happy_path_returns_ok_result(self) -> None:
        recommendation = DptRecommendation(
            mode="hybrid",
            cycle_minutes_min=5,
            cycle_minutes_max=15,
            hysteresis=">= 0.2 K",
            max_rate_per_min=2.0,
            rationale="Temperatur-Hysterese.",
        )
        provider = _FakeProvider(response=recommendation)
        result = await run_provider_test(
            provider, monotonic=_make_clock([100.0, 100.234]),
        )
        assert result.ok is True
        assert result.response == recommendation
        assert result.error is None
        assert result.error_category is None
        assert result.latency_ms == 234.0

    @pytest.mark.asyncio
    async def test_provider_returns_none_yields_invalid_response(self) -> None:
        provider = _FakeProvider(response=None)
        result = await run_provider_test(
            provider, monotonic=_make_clock([0.0, 0.5]),
        )
        assert result.ok is False
        assert result.error_category == "invalid_response"
        assert result.response is None
        assert "keine Empfehlung" in (result.error or "")
        assert result.latency_ms == 500.0

    @pytest.mark.asyncio
    async def test_exception_yields_exception_category(self) -> None:
        provider = _FakeProvider(raises=RuntimeError)
        result = await run_provider_test(
            provider, monotonic=_make_clock([0.0, 0.05]),
        )
        assert result.ok is False
        assert result.error_category == "exception"
        assert "RuntimeError" in (result.error or "")
        assert result.latency_ms == 50.0

    @pytest.mark.asyncio
    async def test_uses_deterministic_inputs(self) -> None:
        provider = _FakeProvider(response=None)
        await run_provider_test(provider)
        assert provider.last_call == {
            "dpt": DETERMINISTIC_TEST_DPT,
            "manufacturer": DETERMINISTIC_TEST_MANUFACTURER,
            "model": DETERMINISTIC_TEST_MODEL,
            "context": DETERMINISTIC_TEST_CONTEXT,
        }

    @pytest.mark.asyncio
    async def test_does_not_call_provider_twice(self) -> None:
        provider = _FakeProvider(response=None)
        await run_provider_test(provider)
        assert provider.call_count == 1


# ---------------------------------------------------------------------------
# incomplete_config_result + serialize_test_result
# ---------------------------------------------------------------------------


class TestIncompleteConfigResult:
    def test_shape(self) -> None:
        result = incomplete_config_result()
        assert result.ok is False
        assert result.latency_ms == 0.0
        assert result.response is None
        assert result.error_category == "incomplete_config"
        assert "base_url, model" in (result.error or "")


class TestSerializeTestResult:
    def test_response_serialized_when_present(self) -> None:
        recommendation = DptRecommendation(
            mode="cyclic",
            cycle_minutes_min=10,
            cycle_minutes_max=10,
            hysteresis=None,
            max_rate_per_min=0.5,
            rationale="x",
        )
        result = ProviderTestResult(
            ok=True, latency_ms=42.0, response=recommendation,
            error=None, error_category=None,
        )
        payload = serialize_test_result(result)
        assert payload["ok"] is True
        assert payload["latency_ms"] == 42.0
        assert payload["response"] == {
            "mode": "cyclic",
            "cycle_minutes_min": 10,
            "cycle_minutes_max": 10,
            "hysteresis": None,
            "max_rate_per_min": 0.5,
            "rationale": "x",
        }
        assert payload["error"] is None
        assert payload["error_category"] is None

    def test_response_null_when_absent(self) -> None:
        result = ProviderTestResult(
            ok=False, latency_ms=0.0, response=None,
            error="x", error_category="exception",
        )
        payload = serialize_test_result(result)
        assert payload["response"] is None
        assert payload["ok"] is False
        assert payload["error_category"] == "exception"

    def test_schema_contract_keys(self) -> None:
        # Frontend baut auf diesen Keys — Vertrag pinnen.
        result = ProviderTestResult(
            ok=False, latency_ms=0.0, response=None,
            error=None, error_category=None,
        )
        payload = serialize_test_result(result)
        assert set(payload.keys()) == {
            "ok", "latency_ms", "response", "error", "error_category",
        }
