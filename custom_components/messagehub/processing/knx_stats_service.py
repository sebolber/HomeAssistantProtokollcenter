"""KNX-Stats-Service (Iter 5): orchestriert Repo + Engine.

Verbindet Storage-Aggregate mit der Recommendation-Engine, dem
Anti-Pattern-Detector und der Buslast-Schaetzung. Wird vom HTTP-API-
Layer und (spaeter) von Alarm-Regeln benutzt.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from dataclasses import field as dataclass_field
from datetime import UTC, datetime, timedelta
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
    from ..storage.findings_repo import FindingsRepository
    from ..storage.knx_stats_repo import KnxStatsRepository
    from .findings import Finding as PersistedFinding


# Bus-Last-Konstanten zentral aus const.py — Iter 36 vereint die alte
# Schaetzung (22 Byte ohne Pause) mit dem ETS-konformen Modell, das den
# Inter-Frame-Overhead (50 + 15 Bit Pause) mitrechnet (~200 Bit/Telegramm).
_AVG_TELEGRAM_BITS: float = float(KNX_AVG_TELEGRAM_BITS)
_TP1_BITRATE: float = float(KNX_TP_BAUDRATE_BPS)

# Iter aiohttp-error-ZU9UA / Trend-Fix B+C + UX-P3.6: Schwellwert in
# Minuten, ab dem compute_trend die Counter-Tabelle statt Raw-Telegramme
# nutzt.
#
# Anfangs auf 2880 (48h) gesetzt — die Raw-Retention. Aber bei genau
# 24h liegt die Vorperiode (24-48h zurueck) am Rand der Retention; je
# nach Cleanup-Timing ist sie teilweise oder ganz ausgeraeumt. Das
# fuehrt zu unterschaetztem total_prev und damit kuenstlich aufgeblasenen
# %-Anstiegen.
#
# Loesung (Iter 6): Schwelle auf 1440 (24h) senken. Counter hat
# hourly-Granularitaet — bei 24h-Aggregaten ist das verlustfrei. 1h/6h
# bleiben bei Raw (sub-stuendliche Praezision noetig fuer kurze
# Perioden, prev_period max 12h zurueck = sicher in Retention).
_TREND_COUNTER_THRESHOLD_MIN: int = 1440


def _hour_align_period(from_iso: str, to_iso: str) -> tuple[str, str]:
    """Rundet Periodengrenzen auf Stunden-Buckets, kompatibel zum
    Listener-Format (`%Y-%m-%dT%H:00:00`, ohne Timezone-Suffix).

    - from: floor (Anfang der enthaltenden Stunde)
    - to:   ceil  (Anfang der ersten ausschliessenden Stunde)

    Damit deckt das resultierende Intervall die gesamte ueberlappende
    Stundenmenge ab, sodass kein Counter-Bucket ausgelassen wird.
    """
    from_dt = datetime.fromisoformat(from_iso)
    to_dt = datetime.fromisoformat(to_iso)
    floor = from_dt.replace(minute=0, second=0, microsecond=0)
    ceil = to_dt.replace(minute=0, second=0, microsecond=0)
    if to_dt != ceil:
        ceil = ceil + timedelta(hours=1)
    fmt = "%Y-%m-%dT%H:00:00"
    return floor.strftime(fmt), ceil.strftime(fmt)


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
class TrendRow:
    """Iter 67 / WR-I: Eine Zeile fuer den Trend-Vergleich.

    Zeigt fuer eine GA, wieviel Telegramme in der aktuellen Periode
    angefallen sind und wie das Verhaeltnis zur Vorperiode (gleicher
    Laenge) ist. delta_pct=None wenn Vorperiode 0 (Division durch 0
    waere irrefuehrend); UI zeigt das als "neu".
    """

    ga: str
    label: str | None
    dpt: str | None
    count_now: int
    count_prev: int
    delta_abs: int
    delta_pct: float | None


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


@dataclass(frozen=True, slots=True)
class SourceGaSummary:
    """Iter B (knx-detail-panes): pro GA eines Geraets im Source-Detail.

    Schlankere Sicht als TopRow — kein dpt_inferred, keine
    Findings-Aggregation pro GA (separate findings-Liste auf Source-
    Ebene). Acknowledged-Status mitliefern, damit die UI Bulk-Ack
    intelligent rendern kann.
    """

    ga: str
    label: str | None
    dpt: str | None
    count: int
    rate_per_min: float
    recommended_rate: float
    ratio: float
    severity: str
    acknowledged: bool
    last_seen: str | None


@dataclass(frozen=True, slots=True)
class SourceDetail:
    """Iter B (knx-detail-panes): Detail-Sicht einer Source-Adresse.

    Anker fuer Top-Geraete und Stille-Alarme. Aggregiert KPIs des
    Geraets (Total/Bus-Anteil/Wiederhol-Quote/last_seen) plus die
    Liste seiner GAs mit Severity-Klassifikation.

    Iter H: findings-Liste (persistierte Detector-Findings dieser
    Source). Default leere Liste, wenn der Service ohne FindingsRepo
    konstruiert wurde — Backwards-kompatibel zu Iter B-Tests.

    Trend kommt in Iter I dazu.
    """

    dev_source: str
    total_count: int
    ga_count: int
    share_pct: float
    last_seen: str | None
    silent_minutes: float | None
    silent_alarm: bool
    repeat_ratio_pct: float
    gas: list[SourceGaSummary]
    findings: list[PersistedFinding] = dataclass_field(default_factory=list)


# Iter B (knx-detail-panes): Defaults fuer Source-Detail.
#
# Silence-Schwelle: spiegelt den Default des /alarms-Endpoints (1440 Min
# = 24 h). Konservativ — viele Geraete haben Tag/Nacht-Pausen, kuerzere
# Schwellen wuerden False-Positives erzeugen.
SOURCE_DETAIL_DEFAULT_SILENCE_MINUTES: int = 1440

# Hard-Cap fuer GA-Liste in der Source-Detail-Antwort. Schuetzt vor
# Geraeten mit hunderten von GAs (z. B. zentrale Logik-Module). Die
# Top-N nach Telegramm-Anzahl reichen fuer die UI; wer mehr braucht,
# soll den Endpoint mehrfach mit Period-Filtern aufrufen.
SOURCE_DETAIL_GA_HARD_CAP: int = 100


def _silent_minutes_from(
    last_seen_iso: str | None,
    *,
    now: datetime,
) -> float | None:
    """Liefert Silent-Minutes zwischen `now` und `last_seen_iso` oder None.

    Defensiv gegenueber kaputten ts-Strings: liefert None statt zu
    crashen. SQLite kann sowohl `+00:00`- als auch naive-Strings
    liefern (Mix aus eigenen Inserts und externen Tools); wir
    normalisieren beide Seiten zu naive UTC vor der Subtraktion.
    """
    if not last_seen_iso:
        return None
    try:
        last_seen = datetime.fromisoformat(last_seen_iso)
    except ValueError:
        return None
    last_seen_naive = (
        last_seen.replace(tzinfo=None)
        if last_seen.tzinfo is not None
        else last_seen
    )
    now_naive = now.replace(tzinfo=None) if now.tzinfo is not None else now
    delta_seconds = (now_naive - last_seen_naive).total_seconds()
    if delta_seconds < 0:
        return 0.0
    return round(delta_seconds / 60.0, 1)


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

    def __init__(
        self,
        repo: KnxStatsRepository,
        *,
        findings_repo: FindingsRepository | None = None,
    ) -> None:
        # Iter H (knx-detail-panes): findings_repo optional, damit
        # bestehende Aufrufer (Tests, andere Endpoints, Iter A-G) ohne
        # Refactor weiter funktionieren. Source-Detail liefert dann
        # `findings=[]` statt zu crashen.
        self._repo = repo
        self._findings_repo = findings_repo

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
        # Iter 77 / CR-23: compute_top in Helper-Methoden zerlegt, um
        # Cognitive-Complexity unter 15 zu halten. Filter-First-Phase
        # (CR-12): Filter VOR dem teuren Bulk-Sample-Lookup, sonst
        # holen wir Samples auch fuer GAs, die durch min_rate
        # rausfliegen.
        rows = await self._repo.top_by_ga(from_iso, to_iso, limit=limit)
        from_dt = datetime.fromisoformat(from_iso)
        to_dt = datetime.fromisoformat(to_iso)
        minutes = _period_minutes(from_dt, to_dt)
        ack_set = await self._repo.ack_active_set()

        survivors = self._filter_top_rows(
            rows,
            minutes=minutes,
            min_rate_per_min=min_rate_per_min,
            include_acknowledged=include_acknowledged,
            ack_set=ack_set,
        )
        inferred_map, findings_set = await self._enrich_top_samples(
            survivors, from_iso, to_iso
        )
        return [
            self._build_top_row(
                row,
                minutes=minutes,
                ack_set=ack_set,
                inferred_map=inferred_map,
                findings_set=findings_set,
            )
            for row in survivors
        ]

    @staticmethod
    def _filter_top_rows(
        rows: list[dict[str, Any]],
        *,
        minutes: float,
        min_rate_per_min: float,
        include_acknowledged: bool,
        ack_set: set[str],
    ) -> list[dict[str, Any]]:
        """Filter-First: rate + ack-Filter VOR dem Bulk-Sample-Lookup."""
        out: list[dict[str, Any]] = []
        for row in rows:
            rate = row["count"] / minutes
            if rate < min_rate_per_min:
                continue
            if not include_acknowledged and row["ga"] in ack_set:
                continue
            out.append(row)
        return out

    async def _enrich_top_samples(
        self,
        survivors: list[dict[str, Any]],
        from_iso: str,
        to_iso: str,
    ) -> tuple[dict[str, str], set[str]]:
        """Iter 77 / CR-12: Bulk-Sample-Lookup nur fuer survivors. DPT-
        Inferenz nur fuer GAs ohne DPT (sonst kein Erkenntnisgewinn);
        Anti-Pattern-Check fuer ALLE survivors (Konstant-Spam tritt
        auch mit korrektem DPT auf).
        """
        if not survivors:
            return {}, set()
        gas_for_dpt_infer = [r["ga"] for r in survivors if not r.get("dpt")][:200]
        all_gas = [r["ga"] for r in survivors][:200]
        # Wenn nichts zu inferieren UND keine Findings noetig — gibts
        # nichts. Aktuell holen wir aber immer fuer Anti-Pattern.
        if not all_gas:
            return {}, set()
        samples_map = await self._repo.bulk_values_for_dpt_infer(
            all_gas, from_iso, to_iso, per_ga_limit=30
        )
        inferred_map: dict[str, str] = {}
        findings_set: set[str] = set()
        for ga, samples in samples_map.items():
            if ga in gas_for_dpt_infer:
                guessed = infer_dpt_from_samples(samples)
                if guessed is not None:
                    inferred_map[ga] = guessed
            if has_anti_pattern_in_samples(samples):
                findings_set.add(ga)
        return inferred_map, findings_set

    @staticmethod
    def _build_top_row(
        row: dict[str, Any],
        *,
        minutes: float,
        ack_set: set[str],
        inferred_map: dict[str, str],
        findings_set: set[str],
    ) -> TopRow:
        ga = row["ga"]
        rate = row["count"] / minutes
        row_dpt = row["dpt"]
        dpt_inferred = False
        if not row_dpt and ga in inferred_map:
            row_dpt = inferred_map[ga]
            dpt_inferred = True
        recommended = recommended_rate_for(row_dpt)
        return TopRow(
            ga=ga,
            dpt=row_dpt,
            label=row["label"],
            dev_source=row["dev_source"],
            count=row["count"],
            rate_per_min=round(rate, 2),
            recommended_rate=recommended,
            ratio=safe_ratio(rate, recommended),
            severity=classify_severity(rate, recommended),
            acknowledged=ga in ack_set,
            dpt_inferred=dpt_inferred,
            has_findings=ga in findings_set,
        )

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

    # ------------------------------------------------------------------
    # Iter B (knx-detail-panes): Source-Detail-Sicht.
    # ------------------------------------------------------------------

    async def compute_source_detail(
        self,
        dev_source: str,
        from_iso: str,
        to_iso: str,
        *,
        max_silence_minutes: int = SOURCE_DETAIL_DEFAULT_SILENCE_MINUTES,
        ga_limit: int = SOURCE_DETAIL_GA_HARD_CAP,
    ) -> SourceDetail | None:
        """Aggregiert Source-Detail-Sicht fuer Top-Geraete + Stille-Alarme.

        Bei `dev_source` ohne Telegramme im Period: liefert None
        (View antwortet 404). Bei mindestens einem GA-Eintrag:
        SourceDetail mit KPIs + GA-Liste sortiert nach Telegramm-Anzahl.

        Performance:
        - 4 SQL-Queries (gas_for_source, last_seen, count, repeat_ratio)
          + 1 ack_active_set + 1 summary-Total — alle indexiert.
        - GA-Liste hard-capped auf ga_limit (Default 100), damit ein
          Geraet mit hunderten GAs den Roundtrip nicht sprengt.
        - Pro GA werden Rate/Severity in Python berechnet (keine
          zusaetzlichen Queries).
        """
        if not dev_source:
            return None
        ga_rows = await self._repo.gas_for_source(
            dev_source, from_iso, to_iso, limit=ga_limit,
        )
        if not ga_rows:
            return None
        from_dt = datetime.fromisoformat(from_iso)
        to_dt = datetime.fromisoformat(to_iso)
        minutes = _period_minutes(from_dt, to_dt)
        last_seen = await self._repo.last_seen_for_source(dev_source)
        total_count = await self._repo.count_for_source(
            dev_source, from_iso, to_iso,
        )
        repeat_ratio = await self._repo.repeat_ratio_for_source(
            dev_source, from_iso, to_iso,
        )
        period_summary = await self._repo.summary(from_iso, to_iso)
        period_total = int(period_summary.get("total_telegrams", 0))
        ack_set = await self._repo.ack_active_set()

        gas = [
            self._build_source_ga_summary(
                row=row, minutes=minutes, ack_set=ack_set,
            )
            for row in ga_rows
        ]
        share_pct = (
            (total_count / period_total * 100.0) if period_total > 0 else 0.0
        )
        silent_minutes = _silent_minutes_from(last_seen, now=datetime.now(UTC))
        silent_alarm = (
            silent_minutes is not None
            and silent_minutes > max_silence_minutes
        )
        # Iter H (knx-detail-panes): Findings dieser Source mitliefern.
        # Limit 200 spiegelt das Default des Findings-Endpoints; bei
        # Geraeten mit >200 Findings ist die UI ohnehin ueberladen, der
        # User soll dann ueber den Findings-Tab mit Filtern arbeiten.
        findings: list[PersistedFinding]
        if self._findings_repo is not None:
            findings = await self._findings_repo.list_findings(
                source=dev_source, limit=200,
            )
        else:
            findings = []
        return SourceDetail(
            dev_source=dev_source,
            total_count=total_count,
            ga_count=len(ga_rows),
            share_pct=round(share_pct, 2),
            last_seen=last_seen,
            silent_minutes=silent_minutes,
            silent_alarm=silent_alarm,
            repeat_ratio_pct=float(repeat_ratio["ratio_pct"]),
            gas=gas,
            findings=findings,
        )

    @staticmethod
    def _build_source_ga_summary(
        *,
        row: dict[str, Any],
        minutes: float,
        ack_set: set[str],
    ) -> SourceGaSummary:
        ga = str(row["ga"])
        count = int(row["count"])
        rate = (count / minutes) if minutes > 0 else 0.0
        dpt = row.get("dpt")
        recommended = recommended_rate_for(dpt)
        return SourceGaSummary(
            ga=ga,
            label=row.get("label"),
            dpt=dpt,
            count=count,
            rate_per_min=round(rate, 2),
            recommended_rate=recommended,
            ratio=safe_ratio(rate, recommended),
            severity=classify_severity(rate, recommended),
            acknowledged=ga in ack_set,
            last_seen=row.get("last_seen"),
        )

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

    async def compute_heatmap(
        self,
        from_iso: str,
        to_iso: str,
        *,
        top_n: int = 10,
        bucket_minutes: int = 60,
    ) -> dict[str, Any]:
        """Iter 91 / WR-G: Heatmap-Daten — Top-N GAs x Bucket-Zeitachse.

        Liefert eine 2D-Matrix:
          {
            "gas": [{ga, label, total}],     # Top-N nach Total-Count
            "buckets": [iso_string],         # Zeit-Achse
            "matrix": [[count_ij]],          # gas x buckets
            "from", "to", "bucket_minutes"
          }

        Hard-Cap: top_n <= 30, bucket_minutes 1..60 (mit Konsistenz zu
        timeline-Endpoint).
        """
        top_n = max(1, min(top_n, 30))
        bucket_minutes = max(1, min(bucket_minutes, 60))
        # 1) Top-N GAs nach Total-Count waehlen.
        top_rows = await self._repo.top_by_ga(from_iso, to_iso, limit=top_n)
        gas = [r["ga"] for r in top_rows]
        if not gas:
            return {
                "from": from_iso,
                "to": to_iso,
                "bucket_minutes": bucket_minutes,
                "gas": [],
                "buckets": [],
                "matrix": [],
            }

        # 2) Timeline-Daten fuer diese GAs abfragen.
        timeline_rows = await self._repo.timeline(
            from_iso, to_iso, gas=gas, bucket_minutes=bucket_minutes
        )
        # 3) Matrix bauen: gas-Index x bucket-Index -> count.
        bucket_set: set[str] = set()
        per_ga: dict[str, dict[str, int]] = {ga: {} for ga in gas}
        for row in timeline_rows:
            ga = row["ga"]
            bucket = row["bucket"]
            bucket_set.add(bucket)
            per_ga.setdefault(ga, {})[bucket] = int(row["count"])
        buckets = sorted(bucket_set)
        matrix: list[list[int]] = []
        for ga in gas:
            row_counts = per_ga.get(ga, {})
            matrix.append([row_counts.get(b, 0) for b in buckets])
        gas_meta = [
            {
                "ga": r["ga"],
                "label": r["label"],
                "total": int(r["count"]),
            }
            for r in top_rows
        ]
        return {
            "from": from_iso,
            "to": to_iso,
            "bucket_minutes": bucket_minutes,
            "gas": gas_meta,
            "buckets": buckets,
            "matrix": matrix,
        }

    async def compute_trend(
        self,
        from_iso: str,
        to_iso: str,
        *,
        top_n: int = 10,
    ) -> dict[str, Any]:
        """Iter 67 / WR-I: Trend-Vergleich zur Vorperiode.

        Zeitfenster: aktuelle Periode (from..to), Vorperiode in der
        gleichen Laenge unmittelbar davor.

        Liefert:
        - period_minutes: int — Laenge der Periode in Minuten,
        - total_now / total_prev / delta_pct,
        - top_increase: TrendRow[] (groesste Anstiege absolute),
        - top_decrease: TrendRow[] (groesste Abnahmen absolute).

        Anstiege mit count_prev=0 sind delta_pct=None ("neu"); werden
        bei top_increase einsortiert sofern count_now >= 1, mit
        delta_abs als Sortier-Schluessel.
        """
        from_dt = datetime.fromisoformat(from_iso)
        to_dt = datetime.fromisoformat(to_iso)
        delta = to_dt - from_dt
        prev_from = (from_dt - delta).isoformat()
        prev_to = from_iso

        # Iter aiohttp-error-ZU9UA / Trend-Fix B+C: Datenquelle nach
        # Periodenlaenge waehlen. Raw-Telegramme leben nur 48h, also
        # liegt bei Perioden >= 48h die Vorperiode (48-96h zurueck oder
        # weiter) komplett ausserhalb. Counter-Tabelle hat 365d
        # Retention + Per-GA-Aggregation und ist ab 48h die richtige
        # Wahl. Schwellwert 48h = 2880 Min.
        period_minutes = max(0, int(delta.total_seconds() // 60))
        if period_minutes >= _TREND_COUNTER_THRESHOLD_MIN:
            now_floor, now_ceil = _hour_align_period(from_iso, to_iso)
            prev_floor, prev_ceil = _hour_align_period(prev_from, prev_to)
            rows_now = await self._repo.total_by_ga_for_period_from_counter(
                now_floor, now_ceil
            )
            rows_prev = await self._repo.total_by_ga_for_period_from_counter(
                prev_floor, prev_ceil
            )
        else:
            rows_now = await self._repo.total_by_ga_for_period(from_iso, to_iso)
            rows_prev = await self._repo.total_by_ga_for_period(prev_from, prev_to)

        prev_by_ga = {r["ga"]: r["count"] for r in rows_prev}
        now_total = sum(r["count"] for r in rows_now)
        prev_total = sum(r["count"] for r in rows_prev)

        trend_rows: list[TrendRow] = []
        seen_now: set[str] = set()
        for r in rows_now:
            ga = r["ga"]
            seen_now.add(ga)
            count_now = int(r["count"])
            count_prev = int(prev_by_ga.get(ga, 0))
            delta_abs = count_now - count_prev
            delta_pct: float | None = (
                None
                if count_prev == 0
                else round((delta_abs / count_prev) * 100.0, 1)
            )
            trend_rows.append(
                TrendRow(
                    ga=ga,
                    label=r.get("label"),
                    dpt=r.get("dpt"),
                    count_now=count_now,
                    count_prev=count_prev,
                    delta_abs=delta_abs,
                    delta_pct=delta_pct,
                )
            )
        # GAs, die nur in der Vorperiode auftauchen (komplett verstummt).
        for r in rows_prev:
            ga = r["ga"]
            if ga in seen_now:
                continue
            count_prev = int(r["count"])
            trend_rows.append(
                TrendRow(
                    ga=ga,
                    label=r.get("label"),
                    dpt=r.get("dpt"),
                    count_now=0,
                    count_prev=count_prev,
                    delta_abs=-count_prev,
                    delta_pct=-100.0,
                )
            )

        top_n = max(1, min(top_n, 50))
        top_increase = sorted(
            (t for t in trend_rows if t.delta_abs > 0),
            key=lambda t: t.delta_abs,
            reverse=True,
        )[:top_n]
        top_decrease = sorted(
            (t for t in trend_rows if t.delta_abs < 0),
            key=lambda t: t.delta_abs,
        )[:top_n]

        if prev_total == 0:
            total_delta_pct: float | None = None
        else:
            total_delta_pct = round(
                ((now_total - prev_total) / prev_total) * 100.0, 1
            )
        return {
            "from": from_iso,
            "to": to_iso,
            "prev_from": prev_from,
            "prev_to": prev_to,
            "period_minutes": period_minutes,
            "total_now": now_total,
            "total_prev": prev_total,
            "total_delta_abs": now_total - prev_total,
            "total_delta_pct": total_delta_pct,
            "top_increase": [asdict(t) for t in top_increase],
            "top_decrease": [asdict(t) for t in top_decrease],
        }

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
        """Iter 73 / CR-8: Holt dpt+label+count fuer eine einzelne GA.

        Vorher: `top_by_ga(limit=500)` mit Linear-Scan in Python — eine
        teure Aggregat-Query nur um EINE GA zu finden. Jetzt: dedizierte
        Repo-Methode `ga_meta_for_period` mit `WHERE r.destination = ?`,
        die direkt das richtige Tupel liefert.
        """
        return await self._repo.ga_meta_for_period(ga, from_iso, to_iso)


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


def source_detail_to_dict(detail: SourceDetail) -> dict[str, Any]:
    """Iter B (knx-detail-panes): SourceDetail -> JSON-Response-Dict.

    Iter H: findings via Finding.to_dict serialisieren (nicht asdict —
    Finding.to_dict konvertiert datetime nach ISO).
    """
    return {
        "dev_source": detail.dev_source,
        "total_count": detail.total_count,
        "ga_count": detail.ga_count,
        "share_pct": detail.share_pct,
        "last_seen": detail.last_seen,
        "silent_minutes": detail.silent_minutes,
        "silent_alarm": detail.silent_alarm,
        "repeat_ratio_pct": detail.repeat_ratio_pct,
        "gas": [asdict(g) for g in detail.gas],
        "findings": [f.to_dict() for f in detail.findings],
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
