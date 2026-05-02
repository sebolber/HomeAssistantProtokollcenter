"""JSONPath-basiertes Field-Mapping fuer Webhook-Payloads.

Iter 10: jsonpath-ng Wrapper, fallback auf Defaults bei fehlendem Pfad,
Plain-Text-Body wird komplett zu `text`.
Iter 12: pro-Webhook Severity-Map ergaenzt das interne Severity-Schema.
v0.10 (S4): Expression-Length-Limit gegen ReDoS-aehnliche Pathologien.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from jsonpath_ng.ext import parse as jsonpath_parse

from ..storage import Severity

_LOGGER = logging.getLogger(__name__)

# v0.10 S4: hartes Limit fuer JSONPath-Expressions. Pathologische
# Patterns wie '$.a..b..c..d..e' koennen auf grossen Payloads quadratisch
# explodieren. 512 Zeichen reicht fuer 99% der realen Webhook-Mappings,
# verhindert aber DoS via Webhook-CRUD-API.
MAX_EXPRESSION_LENGTH = 512
"""Maximale Laenge einer einzelnen JSONPath-Expression."""

MAX_PAYLOAD_DEPTH = 32
"""Maximale Verschachtelungs-Tiefe eingehender JSON-Payloads."""


def _validate_expression(field: str, expr: str) -> str:
    """Validiert eine JSONPath-Expression — wirft ValueError oder TypeError."""
    if not isinstance(expr, str):
        raise TypeError(f"jsonpath for {field!r} must be a string, got {type(expr).__name__}")
    if len(expr) > MAX_EXPRESSION_LENGTH:
        raise ValueError(f"jsonpath for {field!r} too long ({len(expr)} > {MAX_EXPRESSION_LENGTH})")
    return expr


def _payload_depth(payload: Any, max_depth: int = MAX_PAYLOAD_DEPTH) -> int:
    """Berechnet die Verschachtelungstiefe — abgebrochen bei max_depth."""
    if isinstance(payload, dict):
        if not payload:
            return 1
        return 1 + max(
            (_payload_depth(v, max_depth - 1) for v in payload.values()),
            default=0,
        )
    if isinstance(payload, list):
        if not payload:
            return 1
        return 1 + max(
            (_payload_depth(v, max_depth - 1) for v in payload),
            default=0,
        )
    return 0


class FieldMapper:
    """Konvertiert einen Payload (Bytes/Dict/Text) ueber konfigurierbare Pfade
    in ein normalisiertes Message-Dict."""

    def __init__(
        self,
        mapping: dict[str, str] | None = None,
        severity_map: dict[str, str] | None = None,
        defaults: dict[str, Any] | None = None,
    ) -> None:
        self._raw_mapping = mapping or {}
        # v0.10 S4: Expression-Length-Limit als Erste-Linie-Verteidigung.
        # Die jsonpath_parse-Funktion selbst bekommt damit nur klein
        # genuegene Eingaben, dass keine Compile-Bombe moeglich ist.
        self._compiled = {
            key: jsonpath_parse(_validate_expression(key, expr))
            for key, expr in self._raw_mapping.items()
        }
        self._severity_map = {k.lower(): v for k, v in (severity_map or {}).items()}
        self._defaults = defaults or {}

    def map_payload(self, payload: Any) -> dict[str, Any]:
        """Liefert ein Dict mit Schluesseln severity/source/text/timestamp/metadata.

        v0.10 (S4): pathologisch tief verschachtelte Payloads werden auf
        ``MAX_PAYLOAD_DEPTH`` begrenzt. Tiefer-verschachtelte Strukturen
        wuerden die jsonpath-Engine quadratisch belasten und sind in
        realen Webhook-Payloads (Sentry, Grafana, GH) nicht zu finden.
        """
        result: dict[str, Any] = dict(self._defaults)

        if isinstance(payload, str):
            # Plain-Text-Body
            result.setdefault("text", payload)
            self._apply_severity_normalisation(result)
            return result

        if not isinstance(payload, dict | list):
            result.setdefault("text", str(payload))
            self._apply_severity_normalisation(result)
            return result

        if _payload_depth(payload) > MAX_PAYLOAD_DEPTH:
            _LOGGER.warning(
                "field-mapping: payload deeper than %d — applying defaults only",
                MAX_PAYLOAD_DEPTH,
            )
            result.setdefault("text", "<payload too deep>")
            self._apply_severity_normalisation(result)
            return result

        for field, expr in self._compiled.items():
            matches = expr.find(payload)
            if matches:
                result[field] = matches[0].value

        # Falls weder mapping noch defaults `text` lieferten: Komplettes JSON als Text
        if "text" not in result or not result["text"]:
            result["text"] = json.dumps(payload, ensure_ascii=False)[:512]

        self._apply_severity_normalisation(result)
        return result

    def _apply_severity_normalisation(self, result: dict[str, Any]) -> None:
        raw = result.get("severity")
        if raw is None:
            result["severity"] = self._defaults.get("severity", Severity.INFO)
            return
        # Erst pro-Webhook-Map (Iter 12), dann globale Normalisierung (Iter 3).
        if isinstance(raw, str):
            mapped = self._severity_map.get(raw.lower())
            if mapped:
                raw = mapped
        result["severity"] = Severity.normalise(raw)
