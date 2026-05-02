"""HTTP-API fuer den KNX-Stats-Tab (Iter 6).

Endpunkte:
- GET  /api/messagehub/knx-stats/summary?from=&to=
- GET  /api/messagehub/knx-stats/top?from=&to=&limit=&min_rate=&include_acknowledged=
- GET  /api/messagehub/knx-stats/top-by-source?from=&to=&limit=
- GET  /api/messagehub/knx-stats/ga/{ga}?from=&to=
- GET  /api/messagehub/knx-stats/timeline?from=&to=&gas=a,b,c&bucket=10
- POST /api/messagehub/knx-stats/acknowledge       body {ga, note?, expiry_days?}
- DELETE /api/messagehub/knx-stats/acknowledge/{ga}

Auth: alle Endpunkte ueber RequireAdminView.
"""

from __future__ import annotations

from typing import Any

from aiohttp import web

from ..const import DEFAULT_KNX_ACK_EXPIRY_DAYS, DEFAULT_KNX_STATS_PERIOD_DAYS
from ..processing.knx_stats_service import (
    KnxStatsService,
    ga_detail_to_dict,
    top_row_to_dict,
)
from ..storage.knx_stats_repo import KnxStatsRepository
from ._helpers import (
    ERR_INVALID_JSON,
    ERR_NOT_FOUND,
    ERR_NOT_INITIALISED,
    RequireAdminView,
    audit,
    get_database,
    parse_int_param,
)
from ._validation import parse_iso_period, validate_knx_ga

_DEFAULT_TOP_LIMIT = 50
_HARD_TOP_LIMIT = 500
_DEFAULT_BUCKET_MIN = 10
_HARD_BUCKET_MIN = 60
_HARD_TIMELINE_GAS = 20


def _service(hass: Any) -> KnxStatsService | None:
    db = get_database(hass)
    if db is None:
        return None
    return KnxStatsService(KnxStatsRepository(db))


class KnxStatsSummaryView(RequireAdminView):
    url = "/api/messagehub/knx-stats/summary"
    name = "api:messagehub:knx-stats:summary"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        return self.json(await svc.compute_summary(from_iso, to_iso))


class KnxStatsTopView(RequireAdminView):
    url = "/api/messagehub/knx-stats/top"
    name = "api:messagehub:knx-stats:top"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        limit = parse_int_param(
            request.query, "limit", _DEFAULT_TOP_LIMIT,
            min_value=1, max_value=_HARD_TOP_LIMIT,
        )
        try:
            min_rate = float(request.query.get("min_rate", 0.0))
        except (ValueError, TypeError) as err:
            raise web.HTTPBadRequest(reason="invalid min_rate") from err
        include_ack = request.query.get("include_acknowledged", "true").lower() != "false"
        rows = await svc.compute_top(
            from_iso, to_iso,
            limit=limit, min_rate_per_min=min_rate,
            include_acknowledged=include_ack,
        )
        return self.json({
            "from": from_iso,
            "to": to_iso,
            "items": [top_row_to_dict(r) for r in rows],
            "total": len(rows),
        })


class KnxStatsTopBySourceView(RequireAdminView):
    url = "/api/messagehub/knx-stats/top-by-source"
    name = "api:messagehub:knx-stats:top-by-source"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        limit = parse_int_param(
            request.query, "limit", _DEFAULT_TOP_LIMIT,
            min_value=1, max_value=_HARD_TOP_LIMIT,
        )
        rows = await KnxStatsRepository(db).top_by_source(
            from_iso, to_iso, limit=limit
        )
        return self.json({
            "from": from_iso, "to": to_iso, "items": rows, "total": len(rows),
        })


class KnxStatsGaDetailView(RequireAdminView):
    url = "/api/messagehub/knx-stats/ga/{ga}"
    name = "api:messagehub:knx-stats:ga-detail"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        ga = validate_knx_ga(request.match_info["ga"])
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        detail = await svc.compute_ga_detail(ga, from_iso, to_iso)
        if detail is None:
            return self.json_message(ERR_NOT_FOUND, status_code=404)
        return self.json(ga_detail_to_dict(detail))


class KnxStatsTimelineView(RequireAdminView):
    url = "/api/messagehub/knx-stats/timeline"
    name = "api:messagehub:knx-stats:timeline"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        bucket = parse_int_param(
            request.query, "bucket", _DEFAULT_BUCKET_MIN,
            min_value=1, max_value=_HARD_BUCKET_MIN,
        )
        gas_raw = request.query.get("gas", "")
        gas = [validate_knx_ga(g.strip()) for g in gas_raw.split(",") if g.strip()]
        if len(gas) > _HARD_TIMELINE_GAS:
            raise web.HTTPBadRequest(
                reason=f"too many gas (max {_HARD_TIMELINE_GAS})"
            )
        items = await svc.compute_timeline(
            from_iso, to_iso, gas=gas, bucket_minutes=bucket
        )
        return self.json({
            "from": from_iso, "to": to_iso,
            "bucket_minutes": bucket, "items": items,
        })


class KnxStatsBusHealthView(RequireAdminView):
    """Iter 12 (QS-a): Wiederhol-Quote ueber den Zeitraum + Top-GAs."""

    url = "/api/messagehub/knx-stats/bus-health"
    name = "api:messagehub:knx-stats:bus-health"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        repo = KnxStatsRepository(db)
        summary = await repo.bus_health(from_iso, to_iso)
        per_ga = await repo.bus_health_per_ga(from_iso, to_iso, limit=20)
        return self.json({
            "from": from_iso, "to": to_iso,
            "summary": summary,
            "per_ga": per_ga,
        })


class KnxStatsAcknowledgeView(RequireAdminView):
    """POST: acknowledge anlegen/aktualisieren."""

    url = "/api/messagehub/knx-stats/acknowledge"
    name = "api:messagehub:knx-stats:acknowledge"

    async def post(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(ERR_INVALID_JSON, status_code=400)
        ga = validate_knx_ga(str(data.get("ga", "")))
        note = data.get("note")
        expiry_days = data.get("expiry_days", DEFAULT_KNX_ACK_EXPIRY_DAYS)
        try:
            expiry_int = int(expiry_days) if expiry_days is not None else 0
        except (ValueError, TypeError):
            return self.json_message("invalid expiry_days", status_code=400)
        await KnxStatsRepository(db).ack_set(
            ga,
            note=str(note) if isinstance(note, str) else None,
            expiry_days=expiry_int,
        )
        await audit(
            request.app["hass"], request,
            action="knx_stats_acknowledge",
            target_type="knx_ga", target_id=ga,
            details={"note": note, "expiry_days": expiry_int},
        )
        return self.json({"ok": True, "ga": ga})


class KnxStatsAcknowledgeDetailView(RequireAdminView):
    """DELETE: acknowledge entfernen."""

    url = "/api/messagehub/knx-stats/acknowledge/{ga}"
    name = "api:messagehub:knx-stats:acknowledge-detail"

    async def delete(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        ga = validate_knx_ga(request.match_info["ga"])
        deleted = await KnxStatsRepository(db).ack_clear(ga)
        if not deleted:
            return self.json_message(ERR_NOT_FOUND, status_code=404)
        await audit(
            request.app["hass"], request,
            action="knx_stats_unacknowledge",
            target_type="knx_ga", target_id=ga,
        )
        return self.json({"ok": True, "ga": ga})


def register_knx_stats_views(hass: Any) -> None:
    hass.http.register_view(KnxStatsSummaryView())
    hass.http.register_view(KnxStatsTopView())
    hass.http.register_view(KnxStatsTopBySourceView())
    hass.http.register_view(KnxStatsGaDetailView())
    hass.http.register_view(KnxStatsTimelineView())
    hass.http.register_view(KnxStatsBusHealthView())
    hass.http.register_view(KnxStatsAcknowledgeView())
    hass.http.register_view(KnxStatsAcknowledgeDetailView())
