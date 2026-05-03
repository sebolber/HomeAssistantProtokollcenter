"""HTTP-API fuer KNX-Konfigurations-Findings (Iter 6+).

Endpunkte (Phase 1 — Iter 6/7/8):
- GET    /api/messagehub/findings                  Filter + Pagination
- POST   /api/messagehub/findings/ack              Ack setzen
- DELETE /api/messagehub/findings/ack/{ga}/{code}  Ack loeschen
- GET    /api/messagehub/findings/severity-overrides
- PUT    /api/messagehub/findings/severity-overrides/{code}
- DELETE /api/messagehub/findings/severity-overrides/{code}

Auth: alle Endpunkte ueber RequireAdminView.
"""

from __future__ import annotations

from typing import Any

from aiohttp import web

from ..processing.findings import FINDING_SEVERITIES
from ..processing.findings_service import (
    DEFAULT_LIMIT,
    HARD_CAP_LIMIT,
    list_findings_response,
)
from ..storage.findings_repo import FindingsRepository
from ._helpers import (
    ERR_NOT_INITIALISED,
    RequireAdminView,
    get_database,
    parse_int_param,
)


def _repo(hass: Any) -> FindingsRepository | None:
    db = get_database(hass)
    if db is None:
        return None
    return FindingsRepository(db)


class FindingsListView(RequireAdminView):
    """GET /api/messagehub/findings — Filter + Pagination."""

    url = "/api/messagehub/findings"
    name = "api:messagehub:findings:list"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repo = _repo(request.app["hass"])
        if repo is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            payload = await list_findings_response(
                repo,
                code=request.query.get("code"),
                ga=request.query.get("ga"),
                severity=_parse_severity(request.query.get("severity")),
                source=request.query.get("source"),
                limit=parse_int_param(
                    request.query, "limit", DEFAULT_LIMIT,
                    min_value=1, max_value=HARD_CAP_LIMIT,
                ),
                offset=parse_int_param(
                    request.query, "offset", 0, min_value=0,
                ),
            )
        except ValueError as err:
            raise web.HTTPBadRequest(reason=str(err)) from err
        return self.json(payload)


def _parse_severity(raw: str | None) -> Any:
    """Akzeptiert None oder einen FindingSeverity-String; sonst ValueError."""
    if raw is None:
        return None
    if raw not in FINDING_SEVERITIES:
        raise ValueError(
            f"Invalid severity {raw!r}; expected one of {FINDING_SEVERITIES}"
        )
    return raw


__all__ = ["FindingsListView"]
