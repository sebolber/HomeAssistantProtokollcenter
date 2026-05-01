-- Iter 36: persistierter EWMA-State.

CREATE TABLE IF NOT EXISTS source_metrics (
    source         TEXT PRIMARY KEY,
    ewma_rate      REAL NOT NULL DEFAULT 0.0,
    ewma_variance  REAL NOT NULL DEFAULT 1.0,
    last_bucket    TEXT,
    samples        INTEGER NOT NULL DEFAULT 0
);
