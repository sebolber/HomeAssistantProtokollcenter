-- Iter 79 / CR-13: Partieller Index auf knx_ga_acknowledgements.expires_at.
-- ack_active_set filtert per "WHERE expires_at IS NULL OR expires_at >= ?";
-- der NOT-NULL-Branch ist auf grosser Tabelle ein Full-Scan ohne Index.
-- Partieller Index haelt den Index klein (NULL-Eintraege sind eh sticky-Acks).

CREATE INDEX IF NOT EXISTS idx_knx_ga_ack_expires
    ON knx_ga_acknowledgements (expires_at)
    WHERE expires_at IS NOT NULL;
