"""KNX-Stats-Service (Iter 5): orchestriert Repo + Engine.

Verbindet Storage-Aggregate mit der Recommendation-Engine, dem
Anti-Pattern-Detector und der Buslast-Schaetzung. Wird vom HTTP-API-
Layer und (spaeter) von Alarm-Regeln benutzt.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from .knx_stats import (
    Finding,
    Recommendation,
    TelegramSample,
    build_recommendation,
    classify_severity,
    detect_patterns,
    recommended_rate_for,
)

if TYPE_CHECKING:
    from ..storage.knx_stats_repo import KnxStatsRepository


# Bus-Last-Konstanten — siehe Konzept §2.1 / §5.4.
_AVG_TELEGRAM_BITS: float = 22.0 * 8.0  # 22 Byte ~ Standardtelegramm
_TP1_BITRATE: float = 9600.0


@dataclass(frozen=True, slots=True)
class TopRow:
    """Eine Zeile fuer die Top-Sender-Tabelle, post-classified."""

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


@dataclass(frozen=True, slots=True)
class GaDetail:
    """Detail-Sicht einer GA inkl. Recommendation + Findings."""

    ga: str
    dpt: str | None
    label: str | None
    count: int
    rate_per_min: float
    recommended_rate: float
    recommendation: Recommendation
    findings: list[Finding]


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

        out: list[TopRow] = []
        for row in rows:
            rate = row["count"] / minutes
            if rate < min_rate_per_min:
                continue
            ga = row["ga"]
            is_ack = ga in ack_set
            if not include_acknowledged and is_ack:
                continue
            recommended = recommended_rate_for(row["dpt"])
            out.append(
                TopRow(
                    ga=ga,
                    dpt=row["dpt"],
                    label=row["label"],
                    dev_source=row["dev_source"],
                    count=row["count"],
                    rate_per_min=round(rate, 2),
                    recommended_rate=recommended,
                    ratio=_safe_ratio(rate, recommended),
                    severity=classify_severity(rate, recommended),
                    acknowledged=is_ack,
                )
            )
        return out

    async def compute_ga_detail(self, ga: str, from_iso: str, to_iso: str) -> GaDetail | None:
        samples_raw = await self._repo.ga_samples(ga, from_iso, to_iso)
        if not samples_raw:
            return None
        # Bestimme dpt+label aus erster Top-Row mit dieser GA
        # (effizienter waere ein separates Statement, aber wir sparen
        # uns die zweite Query — die Sampling-Liste enthaelt dpt nicht).
        first_dpt: str | None = None
        first_label: str | None = None
        # Als Fallback laden wir 1 row aus top_by_ga — nicht ideal,
        # aber GAs sind Strings, dpt+label sind in messages.metadata.
        # Wir extrahieren sie aus der ersten Row.
        # Schneller: ein dedizierter SELECT mit ga-Filter.
        ga_row = await self._fetch_ga_meta(ga, from_iso, to_iso)
        if ga_row is not None:
            first_dpt = ga_row.get("dpt")
            first_label = ga_row.get("label")

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
        return GaDetail(
            ga=ga,
            dpt=first_dpt,
            label=first_label,
            count=len(samples),
            rate_per_min=round(rate, 2),
            recommended_rate=recommended,
            recommendation=rec,
            findings=findings,
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


def _safe_ratio(rate: float, recommended: float) -> float:
    if recommended <= 0.0:
        return float("inf") if rate > 0.0 else 0.0
    return rate / recommended


# Public helpers fuer JSON-Serialisierung im API-Layer
def top_row_to_dict(row: TopRow) -> dict[str, Any]:
    return asdict(row)


def ga_detail_to_dict(detail: GaDetail) -> dict[str, Any]:
    return {
        "ga": detail.ga,
        "dpt": detail.dpt,
        "label": detail.label,
        "count": detail.count,
        "rate_per_min": detail.rate_per_min,
        "recommended_rate": detail.recommended_rate,
        "recommendation": asdict(detail.recommendation),
        "findings": [asdict(f) for f in detail.findings],
    }
