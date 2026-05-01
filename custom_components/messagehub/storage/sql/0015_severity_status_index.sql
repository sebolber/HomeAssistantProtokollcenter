-- Iter 28/29 Performance-Index (Review #3 + #8): Composite-Index fuer
-- count_unacknowledged_errors() und allgemeine Status+Severity-Queries.

CREATE INDEX IF NOT EXISTS idx_messages_severity_status
    ON messages (severity, status, timestamp DESC);
