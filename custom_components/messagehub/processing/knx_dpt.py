"""KNX-DPT-Formatter (v0.4).

Wandelt rohe Telegrammwerte anhand des konfigurierten DPT in lesbare
Strings um — `1.001 + True` -> `ON`, `9.001 + 21.5` -> `21.5 °C`.
Fuer unbekannte DPTs Fallback auf `str(value)`.
"""

from __future__ import annotations

from typing import Any

# Boolean-DPTs: (dpt-Family, on-Label, off-Label).
_BOOL_DPT_LABELS: dict[str, tuple[str, str]] = {
    "1.001": ("ON", "OFF"),
    "1.002": ("True", "False"),
    "1.003": ("Enable", "Disable"),
    "1.005": ("Alarm", "OK"),  # Stoer-Bit
    "1.006": ("High", "Low"),
    "1.007": ("Increase", "Decrease"),
    "1.008": ("Up", "Down"),
    "1.009": ("Closed", "Open"),
    "1.010": ("Start", "Stop"),
    "1.011": ("Active", "Inactive"),
    "1.012": ("Inverted", "Not inverted"),
    "1.013": ("Cyclic", "Start/Stop"),
    "1.014": ("Calculated", "Fixed"),
    "1.015": ("Reset", "No action"),
    "1.016": ("Acknowledge", "No action"),
    "1.017": ("Trigger", "Trigger"),
    "1.018": ("Occupied", "Not occupied"),
    "1.019": ("Closed", "Open"),
    "1.022": ("Scene B", "Scene A"),
    "1.024": ("Day", "Night"),
}


# Numerische Einheiten pro DPT-Family.
_UNIT_BY_DPT: dict[str, str] = {
    "5.001": "%",
    "5.003": "°",
    "5.004": "%",
    "5.010": "puls",
    "7.012": "mA",
    "7.013": "lx",
    "8.010": "%",
    "9.001": "°C",
    "9.002": "K",
    "9.003": "K/h",
    "9.004": "lx",
    "9.005": "m/s",
    "9.006": "Pa",
    "9.007": "%",  # Luftfeuchte
    "9.008": "ppm",
    "9.020": "mV",
    "9.021": "mA",
    "9.024": "kW",
    "9.025": "l/h",
    "9.026": "l/h",
    "9.027": "°F",
    "9.028": "km/h",
    "12.001": "imp",
    "13.002": "m³/h",
    "13.010": "Wh",
    "13.011": "VAh",
    "13.012": "varh",
    "13.013": "kWh",
    "13.014": "kVAh",
    "13.015": "kvarh",
    "14.000": "m/s²",
    "14.005": "rad",
    "14.007": "°",
    "14.019": "A",
    "14.027": "V",
    "14.031": "J",
    "14.033": "Hz",
    "14.056": "W",
    "14.058": "Pa",
    "14.060": "N",
}


def format_value(dpt: str | None, value: Any) -> str:  # noqa: PLR0911, PLR0912
    """Liefert Wert als lesbaren String anhand des DPT."""
    if value is None:
        return ""
    if not dpt:
        return str(value)

    # 1.x — Boolean
    if dpt.startswith("1."):
        on_label, off_label = _BOOL_DPT_LABELS.get(dpt, ("True", "False"))
        if isinstance(value, bool):
            return on_label if value else off_label
        if isinstance(value, int | float):
            return on_label if value else off_label
        if isinstance(value, str):
            v = value.lower()
            if v in {"true", "on", "1"}:
                return on_label
            if v in {"false", "off", "0"}:
                return off_label
        return str(value)

    # 16.x — String (DPT 16.000 ASCII, 16.001 Latin-1)
    if dpt.startswith("16."):
        return str(value).strip()

    # 232.x — RGB
    if dpt.startswith("232."):
        if isinstance(value, dict):
            r = value.get("red", value.get("r", "?"))
            g = value.get("green", value.get("g", "?"))
            b = value.get("blue", value.get("b", "?"))
            return f"RGB({r}, {g}, {b})"
        return str(value)

    # 10.x — TimeOfDay (3 Byte: dow|hour, min, sec)
    if dpt.startswith("10."):
        return _format_time_of_day(value)

    # 11.x — Date (3 Byte: day, month, year-2-stellig)
    if dpt.startswith("11."):
        return _format_date(value)

    # 19.x — DateTime (8 Byte)
    if dpt.startswith("19."):
        return _format_datetime(value)

    # Numerisch mit Einheit
    unit = _UNIT_BY_DPT.get(dpt, "")
    if isinstance(value, float):
        # Sinnvolle Rundung auf 2 Nachkommastellen
        formatted = f"{value:.2f}".rstrip("0").rstrip(".")
        return f"{formatted} {unit}".strip()
    if isinstance(value, int):
        return f"{value} {unit}".strip()
    return f"{value}{(' ' + unit) if unit else ''}"


_DOW_LABELS = ["", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]


def _format_time_of_day(value: Any) -> str:
    """DPT 10.001: (byte0, min, sec) — byte0 = (dow<<5) | hour."""
    if isinstance(value, tuple) and len(value) == 3:
        try:
            b0, mins, secs = (int(v) for v in value)
        except (TypeError, ValueError):
            return str(value)
        dow = (b0 >> 5) & 0x07
        hours = b0 & 0x1F
        prefix = f"{_DOW_LABELS[dow]} " if 1 <= dow <= 7 else ""
        return f"{prefix}{hours:02d}:{mins:02d}:{secs:02d}"
    return str(value)


def _format_date(value: Any) -> str:
    """DPT 11.001: (day, month, year_2digit)."""
    if isinstance(value, tuple) and len(value) == 3:
        try:
            day, month, year = (int(v) for v in value)
        except (TypeError, ValueError):
            return str(value)
        full_year = 2000 + year if year < 90 else 1900 + year
        return f"{day:02d}.{month:02d}.{full_year}"
    return str(value)


def _format_datetime(value: Any) -> str:
    """DPT 19.001: 8 Byte (year-1900, month, day, dow|hour, min, sec, flags1, flags2)."""
    if isinstance(value, tuple) and len(value) >= 6:
        try:
            year_off, month, day, b3, mins, secs = (int(v) for v in value[:6])
        except (TypeError, ValueError):
            return str(value)
        full_year = 1900 + year_off
        dow = (b3 >> 5) & 0x07
        hours = b3 & 0x1F
        prefix = f"{_DOW_LABELS[dow]} " if 1 <= dow <= 7 else ""
        return f"{prefix}{day:02d}.{month:02d}.{full_year} {hours:02d}:{mins:02d}:{secs:02d}"
    return str(value)


def is_alarm_active(dpt: str | None, value: Any) -> bool | None:
    """Heuristik fuer Stoer-/Alarm-DPTs (1.005). Liefert None, wenn DPT nicht passt."""
    if not dpt or not dpt.startswith("1.005"):
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, int | float):
        return bool(value)
    if isinstance(value, str):
        return value.lower() in {"true", "on", "1", "alarm"}
    return None
