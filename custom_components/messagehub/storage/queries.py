"""Zentrale SQL-Templates fuer messagehub.

v0.10 (H3): Statt SQL als String-Konkatenation in jedem Modul kommt es
hier rein — wir koennen Queries reviewen, EXPLAIN-en und Index-Use
auswerten ohne 10 Dateien aufzumachen.

Aktuell sind nur die *duplizierten* Statements zentralisiert; weitere
Queries wandern bei Bedarf nach. Alle Statements verwenden gebundene
``?``-Parameter — keine String-Konkatenation, also SQL-Injection-sicher.
"""

from __future__ import annotations

from typing import Final

# messages-Tabelle: gemeinsamer INSERT-Block fuer insert() und
# _insert_in_tx() in storage/repositories.py. Davor war derselbe SQL-Text
# wortwoertlich zweimal im File — Anpassungen an einer Stelle drohten,
# vergessen zu werden.
INSERT_MESSAGE: Final[str] = """
INSERT INTO messages
    (timestamp, severity, source, text, metadata, webhook_id,
     fingerprint, count, first_seen, last_seen, status)
VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'new')
"""

# Aktive Duplikat-Suche im Aggregations-Fenster.
SELECT_ACTIVE_DUPLICATE: Final[str] = """
SELECT id, count FROM messages
WHERE fingerprint = ?
  AND status IN ('new', 'acknowledged')
  AND last_seen >= ?
ORDER BY last_seen DESC
LIMIT 1
"""

UPDATE_MESSAGE_AGGREGATE: Final[str] = "UPDATE messages SET count = ?, last_seen = ? WHERE id = ?"

UPDATE_MESSAGE_STATUS: Final[str] = "UPDATE messages SET status = ? WHERE id = ?"

UPDATE_MESSAGE_SEVERITY: Final[str] = "UPDATE messages SET severity = ? WHERE id = ?"

DELETE_MESSAGE_BY_ID: Final[str] = "DELETE FROM messages WHERE id = ?"
SELECT_MESSAGE_BY_ID: Final[str] = "SELECT * FROM messages WHERE id = ?"
COUNT_MESSAGES: Final[str] = "SELECT COUNT(*) AS cnt FROM messages"
SELECT_DISTINCT_SOURCES: Final[str] = "SELECT DISTINCT source FROM messages ORDER BY source ASC"
