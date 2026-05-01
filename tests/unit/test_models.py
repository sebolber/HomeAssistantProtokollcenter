"""Tests fuer storage.models (Message, WebhookConfig, Severity)."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from custom_components.messagehub.const import TEXT_MAX_BYTES
from custom_components.messagehub.storage import (
    Message,
    Severity,
    WebhookConfig,
    validate_source,
    validate_text,
)


class TestSeverityNormalisation:
    """Severity.normalise() ist defensiv und tolerant."""

    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("error", Severity.ERROR),
            ("ERROR", Severity.ERROR),
            ("Err", Severity.ERROR),
            ("fatal", Severity.ERROR),
            ("crit", Severity.ERROR),
            ("p1", Severity.ERROR),
            ("warn", Severity.WARNING),
            ("WARNING", Severity.WARNING),
            ("p2", Severity.WARNING),
            ("info", Severity.INFO),
            ("notice", Severity.INFO),
            ("debug", Severity.DEBUG),
            ("trace", Severity.DEBUG),
            ("verbose", Severity.DEBUG),
            (Severity.WARNING, Severity.WARNING),
        ],
    )
    def test_severity_normalisation_handles_synonyms(self, raw: object, expected: Severity) -> None:
        assert Severity.normalise(raw) == expected

    @pytest.mark.parametrize(
        ("level", "expected"),
        [
            (0, Severity.ERROR),
            (3, Severity.ERROR),
            (4, Severity.WARNING),
            (5, Severity.INFO),
            (6, Severity.INFO),
            (7, Severity.DEBUG),
            ("3", Severity.ERROR),
            ("7", Severity.DEBUG),
        ],
    )
    def test_severity_numeric_levels_mapped_to_rfc5424(
        self, level: object, expected: Severity
    ) -> None:
        assert Severity.normalise(level) == expected

    @pytest.mark.parametrize("raw", ["panic", "", "n/a", None, 42, 9999, True])
    def test_unknown_severity_falls_back_to_info(self, raw: object) -> None:
        assert Severity.normalise(raw) == Severity.INFO


class TestValidateSource:
    @pytest.mark.parametrize(
        "value",
        [
            "pihole",
            "knx-bus",
            "backup.job",
            "service_name",
            "a",
            "0",
            "a." * 32,
        ],
    )
    def test_accepts_valid_sources(self, value: str) -> None:
        assert validate_source(value) == value

    @pytest.mark.parametrize(
        "value",
        [
            "Pihole",  # uppercase
            "PIHOLE",
            "with space",
            "punkt!",
            "weird@source",
            "",  # empty
            "a" * 65,  # too long
            "ä",  # non-ascii
        ],
    )
    def test_source_validator_rejects_uppercase_and_special_chars(self, value: str) -> None:
        with pytest.raises(ValueError, match="Invalid source"):
            validate_source(value)


class TestValidateText:
    def test_rejects_empty_text(self) -> None:
        with pytest.raises(ValueError, match="empty"):
            validate_text("")

    def test_accepts_text_at_byte_limit(self) -> None:
        text = "a" * TEXT_MAX_BYTES
        assert validate_text(text) == text

    def test_rejects_text_above_byte_limit(self) -> None:
        text = "a" * (TEXT_MAX_BYTES + 1)
        with pytest.raises(ValueError, match="exceeds"):
            validate_text(text)

    def test_byte_limit_counts_utf8_not_chars(self) -> None:
        # `ä` ist 2 Bytes in UTF-8 — knapp ueber dem Limit, wenn N == LIMIT
        text = "ä" * (TEXT_MAX_BYTES // 2 + 1)
        with pytest.raises(ValueError, match="exceeds"):
            validate_text(text)


class TestMessageDataclass:
    def test_message_rejects_invalid_severity_via_normalisation(self) -> None:
        # Unbekannte Severity wird zu INFO normalisiert (nicht abgewiesen).
        msg = Message(severity="panic", source="test.source", text="hi")
        assert msg.severity is Severity.INFO

    def test_message_rejects_invalid_source(self) -> None:
        with pytest.raises(ValueError, match="Invalid source"):
            Message(severity=Severity.INFO, source="WRONG", text="x")

    def test_message_rejects_empty_text(self) -> None:
        with pytest.raises(ValueError, match="empty"):
            Message(severity=Severity.INFO, source="ok", text="")

    def test_naive_timestamp_gets_utc_attached(self) -> None:
        naive = datetime(2026, 5, 1, 12, 0, 0)
        msg = Message(severity=Severity.INFO, source="ok", text="x", timestamp=naive)
        assert msg.timestamp.tzinfo is UTC

    def test_metadata_json_serialises_deterministically(self) -> None:
        msg = Message(
            severity=Severity.INFO,
            source="ok",
            text="x",
            metadata={"b": 2, "a": 1},
        )
        # sorted keys -> stabil
        assert msg.metadata_json == '{"a":1,"b":2}'

    def test_metadata_json_none_when_no_metadata(self) -> None:
        msg = Message(severity=Severity.INFO, source="ok", text="x")
        assert msg.metadata_json is None

    def test_timestamp_iso_is_utc(self) -> None:
        ts = datetime(2026, 5, 1, 12, 0, 0, tzinfo=UTC)
        msg = Message(severity=Severity.INFO, source="ok", text="x", timestamp=ts)
        assert msg.timestamp_iso == "2026-05-01T12:00:00+00:00"


class TestWebhookConfig:
    def test_minimal_valid_config(self) -> None:
        cfg = WebhookConfig(
            name="Pi-hole",
            webhook_id="x" * 32,
            default_source="pihole",
        )
        assert cfg.default_severity is Severity.INFO
        assert cfg.enabled is True
        assert cfg.field_map_json is None

    def test_rejects_short_webhook_id(self) -> None:
        with pytest.raises(ValueError, match="webhook_id"):
            WebhookConfig(name="x", webhook_id="short", default_source="pihole")

    def test_rejects_empty_name(self) -> None:
        with pytest.raises(ValueError, match="name"):
            WebhookConfig(name="   ", webhook_id="x" * 32, default_source="pihole")

    def test_rejects_invalid_default_source(self) -> None:
        with pytest.raises(ValueError, match="Invalid source"):
            WebhookConfig(name="x", webhook_id="x" * 32, default_source="UPPER")

    def test_field_map_json_sorted(self) -> None:
        cfg = WebhookConfig(
            name="x",
            webhook_id="x" * 32,
            default_source="pihole",
            field_map={"severity": "$.lvl", "text": "$.msg"},
        )
        assert cfg.field_map_json == '{"severity":"$.lvl","text":"$.msg"}'
