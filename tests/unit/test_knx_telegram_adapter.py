"""Tests fuer _telegram_to_knx_event_data — die Adapter-Funktion zwischen
xknx-Telegram-Objekten und dem knx_event-kompatiblen Daten-Schema.

Damit wir messagehub direkt am xknx-Telegram-Stream haengen koennen, ohne
dass der User eine 'event:'-Konfig in HA-KNX setzen muss.
"""

from __future__ import annotations

from types import SimpleNamespace

from custom_components.messagehub import _telegram_to_knx_event_data


def _make_telegram(
    *,
    destination: str = "1/2/3",
    source: str = "1.1.42",
    payload_class: str = "GroupValueWrite",
    value: object = True,
    raw_value: object | None = b"\x01",
) -> SimpleNamespace:
    """Baut ein Stub-Telegram-Objekt das xknx-API nachstellt.

    Die Adapter-Funktion identifiziert den Telegrammtyp via
    type(payload).__name__ — also brauchen wir hier eine dynamische
    Klasse mit dem gewuenschten Namen.
    """
    payload_cls = type(payload_class, (), {})
    payload = payload_cls()
    payload.value = value  # type: ignore[attr-defined]
    payload.raw_value = raw_value  # type: ignore[attr-defined]
    return SimpleNamespace(
        destination_address=destination,
        source_address=source,
        payload=payload,
    )


def test_telegram_to_event_extrahiert_destination_und_source() -> None:
    tg = _make_telegram(destination="5/0/100", source="1.1.99")
    data = _telegram_to_knx_event_data(tg)
    assert data["destination"] == "5/0/100"
    assert data["source"] == "1.1.99"


def test_telegram_to_event_erkennt_GroupValueWrite() -> None:
    tg = _make_telegram(payload_class="GroupValueWrite", value=True)
    data = _telegram_to_knx_event_data(tg)
    assert data["telegramtype"] == "GroupValueWrite"
    assert data["value"] is True


def test_telegram_to_event_erkennt_GroupValueRead() -> None:
    tg = _make_telegram(payload_class="GroupValueRead", value=None)
    data = _telegram_to_knx_event_data(tg)
    assert data["telegramtype"] == "GroupValueRead"


def test_telegram_to_event_erkennt_GroupValueResponse() -> None:
    tg = _make_telegram(payload_class="GroupValueResponse", value=42)
    data = _telegram_to_knx_event_data(tg)
    assert data["telegramtype"] == "GroupValueResponse"
    assert data["value"] == 42


def test_telegram_to_event_telegramtype_None_fuer_unbekannten_payload() -> None:
    """Telegramme ohne GroupValue*-Payload (z. B. memory/control) sollen
    weiterhin verarbeitet werden, aber telegramtype=None setzen — _build_knx_message
    interpretiert das gnaedig."""
    tg = _make_telegram(payload_class="MemoryRead", value=None)
    data = _telegram_to_knx_event_data(tg)
    assert data["telegramtype"] is None


def test_telegram_to_event_raw_value_fallback() -> None:
    """Wenn payload.value None ist, soll raw_value als 'data' kommen —
    das matched das knx_event-Schema, in dem 'data' rohe Bytes haelt."""
    tg = _make_telegram(value=None, raw_value=bytes([12, 90]))
    data = _telegram_to_knx_event_data(tg)
    assert data["value"] is None
    assert data["data"] == bytes([12, 90])


def test_telegram_to_event_payload_kann_None_sein() -> None:
    """Manche Telegram-Typen haben kein payload — wir crashen nicht."""
    tg = SimpleNamespace(
        destination_address="0/0/0",
        source_address="1.1.1",
        payload=None,
    )
    data = _telegram_to_knx_event_data(tg)
    assert data["destination"] == "0/0/0"
    assert data["telegramtype"] is None
    assert data["value"] is None
    assert data["data"] is None
