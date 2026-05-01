-- Iter 26: Dedup-Spalten und Iter 28: Status-Lifecycle.

ALTER TABLE messages ADD COLUMN fingerprint TEXT;
ALTER TABLE messages ADD COLUMN count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE messages ADD COLUMN first_seen TEXT;
ALTER TABLE messages ADD COLUMN last_seen TEXT;
ALTER TABLE messages ADD COLUMN status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'acknowledged', 'resolved', 'expired'));

CREATE INDEX IF NOT EXISTS idx_messages_fingerprint ON messages (fingerprint);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status, timestamp DESC);
