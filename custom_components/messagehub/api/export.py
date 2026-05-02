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


# Iter 80 / CR-18: Pure Helpers fuer Streaming-Export. Vorher wurden
# bei limit=100 000 mehrere hundert MB im Memory aufgebaut — DoS-
# Vektor. Jetzt Header-Funktion + Per-Row-Encoder, die der Streaming-
# View pro Page ruft und sofort an den HTTP-Stream weiterreicht.

CSV_HEADER_ROW: list[str] = [
    "id",
    "timestamp",
    "severity",
    "source",
    "text",
    "metadata",
    "webhook_id",
]


def csv_header_line() -> str:
    """Liefert die CSV-Header-Zeile inkl. LF."""
    buf = io.StringIO()
    csv.writer(buf, lineterminator="\n").writerow(CSV_HEADER_ROW)
    return buf.getvalue()


def message_to_csv_line(m: Message) -> str:
    """Liefert eine einzelne CSV-Zeile inkl. LF."""
    buf = io.StringIO()
    csv.writer(buf, lineterminator="\n").writerow(
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


def message_to_jsonl_line(m: Message) -> str:
    """Liefert eine einzelne JSONL-Zeile inkl. LF."""
    record = {
        "id": m.id,
        "timestamp": m.timestamp_iso,
        "severity": m.severity.value,
        "source": m.source,
        "text": m.text,
        "metadata": m.metadata,
        "webhook_id": m.webhook_id,
    }
    return json.dumps(record, ensure_ascii=False) + "\n"


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
