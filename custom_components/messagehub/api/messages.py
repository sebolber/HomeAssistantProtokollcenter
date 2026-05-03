"""REST-API-Endpunkte fuer das messagehub-Panel.

Iter 13: list + get
Iter 14: Filter & Pagination
Iter 15: delete + sources + stats + webhooks
"""

from __future__ import annotations

import contextlib
import logging
from typing import TYPE_CHECKING

from aiohttp import web

from ..const import DOMAIN, EVENT_MESSAGE_DELETED
from .findings import (
    FindingsAckDetailView,
    FindingsAckView,
    FindingsListView,
    FindingsMarkdownExportView,
    FindingsRefreshView,
    FindingsSeverityOverrideDetailView,
    FindingsSeverityOverridesView,
)
from .knx import (
    KnxAddressBulkView,
    KnxAddressDetailView,
    KnxAddressesView,
    KnxProjectDiscoveryView,
    KnxProjectSyncView,
)
from .knx_stats import (
    KnxStatsAcknowledgeBulkView,
    KnxStatsAcknowledgeDetailView,
    KnxStatsAcknowledgeView,
    KnxStatsAlarmsView,
    KnxStatsBurstsView,
    KnxStatsBusAnalysisStateView,
    KnxStatsBusHealthView,
    KnxStatsBusloadView,
    KnxStatsGaDetailView,
    KnxStatsGaExportView,
    KnxStatsHealthScoreView,
    KnxStatsHeatmapView,
    KnxStatsLongTermView,
    KnxStatsOrphansView,
    KnxStatsSensitiveLogView,
    KnxStatsSensitiveSetView,
    KnxStatsSilenceView,
    KnxStatsSourceDetailView,
    KnxStatsSummaryView,
    KnxStatsTimelineView,
    KnxStatsTopBySourceView,
    KnxStatsTopView,
    KnxStatsTrendView,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


_LOGGER = logging.getLogger(__name__)

# Iter 72 / CR-1: Helpers aus api/_helpers.py importiert (mit
# Aliases auf die hier gewohnten _-Names, damit das restliche Modul
# ohne Massenaenderungen bleibt). Vorher waren die Definitionen
# komplett dupliziert (siehe CR-1).
from ._helpers import (  # noqa: E402, I001
    DEFAULT_LIMIT,
    HARD_CAP_LIMIT,
    ERR_INVALID_ID as _ERR_INVALID_ID,
    ERR_INVALID_JSON as _ERR_INVALID_JSON,
    ERR_INVALID_REQUEST as _ERR_INVALID_REQUEST,
    ERR_NOT_FOUND as _ERR_NOT_FOUND,
    ERR_NOT_INITIALISED as _ERR_NOT_INITIALISED,
    ERR_NOT_INITIALISED_LONG as _ERR_NOT_INITIALISED_LONG,
    RequireAdminView as _RequireAdminView,
    audit as _audit,
    get_database as _get_database,
    get_repos as _get_repos,
    msg_to_dict as _msg_to_dict,
    parse_int_param as _parse_int_param,
    wh_to_dict as _wh_to_dict,
)


class MessagesListView(_RequireAdminView):
    url = "/api/messagehub/messages"
    name = "api:messagehub:messages"

    async def delete(self, request: web.Request) -> web.Response:
        """Bulk-Delete: alle Nachrichten loeschen, optional gefiltert."""
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        params = request.query
        severities = (
            [s.strip() for s in params["severity"].split(",") if s.strip()]
            if "severity" in params
            else None
        )
        deleted = await msg_repo.delete_filtered(
            severities=severities,
            source=params.get("source"),
            search=params.get("search"),
            from_iso=params.get("from"),
            to_iso=params.get("to"),
        )
        request.app["hass"].bus.async_fire(EVENT_MESSAGE_DELETED, {"bulk": True, "count": deleted})
        return self.json({"deleted": deleted})

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos

        params = request.query
        limit = _parse_int_param(
            params, "limit", DEFAULT_LIMIT, min_value=1, max_value=HARD_CAP_LIMIT
        )
        offset = _parse_int_param(params, "offset", 0, min_value=0)
        severities = (
            [s.strip() for s in params["severity"].split(",") if s.strip()]
            if "severity" in params
            else None
        )
        source = params.get("source")
        search = params.get("search")
        from_iso = params.get("from")
        to_iso = params.get("to")
        order = params.get("order", "desc")
        # Iter 61 / U15: Optionaler Filter, der KNX-GroupValueRead-
        # Telegramme ausblendet (typisch HA-Polling-Spam).
        hide_knx_read = params.get("hide_knx_read", "").lower() in ("1", "true", "yes")

        items = await msg_repo.list_filtered(
            severities=severities,
            source=source,
            search=search,
            from_iso=from_iso,
            to_iso=to_iso,
            hide_knx_read=hide_knx_read,
            limit=limit,
            offset=offset,
            order=order,
        )
        total = await msg_repo.count_filtered(
            severities=severities,
            source=source,
            search=search,
            from_iso=from_iso,
            to_iso=to_iso,
            hide_knx_read=hide_knx_read,
        )
        return self.json(
            {
                "items": [_msg_to_dict(m) for m in items],
                "total": total,
                "limit": limit,
                "offset": offset,
            }
        )


class MessageDetailView(_RequireAdminView):
    url = "/api/messagehub/messages/{message_id}"
    name = "api:messagehub:message-detail"

    async def get(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        msg = await msg_repo.get_by_id(mid)
        if msg is None:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        return self.json(_msg_to_dict(msg))

    async def delete(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        deleted = await msg_repo.delete_by_id(mid)
        if not deleted:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        hass = request.app["hass"]
        hass.bus.async_fire(EVENT_MESSAGE_DELETED, {"id": mid})
        await _audit(hass, request, action="delete", target_type="message", target_id=str(mid))
        return self.json_message("deleted")


class SourcesView(_RequireAdminView):
    url = "/api/messagehub/sources"
    name = "api:messagehub:sources"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        sources = await msg_repo.distinct_sources()
        return self.json({"sources": sources})


class StatsView(_RequireAdminView):
    url = "/api/messagehub/stats"
    name = "api:messagehub:stats"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        return self.json(
            {
                "total": await msg_repo.count_total(),
                "severity_24h": await msg_repo.stats_severity_last_24h(),
            }
        )


class WebhooksView(_RequireAdminView):
    url = "/api/messagehub/webhooks"
    name = "api:messagehub:webhooks"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        _, wh_repo = repos
        return self.json({"webhooks": [_wh_to_dict(c) for c in await wh_repo.list_all()]})

    async def post(self, request: web.Request) -> web.Response:
        from .. import async_register_webhook  # noqa: PLC0415
        from ..storage import (  # noqa: PLC0415
            Severity,
            WebhookConfig,
            WebhookConfigRepository,
        )

        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        _, wh_repo = repos
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_JSON, status_code=400)
        try:
            cfg = WebhookConfig(
                name=data["name"],
                webhook_id=WebhookConfigRepository.generate_webhook_id(),
                default_source=data["default_source"],
                default_severity=Severity.normalise(data.get("default_severity", "info")),
                field_map=data.get("field_map"),
                enabled=bool(data.get("enabled", True)),
            )
            await wh_repo.add(cfg)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        if cfg.enabled:
            async_register_webhook(request.app["hass"], cfg)
        return self.json(_wh_to_dict(cfg))


class WebhookDetailView(_RequireAdminView):
    """CRUD fuer einzelne Webhook-Configs.

    Methoden:
    - GET: liefert die volle Webhook-Config inkl. JSONPath-`field_map`.
      **F-007 / Audit-Hinweis**: Frontend nutzt aktuell nur die Liste
      (`WebhooksView.get`) und arbeitet auf der gefetched Liste; ein
      gezielter Single-Get-Request kommt aus dem UI nicht. Wir behalten
      den Endpoint trotzdem, weil:
      * `wh_to_dict(cfg)` voll dokumentierter Vertrag ist und externe
        Skripte/Curl-User damit eine stabile Detail-Sicht haben,
      * eine kuenftige Drilldown-Ansicht in der UI (z. B. „Webhook-Logs
        pro Webhook") ohne Breaking-Change-Endpoint angesetzt werden
        kann.
    - PUT: ID-stabiles Update (alle Felder optional).
    - DELETE: harte Loeschung.
    """

    url = "/api/messagehub/webhooks/{webhook_id}"
    name = "api:messagehub:webhook-detail"

    async def get(self, request: web.Request, webhook_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        _, wh_repo = repos
        cfg = await wh_repo.get(webhook_id)
        if cfg is None:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        return self.json(_wh_to_dict(cfg))

    async def put(self, request: web.Request, webhook_id: str) -> web.Response:
        from .. import async_register_webhook, async_unregister_webhook  # noqa: PLC0415
        from ..storage import Severity  # noqa: PLC0415

        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        _, wh_repo = repos
        cfg = await wh_repo.get(webhook_id)
        if cfg is None:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_JSON, status_code=400)
        if "name" in data:
            cfg.name = data["name"]
        if "default_source" in data:
            cfg.default_source = data["default_source"]
        if "default_severity" in data:
            cfg.default_severity = Severity.normalise(data["default_severity"])
        if "field_map" in data:
            cfg.field_map = data["field_map"]
        if "enabled" in data:
            cfg.enabled = bool(data["enabled"])
        await wh_repo.update(cfg)
        if cfg.enabled:
            async_register_webhook(request.app["hass"], cfg)
        else:
            async_unregister_webhook(request.app["hass"], cfg.webhook_id)
        return self.json(_wh_to_dict(cfg))

    async def delete(self, request: web.Request, webhook_id: str) -> web.Response:
        from .. import async_unregister_webhook  # noqa: PLC0415

        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        _, wh_repo = repos
        if not await wh_repo.delete(webhook_id):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        hass = request.app["hass"]
        async_unregister_webhook(hass, webhook_id)
        await _audit(
            hass,
            request,
            action="webhook_delete",
            target_type="webhook",
            target_id=webhook_id,
        )
        return self.json_message("deleted")


class MessageStatusView(_RequireAdminView):
    """Iter 28/29: PATCH-Status fuer eine Nachricht (acknowledge/resolve)."""

    url = "/api/messagehub/messages/{message_id}/status"
    name = "api:messagehub:message-status"

    async def post(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
            data = await request.json()
            new_status = str(data.get("status", "")).strip()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_REQUEST, status_code=400)
        try:
            ok = await msg_repo.set_status(mid, new_status)
        except ValueError as err:
            return self.json_message(str(err), status_code=400)
        if not ok:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            request.app["hass"],
            request,
            action="status_change",
            target_type="message",
            target_id=str(mid),
            details={"status": new_status},
        )
        return self.json({"id": mid, "status": new_status})


class MessageSeverityView(_RequireAdminView):
    """Inline-Edit: Severity einer einzelnen Nachricht aendern."""

    url = "/api/messagehub/messages/{message_id}/severity"
    name = "api:messagehub:message-severity"

    async def post(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
            data = await request.json()
            new_severity = str(data.get("severity", "")).strip().lower()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_REQUEST, status_code=400)
        try:
            ok = await msg_repo.set_severity(mid, new_severity)
        except ValueError as err:
            return self.json_message(str(err), status_code=400)
        if not ok:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            request.app["hass"],
            request,
            action="severity_change",
            target_type="message",
            target_id=str(mid),
            details={"severity": new_severity},
        )
        return self.json({"id": mid, "severity": new_severity})


class MessageTagsView(_RequireAdminView):
    """Iter 42: Tag-Verwaltung pro Nachricht."""

    url = "/api/messagehub/messages/{message_id}/tags"
    name = "api:messagehub:message-tags"

    async def get(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        return self.json({"tags": await msg_repo.get_tags(mid)})

    async def post(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
            data = await request.json()
            tag = str(data.get("tag", "")).strip()
        except (ValueError, TypeError):
            return self.json_message(_ERR_INVALID_REQUEST, status_code=400)
        if not tag:
            return self.json_message("tag required", status_code=400)
        await msg_repo.add_tag(mid, tag)
        return self.json({"tags": await msg_repo.get_tags(mid)})

    async def delete(self, request: web.Request, message_id: str) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        try:
            mid = int(message_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        tag = request.query.get("tag", "").strip()
        if not tag:
            return self.json_message("tag query required", status_code=400)
        await msg_repo.remove_tag(mid, tag)
        return self.json({"tags": await msg_repo.get_tags(mid)})


class RunbookForView(_RequireAdminView):
    """Iter 43: Runbook fuer eine Source (+ optional Fingerprint)."""

    url = "/api/messagehub/runbook/{source}"
    name = "api:messagehub:runbook"

    async def get(self, request: web.Request, source: str) -> web.Response:
        from ..processing.runbooks import RunbookRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        fingerprint = request.query.get("fingerprint")
        rb = await RunbookRepository(db).find_for(source, fingerprint=fingerprint)
        if rb is None:
            return self.json_message("no runbook", status_code=404)
        return self.json(
            {
                "id": rb.id,
                "title": rb.title,
                "markdown": rb.markdown,
                "source_pattern": rb.source_pattern,
            }
        )


class AuditLogView(_RequireAdminView):
    """Iter 44: liest die letzten Audit-Eintraege.

    Iter 44b (N5): DELETE loescht alle Eintraege. Vor dem DELETE wird
    der Loesch-Vorgang selbst noch geloggt — die Spur ueberlebt damit
    in den verbleibenden Logs (die wir gerade danach loeschen). Reine
    Buchfuehrung: nach dem Aufruf hat der Endpunkt 1 neuen Eintrag
    "audit_clear", die alten sind weg.
    """

    url = "/api/messagehub/audit"
    name = "api:messagehub:audit"

    async def get(self, request: web.Request) -> web.Response:
        from .audit import AuditRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        limit = _parse_int_param(request.query, "limit", 200, min_value=1, max_value=1000)
        items = await AuditRepository(db).list_recent(limit=limit)
        return self.json({"items": items})

    async def delete(self, request: web.Request) -> web.Response:
        from .audit import AuditRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        repo = AuditRepository(db)
        deleted = await repo.delete_all()
        # Neuer Eintrag NACH dem Clear, damit er als einziger uebrig
        # bleibt und der Loesch-Vorgang dokumentiert ist.
        await _audit(
            request.app["hass"],
            request,
            action="audit_clear",
            target_type="audit_log",
            details={"deleted_count": deleted},
        )
        return self.json({"ok": True, "deleted": deleted})


class ExportView(_RequireAdminView):
    """Iter 45 + Iter 80: Streaming-Export im Format jsonl oder csv.

    Iter 80 / CR-18: Bei limit=100 000 wurden vorher mehrere hundert MB
    im Memory aufgebaut. Jetzt iterieren wir in 1000er-Pages und
    schreiben jede Page direkt in die StreamResponse — Peak-Memory
    bleibt unter wenigen MB.
    """

    url = "/api/messagehub/export"
    name = "api:messagehub:export"

    async def get(self, request: web.Request) -> web.StreamResponse:
        from .export import (  # noqa: PLC0415
            csv_header_line,
            message_to_csv_line,
            message_to_jsonl_line,
        )

        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED_LONG, status_code=503)
        msg_repo, _ = repos
        params = request.query
        fmt = params.get("format", "jsonl").lower()
        limit = _parse_int_param(params, "limit", 1000, min_value=1, max_value=100_000)
        severities = (
            [s.strip() for s in params["severity"].split(",") if s.strip()]
            if "severity" in params
            else None
        )
        if fmt == "csv":
            content_type = "text/csv; charset=utf-8"
            filename = "messagehub-export.csv"
            row_encoder = message_to_csv_line
            header = csv_header_line()
        else:
            content_type = "application/x-ndjson; charset=utf-8"
            filename = "messagehub-export.jsonl"
            row_encoder = message_to_jsonl_line
            header = ""

        response = web.StreamResponse(
            status=200,
            headers={
                "Content-Type": content_type,
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )
        await response.prepare(request)
        if header:
            await response.write(header.encode("utf-8"))

        # Page-by-page-Iteration. PAGE_SIZE=1000 ist ein guter Trade-off
        # zwischen Memory-Footprint und SQL-Roundtrip-Anzahl.
        page_size = 1000
        offset = 0
        sent = 0
        while sent < limit:
            chunk_limit = min(page_size, limit - sent)
            items = await msg_repo.list_filtered(
                severities=severities,
                source=params.get("source"),
                search=params.get("search"),
                from_iso=params.get("from"),
                to_iso=params.get("to"),
                limit=chunk_limit,
                offset=offset,
            )
            if not items:
                break
            buf: list[str] = [row_encoder(m) for m in items]
            await response.write("".join(buf).encode("utf-8"))
            sent += len(items)
            offset += len(items)
        await response.write_eof()
        return response


class HeartbeatsView(_RequireAdminView):
    """Iter 35: Heartbeat-Sources verwalten."""

    url = "/api/messagehub/heartbeats"
    name = "api:messagehub:heartbeats"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.heartbeat import HeartbeatRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        items = await HeartbeatRepository(db).list_all()
        return self.json(
            {
                "items": [
                    {
                        "source": hb.source,
                        "expected_interval_seconds": hb.expected_interval_seconds,
                        "last_seen": hb.last_seen.isoformat() if hb.last_seen else None,
                        "silent_alert_active": hb.silent_alert_active,
                        "enabled": hb.enabled,
                    }
                    for hb in items
                ]
            }
        )

    async def post(self, request: web.Request) -> web.Response:
        from ..processing.heartbeat import HeartbeatRepository, HeartbeatSource  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            source = str(data["source"])
            interval = int(data["expected_interval_seconds"])
        except (KeyError, ValueError, TypeError):
            return self.json_message("source + expected_interval_seconds required", status_code=400)
        await HeartbeatRepository(db).upsert(
            HeartbeatSource(source=source, expected_interval_seconds=interval, enabled=True)
        )
        return self.json_message("ok")


class HeartbeatDetailView(_RequireAdminView):
    """F-005: Lifecycle-Endpoints fuer einzelne Heartbeat-Sources.

    DELETE /api/messagehub/heartbeats/{source} — Eintrag entfernen,
        anschliessend feuert der Heartbeat-Job keine Silent-Warnings
        mehr.
    PATCH  /api/messagehub/heartbeats/{source}  Body {"enabled": bool}
        — Eintrag bleibt erhalten, aber temporaer aus dem Tracking
        ausgeklinkt (z. B. Wartungs-Modus).

    Beide Aktionen werden im Audit-Log dokumentiert.
    """

    url = "/api/messagehub/heartbeats/{source}"
    name = "api:messagehub:heartbeat-detail"

    async def delete(self, request: web.Request, source: str) -> web.Response:
        from ..processing.heartbeat import HeartbeatRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        if not await HeartbeatRepository(db).delete(source):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            hass,
            request,
            action="heartbeat_delete",
            target_type="heartbeat",
            target_id=source,
        )
        return self.json_message("deleted")

    async def patch(self, request: web.Request, source: str) -> web.Response:
        from ..processing.heartbeat import HeartbeatRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            enabled = bool(data["enabled"])
        except (KeyError, ValueError, TypeError):
            return self.json_message("body.enabled required (bool)", status_code=400)
        if not await HeartbeatRepository(db).set_enabled(source, enabled):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            hass,
            request,
            action="heartbeat_set_enabled",
            target_type="heartbeat",
            target_id=source,
            details={"enabled": enabled},
        )
        return self.json({"source": source, "enabled": enabled})


# KNX-Views liegen jetzt in api/knx.py (R11) — Import oben.


class ChannelsView(_RequireAdminView):
    """Iter 30/31: Notification-Channels CRUD."""

    url = "/api/messagehub/channels"
    name = "api:messagehub:channels"

    async def get(self, request: web.Request) -> web.Response:
        from ..notifications.repository import (  # noqa: PLC0415
            ChannelRepository,
            channel_to_dict,
        )

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        items = await ChannelRepository(db).list_all()
        return self.json({"items": [channel_to_dict(it) for it in items]})

    async def post(self, request: web.Request) -> web.Response:
        from ..notifications.repository import (  # noqa: PLC0415
            Channel,
            ChannelRepository,
            channel_to_dict,
        )
        from ._channel_validation import (  # noqa: PLC0415
            ChannelConfigError,
            validate_channel_config,
        )

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            channel_type = str(data["channel_type"])
            config = data.get("config")
            # Iter 75 / CR-21: Channel-Type-spezifische Validation.
            # Verhindert SSRF (webhook → private IPs) und ungueltige
            # Provider-Tokens.
            validate_channel_config(channel_type, config)
            ch = Channel(
                id=None,
                name=str(data["name"]),
                channel_type=channel_type,
                enabled=bool(data.get("enabled", True)),
                severity_threshold=str(data.get("severity_threshold", "warning")),
                quiet_start=data.get("quiet_start"),
                quiet_end=data.get("quiet_end"),
                quiet_bypass_error=bool(data.get("quiet_bypass_error", True)),
                throttle_seconds=int(data.get("throttle_seconds", 600)),
                config=config,
            )
            await ChannelRepository(db).add(ch)
        except ChannelConfigError as err:
            return self.json_message(f"invalid config: {err}", status_code=400)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _reload_dispatch(hass)
        await _audit(
            hass, request, action="channel_create", target_type="channel", target_id=str(ch.id)
        )
        return self.json(channel_to_dict(ch))


# Iter 88 / CR-20: Rate-Limit fuer ChannelTestView. Vorher konnte ein
# Admin per POST /channels/{id}/test einen Provider (Telegram, Pushover,
# ntfy) automatisiert spammen — interne Throttle/Quiet-Hours wurden im
# Test-Pfad deaktiviert. Token-Bucket pro Channel-ID: 3 Tests / Minute,
# Capacity 3. Verhindert Bursts ohne legitime Tests zu blockieren.
from ..processing.rate_limit import TokenBucketLimiter  # noqa: E402

_channel_test_limiter = TokenBucketLimiter(capacity=3.0, refill_per_minute=3.0)


class ChannelTestView(_RequireAdminView):
    """v0.4: schickt eine Test-Nachricht ueber den Channel."""

    url = "/api/messagehub/channels/{channel_id}/test"
    name = "api:messagehub:channel-test"

    async def post(self, request: web.Request, channel_id: str) -> web.Response:
        from ..notifications.dispatch import build_forwarder_for_channels  # noqa: PLC0415
        from ..notifications.repository import ChannelRepository  # noqa: PLC0415
        from ..storage import Message, Severity  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            cid = int(channel_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        # Iter 88 / CR-20: Rate-Limit pro Channel-ID. Verhindert
        # Provider-Spam via wiederholtem Test-Knopf-Klick.
        if not _channel_test_limiter.allow(f"ch:{cid}"):
            return web.json_response(
                {"message": "rate limit exceeded — bitte etwas warten"},
                status=429,
                headers={"Retry-After": "20"},
            )
        channels = await ChannelRepository(db).list_all()
        target = next((c for c in channels if c.id == cid), None)
        if target is None:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)

        # Test ignoriert Throttle/Quiet — wir ueberschreiben temporaer die Schwelle
        # auf 'debug' und Throttle auf 0, damit die Test-Nachricht garantiert
        # durchkommt.
        target_copy = type(target)(
            id=target.id,
            name=target.name,
            channel_type=target.channel_type,
            enabled=True,
            severity_threshold="debug",
            quiet_start=None,
            quiet_end=None,
            quiet_bypass_error=True,
            throttle_seconds=0,
            config=target.config,
        )
        forwarder = build_forwarder_for_channels(hass, [target_copy])
        msg = Message(
            severity=Severity.INFO,
            source="messagehub.test",
            text=f"Test-Nachricht an Channel '{target.name}' — alles funktioniert.",
        )
        msg.id = -1
        delivered = await forwarder.dispatch(msg)
        await _audit(
            hass,
            request,
            action="channel_test",
            target_type="channel",
            target_id=channel_id,
        )
        return self.json({"delivered": delivered, "channel": target.name})


class ChannelDetailView(_RequireAdminView):
    url = "/api/messagehub/channels/{channel_id}"
    name = "api:messagehub:channel-detail"

    async def put(self, request: web.Request, channel_id: str) -> web.Response:
        from ..notifications.repository import (  # noqa: PLC0415
            Channel,
            ChannelRepository,
            channel_to_dict,
        )
        from ._channel_validation import (  # noqa: PLC0415
            ChannelConfigError,
            validate_channel_config,
        )

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            channel_type = str(data["channel_type"])
            config = data.get("config")
            # Iter 75 / CR-21: Channel-Type-spezifische Validation.
            validate_channel_config(channel_type, config)
            ch = Channel(
                id=int(channel_id),
                name=str(data["name"]),
                channel_type=channel_type,
                enabled=bool(data.get("enabled", True)),
                severity_threshold=str(data.get("severity_threshold", "warning")),
                quiet_start=data.get("quiet_start"),
                quiet_end=data.get("quiet_end"),
                quiet_bypass_error=bool(data.get("quiet_bypass_error", True)),
                throttle_seconds=int(data.get("throttle_seconds", 600)),
                config=config,
            )
            await ChannelRepository(db).update(ch)
        except ChannelConfigError as err:
            return self.json_message(f"invalid config: {err}", status_code=400)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _reload_dispatch(hass)
        await _audit(
            hass, request, action="channel_update", target_type="channel", target_id=channel_id
        )
        return self.json(channel_to_dict(ch))

    async def delete(self, request: web.Request, channel_id: str) -> web.Response:
        from ..notifications.repository import ChannelRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            cid = int(channel_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        if not await ChannelRepository(db).delete(cid):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _reload_dispatch(hass)
        await _audit(
            hass, request, action="channel_delete", target_type="channel", target_id=channel_id
        )
        return self.json_message("deleted")


async def _reload_dispatch(hass: HomeAssistant) -> None:
    domain_data = hass.data.get(DOMAIN, {})
    if not domain_data:
        return
    state = next(iter(domain_data.values()))
    dispatch = state.get("dispatch")
    if dispatch is not None:
        await dispatch.reload()


class MqttTopicsView(_RequireAdminView):
    """Iter 37: MQTT-Topic-Subscriptions CRUD."""

    url = "/api/messagehub/mqtt-topics"
    name = "api:messagehub:mqtt-topics"

    async def get(self, request: web.Request) -> web.Response:
        from ..ingestion.mqtt_repo import MqttTopicRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        items = await MqttTopicRepository(db).list_all()
        return self.json(
            {
                "items": [
                    {
                        "id": it.id,
                        "topic_pattern": it.topic_pattern,
                        "source": it.source,
                        "severity": it.severity,
                        "enabled": it.enabled,
                    }
                    for it in items
                ]
            }
        )

    async def post(self, request: web.Request) -> web.Response:
        from ..ingestion.mqtt_repo import MqttTopic, MqttTopicRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            t = MqttTopic(
                id=None,
                topic_pattern=str(data["topic_pattern"]),
                source=str(data["source"]),
                severity=str(data.get("severity", "info")),
                enabled=bool(data.get("enabled", True)),
            )
            await MqttTopicRepository(db).add(t)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _audit(
            hass,
            request,
            action="mqtt_topic_create",
            target_type="mqtt_topic",
            target_id=t.topic_pattern,
        )
        return self.json(
            {
                "id": t.id,
                "topic_pattern": t.topic_pattern,
                "source": t.source,
                "severity": t.severity,
                "enabled": t.enabled,
            }
        )


class MqttTopicDetailView(_RequireAdminView):
    url = "/api/messagehub/mqtt-topics/{topic_id}"
    name = "api:messagehub:mqtt-topic-detail"

    async def put(self, request: web.Request, topic_id: str) -> web.Response:
        """Iter 83 / CR-4: PUT-Handler für MQTT-Topic-Edit. Vorher fehlte
        er — Frontend musste DELETE+POST simulieren, was die ID
        unkonservativ veränderte und die ID-Stabilität nicht garantierte.
        """
        from ..ingestion.mqtt_repo import (  # noqa: PLC0415
            MqttTopic,
            MqttTopicRepository,
        )

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            tid = int(topic_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        try:
            data = await request.json()
            updated = MqttTopic(
                id=tid,
                topic_pattern=str(data["topic_pattern"]),
                source=str(data["source"]),
                severity=str(data.get("severity", "info")),
                enabled=bool(data.get("enabled", True)),
            )
            await MqttTopicRepository(db).update(updated)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _audit(
            hass,
            request,
            action="mqtt_topic_update",
            target_type="mqtt_topic",
            target_id=topic_id,
        )
        return self.json(
            {
                "id": updated.id,
                "topic_pattern": updated.topic_pattern,
                "source": updated.source,
                "severity": updated.severity,
                "enabled": updated.enabled,
            }
        )

    async def delete(self, request: web.Request, topic_id: str) -> web.Response:
        from ..ingestion.mqtt_repo import MqttTopicRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            tid = int(topic_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        if not await MqttTopicRepository(db).delete(tid):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            hass,
            request,
            action="mqtt_topic_delete",
            target_type="mqtt_topic",
            target_id=topic_id,
        )
        return self.json_message("deleted")


class RemediationHooksView(_RequireAdminView):
    """Iter 47: Auto-Remediation-Hooks CRUD."""

    url = "/api/messagehub/remediation-hooks"
    name = "api:messagehub:remediation-hooks"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.remediation_repo import RemediationHookRepository  # noqa: PLC0415

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        items = await RemediationHookRepository(db).list_all()
        return self.json(
            {
                "items": [
                    {
                        "id": it.id,
                        "name": it.name,
                        "source_pattern": it.source_pattern,
                        "fingerprint": it.fingerprint,
                        "automation_id": it.automation_id,
                        "confirm_required": it.confirm_required,
                        "enabled": it.enabled,
                    }
                    for it in items
                ]
            }
        )

    async def post(self, request: web.Request) -> web.Response:
        from ..processing.remediation_repo import (  # noqa: PLC0415
            RemediationHook,
            RemediationHookRepository,
        )

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            h = RemediationHook(
                id=None,
                name=str(data["name"]),
                source_pattern=str(data["source_pattern"]),
                fingerprint=data.get("fingerprint"),
                automation_id=str(data["automation_id"]),
                confirm_required=bool(data.get("confirm_required", True)),
                enabled=bool(data.get("enabled", True)),
            )
            await RemediationHookRepository(db).add(h)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _audit(
            hass,
            request,
            action="remediation_create",
            target_type="remediation_hook",
            target_id=str(h.id),
        )
        return self.json({"id": h.id, "name": h.name})


class RemediationHookDetailView(_RequireAdminView):
    url = "/api/messagehub/remediation-hooks/{hook_id}"
    name = "api:messagehub:remediation-hook-detail"

    async def put(self, request: web.Request, hook_id: str) -> web.Response:
        """F-006: ID-stabiles Update eines Remediation-Hooks.

        Body akzeptiert dieselben Felder wie POST. Existenz wird geprueft —
        404 bei unbekannter ID. Audit-Log: action='remediation_update'.
        """
        from ..processing.remediation_repo import (  # noqa: PLC0415
            RemediationHook,
            RemediationHookRepository,
        )

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            hid = int(hook_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        repo = RemediationHookRepository(db)
        # Existenz-Check schuetzt vor Silent-Update mit nicht existenter ID.
        existing = next((h for h in await repo.list_all() if h.id == hid), None)
        if existing is None:
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        try:
            data = await request.json()
            updated = RemediationHook(
                id=hid,
                name=str(data["name"]),
                source_pattern=str(data["source_pattern"]),
                fingerprint=data.get("fingerprint"),
                automation_id=str(data["automation_id"]),
                confirm_required=bool(data.get("confirm_required", True)),
                enabled=bool(data.get("enabled", True)),
            )
            await repo.update(updated)
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _audit(
            hass,
            request,
            action="remediation_update",
            target_type="remediation_hook",
            target_id=hook_id,
            details={
                "name": updated.name,
                "enabled": updated.enabled,
                "confirm_required": updated.confirm_required,
            },
        )
        return self.json(
            {
                "id": updated.id,
                "name": updated.name,
                "source_pattern": updated.source_pattern,
                "fingerprint": updated.fingerprint,
                "automation_id": updated.automation_id,
                "confirm_required": updated.confirm_required,
                "enabled": updated.enabled,
            }
        )

    async def delete(self, request: web.Request, hook_id: str) -> web.Response:
        from ..processing.remediation_repo import RemediationHookRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            hid = int(hook_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        if not await RemediationHookRepository(db).delete(hid):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            hass,
            request,
            action="remediation_delete",
            target_type="remediation_hook",
            target_id=hook_id,
        )
        return self.json_message("deleted")


class StatsExtendedView(_RequireAdminView):
    """Iter 41: erweiterte Stats fuer Heatmap und Top-Sources."""

    url = "/api/messagehub/stats-extended"
    name = "api:messagehub:stats-extended"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        repos = _get_repos(request.app["hass"])
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, _ = repos
        days = _parse_int_param(request.query, "days", 30, min_value=1, max_value=365)
        return self.json(
            {
                "heatmap": await msg_repo.heatmap_hour_weekday(days=days),
                "top_sources": await msg_repo.top_sources(limit=10, days=days),
                "mttr_per_source": await msg_repo.mttr_per_source(days=days),
                "severity_time_series": await msg_repo.severity_time_series(hours=24),
            }
        )


class SavedFiltersView(_RequireAdminView):
    """Iter 92 / K1: Saved Filters serverseitig.

    Endpoints:
    - GET  /api/messagehub/saved-filters?scope=messages|knx-stats|audit
    - POST /api/messagehub/saved-filters  body {name, scope, filters}
    """

    url = "/api/messagehub/saved-filters"
    name = "api:messagehub:saved-filters"

    async def get(self, request: web.Request) -> web.Response:
        from ..storage.saved_filters_repo import (  # noqa: PLC0415
            SavedFiltersRepository,
            saved_filter_to_dict,
        )

        self._check_admin(request)
        db = _get_database(request.app["hass"])
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        scope = request.query.get("scope", "messages")
        try:
            items = await SavedFiltersRepository(db).list_by_scope(scope)
        except ValueError as err:
            return self.json_message(str(err), status_code=400)
        return self.json(
            {"items": [saved_filter_to_dict(it) for it in items]}
        )

    async def post(self, request: web.Request) -> web.Response:
        from ..storage.saved_filters_repo import (  # noqa: PLC0415
            SavedFiltersRepository,
            saved_filter_to_dict,
        )

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
            item = await SavedFiltersRepository(db).upsert(
                name=str(data["name"]),
                scope=str(data["scope"]),
                filters=data.get("filters") or {},
            )
        except (KeyError, ValueError, TypeError) as err:
            return self.json_message(f"invalid: {err}", status_code=400)
        await _audit(
            hass,
            request,
            action="saved_filter_upsert",
            target_type="saved_filter",
            target_id=str(item.id),
            details={"scope": item.scope, "name": item.name},
        )
        return self.json(saved_filter_to_dict(item))


class SavedFilterDetailView(_RequireAdminView):
    """Iter 92 / K1: DELETE /api/messagehub/saved-filters/{id}."""

    url = "/api/messagehub/saved-filters/{filter_id}"
    name = "api:messagehub:saved-filter-detail"

    async def delete(
        self, request: web.Request, filter_id: str
    ) -> web.Response:
        from ..storage.saved_filters_repo import SavedFiltersRepository  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        db = _get_database(hass)
        if db is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        try:
            fid = int(filter_id)
        except ValueError:
            return self.json_message(_ERR_INVALID_ID, status_code=400)
        if not await SavedFiltersRepository(db).delete(fid):
            return self.json_message(_ERR_NOT_FOUND, status_code=404)
        await _audit(
            hass,
            request,
            action="saved_filter_delete",
            target_type="saved_filter",
            target_id=filter_id,
        )
        return self.json_message("deleted")


class MetricsView(_RequireAdminView):
    """Iter 69 / K2: Prometheus-/metrics-Endpoint.

    Liefert messagehub-Counts im Prometheus-Text-Format. Auth: HA-Admin
    (wie alle anderen Endpoints) — Prometheus-Scraper muss ein
    Long-Lived Access Token via Bearer-Header schicken.
    """

    url = "/api/messagehub/metrics"
    name = "api:messagehub:metrics"

    async def get(self, request: web.Request) -> web.Response:
        from datetime import UTC, datetime, timedelta  # noqa: PLC0415

        from ..processing.findings_service import (  # noqa: PLC0415
            aggregate_finding_total,
        )
        from ..processing.prometheus import format_prometheus_metrics  # noqa: PLC0415
        from ..storage.findings_repo import FindingsRepository  # noqa: PLC0415
        from ._helpers import get_audit_failure_count  # noqa: PLC0415

        self._check_admin(request)
        hass = request.app["hass"]
        repos = _get_repos(hass)
        if repos is None:
            return self.json_message(_ERR_NOT_INITIALISED, status_code=503)
        msg_repo, wh_repo = repos
        db = _get_database(hass)

        cutoff_24h = (datetime.now(UTC) - timedelta(hours=24)).isoformat(
            timespec="seconds"
        )
        # Per Severity all-time + 24h: 4 + 4 = 8 SELECTs. Bei
        # Scrape-Frequenz typisch alle 30-60 s ist das vertretbar.
        # Wer Prometheus-Last ernsthaft skalieren will, kann die Counts
        # in einer Materialized-View persistieren — bewusst nicht in
        # dieser Iteration.
        severity_total: dict[str, int] = {}
        severity_24h: dict[str, int] = {}
        for sev in ("debug", "info", "warning", "error"):
            severity_total[sev] = await msg_repo.count_by_severity(sev)
            severity_24h[sev] = await msg_repo.count_by_severity_since(
                sev, cutoff_24h
            )
        total = await msg_repo.count_total()

        # KNX-Telegramme im Logbuch (whitelist-gefiltert).
        knx_total = await msg_repo.count_filtered(source="knx-bus")
        # Webhook-Anzahl (active + inactive).
        webhooks = await wh_repo.list_all()
        webhook_total = len(webhooks)

        # Iter 29c: KNX-Findings-Aggregation als finding_total weiter-
        # reichen. Vorher fehlte der Caller, der Param war tot.
        finding_total: dict[tuple[str, str], int] = {}
        if db is not None:
            finding_total = await aggregate_finding_total(FindingsRepository(db))

        body = format_prometheus_metrics(
            total=total,
            severity_total=severity_total,
            severity_24h=severity_24h,
            knx_total=knx_total,
            webhook_total=webhook_total,
            audit_failure_total=get_audit_failure_count(),
            finding_total=finding_total,
        )
        return web.Response(
            body=body,
            content_type="text/plain",
            charset="utf-8",
            # Prometheus-Spec verlangt Versions-Suffix im Content-Type.
            headers={"Content-Type": "text/plain; version=0.0.4; charset=utf-8"},
        )


def async_register_views(hass: HomeAssistant) -> None:
    """Registriert alle API-Views (idempotent)."""
    for view_cls in (
        MessagesListView,
        MessageDetailView,
        MessageStatusView,
        MessageSeverityView,
        MessageTagsView,
        RunbookForView,
        AuditLogView,
        ExportView,
        MetricsView,
        SavedFiltersView,
        SavedFilterDetailView,
        HeartbeatsView,
        HeartbeatDetailView,
        SourcesView,
        StatsView,
        WebhooksView,
        WebhookDetailView,
        KnxAddressesView,
        KnxAddressBulkView,
        KnxAddressDetailView,
        KnxProjectDiscoveryView,
        KnxProjectSyncView,
        ChannelsView,
        ChannelDetailView,
        ChannelTestView,
        MqttTopicsView,
        MqttTopicDetailView,
        RemediationHooksView,
        RemediationHookDetailView,
        StatsExtendedView,
        KnxStatsSummaryView,
        KnxStatsTopView,
        KnxStatsTopBySourceView,
        KnxStatsGaDetailView,
        KnxStatsSourceDetailView,
        KnxStatsGaExportView,
        KnxStatsTimelineView,
        KnxStatsBusHealthView,
        KnxStatsBusloadView,
        KnxStatsHealthScoreView,
        KnxStatsHeatmapView,
        KnxStatsBurstsView,
        KnxStatsSensitiveLogView,
        KnxStatsSensitiveSetView,
        KnxStatsLongTermView,
        KnxStatsBusAnalysisStateView,
        KnxStatsSilenceView,
        KnxStatsOrphansView,
        KnxStatsTrendView,
        KnxStatsAlarmsView,
        KnxStatsAcknowledgeView,
        KnxStatsAcknowledgeBulkView,
        KnxStatsAcknowledgeDetailView,
        FindingsListView,
        FindingsAckView,
        FindingsAckDetailView,
        FindingsSeverityOverridesView,
        FindingsSeverityOverrideDetailView,
        FindingsMarkdownExportView,
        FindingsRefreshView,
    ):
        view = view_cls()
        # HA-internes Doppel-Register vermeiden
        with contextlib.suppress(RuntimeError):
            hass.http.register_view(view)
