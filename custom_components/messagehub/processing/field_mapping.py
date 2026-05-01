"""JSONPath-basiertes Field-Mapping fuer Webhook-Payloads.

Iter 10: jsonpath-ng Wrapper, fallback auf Defaults bei fehlendem Pfad,
Plain-Text-Body wird komplett zu `text`.
Iter 12: pro-Webhook Severity-Map ergaenzt das interne Severity-Schema.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from jsonpath_ng.ext import parse as jsonpath_parse

from ..storage import Severity

_LOGGER = logging.getLogger(__name__)


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
        self._compiled = {key: jsonpath_parse(expr) for key, expr in self._raw_mapping.items()}
        self._severity_map = {k.lower(): v for k, v in (severity_map or {}).items()}
        self._defaults = defaults or {}

    def map_payload(self, payload: Any) -> dict[str, Any]:
        """Liefert ein Dict mit Schluesseln severity/source/text/timestamp/metadata."""
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
