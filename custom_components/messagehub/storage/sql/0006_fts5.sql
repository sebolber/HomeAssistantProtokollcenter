-- Iter 33: FTS5-Schatten-Tabelle.

CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    text,
    source,
    content='messages',
    content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS messages_fts_ai AFTER INSERT ON messages BEGIN
    INSERT INTO messages_fts (rowid, text, source) VALUES (new.id, new.text, new.source);
END;

CREATE TRIGGER IF NOT EXISTS messages_fts_ad AFTER DELETE ON messages BEGIN
    INSERT INTO messages_fts (messages_fts, rowid, text, source)
    VALUES ('delete', old.id, old.text, old.source);
END;

CREATE TRIGGER IF NOT EXISTS messages_fts_au AFTER UPDATE ON messages BEGIN
    INSERT INTO messages_fts (messages_fts, rowid, text, source)
    VALUES ('delete', old.id, old.text, old.source);
    INSERT INTO messages_fts (rowid, text, source) VALUES (new.id, new.text, new.source);
END;
