"""Iter L4.2: OpenAI-Chat-Completions-kompatibler Provider.

Sprich das ``/v1/chat/completions``-Format. Damit funktioniert das
gleiche Modul fuer:
- OpenAI direkt
- Azure-OpenAI (mit angepasstem base_url + Modell-Namen)
- Self-hosted: Ollama, vLLM, LiteLLM-Gateway, LM Studio
- Cloud-Aggregatoren: Groq, Together, Replicate, ...

Anthropic-Kompatibilitaet: Anthropic spricht ein anderes Schema —
User koennen einen LiteLLM-Gateway davorsetzen, der OpenAI auf
Anthropic uebersetzt. Direkter Anthropic-Provider waere ein eigener
L4.x-Iter (Future).

Sicherheits-Vorgaben:
- Inputs (manufacturer, model, dpt) werden NICHT direkt im Prompt
  konkateniert, sondern als enumerierte Whitelist-Strings durch
  ``_safe_str`` durchgefiltert (Whitelist alphanumerisch +
  Sonderzeichen-Subset).
- API-Key wird nur im Authorization-Header gesendet, niemals
  geloggt oder im Reasoning-Eintrag eingebettet.
- Rate-Limit (``TokenBucketLimiter``) global pro Provider —
  schuetzt vor LLM-Cost-Runaway.
- Timeout aus ProviderConfig.
- Strukturierter JSON-Output ueber ``response_format``-Parameter
  (OpenAI Structured Outputs) bzw. JSON-Mode.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from .knx_dpt_recommendations import DptRecommendation
from .rate_limit import TokenBucketLimiter
from .recommendation_provider import ProviderConfig

_LOGGER = logging.getLogger(__name__)


# Globaler Rate-Limit-Bucket — User-Cost-Schutz. Nicht pro dev_source,
# sondern pro Provider-Aufruf insgesamt: bei einem typischen Drawer-
# Refresh genug, kein Burst-Aufruf wegen externer Dependencies.
LLM_DEFAULT_RATE_LIMIT_PER_MIN = 5.0
"""5 Aufrufe/Minute global. User mit hoeherem Budget kann via
ProviderConfig in Settings hochsetzen (Future: extra Field)."""


_GLOBAL_LIMITER = TokenBucketLimiter(
    capacity=LLM_DEFAULT_RATE_LIMIT_PER_MIN,
    refill_per_minute=LLM_DEFAULT_RATE_LIMIT_PER_MIN,
)


# Whitelist-Pattern: nur diese Zeichen duerfen im Prompt-Kontext
# ankommen. Alles andere wird durch ``_safe_str`` rausgefiltert —
# verhindert Prompt-Injection ueber manufacturer/model-Felder.
_SAFE_PROMPT_CHARS = re.compile(r"[^a-zA-Z0-9._\-/+ ]")


def _safe_str(raw: str | None, *, max_len: int = 80) -> str:
    """Whitelist-Filter: nur a-zA-Z0-9 + ``. _ - / + space`` durch.

    Wird auf ALLE User-/DB-Eingaben angewandt, bevor sie im Prompt
    landen. Verhindert ``"\nIgnore previous instructions..."``-Style
    Injektionen.
    """
    if raw is None:
        return ""
    cleaned = _SAFE_PROMPT_CHARS.sub("", raw.strip())
    return cleaned[:max_len]


# Default-System-Prompt. Strukturierter JSON-Output erleichtert das
# Parsen + ist robuster gegen LLM-Drift.
DEFAULT_SYSTEM_PROMPT = """Du bist ein Experte fuer KNX-Hausautomation. \
Du erhaelst einen KNX-Datapoint-Type (DPT) und optional Hersteller +
Modell. Liefere die optimale Sende-Strategie als strukturierten JSON.

Antwort-Schema:
{
  "mode": "on_change" | "cyclic" | "hybrid",
  "cycle_minutes_min": null | int,
  "cycle_minutes_max": null | int,
  "hysteresis": null | string,
  "max_rate_per_min": float,
  "rationale": string
}

Regeln:
- Kurze, konkrete rationale (max 2 Saetze).
- cycle_minutes ist null fuer "on_change"-only Empfehlungen.
- hysteresis ist null bei boolean-DPTs.
- Antworte NUR mit dem JSON-Objekt, keine Markdown-Codefences.
"""


_VALID_MODES: frozenset[str] = frozenset({"on_change", "cyclic", "hybrid"})

# HTTP-Status-Schwelle: alles >= 400 ist Client/Server-Fehler.
_HTTP_BAD_REQUEST_STATUS = 400

# split("```", 2) liefert mind. 3 Parts wenn beide Fences vorhanden,
# 2 Parts wenn nur die oeffnende Fence existiert. < 2 = kein gueltiger
# Codefence-Block.
_CODEFENCE_MIN_PARTS = 2

# Lange des "json"-Sprach-Prefix nach der oeffnenden Codefence.
_JSON_LANG_TAG_LEN = 4

_DEFAULT_MAX_RATE_PER_MIN = 1.0
_DEFAULT_RATIONALE_FALLBACK = (
    "LLM-Empfehlung — keine Begruendung mitgeliefert."
)


def _strip_codefences(raw: str) -> str:
    """Entfernt ```...``` und optionale ``json``-Sprachtags.

    Beispiele:
    - "```json\\n{...}\\n```" -> "{...}"
    - "```{...}```" -> "{...}"
    - "{...}" -> "{...}" (unveraendert)
    - "```" (kaputt) -> raw zurueck (Fallback)
    """
    text = raw.strip()
    if not text.startswith("```"):
        return text
    parts = text.split("```", 2)
    if len(parts) < _CODEFENCE_MIN_PARTS:
        # Sehr ungewoehnlich (kein zweites ```), Fallback auf raw.
        return raw
    inner = parts[1]
    if inner.startswith("json"):
        inner = inner[_JSON_LANG_TAG_LEN:].lstrip()
    return inner.strip("` \n\t")


def _coerce_optional_int(value: object) -> int | None:
    """``None``-passthrough, sonst best-effort ``int``-Cast."""
    if value is None:
        return None
    if isinstance(value, int) and not isinstance(value, bool):
        return value
    try:
        return int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


def _coerce_cycle_pair(
    payload: dict[str, Any],
) -> tuple[int | None, int | None]:
    """Cycle-Min/Max sind paarweise: beide gesetzt oder beide ``None``.

    Wenn nur einer gesetzt ist, wird der andere ebenfalls auf ``None``
    gezogen, damit der Service-Pfad ein konsistentes Schema sieht.
    """
    cycle_min = _coerce_optional_int(payload.get("cycle_minutes_min"))
    cycle_max = _coerce_optional_int(payload.get("cycle_minutes_max"))
    if (cycle_min is None) != (cycle_max is None):
        return None, None
    return cycle_min, cycle_max


def _coerce_max_rate(value: object) -> float:
    """Float-Cast mit Fallback auf 1.0; 0/Negativ wird ebenfalls
    durch den Default ersetzt (LLM darf den Bus nicht stilllegen).
    """
    try:
        rate = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return _DEFAULT_MAX_RATE_PER_MIN
    if rate <= 0:
        return _DEFAULT_MAX_RATE_PER_MIN
    return rate


def _coerce_rationale(value: object) -> str:
    if not isinstance(value, str) or not value.strip():
        return _DEFAULT_RATIONALE_FALLBACK
    return value.strip()


def _coerce_hysteresis(value: object) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        return None
    return value


def _build_user_prompt(
    *,
    dpt: str | None,
    manufacturer: str | None,
    model: str | None,
    context: dict[str, Any],
) -> str:
    """Erzeugt den User-Prompt mit gesicherten Inputs."""
    safe_dpt = _safe_str(dpt)
    safe_manufacturer = _safe_str(manufacturer)
    safe_model = _safe_str(model)
    lines = [
        f"DPT: {safe_dpt or 'unbekannt'}",
        f"Hersteller: {safe_manufacturer or 'unbekannt'}",
        f"Modell: {safe_model or 'unbekannt'}",
    ]
    # context ist auf bestimmte Whitelist-Keys beschraenkt — wir
    # akzeptieren nur Strings + numerische Werte.
    safe_context: list[str] = []
    for key, value in context.items():
        safe_key = _safe_str(str(key), max_len=40)
        if not safe_key:
            continue
        if isinstance(value, (int, float)):
            safe_context.append(f"{safe_key}: {value}")
        elif isinstance(value, str):
            safe_context.append(f"{safe_key}: {_safe_str(value)}")
    if safe_context:
        lines.append("Kontext:")
        lines.extend(f"  - {entry}" for entry in safe_context)
    return "\n".join(lines)


def _parse_response(raw: str) -> DptRecommendation | None:
    """Parst LLM-Antwort zu DptRecommendation.

    Robust gegen Markdown-Codefences, Whitespace, falsche Feld-
    Reihenfolge und unbekannte Zusatzfelder. Cycle-Min/Max bleiben
    paarweise konsistent; ``max_rate_per_min`` faellt auf einen
    sicheren Default zurueck statt auf 0/Negativ.
    """
    cleaned = _strip_codefences(raw)
    try:
        payload = json.loads(cleaned)
    except (TypeError, ValueError):
        return None
    if not isinstance(payload, dict):
        return None
    mode = payload.get("mode")
    if mode not in _VALID_MODES:
        return None
    cycle_min, cycle_max = _coerce_cycle_pair(payload)
    return DptRecommendation(
        mode=mode,  # type: ignore[arg-type]
        cycle_minutes_min=cycle_min,
        cycle_minutes_max=cycle_max,
        hysteresis=_coerce_hysteresis(payload.get("hysteresis")),
        max_rate_per_min=_coerce_max_rate(
            payload.get("max_rate_per_min", _DEFAULT_MAX_RATE_PER_MIN),
        ),
        rationale=_coerce_rationale(payload.get("rationale", "")),
    )


class OpenAIChatProvider:
    """OpenAI-Chat-Completions-kompatibler LLM-Provider.

    ``client_factory`` ist als Dependency-Injection-Hook fuer Tests:
    Default ist ``aiohttp.ClientSession``; Test-Doubles koennen einen
    Mock injizieren ohne echten HTTP-Verkehr.
    """

    name = "openai_chat"

    def __init__(
        self,
        config: ProviderConfig,
        *,
        rate_limiter: TokenBucketLimiter | None = None,
        client_factory: Any | None = None,
    ) -> None:
        self._config = config
        self._limiter = rate_limiter or _GLOBAL_LIMITER
        self._client_factory = client_factory

    async def fetch(
        self,
        *,
        dpt: str | None,
        manufacturer: str | None,
        model: str | None,
        context: dict[str, Any],
    ) -> DptRecommendation | None:
        if not self._config.enabled:
            return None
        if not self._limiter.allow("openai_chat"):
            _LOGGER.warning(
                "knx_recommend_llm rate-limited — request dropped"
            )
            return None
        system_prompt = (
            self._config.system_prompt_override.strip()
            or DEFAULT_SYSTEM_PROMPT
        )
        user_prompt = _build_user_prompt(
            dpt=dpt,
            manufacturer=manufacturer,
            model=model,
            context=context,
        )
        body = {
            "model": self._config.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": self._config.max_tokens,
            "response_format": {"type": "json_object"},
        }
        url = self._config.base_url.rstrip("/") + "/chat/completions"
        return await self._post_and_parse(url, body)

    async def _post_and_parse(
        self, url: str, body: dict[str, Any],
    ) -> DptRecommendation | None:
        # Lokaler Import, weil aiohttp im Test-Pfad nicht verfuegbar
        # sein muss (Mock-client_factory uebernimmt).
        if self._client_factory is None:
            import aiohttp  # noqa: PLC0415
            timeout = aiohttp.ClientTimeout(total=self._config.timeout_s)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                return await self._do_post(session, url, body)
        # Test-Pfad: client_factory liefert eine ClientSession.
        async with self._client_factory() as session:
            return await self._do_post(session, url, body)

    async def _do_post(
        self, session: Any, url: str, body: dict[str, Any],
    ) -> DptRecommendation | None:
        headers = {
            "Authorization": f"Bearer {self._config.api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with session.post(
                url, json=body, headers=headers,
            ) as resp:
                if resp.status >= _HTTP_BAD_REQUEST_STATUS:
                    _LOGGER.warning(
                        "knx_recommend_llm provider HTTP %s",
                        resp.status,
                    )
                    return None
                payload = await resp.json()
        except Exception as err:
            _LOGGER.warning(
                "knx_recommend_llm provider error: %s",
                type(err).__name__,
            )
            return None
        try:
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            return None
        if not isinstance(content, str):
            return None
        return _parse_response(content)
