# Backlog `messagehub`

**Stand:** 2026-05-02 (nach Iter 57 + Hotfix `1b83fd6`, vor Tag 0.12.1).

Sammelt alle nicht erledigten Themen aus den Quell-Dokumenten:
- `messagehub_konzept.md` §14 (Optionale Erweiterungen)
- `messagehub_erweiterungen.md` (Erweiterungs-Roadmap)
- `messagehub_knx_statistik.md` + `…_review.md` (Phase 2)
- UX-Reviews KNX-Bus-Analyse-Tab + KNX-Einstellungen
- Webrecherche KNX-Bus-Monitoring (ETS/captureKNX/Foren)

Reihenfolge der Sektionen entspricht der Empfehlung zur Abarbeitung
(Quick-Wins → mittlere Erweiterungen → große Features → blocked).

---

## 0. Manuell (kein Code)

| # | Was | Quelle |
|---|---|---|
| M1 | Tag `v0.12.0` für Commit `cfe4d4f` setzen | Release-Plan |
| M2 | Tag `v0.12.1` für Hotfix `1b83fd6` (KNX-Stats-View-Registrierung) setzen | Release-Plan |
| M3 | PR an `home-assistant/brands` mit `assets/brands/messagehub/` — sonst zeigt HA-Settings weiter „icon not available" | CHANGELOG 0.8.x, `docs/brand-pr.md` |
| M4 | Repository-Topics + Description auf GitHub-Repo-Settings setzen | CHANGELOG 0.9.3 |
| M5 | Manuell verifizieren: N4-Sync-Vorschau-Dialog (Settings → KNX → „Mit ETS-Projekt synchronisieren") | UX-Review |
| M6 | Manuell verifizieren: N2-Default beim Anlegen einer GA → severity = `warning` | UX-Review |

## 1. UX-Quick-Wins (Sammel-Iter)

Alle aus den Screenshot-Reviews. Einzeln klein, zusammen ~1 Iter.

| # | Was | Quelle | Severity |
|---|---|---|---|
| U1 | Top-N-Selektor konsistent zwischen Top-Sender + Top-Geräte ([10, 25, 50, 100]) | KNX-Stats-Review #4 | niedrig |
| U2 | „Aktualisieren"-Button in der Filter-Bar stärker betonen (primary/Outline statt Ghost) | KNX-Stats-Review #6 | niedrig |
| U3 | Verwaiste-GAs-Card im Stats-Tab paginieren oder mit Suche filtern (3169 Einträge unhandlich) | KNX-Stats-Review Design | mittel |
| U4 | Status-Badge „Alle X bekannt" als dezente Pille mit ✓-Icon | KNX-Stats-Review Design | niedrig |
| U5 | Top-Sender-Tabelle sortierbar (analog Iter 57 Top-Geräte) | KNX-Stats-Review Design | niedrig |
| U6 | Inline-Top-N-Selektor mit Label „zeige" + mehr Padding | KNX-Stats-Review Design | niedrig |
| U7 | Buslast-KPI: 0–100 %-Verlaufsskala statt Sprung an Schwellen | KNX-Stats-Review Design | niedrig |
| U8 | Severity-Spalte zeigt Default in muted bei inaktiven GAs (statt nur „—") | KNX-Settings-Review #5 | niedrig |

## 2. KNX-Stats Phase-2 (Code, mittel)

Aus `messagehub_knx_statistik_review.md` §3 + Konzept §10.

| # | Was | Quelle |
|---|---|---|
| P2-1 | Schatten-Counter-Lese-API + UI (Schreib-Pfad in Iter 16 schon aktiv) | KNX-Stats-Review #3 |
| P2-2 | Alarm-Schwellen via Config-Flow konfigurierbar — derzeit hardcoded | Webrecherche H, KNX-Stats-Review #3 |
| P2-3 | Rate-Limit für `/api/messagehub/knx-stats/alarms` (Token-Bucket) | Webrecherche O, KNX-Stats-Review §2.6 |

## 3. KNX-Bus-Monitoring (Webrecherche-Restposten)

Aus der Branchen-Recherche (ETS, captureKNX, Foren). A, K, B+J, C, N
sind in 0.12.0 released — Rest hier:

| # | Was | Value | Effort | Quelle |
|---|---|---|---|---|
| WR-I | Trend-Vergleich heute-vs-Vorperiode (Anomalie-Detection) — Card mit „+/−% gegenüber Vorperiode" | hoch | 1–2 Iter | Webrecherche I |
| WR-F | GA-Werteverlauf-Export CSV/JSON aus dem Detail-Pane | mittel | 1 Iter | Webrecherche F |
| WR-P | Direktlink ins HA-KNX-Geräte-Konfig (knx-Entity-Lookup) | mittel | 0.5 Iter | Webrecherche P |
| WR-G | GA-Heatmap (Zeit × Geräte) als zweite Visualisierung | hoch | 2–3 Iter | Webrecherche G |

## 4. Konzept-Restposten

Aus `messagehub_konzept.md` §14 (verbliebene „Optionale Erweiterungen").

| # | Was | Quelle |
|---|---|---|
| K1 | Saved Filters serverseitig (heute nur LocalStorage pro Browser) | Konzept §14 |
| K2 | Prometheus-Endpoint `/metrics` für Severity-Counts als Scrape-Target | Konzept §14 |

## 5. Offene Konzept-Fragen (Entscheidung User)

Aus `messagehub_knx_statistik.md` §13.

| # | Frage |
|---|---|
| Q1 | Filter-Konfig: LocalStorage (heute) oder server-seitig pro HA-Account? |
| Q2 | Default-Zeitraum 24h oder 7d? |
| Q3 | Acknowledge-Auto-Ablauf-Default (heute 90d) — sticky-Konfig nur per API ausreichend? |

## 6. Blocked (Library-Limit, kein aktives Backlog)

| # | Was | Grund |
|---|---|---|
| BL-D | ACK/NAK-Statistik | xknx liefert nur Group-Layer, keine Link-Layer-Telegramme |
| BL-E | Telegram-Tracer (Hop-Count, Routing-Counter) | Selbe Library-Limitierung wie BL-D |
| BL-M | InfluxDB-Bridge (Power-User mit Grafana) | User-Priorität niedrig — bei Bedarf separat re-evaluieren |

---

## Empfohlene Umsetzungs-Reihenfolge

Kriterium: **erst kleine Quick-Wins** (sichtbarer User-Effekt, geringes
Risiko) **vor neuen Features**, dann **value-pro-aufwand absteigend**.

| Reihenfolge | Iter | Inhalt | Aufwand |
|---|---|---|---|
| 1 | — | M1 + M2: Tags `v0.12.0` und `v0.12.1` setzen (manuell) | 5 min |
| 2 | 59 | UX-Quick-Wins-Sammel-Iter — alle U1–U8 in einem Commit. Klein, aber sehr sichtbar | 1 Iter |
| 3 | 60 | WR-P: Direktlink ins HA-KNX-Geräte-Konfig — kleinster neuer Wert mit konkretem User-Nutzen | 0.5 Iter |
| 4 | 61 | P2-3: Rate-Limit für `/alarms` — Security-Hygiene, klein | 0.5 Iter |
| 5 | 62 | WR-I: Trend-Vergleich heute-vs-Vorperiode — neue KPI-Card, hochwertig | 1–2 Iter |
| 6 | 63 | WR-F: GA-Werteverlauf-Export CSV/JSON — Power-User-Feature, isoliert | 1 Iter |
| 7 | 64 | P2-2: Alarm-Schwellen via Config-Flow-Options — entlastet Phase-2-Backlog | 1–2 Iter |
| 8 | 65 | P2-1: Schatten-Counter-Lese-API + UI — schließt Phase-2-Lücke | 2 Iter |
| 9 | 66 | WR-G: GA-Heatmap (Zeit × Geräte) — Frontend-heavy, daher hinter den kleineren Items | 2–3 Iter |
| 10 | 67 | K2: Prometheus `/metrics` — eigenständiger Endpoint, kein UI-Aufwand | 0.5 Iter |
| 11 | 68 | K1: Saved Filters serverseitig — größerer Schema-Eingriff (DB-Tabelle, REST + UI) | 2 Iter |
| 12 | parallel | M3 (Brand-PR), M4 (Repo-Topics), M5/M6 (manuelle Verifikation) jederzeit | manuell |

**Begründung Reihenfolge:**

- **Iter 59 zuerst**, weil viele kleine Probleme in einem Commit
  abgeräumt werden — beste Sichtbarkeit pro Aufwand.
- **WR-P + P2-3 als nächstes**, weil je ≤ 0.5 Iter und beide schließen
  konkrete Lücken (User-Workflow + Security).
- **WR-I (Trend)** vor **WR-F (Export)**, weil Trend täglich genutzt
  wird, Export nur bei Bedarf.
- **P2-2 (Alarm-Config-Flow) vor P2-1 (Schatten-Counter)**, weil
  Config-Flow-Erweiterung kleiner Schritt ist und P2-1 mehrere
  abhängige Module berührt (API + UI + Test-Suite).
- **WR-G (Heatmap)** und **K1 (Saved Filters)** als letzte echte
  Features — beide brauchen mehrere Iter und tieferen Frontend-
  Refactor.
- **K2 (Prometheus)** vor K1, weil eigenständiger Endpoint ohne UI.
- **BL-D, BL-E, BL-M** bleiben außerhalb der Iter-Reihenfolge, bis
  sich Library-Stand oder User-Bedarf ändert.

---

**Hinweis zur Pflege:** Beim Abschließen eines Items in den jeweiligen
Iter-Commits markieren und hier zeitnah streichen, sonst läuft das
Backlog erneut auseinander wie zuletzt mit `patterns.py` / `geoip.py`.
