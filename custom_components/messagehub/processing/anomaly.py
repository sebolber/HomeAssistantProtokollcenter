"""Iter 36: EWMA-basierte Anomalie-Erkennung pro Source."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..storage import Database


ALPHA = 0.3
SIGMA_FACTOR = 3.0


@dataclass(slots=True)
class SourceMetric:
    source: str
    ewma_rate: float = 0.0
    ewma_variance: float = 1.0
    last_bucket: str | None = None
    samples: int = 0


def update(metric: SourceMetric, count_in_bucket: int) -> SourceMetric:
    """Aktualisiert EWMA von rate und variance mit dem neuen Bucket-Wert."""
    delta = count_in_bucket - metric.ewma_rate
    new_rate = metric.ewma_rate + ALPHA * delta
    new_var = (1 - ALPHA) * (metric.ewma_variance + ALPHA * delta * delta)
    return SourceMetric(
        source=metric.source,
        ewma_rate=new_rate,
        ewma_variance=max(new_var, 0.01),
        last_bucket=metric.last_bucket,
        samples=metric.samples + 1,
    )


def is_anomaly(metric: SourceMetric, count_in_bucket: int) -> bool:
    """True, wenn count_in_bucket > mean + 3*stddev und genug Samples vorhanden."""
    min_samples = 10
    if metric.samples < min_samples:
        return False
    stddev = metric.ewma_variance**0.5
    threshold = metric.ewma_rate + SIGMA_FACTOR * stddev
    return count_in_bucket > threshold


class SourceMetricsRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    async def get(self, source: str) -> SourceMetric:
        row = await self._db.fetch_one("SELECT * FROM source_metrics WHERE source = ?", (source,))
        if row is None:
            return SourceMetric(source=source)
        return SourceMetric(
            source=source,
            ewma_rate=float(row["ewma_rate"]),
            ewma_variance=float(row["ewma_variance"]),
            last_bucket=row["last_bucket"],
            samples=int(row["samples"]),
        )

    async def save(self, metric: SourceMetric) -> None:
        await self._db.execute(
            """
            INSERT INTO source_metrics (source, ewma_rate, ewma_variance, last_bucket, samples)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(source) DO UPDATE SET
                ewma_rate = excluded.ewma_rate,
                ewma_variance = excluded.ewma_variance,
                last_bucket = excluded.last_bucket,
                samples = excluded.samples
            """,
            (
                metric.source,
                metric.ewma_rate,
                metric.ewma_variance,
                metric.last_bucket,
                metric.samples,
            ),
        )
