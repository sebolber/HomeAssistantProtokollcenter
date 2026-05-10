"""Iter 75 / CR-21: Channel-Config-Validierung pro Channel-Type.

Vorher: Channels.post/put speicherten beliebige config-Dicts in die
DB. Bei channel_type='webhook' enthielt config eine URL — ein Admin-
User konnte damit interne Hosts (router.local, 127.0.0.1, RFC1918)
adressieren → SSRF beim automatischen Notification-Dispatch.

Diese Datei haelt pure Validatoren, die im View VOR dem DB-Insert
gerufen werden. Wirft `ValueError` mit klarer Message, die der View
in `HTTPBadRequest` umsetzt.

HA-frei → unit-testbar ohne HA-Stack.
"""

from __future__ import annotations

import ipaddress
import re
from typing import Any
from urllib.parse import urlparse

# Maximal-Laenge fuer URL-Werte (DoS-Schutz).
_MAX_URL_LEN = 1024

# Telegram-Bot-Token-Format: <int>:<35+ chars>
_TELEGRAM_TOKEN_RE = re.compile(r"^\d+:[A-Za-z0-9_-]{20,}$")

# Pushover-User-Key + Token-Format: 30-stellige alphanumerische Strings.
_PUSHOVER_KEY_RE = re.compile(r"^[A-Za-z0-9]{30}$")


class ChannelConfigError(ValueError):
    """Channel-Konfig hat das Validation gefehlt."""


def _ensure_public_url(url: str) -> None:
    """Wirft, wenn die URL nicht http(s) auf einen public Host zeigt.

    Verhindert SSRF gegen lokale/private/loopback-Adressen — der
    Notification-Dispatch laeuft im HA-Prozess mit voller Netz-
    Zugriffs-Power.
    """
    if not isinstance(url, str) or len(url) > _MAX_URL_LEN:
        raise ChannelConfigError("url must be a string ≤ 1024 chars")
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ChannelConfigError("url must use http or https scheme")
    if not parsed.hostname:
        raise ChannelConfigError("url must have a hostname")
    # IP-Adressen direkt: gegen Private/Loopback/Multicast schuetzen.
    try:
        ip = ipaddress.ip_address(parsed.hostname)
    except ValueError:
        # Hostname (kein IP-Literal) — wir koennen DNS-Resolution nicht
        # synchron machen ohne Side-Effekt; zumindest ".local" und
        # "localhost" abfangen.
        host_lower = parsed.hostname.lower()
        if host_lower in ("localhost", "ip6-localhost"):
            raise ChannelConfigError("url cannot point to localhost") from None
        if host_lower.endswith(".local"):
            raise ChannelConfigError("url cannot point to .local hostnames") from None
        return
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
        raise ChannelConfigError(f"url cannot point to private/internal address ({ip})")


def _validate_webhook(config: dict[str, Any]) -> None:
    url = config.get("url")
    if not url:
        raise ChannelConfigError("webhook channel requires 'url'")
    _ensure_public_url(url)


def _validate_telegram(config: dict[str, Any]) -> None:
    token = config.get("bot_token") or config.get("token")
    chat_id = config.get("chat_id")
    if not isinstance(token, str) or not _TELEGRAM_TOKEN_RE.match(token):
        raise ChannelConfigError("telegram channel requires bot_token in format '<id>:<chars>'")
    if not isinstance(chat_id, (str, int)):
        raise ChannelConfigError("telegram channel requires chat_id (str or int)")


def _validate_pushover(config: dict[str, Any]) -> None:
    user = config.get("user_key") or config.get("user")
    token = config.get("api_token") or config.get("token")
    if not isinstance(user, str) or not _PUSHOVER_KEY_RE.match(user):
        raise ChannelConfigError("pushover channel requires user_key (30 alphanumeric chars)")
    if not isinstance(token, str) or not _PUSHOVER_KEY_RE.match(token):
        raise ChannelConfigError("pushover channel requires api_token (30 alphanumeric chars)")


def _validate_ntfy(config: dict[str, Any]) -> None:
    server = config.get("server", "https://ntfy.sh")
    topic = config.get("topic")
    if not isinstance(topic, str) or not topic:
        raise ChannelConfigError("ntfy channel requires non-empty 'topic'")
    _ensure_public_url(server)


def _validate_notify(config: dict[str, Any]) -> None:
    # HA-`notify`-Service: nur ein service-Name (z. B. "mobile_app_phone").
    # Wir validieren das Format, kein URL-Check noetig.
    service = config.get("service")
    if not isinstance(service, str) or "." in service or not service:
        raise ChannelConfigError("notify channel requires non-empty 'service' name without dots")


_VALIDATORS = {
    "webhook": _validate_webhook,
    "telegram": _validate_telegram,
    "pushover": _validate_pushover,
    "ntfy": _validate_ntfy,
    "notify": _validate_notify,
}


def validate_channel_config(channel_type: str, config: Any) -> None:
    """Wirft `ChannelConfigError`, wenn die Config ungueltig ist.

    Akzeptiert alle bekannten Channel-Types; unbekannte Types werden
    *nicht* abgelehnt (Forward-Compat fuer kuenftige Typen), aber
    config muss zumindest ein dict sein.
    """
    if not isinstance(config, dict):
        raise ChannelConfigError("config must be a dict")
    validator = _VALIDATORS.get(channel_type)
    if validator is None:
        # Unbekannter Type: minimal validieren, alles weitere ist
        # Application-Layer-Verantwortung.
        return
    validator(config)
