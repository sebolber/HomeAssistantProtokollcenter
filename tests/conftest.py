"""Globale Pytest-Fixtures fuer die messagehub-Tests.

Hier landen ausschliesslich Fixtures, die ohne Home-Assistant-Stack
funktionieren. HA-spezifische Hilfsmittel liegen in
`tests/integration/conftest.py`.
"""

from __future__ import annotations

import json
from typing import Any


async def insert_raw_telegram(
    db: Any,
    *,
    ts: str,
    ga: str,
    dpt: str | None = None,
    label: str | None = None,
    dev_source: str = "1.1.5",
    value: object = 1,
    telegramtype: str = "GroupValueWrite",
    repeated: bool = False,
) -> None:
    """Iter 22: schreibt ein Telegramm in knx_raw_telegrams + (optional)
    legt einen knx_group_addresses-Eintrag fuer DPT/Label-Lookup an.

    Wird von allen KNX-Stats-Tests genutzt — vorher dupliziert in 6 Files.
    """
    if dpt is not None or label is not None:
        await db.execute(
            "INSERT OR IGNORE INTO knx_group_addresses "
            "(address, label, dpt, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (ga, label or "Test", dpt, ts, ts),
        )
    await db.execute(
        "INSERT INTO knx_raw_telegrams "
        "(timestamp, destination, source, telegramtype, value, repeated) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            ts,
            ga,
            dev_source,
            telegramtype,
            json.dumps(value, default=str),
            1 if repeated else 0,
        ),
    )
