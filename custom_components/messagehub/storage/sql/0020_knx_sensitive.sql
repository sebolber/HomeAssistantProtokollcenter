-- Iter 42 (Feature N): Audit-Log fuer sicherheitssensitive GAs.
--
-- Pro KNX-Gruppenadresse koennen Admins ein "is_sensitive"-Flag setzen
-- (z. B. Alarmanlage, Tuerschloss, Tor, Heizungsausfall). Telegramme
-- auf diesen GAs werden nicht zusaetzlich gespeichert — sie leben
-- bereits in knx_raw_telegrams — sondern nur durch JOIN ausgelesen.
--
-- Boolean per INTEGER 0/1, kompatibel mit aelteren SQLite-Versionen.
ALTER TABLE knx_group_addresses
    ADD COLUMN is_sensitive INTEGER NOT NULL DEFAULT 0;

-- Index: typischer Lesepfad ist "alle Telegramme von sensitiven GAs
-- in einem Zeitraum" — hilft der bestehende destination-Index
-- zusammen mit einer Vorab-Liste der sensitiven Adressen.
CREATE INDEX IF NOT EXISTS idx_knx_group_addresses_sensitive
    ON knx_group_addresses (is_sensitive) WHERE is_sensitive = 1;
