-- Iter 48 (UI-Variante): KNX-Gruppenadressen aus DB statt CSV.
CREATE TABLE IF NOT EXISTS knx_group_addresses (
    address     TEXT PRIMARY KEY CHECK (length(address) BETWEEN 5 AND 11),
    label       TEXT NOT NULL,
    dpt         TEXT,
    description TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knx_group_addresses_label
    ON knx_group_addresses (label);
