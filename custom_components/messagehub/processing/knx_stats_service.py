"""KNX-Stats-Service (Iter 5): orchestriert Repo + Engine.

Verbindet Storage-Aggregate mit der Recommendation-Engine, dem
Anti-Pattern-Detector und der Buslast-Schaetzung. Wird vom HTTP-API-
Layer und (spaeter) von Alarm-Regeln benutzt.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from ..const import (
    KNX_AVG_TELEGRAM_BITS,
    KNX_BUSLOAD_DEFAULT_BUCKET_SECONDS,
    KNX_BUSLOAD_MAX_BUCKET_SECONDS,
    KNX_BUSLOAD_MIN_BUCKET_SECONDS,
    KNX_TP_BAUDRATE_BPS,
)
from .knx_stats import (
    Finding,
    HealthScoreInput,
    Recommendation,
    TelegramSample,
    build_recommendation,
    classify_severity,
    compute_health_score,
    detect_patterns,
    has_anti_pattern_in_samples,
    infer_dpt_from_samples,
    recommended_rate_for,
    safe_ratio,
)

if TYPE_CHECKING:
    from ..storage.knx_stats_repo import KnxStatsRepository


# Bus-Last-Konstanten zentral aus const.py — Iter 36 vereint die alte
# Schaetzung (22 Byte ohne Pause) mit dem ETS-konformen Modell, das den
# Inter-Frame-Overhead (50 + 15 Bit Pause) mitrechnet (~200 Bit/Telegramm).
_AVG_TELEGRAM_BITS: float = float(KNX_AVG_TELEGRAM_BITS)
_TP1_BITRATE: float = float(KNX_TP_BAUDRATE_BPS)


@dataclass(frozen=True, slots=True)
class TopRow:
    """Eine Zeile fuer die Top-Sender-Tabelle, post-classified.

    Iter 62 / WR-T: `dpt_inferred=True` markiert, dass der DPT nicht aus
    dem ETS-Projekt stammt, sondern aus den Sample-Werten geraten wurde
    (siehe `infer_dpt_from_samples`). Frontend zeigt das mit Tooltip
    "geraten aus Werten".

    Iter 63 / U13: `has_findings=True` markiert eine erkannte
    Auffaelligkeit (heute: Konstant-Wert-Spam >= 5 identische Samples).
    Volle Findings-Liste ist im Detail-Pane verfuegbar.
    """

    ga: str
    dpt: str | None
    label: str | None
    dev_source: str
    count: int
    rate_per_min: float
    recommended_rate: float
    ratio: float
    severity: str
    acknowledged: bool
    dpt_inferred: bool = False
    has_findings: bool = False


@dataclass(frozen=True, slots=True)
class SiblingGa:
    """Eine andere GA des selben Geraets — fuer Detail-Pane-Liste."""

    ga: str
    label: str | None
    count: int
    rate_per_min: float


@dataclass(frozen=True, slots=True)
class GaDetail:
    """Detail-Sicht einer GA inkl. Recommendation + Findings + Siblings."""

    ga: str
    dpt: str | None
    label: str | None
    dev_source: str
    count: int
    rate_per_min: float
    recommended_rate: float
    recommendation: Recommendation
    findings: list[Finding]
    sibling_gas: list[SiblingGa]
    value_history: list[dict[str, Any]]


def estimate_busload_pct(total_telegrams: int, period_seconds: float) -> float:
    """Schaetzt die Buslast in Prozent ueber den Zeitraum."""
    if period_seconds <= 0.0 or total_telegrams <= 0:
        return 0.0
    rate_per_sec = total_telegrams / period_seconds
    return rate_per_sec * _AVG_TELEGRAM_BITS / _TP1_BITRATE * 100.0


def _period_minutes(from_dt: datetime, to_dt: datetime) -> float:
    delta = (to_dt - from_dt).total_seconds() / 60.0
    return max(delta, 1.0 / 60.0)  # mind. 1 Sekunde, gegen DivByZero


class KnxStatsService:
    """Orchestriert die Aggregat-Logik fuer den KNX-Stats-Tab."""

    def __init__(self, repo: KnxStatsRepository) -> None:
        self._repo = repo

    # --- Buslast-Zeitreihe (Iter 36, Feature A) -----------------------------

    @staticmethod
    def compute_busload_summary(series: list[dict[str, Any]]) -> dict[str, Any]:
        """Aggregiert eine Bucket-Zeitreihe zur Single-Glance-KPI.

        - current_pct: Buslast im juengsten Bucket (oder 0.0 wenn leer)
        - max_pct: groesste Buslast in der Zeitreihe
        - avg_pct: arithmetisches Mittel ueber alle Buckets
        - total_telegrams: Summe ueber die Periode
        - buckets: Anzahl Buckets mit Telegrammen
        """
        if not series:
            return {
                "current_pct": 0.0,
                "max_pct": 0.0,
                "avg_pct": 0.0,
                "total_telegrams": 0,
                "buckets": 0,
            }
        pcts = [float(b["busload_pct"]) for b in series]
        total_t = sum(int(b["telegrams"]) for b in series)
        return {
            "current_pct": round(pcts[-1], 2),
            "max_pct": round(max(pcts), 2),
            "avg_pct": round(sum(pcts) / len(pcts), 2),
            "total_telegrams": total_t,
            "buckets": len(series),
        }

    async def busload(
        self,
        from_iso: str,
        to_iso: str,
        *,
        bucket_seconds: int = KNX_BUSLOAD_DEFAULT_BUCKET_SECONDS,
    ) -> dict[str, Any]:
        """Liefert Buslast-Zeitreihe + aggregierte Summary fuer den Tab.

        DoS-Schutz: bucket_seconds wird in
        [KNX_BUSLOAD_MIN_BUCKET_SECONDS, KNX_BUSLOAD_MAX_BUCKET_SECONDS]
        geclippt — verhindert 1-Sek-Buckets ueber 90 Tage (~7.7M Buckets).
        """
        bs = max(
            KNX_BUSLOAD_MIN_BUCKET_SECONDS,
            min(int(bucket_seconds), KNX_BUSLOAD_MAX_BUCKET_SECONDS),
        )
        series = await self._repo.busload_timeseries(from_iso, to_iso, bucket_seconds=bs)
        return {
            "from": from_iso,
            "to": to_iso,
            "bucket_seconds": bs,
            "summary": self.compute_busload_summary(series),
            "series": series,
        }

    async def compute_summary(self, from_iso: str, to_iso: str) -> dict[str, Any]:
        from_dt = datetime.fromisoformat(from_iso)
        to_dt = datetime.fromisoformat(to_iso)
        s = await self._repo.summary(from_iso, to_iso)
        period_sec = max(0.0, (to_dt - from_dt).total_seconds())
        busload = estimate_busload_pct(s["total_telegrams"], period_sec)

        # Klassifizierungs-Counts via Top-Liste — eine Query mehr, aber
        # reusable (Top wird sowieso fuer den Tab geladen).
        top_rows = await self.compute_top(from_iso, to_iso, limit=500, include_acknowledged=True)
        counts = {"green": 0, "yellow": 0, "orange": 0, "red": 0}
        for row in top_rows:
            counts[row.severity] = counts.get(row.severity, 0) + 1

        return {
            "from": from_iso,
            "to": to_iso,
            "total_telegrams": s["total_telegrams"],
            "active_gas": s["active_gas"],
            "active_devices": s["active_devices"],
            "estimated_busload_pct": round(busload, 2),
            "counts_by_severity": counts,
        }

    async def compute_top(
        self,
        from_iso: str,
        to_iso: str,
        *,
        limit: int = 50,
        min_rate_per_min: float = 0.0,
        include_acknowledged: bool = True,
    ) -> list[TopRow]:
        rows = await self._repo.top_by_ga(from_iso, to_iso, limit=limit)
        from_dt = datetime.fromisoformat(from_iso)
        to_dt = datetime.fromisoformat(to_iso)
        minutes = _period_minutes(from_dt, to_dt)
        ack_set = await self._repo.ack_active_set()

        # Iter 62 / WR-T + Iter 63 / U13: Bulk-Sample-Lookup fuer
        # DPT-Inferenz UND Anti-Pattern-Lightweight-Check. Beide nutzen
        # dieselben 30 letzten Werte pro GA — kostet nur eine zusaetzliche
        # Query gegenueber dem Top-Listen-Lookup.
        # GAs ohne DPT bekommen Inferenz; ALLE Top-GAs bekommen den
        # Anti-Pattern-Check (Konstant-Wert-Spam tritt auch bei
        # gepflegten DPTs auf — Hörmann-Tor mit DPT 9.x sendet 0).
        all_top_gas = [r["ga"] for r in rows][:200]
        inferred_map: dict[str, str] = {}
        findings_set: set[str] = set()
        if all_top_gas:
            samples_map = await self._repo.bulk_values_for_dpt_infer(
                all_top_gas, from_iso, to_iso, per_ga_limit=30
            )
            for ga, samples in samples_map.items():
                guessed = infer_dpt_from_samples(samples)
                if guessed is not None:
                    inferred_map[ga] = guessed
                if has_anti_pattern_in_samples(samples):
                    findings_set.add(ga)

        out: list[TopRow] = []
        for row in rows:
            rate = row["count"] / minutes
            if rate < min_rate_per_min:
                continue
            ga = row["ga"]
            is_ack = ga in ack_set
            if not include_acknowledged and is_ack:
                continue
            row_dpt = row["dpt"]
            dpt_inferred = False
            if not row_dpt and ga in inferred_map:
                row_dpt = inferred_map[ga]
                dpt_inferred = True
            recommended = recommended_rate_for(row_dpt)
            out.append(
                TopRow(
                    ga=ga,
                    dpt=row_dpt,
                    label=row["label"],
                    dev_source=row["dev_source"],
                    count=row["count"],
                    rate_per_min=round(rate, 2),
                    recommended_rate=recommended,
                    ratio=safe_ratio(rate, recommended),
                    severity=classify_severity(rate, recommended),
                    acknowledged=is_ack,
                    dpt_inferred=dpt_inferred,
                    has_findings=ga in findings_set,
                )
            )
        return out

    async def compute_ga_detail(self, ga: str, from_iso: str, to_iso: str) -> GaDetail | None:
        samples_raw = await self._repo.ga_samples(ga, from_iso, to_iso)
        if not samples_raw:
            return None
        ga_row = await self._fetch_ga_meta(ga, from_iso, to_iso)
        first_dpt: str | None = ga_row.get("dpt") if ga_row else None
        first_label: str | None = ga_row.get("label") if ga_row else None
        # Source-Adresse aus den Samples: typischerweise dieselbe in
        # allen Eintraegen (1 Geraet sendet auf 1 GA).
        dev_source = samples_raw[0].get("dev_source", "") if samples_raw else ""

        samples = [
            TelegramSample(
                ts=datetime.fromisoformat(s["ts"]),
                value=s["value"],
                telegramtype=s["telegramtype"],
                source=s["dev_source"],
            )
            for s in samples_raw
        ]
        from_dt = datetime.fromisoformat(from_iso)
        to_dt = datetime.fromisoformat(to_iso)
        minutes = _period_minutes(from_dt, to_dt)
        rate = len(samples) / minutes
        recommended = recommended_rate_for(first_dpt)
        rec = build_recommendation(dpt=first_dpt, rate=rate, recommended=recommended)
        findings = detect_patterns(samples, dpt=first_dpt)

        # Iter 29: Sibling-GAs derselben Source-Adresse, ausser uns selbst.
        sibling_gas = await self._fetch_siblings(dev_source, ga, from_iso, to_iso, minutes)
        # Iter 31-vorbereitend: Wertverlauf — Down-Sampled auf max 200
        # Punkte fuer Sparkline; immer chronologisch.
        value_history = _downsample_value_history(samples_raw, max_points=200)

        return GaDetail(
            ga=ga,
            dpt=first_dpt,
            label=first_label,
            dev_source=dev_source,
            count=len(samples),
            rate_per_min=round(rate, 2),
            recommended_rate=recommended,
            recommendation=rec,
            findings=findings,
            sibling_gas=sibling_gas,
            value_history=value_history,
        )

    async def _fetch_siblings(
        self,
        dev_source: str,
        own_ga: str,
        from_iso: str,
        to_iso: str,
        minutes: float,
    ) -> list[SiblingGa]:
        if not dev_source:
            return []
        rows = await self._repo.gas_for_source(dev_source, from_iso, to_iso, limit=20)
        return [
            SiblingGa(
                ga=str(row["ga"]),
                label=row.get("label"),
                count=int(row["count"]),
                rate_per_min=round(int(row["count"]) / minutes, 2),
            )
            for row in rows
            if row["ga"] != own_ga
        ]

    async def compute_timeline(
        self,
        from_iso: str,
        to_iso: str,
        *,
        gas: list[str],
        bucket_minutes: int = 10,
    ) -> list[dict[str, Any]]:
        return await self._repo.timeline(from_iso, to_iso, gas=gas, bucket_minutes=bucket_minutes)

    # --- Sensitive-Log (Iter 42, Feature N) ---------------------------------

    async def sensitive_log(
        self,
        *,
        from_iso: str,
        to_iso: str,
        limit: int = 200,
    ) -> dict[str, Any]:
        """Liefert sensitive GA-Liste + Telegramm-Stream im Zeitraum.

        Wird sowohl vom Stats-Tab (Sektion "Sicherheits-Audit") als auch
        zukuenftig von einem Sensor/Notification-Channel genutzt.
        """
        addresses = await self._repo.sensitive_addresses()
        telegrams = await self._repo.sensitive_telegrams(from_iso, to_iso, limit=limit)
        return {
            "from": from_iso,
            "to": to_iso,
            "addresses": addresses,
            "telegrams": telegrams,
        }

    # --- Burst-Detector (Iter 40, Feature C) --------------------------------

    BURST_DEFAULT_WINDOW_S: int = 5
    BURST_DEFAULT_THRESHOLD_PCT: float = 30.0
    BURST_MIN_THRESHOLD_PCT: float = 1.0
    BURST_MAX_THRESHOLD_PCT: float = 100.0
    BURST_DEFAULT_LIMIT: int = 50

    async def bursts(
        self,
        *,
        from_iso: str,
        to_iso: str,
        window_seconds: int | None = None,
        threshold_pct: float | None = None,
        limit: int | None = None,
    ) -> dict[str, Any]:
        """Findet kurze Telegrammfluten oberhalb threshold_pct Buslast.

        Defaults gemaess Best-Practice: 5s-Fenster, 30% als 'auffaellig'-
        Schwelle (KNX-Praxis: dauerhafte > 30% sind ungewoehnlich; kurze
        Spitzen wie Sonnenautomatik treten haeufig auf).
        """
        ws = max(1, int(window_seconds or self.BURST_DEFAULT_WINDOW_S))
        thr = float(
            threshold_pct if threshold_pct is not None else self.BURST_DEFAULT_THRESHOLD_PCT
        )
        thr = max(self.BURST_MIN_THRESHOLD_PCT, min(self.BURST_MAX_THRESHOLD_PCT, thr))
        lim = max(1, int(limit or self.BURST_DEFAULT_LIMIT))
        bursts = await self._repo.burst_detect(
            from_iso,
            to_iso,
            window_seconds=ws,
            threshold_pct=thr,
            limit=lim,
        )
        return {
            "from": from_iso,
            "to": to_iso,
            "window_seconds": ws,
            "threshold_pct": thr,
            "bursts": bursts,
        }

    # --- Long-Term-Sicht (Iter 38, Feature B+J) -----------------------------

    # Heuristik-Schwelle (Tage), ab der die Long-Term-Sicht von Hour-Buckets
    # auf Day-Buckets umschaltet. Bei 14 Tagen waeren das 336 Hour-Buckets
    # — zu viele Punkte fuer eine UI-Sparkline; ab da Tagesaufloesung.
    LONG_TERM_AUTO_DAY_THRESHOLD: int = 14

    @staticmethod
    def _resolve_long_term_bucket(from_iso: str, to_iso: str, requested: str) -> str:
        """Waehlt 'hour' fuer kurze Perioden, 'day' fuer lange.

        - "auto": Heuristik nach Periodendauer.
        - "hour"/"day": Caller-Override (durch repo defensiv geclamped).
        """
        if requested in {"hour", "day"}:
            return requested
        from_dt = datetime.fromisoformat(from_iso)
        to_dt = datetime.fromisoformat(to_iso)
        days = max(0.0, (to_dt - from_dt).total_seconds() / 86400.0)
        return "day" if days > KnxStatsService.LONG_TERM_AUTO_DAY_THRESHOLD else "hour"

    async def long_term_view(
        self,
        *,
        from_iso: str,
        to_iso: str,
        top_limit: int = 50,
        bucket: str = "auto",
        gas: list[str] | None = None,
    ) -> dict[str, Any]:
        """Aggregiert Counter-Tabelle fuer Perioden > 48h (degradierter Modus).

        Liefert Total + Top-GAs + bucketierte Zeitreihe. Hat KEINE Source-
        Adressen, KEINE Werteverlaeufe — Counter-Tabelle speichert nur
        ga + hour_bucket + count.
        """
        resolved_bucket = self._resolve_long_term_bucket(from_iso, to_iso, bucket)
        total = await self._repo.counter_total(from_iso, to_iso)
        top_gas = await self._repo.counter_top_gas(from_iso, to_iso, limit=top_limit)
        series = await self._repo.counter_timeseries(
            from_iso, to_iso, bucket=resolved_bucket, gas=gas
        )
        return {
            "from": from_iso,
            "to": to_iso,
            "bucket": resolved_bucket,
            "total": total,
            "top_gas": top_gas,
            "series": series,
        }

    # --- Bus-Health-Score (Iter 37, Feature K) ------------------------------

    async def health_score(
        self,
        from_iso: str,
        to_iso: str,
        *,
        now_iso: str,
        max_silence_minutes: int,
    ) -> dict[str, Any]:
        """Aggregiert die vier KPIs zu einem 0..100-Score + Findings.

        Verwendet als Buslast-Wert die Spitze (max_pct) aus dem 10s/60s-
        Bucketing — fuer kurze Bursts (Sturm-Telegramme) ist die Spitze
        aussagekraeftiger als der Period-Avg.
        """
        bus_h = await self._repo.bus_health(from_iso, to_iso)
        busload = await self.busload(from_iso, to_iso)
        silence_rows = await self._repo.silence_detect(
            from_iso,
            to_iso,
            now_iso=now_iso,
            max_silence_minutes=max_silence_minutes,
        )
        silent_devices = sum(1 for r in silence_rows if r["alarm"])
        # Open-Alarms haben wir hier nicht direkt — die werden im
        # /alarms-Endpoint gegen User-Schwellen evaluiert. Fuer den Score
        # zaehlen wir aktuell die "stumm laenger als Limit"-Geraete; die
        # zwei anderen Default-Regeln (bus_load_above, repeat_rate_above)
        # gehen bereits ueber repeat_ratio_pct + busload_max_pct in den
        # Score ein, also waeren sie hier doppelt. Iter 37: open_alarms=0,
        # Iter 42 erweitert um echte ack-pflichtige Alarme.
        result = compute_health_score(
            HealthScoreInput(
                repeat_ratio_pct=float(bus_h["ratio_pct"]),
                busload_max_pct=float(busload["summary"]["max_pct"]),
                silent_devices=silent_devices,
                open_alarms=0,
            )
        )
        result["from"] = from_iso
        result["to"] = to_iso
        return result

    async def evaluate_alarms(
        self,
        from_iso: str,
        to_iso: str,
        *,
        busload_pct_threshold: float,
        repeat_rate_pct_threshold: float,
        silence_count_threshold: int,
        max_silence_minutes: int,
    ) -> list[dict[str, Any]]:
        """Iter 15 (QS-l): wertet drei Default-Alarm-Regeln aus.

        Liefert eine Liste von Alarmen, jeweils mit `rule`, `triggered`,
        `actual`, `threshold`, `message`. UI/Eventbus-Code nutzt nur die
        triggered=True-Eintraege.

        Schwellwerte werden vom Aufrufer hereingegeben — der API-Layer
        kann sie aus Config-Flow-Options lesen.
        """
        _dt = datetime  # alias to keep diff small

        summary = await self._repo.summary(from_iso, to_iso)
        bus_health = await self._repo.bus_health(from_iso, to_iso)
        # Periode in Sek fuer Buslast-Schaetzung wiederverwenden
        from_dt = _dt.fromisoformat(from_iso)
        to_dt = _dt.fromisoformat(to_iso)
        period_sec = max(0.0, (to_dt - from_dt).total_seconds())
        busload = estimate_busload_pct(summary["total_telegrams"], period_sec)

        now_iso = _dt.now(UTC).isoformat(timespec="seconds")
        silence_rows = await self._repo.silence_detect(
            from_iso,
            to_iso,
            now_iso=now_iso,
            max_silence_minutes=max_silence_minutes,
        )
        silence_alarms = sum(1 for r in silence_rows if r["alarm"])

        return [
            {
                "rule": "bus_load_above",
                "triggered": busload > busload_pct_threshold,
                "actual": round(busload, 2),
                "threshold": busload_pct_threshold,
                "unit": "%",
                "message": (
                    f"Geschaetzte Buslast {busload:.1f}% liegt ueber dem "
                    f"Schwellwert von {busload_pct_threshold:.0f}%."
                ),
            },
            {
                "rule": "repeat_rate_above",
                "triggered": bus_health["ratio_pct"] > repeat_rate_pct_threshold,
                "actual": bus_health["ratio_pct"],
                "threshold": repeat_rate_pct_threshold,
                "unit": "%",
                "message": (
                    f"Wiederhol-Quote {bus_health['ratio_pct']:.2f}% liegt "
                    f"ueber dem Schwellwert von {repeat_rate_pct_threshold}%. "
                    f"Hinweis auf Verkabelung/EMV-Stoerung."
                ),
            },
            {
                "rule": "silence_alarm",
                "triggered": silence_alarms >= silence_count_threshold,
                "actual": silence_alarms,
                "threshold": silence_count_threshold,
                "unit": "Geraet(e)",
                "message": (
                    f"{silence_alarms} Geraet(e) haben laenger als "
                    f"{max_silence_minutes} Min nicht gesendet."
                ),
            },
        ]

    async def compute_orphans(
        self,
        from_iso: str,
        to_iso: str,
        *,
        project_gas: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Iter 14 (QS-g): Vergleich Projekt-GAs vs reale Telegramme.

        - missing_in_log: im Projekt definiert, aber im Zeitraum nie gesehen
        - extra_in_log:  im Zeitraum gesehen, aber nicht im Projekt
                        (alter Aktor / nicht dokumentiert / verwaist)

        project_gas erwartet das Discovery-Format
        [{address, name, dpt}, ...].
        """
        rows = await self._repo.top_by_ga(from_iso, to_iso, limit=500)
        seen_addresses = {row["ga"] for row in rows}
        project_addresses = {p["address"] for p in project_gas}

        missing = [
            {
                "address": p["address"],
                "name": p.get("name", ""),
                "dpt": p.get("dpt"),
            }
            for p in project_gas
            if p["address"] not in seen_addresses
        ]
        extra = [
            {
                "address": row["ga"],
                "label": row["label"],
                "count": row["count"],
            }
            for row in rows
            if row["ga"] not in project_addresses
        ]
        return {
            "missing_in_log": missing,
            "extra_in_log": extra,
            "project_total": len(project_addresses),
            "log_total": len(seen_addresses),
        }

    async def _fetch_ga_meta(self, ga: str, from_iso: str, to_iso: str) -> dict[str, Any] | None:
        """Holt dpt+label fuer eine einzelne GA — fuer compute_ga_detail."""
        rows = await self._repo.top_by_ga(from_iso, to_iso, limit=500)
        for row in rows:
            if row["ga"] == ga:
                return row
        return None


# Public helpers fuer JSON-Serialisierung im API-Layer
def top_row_to_dict(row: TopRow) -> dict[str, Any]:
    return asdict(row)


def ga_detail_to_dict(detail: GaDetail) -> dict[str, Any]:
    return {
        "ga": detail.ga,
        "dpt": detail.dpt,
        "label": detail.label,
        "dev_source": detail.dev_source,
        "count": detail.count,
        "rate_per_min": detail.rate_per_min,
        "recommended_rate": detail.recommended_rate,
        "recommendation": asdict(detail.recommendation),
        "findings": [asdict(f) for f in detail.findings],
        "sibling_gas": [asdict(s) for s in detail.sibling_gas],
        "value_history": detail.value_history,
    }


def _downsample_value_history(
    samples: list[dict[str, Any]], *, max_points: int
) -> list[dict[str, Any]]:
    """Down-Sampling fuer die Sparkline. Behaelt Reihenfolge bei.

    Bei <= max_points: alle uebernommen.
    Sonst: gleichmaessig verteilte Subsequenz.
    """
    if max_points <= 0 or len(samples) == 0:
        return []
    if len(samples) <= max_points:
        return [{"ts": s["ts"], "value": s["value"]} for s in samples]
    step = len(samples) / max_points
    out: list[dict[str, Any]] = []
    for i in range(max_points):
        sample = samples[int(i * step)]
        out.append({"ts": sample["ts"], "value": sample["value"]})
    return out
