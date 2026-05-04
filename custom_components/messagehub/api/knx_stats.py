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
from ..processing.knx_recommend_service import (
    compute_device_recommendation,
    device_recommendation_to_dict,
)
from ..processing.recommendation_cache import RecommendationCache
from ..storage.knx_devices_repo import KnxDeviceRepository
from ..processing.knx_stats_service import (
    KnxStatsService,
    ga_detail_to_dict,
    source_detail_to_dict,
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
    # Iter H (knx-detail-panes): findings_repo mitgeben, damit
    # compute_source_detail die persistierten Findings dieser Source
    # mitliefern kann. Lokaler Import vermeidet Circular-Import beim
    # Modul-Laden (FindingsRepository -> processing -> knx_stats_service).
    from ..storage.findings_repo import FindingsRepository  # noqa: PLC0415
    return KnxStatsService(
        KnxStatsRepository(db),
        findings_repo=FindingsRepository(db),
    )


def _first_entry_options(hass: Any) -> dict[str, Any]:
    """Iter 87 / P2-2: Liefert die `options` des ersten ConfigEntry,
    aus dem die Alarm-Schwellen u. a. ueberschrieben werden koennen.

    Defensiv: bei nicht-initialisiertem ConfigEntry-Stack gibt's leeres
    Dict — Aufrufer fallen auf hardcoded Defaults zurueck.
    """
    entries = list(hass.config_entries.async_entries(DOMAIN)) if hasattr(
        hass, "config_entries"
    ) else []
    if not entries:
        return {}
    return dict(entries[0].options or {})


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

    async def get(self, request: web.Request, ga: str) -> web.Response:
        from ..processing.knx_discovery import discover_knx_devices  # noqa: PLC0415
        from ..processing.knx_manufacturer import (  # noqa: PLC0415
            lookup_manufacturer_hints,
        )

        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        ga = validate_knx_ga(ga)
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


class KnxStatsSourceDetailView(RequireAdminView):
    """Iter C (knx-detail-panes): Source-Detail-Endpoint.

    URL: /api/messagehub/knx-stats/source/{dev_source}
         ?from=ISO&to=ISO[&max_silence_min=N]

    Liefert die Source-Detail-Sicht (KPIs + GA-Liste + Status). 404
    wenn die Source im Period kein einziges Telegramm gesendet hat;
    400 bei ungueltiger Source-Adresse oder Period.
    Auth: HA-Admin (RequireAdminView).
    """

    url = "/api/messagehub/knx-stats/source/{dev_source}"
    name = "api:messagehub:knx-stats:source-detail"

    async def get(self, request: web.Request, dev_source: str) -> web.Response:
        from ..processing.knx_discovery import discover_knx_devices  # noqa: PLC0415
        from ..processing.knx_manufacturer import (  # noqa: PLC0415
            lookup_manufacturer_hints,
        )

        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        dev_source = validate_knx_individual_address(dev_source)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        # max_silence_min ueber Query-Param uebersteuerbar; Hard-Cap 1
        # bis 90 Tage damit kein Verstoss gegen MAX_PERIOD_DAYS
        # entsteht und kein 0/Negativer-Wert die Logik bricht.
        max_silence = parse_int_param(
            request.query,
            "max_silence_min",
            1440,
            min_value=1,
            max_value=129600,  # 90 Tage in Minuten
        )
        detail = await svc.compute_source_detail(
            dev_source, from_iso, to_iso,
            max_silence_minutes=max_silence,
        )
        if detail is None:
            return self.json_message(ERR_NOT_FOUND, status_code=404)
        result = source_detail_to_dict(detail)
        result["from"] = from_iso
        result["to"] = to_iso
        # Geraete-Info aus ETS-Projekt anhaengen (analog GA-Detail).
        devices = await discover_knx_devices(request.app["hass"])
        device = devices.get(dev_source)
        result["device"] = device
        result["manufacturer_hints"] = (
            lookup_manufacturer_hints(device.get("manufacturer", ""))
            if device is not None
            else None
        )
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

    async def get(self, request: web.Request, ga: str) -> web.Response:
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
        ga = validate_knx_ga(ga)
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


class KnxStatsHeatmapView(RequireAdminView):
    """Iter 91 / WR-G: Heatmap-Endpoint fuer GA x Zeit.

    Endpoint: GET /api/messagehub/knx-stats/heatmap?from=&to=&top_n=10&bucket=60
    """

    url = "/api/messagehub/knx-stats/heatmap"
    name = "api:messagehub:knx-stats:heatmap"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        svc = _service(request.app["hass"])
        if svc is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        from_iso, to_iso = parse_iso_period(
            request.query, default_days=DEFAULT_KNX_STATS_PERIOD_DAYS
        )
        top_n = parse_int_param(
            request.query, "top_n", 10, min_value=1, max_value=30
        )
        bucket = parse_int_param(
            request.query,
            "bucket",
            60,
            min_value=1,
            max_value=_HARD_BUCKET_MIN,
        )
        return self.json(
            await svc.compute_heatmap(
                from_iso, to_iso, top_n=top_n, bucket_minutes=bucket
            )
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
        # Iter aiohttp-error-ZU9UA / Trend-Fix B+C: max_days auf
        # Counter-Retention setzen — der Service waehlt ab 48h die
        # Counter-Tabelle als Datenquelle und kann damit auch
        # 7d/30d/365d-Perioden bedienen.
        from_iso, to_iso = parse_iso_period(
            request.query,
            default_days=DEFAULT_KNX_STATS_PERIOD_DAYS,
            max_days=DEFAULT_KNX_COUNTER_RETENTION_DAYS,
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
        # Iter 87 / P2-2: Alarm-Schwellen aus Config-Flow-Options
        # auslesen, fallback auf hardcoded Defaults. Query-Param-Override
        # gewinnt (fuer Frontend-Tests + manuelle Overrides).
        from ..const import (  # noqa: PLC0415
            OPT_KNX_ALARM_BUSLOAD_PCT,
            OPT_KNX_ALARM_REPEAT_RATE_PCT,
            OPT_KNX_ALARM_SILENCE_COUNT,
        )

        opts = _first_entry_options(request.app["hass"])
        opt_busload = float(opts.get(OPT_KNX_ALARM_BUSLOAD_PCT, KNX_ALARM_BUSLOAD_PCT_DEFAULT))
        opt_repeat = float(
            opts.get(OPT_KNX_ALARM_REPEAT_RATE_PCT, KNX_ALARM_REPEAT_RATE_PCT_DEFAULT)
        )
        opt_silence = int(
            opts.get(OPT_KNX_ALARM_SILENCE_COUNT, KNX_ALARM_SILENCE_COUNT_DEFAULT)
        )
        try:
            busload_th = float(request.query.get("busload_threshold", opt_busload))
            repeat_th = float(request.query.get("repeat_threshold", opt_repeat))
        except (ValueError, TypeError) as err:
            raise web.HTTPBadRequest(reason="invalid threshold") from err
        silence_th = parse_int_param(
            request.query,
            "silence_threshold",
            opt_silence,
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
        # Iter UX-1.0: ETS-Discovery fuer den silence_alarm-Detail-
        # Block. Lazy-Import wie an anderen Stellen, damit der View-
        # Modul-Import HA-frei testbar bleibt.
        from ..processing.knx_discovery import discover_knx_devices  # noqa: PLC0415
        ets_devices = await discover_knx_devices(request.app["hass"])
        alarms = await svc.evaluate_alarms(
            from_iso,
            to_iso,
            busload_pct_threshold=busload_th,
            repeat_rate_pct_threshold=repeat_th,
            silence_count_threshold=silence_th,
            max_silence_minutes=max_silence,
            ets_devices=ets_devices,
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
        from ..processing.knx_discovery import discover_knx_devices  # noqa: PLC0415

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
        # Iter UX-1.0: Geraetename + GAs anreichern, damit das Frontend
        # die Stille-Liste analog zur Top-Geraete-Tabelle rendern kann
        # und der Alarm-Banner aufklappbare GA-Listen zeigen kann.
        svc = _service(request.app["hass"])
        if svc is not None:
            ets_devices = await discover_knx_devices(request.app["hass"])
            rows = await svc.enrich_silence_with_devices(
                rows,
                from_iso=from_iso,
                to_iso=to_iso,
                ets_devices=ets_devices,
            )
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

    async def post(self, request: web.Request, ga: str) -> web.Response:
        return await self._toggle(request, ga, sensitive=True)

    async def delete(self, request: web.Request, ga: str) -> web.Response:
        return await self._toggle(request, ga, sensitive=False)

    async def _toggle(self, request: web.Request, ga: str, *, sensitive: bool) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        ga = validate_knx_ga(ga)
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
    """Iter 12 (QS-a): Wiederhol-Quote ueber den Zeitraum + Top-GAs.

    Iter topn-3: liest `limit` aus der Query (Default 20 fuer Backwards-
    Compat, Max 500 wie die anderen Top-N-Endpunkte) und reicht ihn an
    `bus_health_per_ga` durch — vorher hardcoded 20, sodass der UI-
    Card-Selektor topNBusHealth keinen Effekt hatte.
    """

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
        limit = parse_int_param(
            request.query, "limit", 20, min_value=1, max_value=_HARD_TOP_LIMIT
        )
        repo = KnxStatsRepository(db)
        summary = await repo.bus_health(from_iso, to_iso)
        per_ga = await repo.bus_health_per_ga(from_iso, to_iso, limit=limit)
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

    async def delete(self, request: web.Request, ga: str) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        ga = validate_knx_ga(ga)
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


# =============================================================================
# Iter L1.3 — Recommendation-Endpoint
# =============================================================================
#
# Eigener Endpoint statt Embedding ins Source-Detail, damit:
# - Source-Detail-Latency unbeeinflusst bleibt (Recommendation rechnet
#   ggf. mehrere zusaetzliche Repo-Queries pro GA, und der Drawer-Open
#   soll nicht warten);
# - Frontend lazy laden kann (Card kollabiert by default);
# - eigenes In-Memory-Caching pro (dev_source, period_hash) moeglich
#   ist, ohne den Source-Detail-Cache anzufassen.
#
# Sicherheit:
# - RequireAdminView, _check_admin, validate_knx_individual_address
# - parse_iso_period mit max_days=DEFAULT_KNX_COUNTER_RETENTION_DAYS (Counter
#   reicht weit zurueck — wir wollen Long-Term-Periodizitaet erlauben)
# - TokenBucketLimiter pro dev_source (capacity 10, refill 10/min) —
#   schuetzt vor Drawer-Open-Loops und parallelen Browser-Tabs.
#
# KEIN Audit-Log: Read-only-Compute ohne externe Folgen. Layer-4-LLM-
# Aufrufe in zukuenftigen Iter werden separat audit-geloggt.

_recommendation_limiter = TokenBucketLimiter(capacity=10.0, refill_per_minute=10.0)
_recommendation_cache = RecommendationCache()


class KnxStatsSourceRecommendationView(RequireAdminView):
    """Iter L1.3 (Sprint Recommendations): Geraete-Empfehlung.

    URL: /api/messagehub/knx-stats/source/{dev_source}/recommendation
         ?from=ISO&to=ISO

    Antworten:
    - 200: vollstaendige DeviceRecommendation (siehe
      ``device_recommendation_to_dict``)
    - 400: ungueltige dev_source oder Period
    - 404: Geraet hat im Zeitraum keine Telegramme (analog Source-Detail)
    - 429: Rate-Limit ueberschritten
    - 503: Service nicht initialisiert (DB fehlt)
    """

    url = "/api/messagehub/knx-stats/source/{dev_source}/recommendation"
    name = "api:messagehub:knx-stats:source-recommendation"

    async def get(self, request: web.Request, dev_source: str) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        dev_source = validate_knx_individual_address(dev_source)
        from_iso, to_iso = parse_iso_period(
            request.query,
            default_days=DEFAULT_KNX_STATS_PERIOD_DAYS,
            max_days=DEFAULT_KNX_COUNTER_RETENTION_DAYS,
        )
        if not _recommendation_limiter.allow(f"reco:{dev_source}"):
            return web.json_response(
                {"message": "rate limit exceeded — bitte etwas warten"},
                status=429,
                headers={"Retry-After": "10"},
            )
        cache_key = f"{dev_source}:{from_iso}:{to_iso}"
        cached = _recommendation_cache.get(cache_key)
        if cached is not None:
            return self.json(cached)
        repo = KnxStatsRepository(db)
        devices_repo = KnxDeviceRepository(db)
        # Iter L3.1: FindingsRepository fuer Layer-3-Override.
        from ..storage.findings_repo import FindingsRepository  # noqa: PLC0415
        findings_repo = FindingsRepository(db)
        # Iter L2.5: ETS-Discovery als Layer-2-Default. User-Override
        # (knx_devices) hat trotzdem Vorrang im Service-Pfad.
        from ..processing.knx_discovery import discover_knx_devices  # noqa: PLC0415
        ets_devices = await discover_knx_devices(request.app["hass"])
        # Iter L4.2: optionalen LLM-Provider laden (default Stub).
        from ..processing.openai_chat_provider import OpenAIChatProvider  # noqa: PLC0415
        from ..processing.recommendation_settings import (  # noqa: PLC0415
            load_provider_config,
            stub_provider,
        )
        from ..storage.recommendation_cache_repo import (  # noqa: PLC0415
            RecommendationCacheRepository,
        )
        from ..storage.settings_repo import SettingsRepository  # noqa: PLC0415

        config = await load_provider_config(SettingsRepository(db))
        if config.enabled:
            llm_provider = OpenAIChatProvider(config)
            llm_cache_repo = RecommendationCacheRepository(db)
        else:
            llm_provider = stub_provider()
            llm_cache_repo = None
        reco = await compute_device_recommendation(
            repo, dev_source, from_iso, to_iso,
            devices_repo=devices_repo,
            ets_devices=ets_devices,
            findings_repo=findings_repo,
            llm_provider=llm_provider,
            llm_cache_repo=llm_cache_repo,
            llm_provider_name=getattr(llm_provider, "name", "stub"),
            llm_model=config.model,
        )
        if reco is None:
            return self.json_message(ERR_NOT_FOUND, status_code=404)
        result = device_recommendation_to_dict(reco)
        result["from"] = from_iso
        result["to"] = to_iso
        _recommendation_cache.set(cache_key, result)
        return self.json(result)


# =============================================================================
# Iter L2.3 — Pflege-API fuer KNX-Geraete-Profile
# =============================================================================
#
# Sicherheits-Pyramide:
# - RequireAdminView + _check_admin auf jeder Methode (GET/PUT/DELETE)
# - validate_knx_individual_address auf dev_source-Path-Param
# - validate_note auf manufacturer/model/notes (max 200 chars,
#   nicht-string -> None)
# - Audit-Log via _audit fuer PUT (knx_device_set) und DELETE
#   (knx_device_clear)
#
# Iter L2.5: Pflegepfad ist ein User-Override. Default-Quelle fuer
# Hersteller/Modell ist die ETS-Discovery (`discover_knx_devices`),
# die im GET-Response als ``ets``-Block mitgeliefert wird.
# `knx_devices`-Tabelle ist nur fuer Edge-Cases noetig:
# - User will eine andere Bezeichnung als ETS (Glob-Match-Tuning)
# - ETS-Werte fehlen / ETS-Projekt nicht geladen
# - eigene Notes (gibt es in ETS nicht)


class KnxDeviceListView(RequireAdminView):
    """Iter L2.3: Liste aller Geraete-Profile."""

    url = "/api/messagehub/knx-devices"
    name = "api:messagehub:knx-devices:list"

    async def get(self, request: web.Request) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        repo = KnxDeviceRepository(db)
        items = await repo.list_all()
        return self.json({"items": items, "count": len(items)})


class KnxDeviceDetailView(RequireAdminView):
    """Iter L2.3: GET/PUT/DELETE pro Geraet.

    GET: Eintrag (oder 404). Bei 404 liefert die View zusaetzlich einen
    optionalen `inferred`-Block, falls die Auto-Inferenz aus den Live-
    GA-Labels einen plausiblen Hersteller findet.

    PUT: Body {manufacturer?, model?, notes?}. Empty-String loescht das
    Feld zu NULL. Audit-Log `knx_device_set`.

    DELETE: Idempotent. Audit-Log `knx_device_clear`.
    """

    url = "/api/messagehub/knx-devices/{dev_source}"
    name = "api:messagehub:knx-devices:detail"

    async def get(
        self, request: web.Request, dev_source: str,
    ) -> web.Response:
        from ..processing.knx_discovery import discover_knx_devices  # noqa: PLC0415

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        dev_source = validate_knx_individual_address(dev_source)
        repo = KnxDeviceRepository(db)
        entry = await repo.get(dev_source)
        # Iter L2.5: ETS-Discovery als Default-Quelle. Kein Auto-
        # Inferenz aus Labels mehr — ETS ist die kanonische Quelle,
        # hat schon Hersteller + Produkt direkt aus dem KNX-Projekt.
        ets_devices = await discover_knx_devices(request.app["hass"])
        ets_entry = ets_devices.get(dev_source)
        ets_block: dict[str, Any] | None = None
        if ets_entry is not None and (
            ets_entry.get("manufacturer") or ets_entry.get("product")
        ):
            ets_block = {
                "manufacturer": (
                    str(ets_entry.get("manufacturer") or "").strip() or None
                ),
                "model": (
                    str(ets_entry.get("product") or "").strip() or None
                ),
                "name": (
                    str(ets_entry.get("name") or "").strip() or None
                ),
            }
        if entry is not None:
            entry["ets"] = ets_block
            return self.json(entry)
        body: dict[str, Any] = {
            "dev_source": dev_source,
            "manufacturer": None,
            "model": None,
            "notes": None,
            "last_seen": None,
            "created_at": None,
            "updated_at": None,
            "ets": ets_block,
        }
        return self.json(body)

    async def put(
        self, request: web.Request, dev_source: str,
    ) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        dev_source = validate_knx_individual_address(dev_source)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(ERR_INVALID_JSON, status_code=400)
        if not isinstance(data, dict):
            return self.json_message(ERR_INVALID_JSON, status_code=400)
        manufacturer = validate_note(data.get("manufacturer"), max_length=200)
        model = validate_note(data.get("model"), max_length=200)
        notes = validate_note(data.get("notes"), max_length=1000)
        repo = KnxDeviceRepository(db)
        result = await repo.upsert(
            dev_source=dev_source,
            manufacturer=manufacturer if "manufacturer" in data else None,
            model=model if "model" in data else None,
            notes=notes if "notes" in data else None,
        )
        await audit(
            request.app["hass"],
            request,
            action="knx_device_set",
            target_type="knx_device",
            target_id=dev_source,
            details={
                "manufacturer": result["manufacturer"],
                "model": result["model"],
            },
        )
        # Recommendation-Cache fuer dieses Geraet flushen — naechster
        # Drawer-Open zeigt direkt das aktualisierte Profil.
        _flush_recommendation_cache_for(dev_source)
        return self.json(result)

    async def delete(
        self, request: web.Request, dev_source: str,
    ) -> web.Response:
        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        dev_source = validate_knx_individual_address(dev_source)
        repo = KnxDeviceRepository(db)
        ok = await repo.delete(dev_source)
        if not ok:
            return self.json_message(ERR_NOT_FOUND, status_code=404)
        await audit(
            request.app["hass"],
            request,
            action="knx_device_clear",
            target_type="knx_device",
            target_id=dev_source,
        )
        _flush_recommendation_cache_for(dev_source)
        return self.json({"ok": True, "dev_source": dev_source})


# =============================================================================
# Iter L4.1 — LLM-Provider-Settings-API
# =============================================================================


class KnxRecommendationLlmSettingsView(RequireAdminView):
    """GET/PUT der LLM-Provider-Konfiguration.

    GET liefert die aktuellen Settings OHNE den API-Key (nur ein
    `api_key_set`-Boolean). PUT akzeptiert
    `{enabled, base_url, model, api_key?, timeout_s?, max_tokens?,
    system_prompt_override?}`. ``api_key`` ist optional — wenn nicht
    mitgegeben, bleibt der bestehende Schluessel im Store.

    Sicherheits-Pyramide:
    - RequireAdminView, _check_admin
    - URL-Schema-Whitelist (http/https) via load/save-Helpers
    - validate_note auf alle string-Felder (max-Length-Schutz)
    - Audit-Log knx_recommend_llm_settings_set
    - API-Key wird im Audit-Log NICHT mitgeloggt (details enthaelt
      nur ``api_key_set: bool``)
    - PUT flusht den persistenten LLM-Cache, weil Provider-Wechsel
      alle Cache-Eintraege invalidiert.
    """

    url = "/api/messagehub/knx-recommend/llm-settings"
    name = "api:messagehub:knx-recommend:llm-settings"

    async def get(self, request: web.Request) -> web.Response:
        from ..processing.recommendation_settings import (  # noqa: PLC0415
            load_provider_config,
            redact_for_response,
        )
        from ..storage.settings_repo import SettingsRepository  # noqa: PLC0415

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        config = await load_provider_config(SettingsRepository(db))
        return self.json(redact_for_response(config))

    async def put(self, request: web.Request) -> web.Response:
        from ..processing.recommendation_settings import (  # noqa: PLC0415
            DEFAULT_LLM_MAX_TOKENS,
            DEFAULT_LLM_TIMEOUT_S,
            load_provider_config,
            redact_for_response,
            save_provider_config,
        )
        from ..storage.recommendation_cache_repo import (  # noqa: PLC0415
            RecommendationCacheRepository,
        )
        from ..storage.settings_repo import SettingsRepository  # noqa: PLC0415

        self._check_admin(request)
        db = get_database(request.app["hass"])
        if db is None:
            return self.json_message(ERR_NOT_INITIALISED, status_code=503)
        try:
            data = await request.json()
        except (ValueError, TypeError):
            return self.json_message(ERR_INVALID_JSON, status_code=400)
        if not isinstance(data, dict):
            return self.json_message(ERR_INVALID_JSON, status_code=400)
        enabled = bool(data.get("enabled", False))
        base_url = validate_note(data.get("base_url"), max_length=500) or ""
        model = validate_note(data.get("model"), max_length=200) or ""
        # API-Key-Sonderfall: nicht mitgegeben → bestehender Wert bleibt
        # erhalten. Leerstring → leeres Setting (User loescht den Key).
        api_key_raw = data.get("api_key")
        if api_key_raw is None:
            api_key_value: str | None = None
        else:
            api_key_value = (
                validate_note(api_key_raw, max_length=2000) or ""
            )
        timeout_raw = data.get("timeout_s")
        timeout_s = (
            float(timeout_raw)
            if isinstance(timeout_raw, (int, float))
            else DEFAULT_LLM_TIMEOUT_S
        )
        max_tokens_raw = data.get("max_tokens")
        max_tokens = (
            int(max_tokens_raw)
            if isinstance(max_tokens_raw, int)
            else DEFAULT_LLM_MAX_TOKENS
        )
        system_prompt = (
            validate_note(data.get("system_prompt_override"), max_length=4000)
            or ""
        )
        try:
            await save_provider_config(
                SettingsRepository(db),
                enabled=enabled,
                base_url=base_url,
                model=model,
                api_key=api_key_value,
                timeout_s=timeout_s,
                max_tokens=max_tokens,
                system_prompt_override=system_prompt,
            )
        except ValueError as err:
            return self.json_message(str(err), status_code=400)
        # Persistenten LLM-Cache flushen — Provider-Wechsel invalidiert.
        await RecommendationCacheRepository(db).clear()
        # In-Memory-Recommendation-Cache komplett flushen
        # (alle Eintraege, weil Layer-4-Antworten an den Provider
        # gebunden sind).
        _recommendation_cache.clear()
        config = await load_provider_config(SettingsRepository(db))
        await audit(
            request.app["hass"],
            request,
            action="knx_recommend_llm_settings_set",
            target_type="knx_recommend_llm",
            target_id="settings",
            details={
                "enabled": config.enabled,
                "base_url": config.base_url,
                "model": config.model,
                "api_key_set": bool(config.api_key),
            },
        )
        return self.json(redact_for_response(config))


def _flush_recommendation_cache_for(dev_source: str) -> None:
    """Loescht alle Cache-Eintraege, die zu einem dev_source gehoeren.

    Cache-Keys sind ``{dev_source}:{from}:{to}`` — wir muessen den ganzen
    Cache iterieren, weil from/to variabel sind. Bei < 200 Eintraegen
    (Cache-max_entries) ist das O(n) und vernachlaessigbar.
    """
    prefix = f"{dev_source}:"
    keys_to_drop = [
        k for k in list(_recommendation_cache._store.keys())  # noqa: SLF001
        if k.startswith(prefix)
    ]
    for k in keys_to_drop:
        _recommendation_cache._store.pop(k, None)  # noqa: SLF001


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
    hass.http.register_view(KnxStatsSourceRecommendationView())
    hass.http.register_view(KnxDeviceListView())
    hass.http.register_view(KnxDeviceDetailView())
    hass.http.register_view(KnxRecommendationLlmSettingsView())
