"""HTTP-API fuer KNX-Konfigurations-Findings (Iter 6+).

Endpunkte (Phase 1 — Iter 6/7/8):
- GET    /api/messagehub/findings                  Filter + Pagination
- POST   /api/messagehub/findings/ack              Ack setzen
- DELETE /api/messagehub/findings/ack/{ga}/{code}  Ack loeschen
- GET    /api/messagehub/findings/severity-overrides
- PUT    /api/messagehub/findings/severity-overrides/{code}
- DELETE /api/messagehub/findings/severity-overrides/{code}

Iter 29a (Wiring): POST /api/messagehub/findings/refresh — Per-GA-
Detector-Runner on-demand (User-Trigger aus dem findings-view).

Auth: alle Endpunkte ueber RequireAdminView.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from aiohttp import web

from ..processing.findings import FINDING_SEVERITIES
from ..processing.findings_service import (
    DEFAULT_LIMIT,
    DEFAULT_REFRESH_PERIOD_DAYS,
    HARD_CAP_LIMIT,
    ack_finding_response,
    clear_severity_override_response,
    findings_markdown_response,
    list_findings_response,
    list_severity_overrides_response,
    refresh_findings_response,
    set_severity_override_response,
    unack_finding_response,
)
from ..processing.knx_repo import KnxAddressRepository
from ..storage.findings_repo import FindingsRepository
from ..storage.knx_stats_repo import KnxStatsRepository
from ._helpers import (
    ERR_INVALID_JSON,
    ERR_NOT_INITIALISED,
    RequireAdminView,
    actor,
    get_database,
    parse_int_param,
)

# Iter 7: Hard-Limit fuer User-Input im Note-Feld (Audit + DoS-Schutz),
# spiegelt KnxStatsAcknowledgeView (siehe knx_stats.py).
_HARD_NOTE_LENGTH = 1000


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
                    request.query,
                    "limit",
                    DEFAULT_LIMIT,
                    min_value=1,
                    max_value=HARD_CAP_LIMIT,
                ),
                offset=parse_int_param(
                    request.query,
                    "offset",
                    0,
                    min_value=0,
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
        raise ValueError(f"Invalid severity {raw!r}; expected one of {FINDING_SEVERITIES}")
    return raw


class FindingsAckView(RequireAdminView):
    """POST /api/messagehub/findings/ack — Ack setzen."""

    url = "/api/messagehub/findings/ack"
    name = "api:messagehub:findings:ack"

    async def post(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repo = _repo(request.app["hass"])
        if repo is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            body = await request.json()
        except (ValueError, TypeError) as err:
            raise web.HTTPBadRequest(reason=ERR_INVALID_JSON) from err
        ga = str(body.get("ga", "")).strip()
        code = str(body.get("code", "")).strip()
        note = body.get("note")
        if note is not None and len(str(note)) > _HARD_NOTE_LENGTH:
            raise web.HTTPBadRequest(reason="note too long")
        sticky = bool(body.get("sticky", False))
        try:
            payload = await ack_finding_response(
                repo,
                ga=ga,
                code=code,
                actor=actor(request),
                note=str(note) if note else None,
                sticky=sticky,
            )
        except ValueError as err:
            raise web.HTTPBadRequest(reason=str(err)) from err
        return self.json(payload)


class FindingsAckDetailView(RequireAdminView):
    """DELETE /api/messagehub/findings/ack/{ga}/{code} — Ack loeschen."""

    url = "/api/messagehub/findings/ack/{ga}/{code}"
    name = "api:messagehub:findings:ack-detail"

    async def delete(self, request: web.Request, ga: str, code: str) -> web.Response:
        self._check_admin(request)
        repo = _repo(request.app["hass"])
        if repo is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            payload = await unack_finding_response(
                repo,
                ga=ga,
                code=code,
                actor=actor(request),
            )
        except ValueError as err:
            raise web.HTTPBadRequest(reason=str(err)) from err
        return self.json(payload)


class FindingsSeverityOverridesView(RequireAdminView):
    """GET /api/messagehub/findings/severity-overrides — Tabelle Code|Default|Override."""

    url = "/api/messagehub/findings/severity-overrides"
    name = "api:messagehub:findings:severity-overrides"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repo = _repo(request.app["hass"])
        if repo is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        return self.json(await list_severity_overrides_response(repo))


class FindingsSeverityOverrideDetailView(RequireAdminView):
    """PUT/DELETE /api/messagehub/findings/severity-overrides/{code}."""

    url = "/api/messagehub/findings/severity-overrides/{code}"
    name = "api:messagehub:findings:severity-override-detail"

    async def put(self, request: web.Request, code: str) -> web.Response:
        self._check_admin(request)
        repo = _repo(request.app["hass"])
        if repo is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            body = await request.json()
        except (ValueError, TypeError) as err:
            raise web.HTTPBadRequest(reason=ERR_INVALID_JSON) from err
        severity = body.get("severity")
        note = body.get("note")
        if note is not None and len(str(note)) > _HARD_NOTE_LENGTH:
            raise web.HTTPBadRequest(reason="note too long")
        try:
            payload = await set_severity_override_response(
                repo,
                code=code,
                severity=severity,
                actor=actor(request),
                note=str(note) if note else None,
            )
        except ValueError as err:
            raise web.HTTPBadRequest(reason=str(err)) from err
        return self.json(payload)

    async def delete(self, request: web.Request, code: str) -> web.Response:
        self._check_admin(request)
        repo = _repo(request.app["hass"])
        if repo is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            payload = await clear_severity_override_response(
                repo,
                code=code,
                actor=actor(request),
            )
        except ValueError as err:
            raise web.HTTPBadRequest(reason=str(err)) from err
        return self.json(payload)


class FindingsMarkdownExportView(RequireAdminView):
    """GET /api/messagehub/findings/export.md — Markdown-Vorlage fuer ETS-Notizen."""

    url = "/api/messagehub/findings/export.md"
    name = "api:messagehub:findings:export-markdown"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repo = _repo(request.app["hass"])
        if repo is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        markdown = await findings_markdown_response(repo)
        # text/markdown statt JSON, damit ein curl-Aufruf direkt ins
        # Clipboard / in eine Datei umgeleitet werden kann.
        return web.Response(text=markdown, content_type="text/markdown")


class FindingsRefreshView(RequireAdminView):
    """POST /api/messagehub/findings/refresh — Iter 29a Per-GA-Runner."""

    url = "/api/messagehub/findings/refresh"
    name = "api:messagehub:findings:refresh"

    async def post(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        hass = request.app["hass"]
        db = get_database(hass)
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            body = await request.json()
        except (ValueError, TypeError) as err:
            raise web.HTTPBadRequest(reason=ERR_INVALID_JSON) from err
        ga = str(body.get("ga", "")).strip()
        period_days = body.get("period_days", DEFAULT_REFRESH_PERIOD_DAYS)
        try:
            period_days_int = int(period_days)
        except (TypeError, ValueError) as err:
            raise web.HTTPBadRequest(reason="period_days must be int") from err
        try:
            payload = await refresh_findings_response(
                FindingsRepository(db),
                ga=ga,
                period_days=period_days_int,
                address_repo=KnxAddressRepository(db),
                stats_repo=KnxStatsRepository(db),
                now=datetime.now(UTC),
            )
        except ValueError as err:
            raise web.HTTPBadRequest(reason=str(err)) from err
        return self.json(payload)


__all__ = [
    "FindingsAckDetailView",
    "FindingsAckView",
    "FindingsListView",
    "FindingsMarkdownExportView",
    "FindingsRefreshView",
    "FindingsSeverityOverrideDetailView",
    "FindingsSeverityOverridesView",
]
