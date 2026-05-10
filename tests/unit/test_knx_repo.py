"""Tests fuer KnxAddressRepository (Iter 48 UI-Variante)."""

from __future__ import annotations

from dataclasses import fields
from pathlib import Path

import pytest

from custom_components.messagehub.processing.knx_repo import (
    KnxAddress,
    KnxAddressRepository,
    resolve_severity,
    validate_address,
)
from custom_components.messagehub.storage import Database, MigrationRunner


@pytest.fixture
async def repo(tmp_path: Path):  # type: ignore[no-untyped-def]
    db = Database(tmp_path / "m.db")
    await db.open()
    await MigrationRunner(db).run()
    try:
        yield KnxAddressRepository(db)
    finally:
        await db.close()


def test_validate_address_accepts_valid() -> None:
    assert validate_address("1/2/3") == "1/2/3"
    assert validate_address("31/7/255") == "31/7/255"


@pytest.mark.parametrize(
    "addr",
    ["", "1/2", "abc", "1/2/3/4", "1//3", "/1/2"],
)
def test_validate_address_rejects_invalid(addr: str) -> None:
    with pytest.raises(ValueError, match="invalid KNX"):
        validate_address(addr)


@pytest.mark.asyncio
async def test_upsert_and_lookup(repo: KnxAddressRepository) -> None:
    await repo.upsert(KnxAddress(address="1/2/3", label="Wohnzimmer Deckenlicht"))
    assert await repo.lookup("1/2/3") == "Wohnzimmer Deckenlicht"
    assert await repo.lookup("9/9/9") is None


@pytest.mark.asyncio
async def test_upsert_overwrites(repo: KnxAddressRepository) -> None:
    await repo.upsert(KnxAddress(address="1/2/3", label="alt"))
    await repo.upsert(KnxAddress(address="1/2/3", label="neu", dpt="1.001"))
    items = await repo.list_all()
    assert len(items) == 1
    assert items[0].label == "neu"
    assert items[0].dpt == "1.001"


@pytest.mark.asyncio
async def test_delete(repo: KnxAddressRepository) -> None:
    await repo.upsert(KnxAddress(address="1/2/3", label="x"))
    assert await repo.delete("1/2/3") is True
    assert await repo.delete("1/2/3") is False


@pytest.mark.asyncio
async def test_bulk_import_csv(repo: KnxAddressRepository) -> None:
    csv_content = (
        "address,name,type\n"
        "1/0/0,Wohnzimmer Schalter,DPT_1.001\n"
        "1/0/1,Wohnzimmer Dimmer,DPT_5.001\n"
        "invalid/ga/format/extra,foo,DPT_1\n"
    )
    stats = await repo.bulk_import_csv(csv_content)
    assert stats["imported"] == 2
    items = await repo.list_all()
    addresses = {it.address for it in items}
    assert addresses == {"1/0/0", "1/0/1"}


@pytest.mark.asyncio
async def test_upsert_persists_log_fields(repo: KnxAddressRepository) -> None:
    """Regression: log_enabled/log_severity/severity_on_true/false muessen
    durch die API/UI bis in die DB gelangen — sonst Filter 'nur aktive' leer."""
    await repo.upsert(
        KnxAddress(
            address="5/0/12",
            label="Stoerung Heizung Pumpe",
            dpt="1.005",
            log_enabled=True,
            log_severity="auto",
            severity_on_true="error",
            severity_on_false="info",
        )
    )
    items = await repo.list_all()
    assert len(items) == 1
    saved = items[0]
    assert saved.log_enabled is True
    assert saved.log_severity == "auto"
    assert saved.severity_on_true == "error"
    assert saved.severity_on_false == "info"

    logged = await repo.list_logged()
    assert "5/0/12" in logged


@pytest.mark.asyncio
async def test_upsert_rejects_invalid(repo: KnxAddressRepository) -> None:
    with pytest.raises(ValueError, match="invalid KNX"):
        await repo.upsert(KnxAddress(address="bad", label="x"))
    with pytest.raises(ValueError, match="empty"):
        await repo.upsert(KnxAddress(address="1/2/3", label="  "))


def test_to_dict_contains_all_log_fields() -> None:
    """Regression-Lock fuer Bugfix 1a4349b: GET-Handler hatte log_enabled-
    Felder weggelassen. Jeder API-Handler soll to_dict() benutzen, damit
    eine zentrale Stelle die Schema-Vollstaendigkeit garantiert."""
    addr = KnxAddress(
        address="5/0/12",
        label="Stoer Heizung",
        dpt="1.005",
        description="Mein Test",
        log_enabled=True,
        log_severity="auto",
        severity_on_true="error",
        severity_on_false="info",
    )
    assert addr.to_dict() == {
        "address": "5/0/12",
        "label": "Stoer Heizung",
        "dpt": "1.005",
        "description": "Mein Test",
        "log_enabled": True,
        "log_severity": "auto",
        "severity_on_true": "error",
        "severity_on_false": "info",
    }


def test_to_dict_normalizes_log_enabled_to_bool() -> None:
    """SQLite gibt INTEGER 0/1 zurueck, Frontend erwartet Boolean.
    to_dict() muss casten, sonst bricht der UI-Filter 'nur aktive'."""
    addr = KnxAddress(address="1/2/3", label="x", log_enabled=1)  # type: ignore[arg-type]
    assert addr.to_dict()["log_enabled"] is True
    addr2 = KnxAddress(address="1/2/4", label="y", log_enabled=0)  # type: ignore[arg-type]
    assert addr2.to_dict()["log_enabled"] is False


def test_to_dict_covers_all_dataclass_fields() -> None:
    """Contract-Test: wenn jemand der KnxAddress ein Feld hinzufuegt,
    soll dieser Test sofort schlagen, falls er es in to_dict() vergisst.
    So bleibt das JSON-Schema strukturell mit dem Modell synchron."""
    addr = KnxAddress(address="1/2/3", label="x")
    expected_keys = {f.name for f in fields(KnxAddress)}
    actual_keys = set(addr.to_dict().keys())
    missing = expected_keys - actual_keys
    extra = actual_keys - expected_keys
    assert not missing, f"to_dict() fehlt Felder: {missing}"
    assert not extra, f"to_dict() hat unbekannte Felder: {extra}"


class TestResolveSeverity:
    """Verhaltens-Charakterisierung fuer ``resolve_severity``.

    Der Test schreibt das aktuelle Mapping fest, bevor die Funktion in
    benannte Helfer zerlegt wird (CC-Reduktion). Jede Zeile bildet einen
    der Branches im Original ab.
    """

    @staticmethod
    def _cfg(
        log_severity: str = "auto",
        on_true: str | None = None,
        on_false: str | None = None,
    ) -> KnxAddress:
        return KnxAddress(
            address="1/1/1",
            label="x",
            log_severity=log_severity,
            severity_on_true=on_true,
            severity_on_false=on_false,
        )

    def test_non_auto_valid_severity_returned_unchanged(self) -> None:
        for sev in ("debug", "info", "warning", "error"):
            assert resolve_severity(self._cfg(log_severity=sev), value=None) == sev

    def test_non_auto_invalid_severity_falls_back_to_info(self) -> None:
        assert resolve_severity(self._cfg(log_severity="bogus"), value=True) == "info"

    def test_auto_with_python_true_uses_on_true_or_warning_default(self) -> None:
        assert resolve_severity(self._cfg(), value=True) == "warning"
        assert resolve_severity(self._cfg(on_true="error"), value=True) == "error"

    def test_auto_with_python_false_uses_on_false_or_info_default(self) -> None:
        assert resolve_severity(self._cfg(), value=False) == "info"
        assert resolve_severity(self._cfg(on_false="warning"), value=False) == "warning"

    @pytest.mark.parametrize("truthy", ["true", "TRUE", "True", "on", "ON", "1"])
    def test_auto_truthy_strings_map_to_on_true(self, truthy: str) -> None:
        assert resolve_severity(self._cfg(on_true="error"), value=truthy) == "error"

    @pytest.mark.parametrize("falsy", ["false", "FALSE", "False", "off", "OFF", "0"])
    def test_auto_falsy_strings_map_to_on_false(self, falsy: str) -> None:
        assert resolve_severity(self._cfg(on_false="warning"), value=falsy) == "warning"

    def test_auto_unknown_string_falls_back_to_info(self) -> None:
        assert resolve_severity(self._cfg(on_true="error"), value="hello") == "info"
        assert resolve_severity(self._cfg(on_true="error"), value="") == "info"

    @pytest.mark.parametrize("truthy_num", [1, 2, -1, 1.5, -0.1])
    def test_auto_nonzero_numbers_map_to_on_true(self, truthy_num: int | float) -> None:
        assert resolve_severity(self._cfg(on_true="error"), value=truthy_num) == "error"

    @pytest.mark.parametrize("falsy_num", [0, 0.0])
    def test_auto_zero_numbers_map_to_on_false(self, falsy_num: int | float) -> None:
        assert resolve_severity(self._cfg(on_false="warning"), value=falsy_num) == "warning"

    def test_auto_none_falls_back_to_info(self) -> None:
        assert resolve_severity(self._cfg(on_true="error"), value=None) == "info"

    def test_auto_uses_warning_default_when_on_true_unset(self) -> None:
        assert resolve_severity(self._cfg(), value="on") == "warning"
        assert resolve_severity(self._cfg(), value=1) == "warning"

    def test_auto_uses_info_default_when_on_false_unset(self) -> None:
        assert resolve_severity(self._cfg(), value="off") == "info"
        assert resolve_severity(self._cfg(), value=0) == "info"

    def test_auto_unknown_object_falls_back_to_info(self) -> None:
        # Listen, dicts, etc. — keine Bool-/String-/Zahl-Semantik
        assert resolve_severity(self._cfg(on_true="error"), value=[1, 2]) == "info"
        assert resolve_severity(self._cfg(on_true="error"), value={"k": "v"}) == "info"
