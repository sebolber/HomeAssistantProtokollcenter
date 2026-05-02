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

from ..const import (
    DEFAULT_KNX_ACK_EXPIRY_DAYS,
    DEFAULT_KNX_BUS_ANALYSIS_ENABLED,
    DEFAULT_KNX_COUNTER_RETENTION_DAYS,
    DEFAULT_KNX_STATS_PERIOD_DAYS,
    DOMAIN,
    EVENT_KNX_ALARM_TRIGGERED,
    HASS_KEY_KNX_BUS_ANALYSIS,
    KNX_ALARM_BUSLOAD_PCT_DEFAULT,
    KNX_ALARM_REPEAT_RATE_PCT_DEFAULT,
    KNX_ALARM_SILENCE_COUNT_DEFAULT,
    KNX_BUSLOAD_DEFAULT_BUCKET_SECONDS,
    KNX_BUSLOAD_MAX_BUCKET_SECONDS,
    KNX_BUSLOAD_MIN_BUCKET_SECONDS,
    SETTINGS_KEY_KNX_BUS_ANALYSIS,
)
from ..processing.knx_stats_service import (
    KnxStatsService,
    ga_detail_to_dict,
    top_row_to_dict,
)
from ..processing.rate_limit import TokenBucketLimiter
from ..storage.knx_stats_repo import KnxStatsRepository
from ._alarm_dedup import AlarmDedupCache
from ._helpers import (
    ERR_INVALID_JSON,
    ERR_NOT_FOUND,
    ERR_NOT_INITIALISED,
    RequireAdminView,
    audit,
    get_database,
    parse_int_param,
)
from ._validation import (
    parse_iso_period,
    validate_knx_ga,
    validate_knx_individual_address,
    validate_note,
)

# Iter 65 / P2-3: Rate-Limit fuer /knx-stats/alarms. Jeder Aufruf
# feuert HA-Eventbus-Events fuer triggered Alarms — ein Admin koennte
# durch Polling sehr viele Events erzeugen. Capacity 5 Bursts, Refill
# 1 pro 5 Sekunden = 12 / Minute. Praktischer Use-Case: alle 30-60 s
# pollen reicht; absichtliches Spam wird gedrosselt. Pro-User-Key
# (User-ID), damit ein User nicht andere blockiert.
_ALARMS_RATE_CAPACITY: float = 5.0
_ALARMS_RATE_PER_MINUTE: float = 12.0
_alarms_limiter = TokenBucketLimiter(
    capacity=_ALARMS_RATE_CAPACITY,
    refill_per_minute=_ALARMS_RATE_PER_MINUTE,
)

# Iter 76 / CR-17: Alarm-Eventbus-Dedup. Auch wenn der Rate-Limiter
# einen Aufruf zulaesst, soll derselbe triggered Alarm pro Minute nur
# ein Event feuern — sonst entstehen redundante Automation-Trigger
# bei kurzem Polling. Modul-Singleton, in-process state.
_alarm_dedup = AlarmDedupCache()

_DEFAULT_TOP_LIMIT = 50
_HARD_TOP_LIMIT = 500
_DEFAULT_BUCKET_MIN = 10
_HARD_BUCKET_MIN = 60
_HARD_TIMELINE_GAS = 20

# Iter 19 Security-Fix: Hard-Limit fuer User-Input im Acknowledge-Note,
# damit keine Bomb-Strings die DB belasten.
_HARD_NOTE_LENGTH = 1000

# Iter 33: Bulk-Ack auf max 100 GAs pro Call (DoS + Audit-Log-Spam-Schutz)
_HARD_BULK_ACK_COUNT = 100


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
            request.query,
            "limit",
            _DEFAULT_TOP_LIMIT,
            min_value=1,
            max_value=_HARD_TOP_LIMIT,
        )
        try:
            min_rate = float(request.query.get("min_rate", 0.0))
        except (ValueError, TypeError) as err:
            raise web.HTTPBadRequest(reason="invalid min_rate") from err
        include_ack = request.query.get("include_acknowledged", "true").lower() != "false"
        rows = await svc.compute_top(
            from_iso,
            to_iso,
            limit=limit,
            min_rate_per_min=min_rate,
            include_acknowledged=include_ack,
        )
        return self.json(
            {
                "from": from_iso,
                "to": to_iso,
                "items": [top_row_to_dict(r) for r in rows],
                "total": len(rows),
            }
        )


class KnxStatsTopBySourceView(RequireAdminView):
    url = "/api/messagehub/knx-stats/top-by-source"
    name = "api:messagehub:knx-stats:top-by-source"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.knx_discovery import discover_knx_devices  # noqa: PLC0415

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        limit = parse_int_param(
            request.query,
            "limit",
            _DEFAULT_TOP_LIMIT,
            min_value=1,
            max_value=_HARD_TOP_LIMIT,
        )
        rows = await KnxStatsRepository(db).top_by_source(from_iso, to_iso, limit=limit)
        # Iter 34: Hersteller annotieren falls ETS-Projekt verfuegbar.
        devices = await discover_knx_devices(request.app["hass"])
        for row in rows:
            device = devices.get(row.get("dev_source", ""))
            if device is not None:
                row["manufacturer"] = device.get("manufacturer", "")
                row["device_name"] = device.get("name", "")
        return self.json(
            {
                "from": from_iso,
                "to": to_iso,
                "items": rows,
                "total": len(rows),
            }
        )


class KnxStatsGaDetailView(RequireAdminView):
    url = "/api/messagehub/knx-stats/ga/{ga}"
    name = "api:messagehub:knx-stats:ga-detail"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.knx_discovery import discover_knx_devices  # noqa: PLC0415
        from ..processing.knx_manufacturer import (  # noqa: PLC0415
            lookup_manufacturer_hints,
        )

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
        result = ga_detail_to_dict(detail)
        # Iter 34: Hersteller-Info aus dem ETS-Projekt anhaengen.
        device_info = None
        manufacturer_hints = None
        if detail.dev_source:
            devices = await discover_knx_devices(request.app["hass"])
            device = devices.get(detail.dev_source)
            if device is not None:
                device_info = device
                manufacturer_hints = lookup_manufacturer_hints(device.get("manufacturer", ""))
        result["device"] = device_info
        result["manufacturer_hints"] = manufacturer_hints
        return self.json(result)


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
            request.query,
            "bucket",
            _DEFAULT_BUCKET_MIN,
            min_value=1,
            max_value=_HARD_BUCKET_MIN,
        )
        gas_raw = request.query.get("gas", "")
        gas = [validate_knx_ga(g.strip()) for g in gas_raw.split(",") if g.strip()]
        if len(gas) > _HARD_TIMELINE_GAS:
            raise web.HTTPBadRequest(reason=f"too many gas (max {_HARD_TIMELINE_GAS})")
        items = await svc.compute_timeline(from_iso, to_iso, gas=gas, bucket_minutes=bucket)
        return self.json(
            {
                "from": from_iso,
                "to": to_iso,
                "bucket_minutes": bucket,
                "items": items,
            }
        )


class KnxStatsGaExportView(RequireAdminView):
    """Iter 68 / WR-F: Werteverlauf-Export einer GA als CSV oder JSON.

    Endpoint: GET /api/messagehub/knx-stats/ga/{ga}/export?format=csv&from=&to=
    Hard-Cap: 50.000 Samples pro Aufruf.
    """

    url = "/api/messagehub/knx-stats/ga/{ga}/export"
    name = "api:messagehub:knx-stats:ga-export"

    async def get(self, request: web.Request) -> web.Response:
        # Iter 70 / CR-32: Encoding-Logik in pure Helpers ausgelagert
        # (processing/knx_stats_export.py), damit Hard-Cap + CSV-Quoting
        # + JSON-Wrapper unit-getestet werden koennen.
        from ..processing.knx_stats_export import (  # noqa: PLC0415
            cap_samples,
            format_ga_export_csv,
            format_ga_export_json,
            safe_export_filename,
        )

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        ga = validate_knx_ga(request.match_info["ga"])
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        fmt = request.query.get("format", "csv").lower()
        if fmt not in ("csv", "json"):
            raise web.HTTPBadRequest(reason="format must be csv or json")
        repo = KnxStatsRepository(db)
        # Iter 75 / CR-19: Sensitive-GA-Pruefung VOR dem Sample-Lookup,
        # damit das Audit-Detail klar markiert ist. Export wird nicht
        # blockiert (User ist Admin), aber lauter geloggt.
        is_sensitive = await repo.is_sensitive(ga)
        samples = await repo.ga_samples(ga, from_iso, to_iso)
        capped = cap_samples(samples)
        audit(
            request.app["hass"],
            "knx_stats_ga_export"
            if not is_sensitive
            else "knx_stats_ga_export_sensitive",
            target_id=ga,
            details={
                "format": fmt,
                "from": from_iso,
                "to": to_iso,
                "count": len(capped),
                "is_sensitive": is_sensitive,
            },
        )
        if fmt == "csv":
            csv_filename = safe_export_filename(ga, "csv")
            return web.Response(
                body=format_ga_export_csv(ga, capped),
                content_type="text/csv",
                charset="utf-8",
                headers={
                    "Content-Disposition": f'attachment; filename="{csv_filename}"',
                },
            )
        json_filename = safe_export_filename(ga, "json")
        return web.Response(
            body=format_ga_export_json(ga, from_iso, to_iso, capped),
            content_type="application/json",
            charset="utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{json_filename}"',
            },
        )


class KnxStatsTrendView(RequireAdminView):
    """Iter 67 / WR-I: Trend-Vergleich aktueller Periode vs. Vorperiode.

    Endpoint: GET /api/messagehub/knx-stats/trend?from=&to=&top_n=10
    """

    url = "/api/messagehub/knx-stats/trend"
    name = "api:messagehub:knx-stats:trend"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        top_n = parse_int_param(
            request.query, "top_n", 10, min_value=1, max_value=50
        )
        return self.json(await svc.compute_trend(from_iso, to_iso, top_n=top_n))


class KnxStatsAlarmsView(RequireAdminView):
    """Iter 15 (QS-l): wertet Default-Alarm-Regeln aus + feuert
    HA-Eventbus-Event je triggered Alarm.

    Schwellwerte (Phase 1) aus const.py — koennen via Query-Param
    (busload_threshold, repeat_threshold, silence_threshold) ueber-
    schrieben werden, was auch fuer Frontend-Tests brauchbar ist.
    """

    url = "/api/messagehub/knx-stats/alarms"
    name = "api:messagehub:knx-stats:alarms"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        # Iter 65 / P2-3: Rate-Limit pro User-ID gegen Eventbus-Spam.
        # Vor allem anderen Validation-Aufwand pruefen — DoS-Resistenz.
        user = request.get("hass_user")
        rate_key = (
            f"user:{user.id}" if user is not None and getattr(user, "id", None) else "anon"
        )
        if not _alarms_limiter.allow(rate_key):
            # Refill-Rate: 1 Token pro 5 s. Retry-After konservativ 5 s.
            # web.json_response statt self.json_message, weil letzteres
            # in HomeAssistantView keine custom Headers unterstuetzt.
            return web.json_response(
                {"message": "rate limit exceeded"},
                status=429,
                headers={"Retry-After": "5"},
            )
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        try:
            busload_th = float(
                request.query.get("busload_threshold", KNX_ALARM_BUSLOAD_PCT_DEFAULT)
            )
            repeat_th = float(
                request.query.get("repeat_threshold", KNX_ALARM_REPEAT_RATE_PCT_DEFAULT)
            )
        except (ValueError, TypeError) as err:
            raise web.HTTPBadRequest(reason="invalid threshold") from err
        silence_th = parse_int_param(
            request.query,
            "silence_threshold",
            KNX_ALARM_SILENCE_COUNT_DEFAULT,
            min_value=1,
            max_value=1000,
        )
        max_silence = parse_int_param(
            request.query,
            "max_silence_min",
            1440,
            min_value=1,
            max_value=43200,
        )
        alarms = await svc.evaluate_alarms(
            from_iso,
            to_iso,
            busload_pct_threshold=busload_th,
            repeat_rate_pct_threshold=repeat_th,
            silence_count_threshold=silence_th,
            max_silence_minutes=max_silence,
        )
        # Eventbus-Trigger fuer triggered Alarme.
        # Iter 76 / CR-17: Dedup pro (rule_kind, Minutenbucket) — bei
        # rapid-Polling wird derselbe Alarm pro Minute nur einmal
        # gefeuert. Schuetzt nachgelagerte Automationen vor Mehrfach-
        # Trigger.
        bus = request.app["hass"].bus
        for alarm in alarms:
            if not alarm["triggered"]:
                continue
            rule_kind = str(alarm.get("kind") or alarm.get("rule") or "unknown")
            if _alarm_dedup.should_fire(rule_kind):
                bus.async_fire(EVENT_KNX_ALARM_TRIGGERED, alarm)
        return self.json(
            {
                "from": from_iso,
                "to": to_iso,
                "alarms": alarms,
                "triggered_count": sum(1 for a in alarms if a["triggered"]),
            }
        )


class KnxStatsOrphansView(RequireAdminView):
    """Iter 14 (QS-g): Verwaiste GAs.

    Vergleicht die im HA-KNX-Projekt definierten Gruppenadressen mit den
    im Zeitraum tatsaechlich gesehenen Telegrammen.
    """

    url = "/api/messagehub/knx-stats/orphans"
    name = "api:messagehub:knx-stats:orphans"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.knx_discovery import discover_knx_project  # noqa: PLC0415

        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        project_gas, status = await discover_knx_project(request.app["hass"])
        result = await svc.compute_orphans(from_iso, to_iso, project_gas=project_gas)
        result["from"] = from_iso
        result["to"] = to_iso
        result["discovery_status"] = status
        return self.json(result)


class KnxStatsSilenceView(RequireAdminView):
    """Iter 13 (QS-c): Stille-Detector pro Source-Adresse.

    Default max_silence=1440 Min (24h). Anpassbar via Query-Param.
    """

    url = "/api/messagehub/knx-stats/silence"
    name = "api:messagehub:knx-stats:silence"

    async def get(self, request: web.Request) -> web.Response:
        from datetime import UTC, datetime  # noqa: PLC0415

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        max_silence = parse_int_param(
            request.query,
            "max_silence_min",
            1440,
            min_value=1,
            max_value=43200,  # max 30 Tage
        )
        now_iso = datetime.now(UTC).isoformat(timespec="seconds")
        rows = await KnxStatsRepository(db).silence_detect(
            from_iso,
            to_iso,
            now_iso=now_iso,
            max_silence_minutes=max_silence,
        )
        # Frontend zeigt primaer die Alarme — sortieren wir die zuerst.
        rows.sort(key=lambda r: (not r["alarm"], -r["silent_minutes"]))
        return self.json(
            {
                "from": from_iso,
                "to": to_iso,
                "max_silence_minutes": max_silence,
                "items": rows,
                "alarm_count": sum(1 for r in rows if r["alarm"]),
            }
        )


class KnxStatsSensitiveLogView(RequireAdminView):
    """Iter 42 (Feature N): Audit-Log fuer is_sensitive-markierte GAs."""

    url = "/api/messagehub/knx-stats/sensitive-log"
    name = "api:messagehub:knx-stats:sensitive-log"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        limit = parse_int_param(request.query, "limit", 200, min_value=1, max_value=1000)
        result = await svc.sensitive_log(from_iso=from_iso, to_iso=to_iso, limit=limit)
        return self.json(result)


class KnxStatsSensitiveSetView(RequireAdminView):
    """Iter 42 (Feature N): is_sensitive-Flag setzen (POST/DELETE).

    POST /sensitive/{ga}  -> setzt das Flag = 1
    DELETE /sensitive/{ga} -> setzt das Flag = 0

    Beide Aktionen erzeugen ein Audit-Log mit dem Admin als Subject.
    """

    url = "/api/messagehub/knx-stats/sensitive/{ga}"
    name = "api:messagehub:knx-stats:sensitive-set"

    async def post(self, request: web.Request) -> web.Response:
        return await self._toggle(request, sensitive=True)

    async def delete(self, request: web.Request) -> web.Response:
        return await self._toggle(request, sensitive=False)

    async def _toggle(self, request: web.Request, *, sensitive: bool) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        ga = validate_knx_ga(request.match_info["ga"])
        repo = KnxStatsRepository(db)
        await repo.set_sensitive(ga, sensitive=sensitive)
        await audit(
            request.app["hass"],
            request,
            action="knx_stats_sensitive_set" if sensitive else "knx_stats_sensitive_clear",
            target_type="knx_ga",
            target_id=ga,
            details={"sensitive": sensitive},
        )
        return self.json({"ok": True, "ga": ga, "sensitive": sensitive})


class KnxStatsBurstsView(RequireAdminView):
    """Iter 40 (Feature C): Burst-Detector — kurze Telegrammfluten.

    GET-Parameter:
    - from / to (ISO-Periode, validiert)
    - window_seconds (1..60, default 5)
    - threshold_pct (1..100, default 30)
    - limit (1..500, default 50)
    """

    url = "/api/messagehub/knx-stats/bursts"
    name = "api:messagehub:knx-stats:bursts"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        window_seconds = parse_int_param(
            request.query, "window_seconds", 5, min_value=1, max_value=60
        )
        limit = parse_int_param(request.query, "limit", 50, min_value=1, max_value=500)
        # threshold_pct als float manuell parsen — parse_int_param ist int-only
        thr_raw = request.query.get("threshold_pct")
        try:
            threshold_pct = float(thr_raw) if thr_raw is not None else 30.0
        except (TypeError, ValueError):
            threshold_pct = 30.0
        result = await svc.bursts(
            from_iso=from_iso,
            to_iso=to_iso,
            window_seconds=window_seconds,
            threshold_pct=threshold_pct,
            limit=limit,
        )
        return self.json(result)


class KnxStatsLongTermView(RequireAdminView):
    """Iter 38 (Feature B+J): Long-Term-Sicht aus Counter-Tabelle.

    Degradierter Modus fuer Perioden > 48 h: keine Source-Adressen,
    keine Wertverlaeufe, nur Counts pro GA und Stunden-/Tages-Bucket.

    GET-Parameter:
    - from / to (ISO-Periode, validiert)
    - limit (Top-GAs, default 50, max 500)
    - bucket: "auto"/"hour"/"day" (default auto)
    - gas: kommaseparierte GA-Liste (optional, max 50)
    """

    url = "/api/messagehub/knx-stats/long-term"
    name = "api:messagehub:knx-stats:long-term"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        # Counter-Retention erlaubt bis zu 365 Tage — fuer diesen
        # Endpunkt heben wir das default-Period-Limit von 90d an.
        from_iso, to_iso = parse_iso_period(
            request.query,
            default_days=DEFAULT_KNX_STATS_PERIOD_DAYS,
            max_days=DEFAULT_KNX_COUNTER_RETENTION_DAYS,
        )
        limit = parse_int_param(
            request.query, "limit", _DEFAULT_TOP_LIMIT, min_value=1, max_value=_HARD_TOP_LIMIT
        )
        bucket_raw = (request.query.get("bucket") or "auto").strip().lower()
        bucket = bucket_raw if bucket_raw in {"auto", "hour", "day"} else "auto"
        gas_raw = request.query.get("gas") or ""
        gas: list[str] = []
        if gas_raw:
            gas = [validate_knx_ga(g.strip()) for g in gas_raw.split(",") if g.strip()]
            if len(gas) > _HARD_TIMELINE_GAS:
                return self.json_message(
                    f"too many gas (max {_HARD_TIMELINE_GAS})", status_code=400
                )
        result = await svc.long_term_view(
            from_iso=from_iso,
            to_iso=to_iso,
            top_limit=limit,
            bucket=bucket,
            gas=gas or None,
        )
        return self.json(result)


class KnxStatsBusAnalysisStateView(RequireAdminView):
    """Iter 48 (N1): Bus-Analyse-Toggle.

    GET liefert {enabled: bool} aus dem Hass-Data-Cache (oder Default,
    falls noch keine Setting gespeichert).
    PUT body {enabled: bool} schreibt in messagehub_settings UND setzt
    den Hass-Data-Flag — der Listener-Guard greift sofort, ohne Reload.
    """

    url = "/api/messagehub/knx-stats/bus-analysis-state"
    name = "api:messagehub:knx-stats:bus-analysis-state"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        # Iter 85 / CR-6: 503-Pfad konsistent mit anderen Endpoints,
        # damit Frontend bei Setup-Fehler eine eindeutige Fehlermeldung
        # bekommt statt eines voreilig "enabled: True"-Defaults.
        if get_database(request.app["hass"]) is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        domain_data = request.app["hass"].data.get(DOMAIN, {})
        enabled = bool(domain_data.get(HASS_KEY_KNX_BUS_ANALYSIS, DEFAULT_KNX_BUS_ANALYSIS_ENABLED))
        return self.json({"enabled": enabled})

    async def put(self, request: web.Request) -> web.Response:
        from ..storage.settings_repo import SettingsRepository  # noqa: PLC0415

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(ERR_INVALID_JSON, status_code=400)
        enabled = bool(data.get("enabled", DEFAULT_KNX_BUS_ANALYSIS_ENABLED))
        await SettingsRepository(db).set_bool(SETTINGS_KEY_KNX_BUS_ANALYSIS, enabled)
        # Hass-Data-Flag direkt aktualisieren — Listener-Guard sieht den
        # neuen Wert beim naechsten Telegramm, ohne Integration-Reload.
        request.app["hass"].data.setdefault(DOMAIN, {})[HASS_KEY_KNX_BUS_ANALYSIS] = enabled
        await audit(
            request.app["hass"],
            request,
            action="knx_bus_analysis_toggle",
            target_type="messagehub_setting",
            target_id=SETTINGS_KEY_KNX_BUS_ANALYSIS,
            details={"enabled": enabled},
        )
        return self.json({"ok": True, "enabled": enabled})


class KnxStatsHealthScoreView(RequireAdminView):
    """Iter 37 (Feature K): Bus-Health-Score 0..100 + Findings.

    Single-Glance-KPI fuer Stats-Tab + (optional) Sensor-Quelle. Aggregiert
    Wiederhol-Quote, Buslast-Spitze, Stille-Geraete und offene Alarme.
    """

    url = "/api/messagehub/knx-stats/health-score"
    name = "api:messagehub:knx-stats:health-score"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        max_silence = parse_int_param(
            request.query,
            "max_silence_min",
            1440,
            min_value=1,
            max_value=43200,
        )
        from datetime import UTC, datetime  # noqa: PLC0415

        now_iso = datetime.now(UTC).isoformat(timespec="seconds")
        result = await svc.health_score(
            from_iso=from_iso,
            to_iso=to_iso,
            now_iso=now_iso,
            max_silence_minutes=max_silence,
        )
        return self.json(result)


class KnxStatsBusloadView(RequireAdminView):
    """Iter 36 (Feature A): Buslast-%-KPI mit konfigurierbarem Bucket.

    GET-Parameter:
    - from / to: ISO-Periode (von parse_iso_period validiert)
    - bucket_seconds: optional, default 10 (ETS-Standard).
      Geclippt auf [KNX_BUSLOAD_MIN_BUCKET_SECONDS, KNX_BUSLOAD_MAX_BUCKET_SECONDS].
    """

    url = "/api/messagehub/knx-stats/busload"
    name = "api:messagehub:knx-stats:busload"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        bucket_seconds = parse_int_param(
            request.query,
            "bucket_seconds",
            default=KNX_BUSLOAD_DEFAULT_BUCKET_SECONDS,
            min_value=KNX_BUSLOAD_MIN_BUCKET_SECONDS,
            max_value=KNX_BUSLOAD_MAX_BUCKET_SECONDS,
        )
        result = await svc.busload(from_iso=from_iso, to_iso=to_iso, bucket_seconds=bucket_seconds)
        return self.json(result)


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
        return self.json(
            {
                "from": from_iso,
                "to": to_iso,
                "summary": summary,
                "per_ga": per_ga,
            }
        )


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
        note_str = validate_note(data.get("note"), max_length=_HARD_NOTE_LENGTH)
        expiry_days = data.get("expiry_days", DEFAULT_KNX_ACK_EXPIRY_DAYS)
        try:
            expiry_int = int(expiry_days) if expiry_days is not None else 0
        except (ValueError, TypeError):
            return self.json_message("invalid expiry_days", status_code=400)
        await KnxStatsRepository(db).ack_set(
            ga,
            note=note_str,
            expiry_days=expiry_int,
        )
        await audit(
            request.app["hass"],
            request,
            action="knx_stats_acknowledge",
            target_type="knx_ga",
            target_id=ga,
            details={"note": note_str, "expiry_days": expiry_int},
        )
        return self.json({"ok": True, "ga": ga})


class KnxStatsAcknowledgeBulkView(RequireAdminView):
    """Iter 33: Bulk-Ack aller GAs eines Geraets (Source-Adresse).

    Body: {"dev_source": "1.1.220", "note": "...", "expiry_days": 90}
    """

    url = "/api/messagehub/knx-stats/acknowledge-bulk"
    name = "api:messagehub:knx-stats:acknowledge-bulk"

    async def post(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(ERR_INVALID_JSON, status_code=400)
        dev_source = validate_knx_individual_address(str(data.get("dev_source", "")))
        note_str = validate_note(data.get("note"), max_length=_HARD_NOTE_LENGTH)
        expiry_days = data.get("expiry_days", DEFAULT_KNX_ACK_EXPIRY_DAYS)
        try:
            expiry_int = int(expiry_days) if expiry_days is not None else 0
        except (ValueError, TypeError):
            return self.json_message("invalid expiry_days", status_code=400)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        repo = KnxStatsRepository(db)
        rows = await repo.gas_for_source(dev_source, from_iso, to_iso, limit=_HARD_BULK_ACK_COUNT)
        gas = [str(row["ga"]) for row in rows]
        if not gas:
            return self.json({"ok": True, "dev_source": dev_source, "count": 0})
        if len(gas) > _HARD_BULK_ACK_COUNT:
            return self.json_message(
                f"too many gas (max {_HARD_BULK_ACK_COUNT})",
                status_code=400,
            )
        count = await repo.ack_set_bulk(gas, note=note_str, expiry_days=expiry_int)
        await audit(
            request.app["hass"],
            request,
            action="knx_stats_acknowledge_bulk",
            target_type="knx_dev_source",
            target_id=dev_source,
            details={
                "ga_count": count,
                "note": note_str,
                "expiry_days": expiry_int,
            },
        )
        return self.json(
            {
                "ok": True,
                "dev_source": dev_source,
                "count": count,
                "gas": gas,
            }
        )


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
            request.app["hass"],
            request,
            action="knx_stats_unacknowledge",
            target_type="knx_ga",
            target_id=ga,
        )
        return self.json({"ok": True, "ga": ga})


def register_knx_stats_views(hass: Any) -> None:
    hass.http.register_view(KnxStatsSummaryView())
    hass.http.register_view(KnxStatsTopView())
    hass.http.register_view(KnxStatsTopBySourceView())
    hass.http.register_view(KnxStatsGaDetailView())
    hass.http.register_view(KnxStatsTimelineView())
    hass.http.register_view(KnxStatsSilenceView())
    hass.http.register_view(KnxStatsOrphansView())
    hass.http.register_view(KnxStatsAlarmsView())
    hass.http.register_view(KnxStatsBusHealthView())
    hass.http.register_view(KnxStatsBusloadView())
    hass.http.register_view(KnxStatsHealthScoreView())
    hass.http.register_view(KnxStatsLongTermView())
    hass.http.register_view(KnxStatsBurstsView())
    hass.http.register_view(KnxStatsSensitiveLogView())
    hass.http.register_view(KnxStatsSensitiveSetView())
    hass.http.register_view(KnxStatsBusAnalysisStateView())
    hass.http.register_view(KnxStatsAcknowledgeView())
    hass.http.register_view(KnxStatsAcknowledgeBulkView())
    hass.http.register_view(KnxStatsAcknowledgeDetailView())
