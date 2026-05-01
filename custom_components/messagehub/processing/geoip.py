"""GeoIP-Anreicherung via MaxMind GeoLite2 (v0.3, optional).

Falls `geoip2` und eine .mmdb-Datei verfuegbar sind, ergaenzt der Webhook-Pfad
metadata.geo_country / geo_country_code fuer in Text/Metadata enthaltene IPs.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

_LOGGER = logging.getLogger(__name__)

_IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


def extract_ips(text: str) -> list[str]:
    """Liefert IPv4-Adressen aus dem Text. Filter offensichtliches Local-Net."""
    out: list[str] = []
    for match in _IP_RE.findall(text or ""):
        if _is_private(match):
            continue
        if match not in out:
            out.append(match)
    return out


def _is_private(ip: str) -> bool:
    import ipaddress  # noqa: PLC0415

    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return True
    return (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_unspecified
    )


class GeoIpResolver:
    """Lazy-Wrapper um geoip2.Reader. Falls Lib oder DB fehlen,
    bleibt enabled=False und alle Lookups liefern None."""

    def __init__(self, db_path: Path | str | None) -> None:
        self._reader: Any = None
        self._enabled = False
        if db_path is None:
            return
        path = Path(db_path)
        try:
            import geoip2.database  # noqa: PLC0415 — optional dep
        except ImportError:
            _LOGGER.debug("geoip2 not installed; geo-enrichment disabled")
            return
        if not path.is_file():
            _LOGGER.debug("GeoIP DB %s not found", path)
            return
        try:
            self._reader = geoip2.database.Reader(str(path))
            self._enabled = True
            _LOGGER.info("GeoIP-Resolver aktiv: %s", path)
        except (ValueError, OSError) as err:
            _LOGGER.warning("GeoIP DB konnte nicht geoeffnet werden: %s", err)

    @property
    def enabled(self) -> bool:
        return self._enabled

    def lookup(self, ip: str) -> dict[str, str] | None:
        if not self._enabled or self._reader is None:
            return None
        try:
            resp = self._reader.country(ip)
        except (ValueError, OSError, LookupError):
            return None
        country = getattr(resp.country, "name", None)
        iso = getattr(resp.country, "iso_code", None)
        if not country and not iso:
            return None
        return {"name": country or "?", "iso_code": iso or "?"}

    def close(self) -> None:
        import contextlib  # noqa: PLC0415

        if self._reader is not None:
            with contextlib.suppress(OSError, AttributeError):
                self._reader.close()
        self._reader = None
        self._enabled = False
