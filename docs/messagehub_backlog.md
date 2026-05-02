# Backlog `messagehub`

**Stand:** 2026-05-02 (nach Iter 68 — alle Bugs B1-B5 + UX U1-U15 +
WR-T/WR-V/WR-P/WR-I/WR-F + P2-3 + U13 sind released).

Sammelt alle nicht erledigten Themen aus den Quell-Dokumenten:
- `messagehub_konzept.md` §14 (Optionale Erweiterungen)
- `messagehub_erweiterungen.md` (Erweiterungs-Roadmap)
- `messagehub_knx_statistik.md` + `…_review.md` (Phase 2)
- UX-Reviews KNX-Bus-Analyse-Tab + KNX-Einstellungen (zwei Runden)
- Webrecherche KNX-Bus-Monitoring (ETS/captureKNX/Foren)

Reihenfolge der Sektionen folgt der Empfehlung zur Abarbeitung.

---

## 0. Manuell (kein Code)

| # | Was | Status |
|---|---|---|
| M1 | Tag `v0.12.0` für Commit `cfe4d4f` | Tag `0.12.9` ist auf `c94870d` (Iter 57) gesetzt — abweichende Versionierung, vom User vermutlich bewusst |
| M2 | Tag für Hotfix `1b83fd6` (KNX-Stats-View-Registrierung) | ✅ als Tag `0.13.0` released |
| M2b | Tag `v0.14.0` für Iter 59-68 (Bugs, UX-Quick-Wins + WR-T/V/P/I/F + P2-3 + U13) — `manifest.json:version` von `0.12.0` auf `0.14.0` bumpen | offen, manuell |
| M3 | PR an `home-assistant/brands` mit `assets/brands/messagehub/` | offen |
| M4 | Repository-Topics + Description auf GitHub-Repo-Settings setzen | offen |
| M5 | Manuell verifizieren: N4-Sync-Vorschau-Dialog | offen |
| M6 | Manuell verifizieren: N2-Default beim Anlegen einer GA → severity = `warning` | offen |

## 1. Erledigt seit Iter 58

Vollständig released im Feature-Branch + main:

| Iter | Inhalt |
|---|---|
| 59 | Bugs B1+B2+B3+B4 (Audit-Detail-Renderer, Status-Pille-Mapping, Timeline-Stroke-Width, Umlaut-Drift) |
| 60 | UX-Quick-Wins Visual: U1, U2, U4, U5, U6, U7, U8, U10, U11, U12 + B2-Nachzug |
| 61 | UX-Quick-Wins Frontend-Logik: U3, U9, U15 + B5 (Realität) |
| 62 | WR-T DPT-Auto-Erkennung aus Werte-Samples (mit Bulk-Lookup) |
| 63 | U13 Anti-Pattern-Badge in Top-Sender-Tabelle |
| 64 | WR-P HA-KNX-Direktlinks im Detail-Pane |
| 65 | P2-3 Rate-Limit für `/knx-stats/alarms` |
| 66 | WR-V Multi-byte-ASCII-Decoder für DPT 16.x |
| 67 | WR-I Trend-Vergleich heute-vs-Vorperiode (neue Card) |
| 68 | WR-F GA-Werteverlauf-Export CSV/JSON |

## 2. Noch offen — Features

### 2a. KNX-Stats Phase-2 (mittel)

| # | Was | Aufwand |
|---|---|---|
| P2-1 | Schatten-Counter-Lese-API + UI (Schreib-Pfad in Iter 16 schon aktiv) | 2 Iter |
| P2-2 | Alarm-Schwellen via Config-Flow konfigurierbar — derzeit hardcoded | 1–2 Iter |

### 2b. KNX-Bus-Monitoring Webrecherche

| # | Was | Aufwand |
|---|---|---|
| WR-G | GA-Heatmap (Zeit × Geräte) als zweite Visualisierung | 2–3 Iter |

### 2c. Konzept-Restposten

| # | Was | Aufwand |
|---|---|---|
| K1 | Saved Filters serverseitig (heute nur LocalStorage pro Browser) | 2 Iter |
| K2 | Prometheus-Endpoint `/metrics` für Severity-Counts | 0.5 Iter |

## 3. Offene Konzept-Fragen (Entscheidung User)

Aus `messagehub_knx_statistik.md` §13.

| # | Frage |
|---|---|
| Q1 | Filter-Konfig: LocalStorage (heute) oder server-seitig pro HA-Account? |
| Q2 | Default-Zeitraum 24h oder 7d? |
| Q3 | Acknowledge-Auto-Ablauf-Default (heute 90d) — sticky-Konfig nur per API ausreichend? |

## 4. Code-Review-Findings (Iter 69 +)

_Werden nach dem aktuellen Code-Review-Pass befüllt — siehe Sektion 6._

## 5. Blocked (Library-Limit, kein aktives Backlog)

| # | Was | Grund |
|---|---|---|
| BL-D | ACK/NAK-Statistik | xknx liefert nur Group-Layer, keine Link-Layer-Telegramme |
| BL-E | Telegram-Tracer (Hop-Count, Routing-Counter) | Selbe Library-Limitierung wie BL-D |
| BL-M | InfluxDB-Bridge (Power-User mit Grafana) | User-Priorität niedrig |

## 6. Code-Review-Findings (CR-*) — wird in Iter 69+ befüllt

_Pending — Code-Review läuft._

---

## Empfohlene Umsetzungs-Reihenfolge (nach Iter 68)

| Reihenfolge | Iter | Inhalt | Aufwand |
|---|---|---|---|
| 1 | 69+ | Code-Review-Findings einsortieren und High-Severity zuerst angehen | variabel |
| 2 | — | M2b: `manifest.json:version` bumpen + Tag `v0.14.0` (manuell durch User) | 5 min |
| 3 | — | K2: Prometheus `/metrics` — eigenständiger Endpoint, kein UI-Aufwand | 0.5 Iter |
| 4 | — | P2-2: Alarm-Schwellen via Config-Flow-Options | 1–2 Iter |
| 5 | — | P2-1: Schatten-Counter-Lese-API + UI | 2 Iter |
| 6 | — | WR-G: GA-Heatmap (Zeit × Geräte) | 2–3 Iter |
| 7 | — | K1: Saved Filters serverseitig | 2 Iter |
| 8 | parallel | M3 (Brand-PR), M4 (Repo-Topics), M5/M6 (manuelle Verifikation) | manuell |

**Begründung:**
- Code-Review-Findings zuerst, weil Sustainability-/Security-Risiken vor neuen Features adressiert werden müssen.
- K2 (Prometheus) als kleinster Restposten: 0.5 Iter, eigenständiger Endpoint ohne UI.
- P2-2 (Alarm-Config-Flow) vor P2-1 (Schatten-Counter), weil Config-Flow-Erweiterung kleiner Schritt ist.
- WR-G und K1 als letzte echte Features — beide brauchen mehrere Iter und tieferen Frontend-Refactor.
- BL-D, BL-E, BL-M bleiben außerhalb der Iter-Reihenfolge.

---

**Hinweis zur Pflege:** Beim Abschließen eines Items in den jeweiligen
Iter-Commits markieren und hier zeitnah streichen, sonst läuft das
Backlog erneut auseinander wie zuletzt mit `patterns.py` / `geoip.py`.
