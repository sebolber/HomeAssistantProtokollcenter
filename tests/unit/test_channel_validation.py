"""Iter 75 / CR-21: Channel-Config-Validation gegen SSRF + Config-Bombs."""

from __future__ import annotations

import pytest

from custom_components.messagehub.api._channel_validation import (
    ChannelConfigError,
    validate_channel_config,
)

# ----------------------------------------------------------------------
# webhook


def test_webhook_https_public_host_passes() -> None:
    validate_channel_config("webhook", {"url": "https://hooks.example.com/abc"})


def test_webhook_http_public_host_passes() -> None:
    # http ist erlaubt — aber durch User akzeptiert, wir sind nicht
    # paranoid uber TLS hier.
    validate_channel_config("webhook", {"url": "http://hooks.example.com/abc"})


def test_webhook_localhost_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("webhook", {"url": "http://localhost/x"})


def test_webhook_private_ipv4_blocked() -> None:
    for url in (
        "http://192.168.1.1/x",
        "http://10.0.0.1/x",
        "http://172.16.0.1/x",
        "http://127.0.0.1/x",
    ):
        with pytest.raises(ChannelConfigError):
            validate_channel_config("webhook", {"url": url})


def test_webhook_link_local_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("webhook", {"url": "http://169.254.1.1/x"})


def test_webhook_dot_local_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("webhook", {"url": "http://router.local/admin"})


def test_webhook_invalid_scheme_blocked() -> None:
    for url in ("file:///etc/passwd", "gopher://x/", "ftp://x/"):
        with pytest.raises(ChannelConfigError):
            validate_channel_config("webhook", {"url": url})


def test_webhook_too_long_url_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("webhook", {"url": "https://" + "a" * 2000 + ".com/"})


def test_webhook_missing_url_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("webhook", {})


# ----------------------------------------------------------------------
# telegram


def test_telegram_valid_token_passes() -> None:
    validate_channel_config(
        "telegram",
        {"bot_token": "1234567:AAFakeTokenAAAAAAAAAAAAAAAAAAAAA", "chat_id": "123"},
    )


def test_telegram_invalid_token_format_blocked() -> None:
    for token in ("not-a-token", "12345", "abc:def", "1234:short"):
        with pytest.raises(ChannelConfigError):
            validate_channel_config("telegram", {"bot_token": token, "chat_id": "1"})


def test_telegram_missing_chat_id_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config(
            "telegram",
            {"bot_token": "1234567:AAFakeTokenAAAAAAAAAAAAAAAAAAAAA"},
        )


# ----------------------------------------------------------------------
# pushover


def test_pushover_valid_keys_pass() -> None:
    validate_channel_config(
        "pushover",
        {"user_key": "u" * 30, "api_token": "a" * 30},
    )


def test_pushover_short_key_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("pushover", {"user_key": "short", "api_token": "a" * 30})


# ----------------------------------------------------------------------
# ntfy


def test_ntfy_default_server_passes() -> None:
    validate_channel_config("ntfy", {"topic": "my-topic"})


def test_ntfy_self_hosted_public_server_passes() -> None:
    validate_channel_config("ntfy", {"server": "https://ntfy.example.com", "topic": "x"})


def test_ntfy_localhost_server_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("ntfy", {"server": "http://localhost:8080", "topic": "x"})


def test_ntfy_missing_topic_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("ntfy", {})


# ----------------------------------------------------------------------
# notify


def test_notify_valid_service_passes() -> None:
    validate_channel_config("notify", {"service": "mobile_app_phone"})


def test_notify_dotted_service_blocked() -> None:
    # User schickt "notify.mobile_app_phone" — wir wollen nur den
    # Service-Namen ohne Domain.
    with pytest.raises(ChannelConfigError):
        validate_channel_config("notify", {"service": "notify.mobile_app_phone"})


def test_notify_missing_service_blocked() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("notify", {})


# ----------------------------------------------------------------------
# generic


def test_unknown_channel_type_passes_with_dict_config() -> None:
    # Forward-Compat: unbekannte Channel-Types kommen durch, solange
    # die config wenigstens ein dict ist.
    validate_channel_config("future-type", {"foo": "bar"})


def test_non_dict_config_blocked_for_known_type() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("webhook", "not-a-dict")


def test_non_dict_config_blocked_for_unknown_type() -> None:
    with pytest.raises(ChannelConfigError):
        validate_channel_config("future-type", "not-a-dict")
