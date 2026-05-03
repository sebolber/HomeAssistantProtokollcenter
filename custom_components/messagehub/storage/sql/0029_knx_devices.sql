-- Iter L2.0 (Sprint Recommendations / Phase 9): Geraete-Profil pro
-- KNX-Individualadresse fuer Modell-spezifische Empfehlungs-Overrides.
--
-- Quelle: vom User manuell gepflegt (Phase L2.3) oder automatisch
-- inferiert aus den GA-Labels gegen KNX_MANUFACTURER_HINTS (Phase L2.3).
-- ETS-Topologie-Import waere die saubere Loesung (Future Work).
--
-- Modell-Schreibweise: lowercase, ohne Leerzeichen — die Lookup-Logik
-- normalisiert auf demselben Format. CHECK-Constraint fuer das KNX-IA-
-- Pattern (1.1.220 etc.) verhindert Tippfehler im API-Pfad.

CREATE TABLE IF NOT EXISTS knx_devices (
    dev_source   TEXT    PRIMARY KEY
                 CHECK (length(dev_source) BETWEEN 5 AND 11),
    manufacturer TEXT,
    model        TEXT,
    notes        TEXT,           -- optionaler User-Kommentar
    last_seen    TEXT,           -- ISO 8601, vom Listener gepflegt
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);

-- Lookup nach manufacturer + model fuer Modell-Recommendation-Pipeline.
-- Index ist klein (typische Anlagen < 100 Geraete) aber spart einen
-- Full-Scan bei der Aggregation.
CREATE INDEX IF NOT EXISTS idx_knx_devices_manufacturer_model
    ON knx_devices (manufacturer, model);
