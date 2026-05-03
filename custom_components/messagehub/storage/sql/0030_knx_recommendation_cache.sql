-- Iter L4.0 (Sprint Recommendations / Phase 9): SQLite-Cache fuer
-- LLM-basierte Geraete-Empfehlungen.
--
-- Layer 4 ruft optional einen externen LLM-Provider, wenn DPT (Layer 1)
-- und Modell (Layer 2) keinen Treffer hatten. LLM-Antworten sind teuer
-- und stabil — wir cachen sie in dieser Tabelle (Default 30 d TTL).
--
-- Cache-Key: sha256-Hash ueber (provider, model, dpt, manufacturer,
-- device_model, prompt_version) — gleiche Eingaben fuehren zu gleichem
-- Key. So bleiben Antworten stabil zwischen verschiedenen Geraeten
-- mit identischen Merkmalen.
--
-- Audit: jeder Cache-Miss schreibt zusaetzlich einen Audit-Log-Eintrag
-- (in api/knx_stats.py), damit der User-Logfile sieht, wann LLMs
-- aufgerufen wurden — Datenschutz + Cost-Tracking.

CREATE TABLE IF NOT EXISTS knx_recommendation_cache (
    cache_key  TEXT PRIMARY KEY,
    response   TEXT NOT NULL,    -- JSON-Serialisierung der DptRecommendation
    provider   TEXT NOT NULL,    -- "openai_chat" (Iter L4.2) oder zukuenftig
    model      TEXT NOT NULL,    -- konkreter LLM-Modellname
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

-- Cleanup-Pfad: aelteste expirierten Eintraege zuerst.
CREATE INDEX IF NOT EXISTS idx_knx_reco_cache_expires
    ON knx_recommendation_cache (expires_at);
