-- Iter 34: Korrelations-IDs / Trace-Gruppen.
ALTER TABLE messages ADD COLUMN trace_id TEXT;
CREATE INDEX IF NOT EXISTS idx_messages_trace_id ON messages (trace_id);
