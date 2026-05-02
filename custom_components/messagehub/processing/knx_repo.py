"""KNX-Gruppenadress-Repository (Iter 48 — UI-Variante mit Logging-Whitelist).

Verwaltung erfolgt komplett ueber das Panel-UI, optional mit ETS-CSV-Bulk-Import.
Pro GA wird konfiguriert, ob sie ueberhaupt geloggt werden soll und mit welcher
Severity (inkl. Boolean-True/False-Mapping fuer Stoer-/Ok-Bits).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from ..storage import Database


_GA_PATTERN = re.compile(r"^\d{1,2}/\d{1,2}/\d{1,3}$")
_VALID_SEVERITIES = {"debug", "info", "warning", "error"}
_VALID_LOG_SEVERITIES = _VALID_SEVERITIES | {"auto"}


@dataclass(slots=True)
class KnxAddress:
    address: str
    label: str
    dpt: str | None = None
    description: str | None = None
    log_enabled: bool = False
    log_severity: str = "info"
    severity_on_true: str | None = None
    severity_on_false: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Einheitliche JSON-Serialisierung fuer API-Antworten.

        Eine Quelle der Wahrheit verhindert Drift zwischen GET/POST-Handlern
        (vgl. Bugfix 1a4349b: GET hatte log_enabled-Felder weggelassen, was
        den UI-Filter 'nur aktive' brach).
        """
        return {
            "address": self.address,
            "label": self.label,
            "dpt": self.dpt,
            "description": self.description,
            "log_enabled": bool(self.log_enabled),
            "log_severity": self.log_severity,
            "severity_on_true": self.severity_on_true,
            "severity_on_false": self.severity_on_false,
        }


def validate_address(value: str) -> str:
    if not _GA_PATTERN.fullmatch(value):
        raise ValueError(f"invalid KNX group address {value!r}: must match N/N/N (1-2/1-2/1-3)")
    return value


def _validate_severity(value: str | None, allow_auto: bool = False) -> str | None:
    if value is None:
        return None
    valid = _VALID_LOG_SEVERITIES if allow_auto else _VALID_SEVERITIES
    if value not in valid:
        raise ValueError(f"invalid severity {value!r}; expected one of {sorted(valid)}")
    return value


class KnxAddressRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def upsert(self, item: KnxAddress) -> None:
        validate_address(item.address)
        if not item.label.strip():
            raise ValueError("label must not be empty")
        _validate_severity(item.log_severity, allow_auto=True)
        _validate_severity(item.severity_on_true)
        _validate_severity(item.severity_on_false)
        now = datetime.now(UTC).isoformat(timespec="seconds")
        await self._db.execute(
            "INSERT INTO knx_group_addresses "
            "(address, label, dpt, description, created_at, updated_at, "
            " log_enabled, log_severity, severity_on_true, severity_on_false) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(address) DO UPDATE SET "
            "label = excluded.label, "
            "dpt = excluded.dpt, "
            "description = excluded.description, "
            "log_enabled = excluded.log_enabled, "
            "log_severity = excluded.log_severity, "
            "severity_on_true = excluded.severity_on_true, "
            "severity_on_false = excluded.severity_on_false, "
            "updated_at = excluded.updated_at",
            (
                item.address,
                item.label.strip(),
                item.dpt,
                item.description,
                now,
                now,
                1 if item.log_enabled else 0,
                item.log_severity,
                item.severity_on_true,
                item.severity_on_false,
            ),
        )

    async def delete(self, address: str) -> bool:
        cursor = await self._db.connection.execute(
            "DELETE FROM knx_group_addresses WHERE address = ?", (address,)
        )
        await self._db.connection.commit()
        deleted = cursor.rowcount > 0
        await cursor.close()
        return bool(deleted)

    async def list_all(self) -> list[KnxAddress]:
        rows = await self._db.fetch_all("SELECT * FROM knx_group_addresses ORDER BY address")
        return [_row_to_address(row) for row in rows]

    async def get(self, address: str) -> KnxAddress | None:
        row = await self._db.fetch_one(
            "SELECT * FROM knx_group_addresses WHERE address = ?", (address,)
        )
        return _row_to_address(row) if row is not None else None

    async def lookup(self, address: str) -> str | None:
        """Beim Webhook-Anreichern: nur Label."""
        row = await self._db.fetch_one(
            "SELECT label FROM knx_group_addresses WHERE address = ?", (address,)
        )
        return str(row["label"]) if row is not None else None

    async def list_logged(self) -> dict[str, KnxAddress]:
        """Iter 48 KNX-Bus: alle GAs mit log_enabled=1 als dict address -> KnxAddress."""
        rows = await self._db.fetch_all("SELECT * FROM knx_group_addresses WHERE log_enabled = 1")
        return {str(row["address"]): _row_to_address(row) for row in rows}

    async def bulk_import_csv(self, csv_content: str) -> dict[str, int]:
        """Importiert ETS-CSV (label-only, log_enabled bleibt 0)."""
        from .knx import load_ets_csv  # noqa: PLC0415

        mapping = load_ets_csv(csv_content)
        imported = 0
        skipped = 0
        errors = 0
        for address, label in mapping.items():
            try:
                await self.upsert(KnxAddress(address=address, label=label))
                imported += 1
            except ValueError:
                errors += 1
            except RuntimeError:
                skipped += 1
        return {"imported": imported, "skipped": skipped, "errors": errors}


def _row_to_address(row: Any) -> KnxAddress:
    return KnxAddress(
        address=str(row["address"]),
        label=str(row["label"]),
        dpt=row["dpt"],
        description=row["description"],
        log_enabled=bool(row["log_enabled"]),
        log_severity=str(row["log_severity"] or "info"),
        severity_on_true=row["severity_on_true"],
        severity_on_false=row["severity_on_false"],
    )


def resolve_severity(cfg: KnxAddress, value: Any) -> str:
    """Iter 48: bestimmt die Severity fuer einen KNX-Telegrammwert basierend auf der GA-Konfig.

    - log_severity == 'auto' und value ist Boolean-artig: True -> severity_on_true,
      False -> severity_on_false (Default 'info' falls nicht gesetzt)
    - sonst: log_severity (Default 'info')
    """
    if cfg.log_severity == "auto":
        if value is True or (isinstance(value, str) and value.lower() in {"true", "on", "1"}):
            return cfg.severity_on_true or "warning"
        if value is False or (isinstance(value, str) and value.lower() in {"false", "off", "0"}):
            return cfg.severity_on_false or "info"
        if isinstance(value, int | float):
            return cfg.severity_on_true or "warning" if value else (cfg.severity_on_false or "info")
        return "info"
    return cfg.log_severity if cfg.log_severity in _VALID_SEVERITIES else "info"


def build_text(cfg: KnxAddress, value: Any, telegramtype: str | None = None) -> str:
    """Erzeugt den Nachrichtentext: Label + Wert (+ optional Telegramtyp)."""
    label = cfg.label
    val_str = "" if value is None else f" = {value}"
    if telegramtype and telegramtype != "GroupValueWrite":
        return f"{label} ({telegramtype}){val_str}"
    return f"{label}{val_str}"
