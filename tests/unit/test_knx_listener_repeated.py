"""Iter 12 (QS-a): KnxTelegramData faengt das xknx-`repeated`-Flag,
_build_knx_message legt es in metadata.knx_repeated ab."""

from __future__ import annotations

from typing import Any

from custom_components.messagehub.listeners.knx import (
    KnxTelegramData,
    _build_knx_message,
)


class _StubGroupValue:
    def __init__(self, value: Any, raw: Any = None) -> None:
        self.value = value
        self.raw_value = raw or b""
        # xknx setzt diese Klasse als payload
        type(self).__name__ = "GroupValueWrite"


class _StubTelegram:
    def __init__(
        self,
        *,
        destination: str = "1/2/3",
        source: str = "1.1.5",
        value: Any = 1,
        repeated: bool = False,
    ) -> None:
        self.destination_address = destination
        self.source_address = source
        self.payload = _StubGroupValue(value)
        self.repeated = repeated


class _StubKnxConfig:
    def __init__(self) -> None:
        self.label = "Test"
        self.dpt = "1.001"
        self.log_severity = "info"
        self.severity_on_true = None
        self.severity_on_false = None


class TestRepeatedFlag:
    def test_from_telegram_default_false(self) -> None:
        td = KnxTelegramData.from_telegram(_StubTelegram())
        assert td.repeated is False

    def test_from_telegram_picks_up_repeated_true(self) -> None:
        td = KnxTelegramData.from_telegram(_StubTelegram(repeated=True))
        assert td.repeated is True

    def test_from_event_data_default_false(self) -> None:
        td = KnxTelegramData.from_event_data({"destination": "1/2/3"})
        assert td.repeated is False

    def test_from_event_data_explicit_true(self) -> None:
        td = KnxTelegramData.from_event_data(
            {"destination": "1/2/3", "repeated": True}
        )
        assert td.repeated is True


class TestRepeatedInMetadata:
    def test_repeated_appears_in_message_metadata(self) -> None:
        cfg = _StubKnxConfig()
        td = KnxTelegramData(
            destination="1/2/3",
            source="1.1.5",
            telegramtype="GroupValueWrite",
            value=1,
            raw=None,
            repeated=True,
        )
        msg = _build_knx_message(cfg, td)
        assert msg.metadata is not None
        assert msg.metadata["knx_repeated"] is True

    def test_not_repeated_appears_as_false(self) -> None:
        cfg = _StubKnxConfig()
        td = KnxTelegramData(
            destination="1/2/3",
            source="1.1.5",
            telegramtype="GroupValueWrite",
            value=1,
            raw=None,
            repeated=False,
        )
        msg = _build_knx_message(cfg, td)
        assert msg.metadata is not None
        assert msg.metadata["knx_repeated"] is False
