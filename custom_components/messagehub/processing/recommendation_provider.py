"""Iter L4.0: Provider-Schnittstelle fuer LLM-basierte Empfehlungen.

Layer 4 der Recommendation-Engine. Bewusst HA-frei, damit Tests ohne
HA-Stack laufen koennen. Konkrete Implementationen (StubProvider in
L4.1, OpenAIChatProvider in L4.2) erweitern diese Schnittstelle.

Sicherheits-Pyramide bereits hier verankert:
- Inputs werden im Aufrufer (api/knx_stats.py) NICHT direkt im Prompt
  verwendet, sondern als enumerierte Whitelist-Strings — Prompt-
  Injection-Schutz beim eigentlichen Provider (L4.2).
- ``fetch`` darf bei Provider-Fehler ``None`` zurueckgeben statt zu
  werfen — die Empfehlungs-Engine soll nicht abbrechen, nur den
  Layer-4-Output ueberspringen + im Reasoning markieren.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Protocol

if TYPE_CHECKING:
    from .knx_dpt_recommendations import DptRecommendation


@dataclass(frozen=True, slots=True)
class ProviderConfig:
    """Konfiguration fuer einen LLM-Provider.

    Bewusst generisch: ``base_url`` + ``api_key`` + ``model`` deckt
    OpenAI, Azure-OpenAI, Ollama, vLLM, LiteLLM, Groq, Together und
    alle weiteren Anbieter ab, die das OpenAI-Chat-Completions-Schema
    sprechen.
    """

    enabled: bool
    """Master-Toggle. Default ``False`` — User-Opt-in via Settings."""

    base_url: str
    """Endpoint-Praefix, z. B. ``https://api.openai.com/v1`` oder
    ``http://localhost:11434/v1`` (Ollama)."""

    model: str
    """Konkretes Modell, z. B. ``"gpt-4o-mini"`` oder
    ``"llama3.2"``. Der Recommendation-Cache nutzt das fuer den
    Cache-Key — Wechsel des Modells invalidiert den Cache."""

    api_key: str
    """Bearer-Token fuer den Authorization-Header. Niemals geloggt
    oder im Reasoning-Eintrag eingebettet."""

    timeout_s: float = 15.0
    """Request-Timeout fuer den HTTP-Call. Default 15 s — laengere
    Werte bremsen den Drawer; bei lokalen LLMs darf der User hochsetzen."""

    max_tokens: int = 800
    """Cap auf die Token-Antwort. Schuetzt vor Provider-Cost-Runaway."""

    system_prompt_override: str = ""
    """Optionaler System-Prompt-Override. Leer = Default-Prompt aus
    der Provider-Implementation."""


class RecommendationProvider(Protocol):
    """Vertrag fuer LLM-Provider.

    ``fetch`` bekommt die Inputs aus der Recommendation-Engine und
    liefert eine ``DptRecommendation`` zurueck — oder ``None``, wenn
    der Provider keine Empfehlung geben kann (z. B. Disabled,
    Fehler, Rate-Limit). Ausnahmen werden vom Aufrufer abgefangen
    und als Reasoning-Eintrag dokumentiert.
    """

    async def fetch(
        self,
        *,
        dpt: str | None,
        manufacturer: str | None,
        model: str | None,
        context: dict[str, Any],
    ) -> DptRecommendation | None: ...
