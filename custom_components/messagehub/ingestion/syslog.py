"""Iter 39: minimaler RFC-3164 Syslog-Parser.

UDP-Listener wird ueber asyncio.DatagramProtocol gestartet, ist aber
defaultmaessig deaktiviert (Options-Flow).
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from ..storage import Severity

# Severity-Bits: <PRI> = facility * 8 + severity
_PRI_RE = re.compile(r"^<(\d+)>")


_SYSLOG_TO_SEVERITY = {
    0: Severity.ERROR,  # emergency
    1: Severity.ERROR,  # alert
    2: Severity.ERROR,  # critical
    3: Severity.ERROR,  # error
    4: Severity.WARNING,  # warning
    5: Severity.INFO,  # notice
    6: Severity.INFO,  # info
    7: Severity.DEBUG,  # debug
}


@dataclass(slots=True)
class SyslogMessage:
    severity: Severity
    facility: int
    hostname: str
    text: str


def parse_rfc3164(line: str) -> SyslogMessage:
    """Liefert (severity, facility, hostname, text). Fehler -> defaults."""
    severity = Severity.INFO
    facility = 1
    hostname = "syslog"
    text = line

    m = _PRI_RE.match(line)
    if m:
        pri = int(m.group(1))
        facility = pri // 8
        severity = _SYSLOG_TO_SEVERITY.get(pri % 8, Severity.INFO)
        rest = line[m.end() :].strip()
        # rfc3164: TIMESTAMP HOSTNAME MSG ...
        # Wir schluessen ueber Whitespace.
        parts = rest.split(" ", 4)
        rfc3164_min_parts = 4
        if len(parts) >= rfc3164_min_parts:
            hostname = parts[3]
            text = parts[4] if len(parts) > rfc3164_min_parts else ""
        else:
            text = rest

    return SyslogMessage(severity=severity, facility=facility, hostname=hostname, text=text)
