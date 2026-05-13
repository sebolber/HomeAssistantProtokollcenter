"""Iter 37: MQTT-Eingang via HA-mqtt.

Topic-Wildcards `+` (single segment) und `#` (rest) werden unterstuetzt.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class TopicMapping:
    topic_pattern: str
    source: str
    severity: str = "info"
    enabled: bool = True


def topic_matches(pattern: str, topic: str) -> bool:
    """Implementiert MQTT-Wildcards `+` und `#`."""
    regex_parts: list[str] = []
    pat_segments = pattern.split("/")
    for i, seg in enumerate(pat_segments):
        if seg == "#":
            if i != len(pat_segments) - 1:
                return False
            regex_parts.append(".*")
            break
        elif seg == "+":
            regex_parts.append("[^/]+")
        else:
            regex_parts.append(re.escape(seg))
    regex = "^" + "/".join(regex_parts) + "$"
    return re.match(regex, topic) is not None


def resolve_source(mappings: list[TopicMapping], topic: str) -> TopicMapping | None:
    """Liefert die erste passende, aktivierte Mapping-Regel."""
    for mp in mappings:
        if mp.enabled and topic_matches(mp.topic_pattern, topic):
            return mp
    return None
