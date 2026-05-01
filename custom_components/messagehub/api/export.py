"""Iter 45: Export & Forensik-Bundle Helpers."""

from __future__ import annotations

import csv
import io
import json
import zipfile
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Iterable

    from ..storage import Message


def messages_to_jsonl(messages: Iterable[Message]) -> str:
    """Serialisiert Messages als JSON-Lines (UTF-8)."""
    out_lines: list[str] = []
    for m in messages:
        record = {
            "id": m.id,
            "timestamp": m.timestamp_iso,
            "severity": m.severity.value,
            "source": m.source,
            "text": m.text,
            "metadata": m.metadata,
            "webhook_id": m.webhook_id,
        }
        out_lines.append(json.dumps(record, ensure_ascii=False))
    return "\n".join(out_lines) + ("\n" if out_lines else "")


def messages_to_csv(messages: Iterable[Message]) -> str:
    """Serialisiert Messages als CSV (Komma-separiert, Zeilenende LF)."""
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(["id", "timestamp", "severity", "source", "text", "metadata", "webhook_id"])
    for m in messages:
        writer.writerow(
            [
                m.id,
                m.timestamp_iso,
                m.severity.value,
                m.source,
                m.text,
                json.dumps(m.metadata) if m.metadata is not None else "",
                m.webhook_id or "",
            ]
        )
    return buf.getvalue()


def build_forensic_bundle(
    messages: Iterable[Message],
    *,
    config: dict[str, Any],
    extra_files: dict[str, str] | None = None,
) -> bytes:
    """Liefert ZIP mit messages.jsonl + config.json + optionalen extra_files."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("messages.jsonl", messages_to_jsonl(messages))
        zf.writestr("config.json", json.dumps(config, indent=2, ensure_ascii=False))
        for name, content in (extra_files or {}).items():
            zf.writestr(name, content)
    return buf.getvalue()
