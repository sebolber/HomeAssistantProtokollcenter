# Backlog `messagehub`

**Stand:** 2026-05-02 (nach Iter 57 + Hotfix `1b83fd6`, vor Tag 0.12.1,
plus zweite Screenshot-Runde mit Bug-Findings).

Sammelt alle nicht erledigten Themen aus den Quell-Dokumenten:
- `messagehub_konzept.md` §14 (Optionale Erweiterungen)
- `messagehub_erweiterungen.md` (Erweiterungs-Roadmap)
- `messagehub_knx_statistik.md` + `…_review.md` (Phase 2)
- UX-Reviews KNX-Bus-Analyse-Tab + KNX-Einstellungen
- Webrecherche KNX-Bus-Monitoring (ETS/captureKNX/Foren)
- Zweite Screenshot-Runde Nachrichten/Audit/KNX-Settings/Bus-Analyse

Reihenfolge der Sektionen entspricht der Empfehlung zur Abarbeitung
(Bugs → Quick-Wins → mittlere Erweiterungen → große Features → blocked).

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

## 0.5. Bugs (sichtbar gebrochen — höchste Prio)

Aus zweiter Screenshot-Runde, im Code verifiziert.

| # | Was | Code-Stelle | Severity |
|---|---|---|---|
| B1 | Audit-Detail Summary zeigt nur Keys (`{deleted_count}`) — wirkt wie nicht ersetztes Template. Bei einzelnem Key sollte „key: value" gezeigt werden, sonst sieht der User „kaputt" | `audit-view.ts:147 _renderDetailsSummary` | hoch |
| B2 | Status-Pille „● OK" wird grau statt grün gerendert. Mapping `green → mh-pill--neutral` ist falsch — Konzept §3.1 verlangt Ampel grün/gelb/orange/rot. Zusätzlich `yellow → mh-pill--info` (blau) ist semantisch verwirrend | `stats-knx-view.ts:1597 _severityPillClass` | hoch |
| B3 | Tagesverlauf-Chart bleibt leer trotz Daten (Y-Achse 0–87 sichtbar, aber keine Linie). Iter 52 hat zwar Single-Datapoint-Fix gebracht, aber bei mehreren GAs mit > 1 Bucket greift er nicht — Daten kommen nicht in der erwarteten Struktur an | `knx-timeline-chart.ts` + Endpoint `/timeline` | hoch |
| B4 | Umlaut-Drift: nach Iter 0.5.0 („Umlaute überall") sind in `stats-knx-view.ts`, `audit-view.ts`, `knx-addresses-view.ts` wieder ASCII-Substitute eingezogen — „Geraete", „physische Geraet", „loeschen", „auffaellig", „leicht erhoeht", „Eintraege loeschen", „geaenderte aktualisieren" | mehrere Files | mittel |

## 1. UX-Quick-Wins (Sammel-Iter)

Alle aus den Screenshot-Reviews. Einzeln klein, zusammen ~1–2 Iter.

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
| U9 | Severity-Filter-Pills im Nachrichten-Tab: aktiver vs. inaktiver Zustand klarer (heute Error/Warning/Info alle voll farbig, nur Debug grau — wirkt als wären alle aktiv; Selected-State braucht Border/Ring oder Filled-vs-Outline) | Screenshot Nachrichten | mittel |
| U10 | Helper-Text „Welches physische Gerät erzeugt am meisten Last?" auch bei Top-Sender-Card (Konsistenz mit Top-Geräte) | Screenshot Bus-Analyse | niedrig |
| U11 | Lange Hersteller/Modell-Texte mit Tooltip bei Truncation (heute hartes „…" ohne Hover-Anzeige) | Screenshot Bus-Analyse | niedrig |
| U12 | Reload-Icon (oben rechts in jedem Tab, ↻) zu schwach — Tooltip „Aktualisieren" reicht nicht; mh-btn--ghost mit Icon-Größe-Bump oder Outline | Screenshot alle Tabs | niedrig |
| U13 | Anti-Pattern-Findings als Badge in Top-Sender-Tabelle (heute nur im Detail-Pane sichtbar) — z. B. Hörmann-Tor mit Konstant-Wert-Spam wäre direkt erkennbar | Screenshot Bus-Analyse + Konzept §5.6 | mittel |
| U14 | Absolute Zeit immer als Tooltip auf relativen Zeitangaben („vor 2 Stunden" → ISO-Timestamp im title); im Nachrichten- + Audit-Tab | Screenshots Nachrichten/Audit | niedrig |
| U15 | GroupValueRead-Telegramme im Nachrichten-Tab optional ausblenden (Toggle in Filter-Bar) — Polling-Spam reduzieren ohne Loggen-Konfig zu ändern | Screenshot Nachrichten | mittel |

## 2. KNX-Stats Phase-2 (Code, mittel)

Aus `messagehub_knx_statistik_review.md` §3 + Konzept §10.

| # | Was | Quelle |
|---|---|---|
| P2-1 | Schatten-Counter-Lese-API + UI (Schreib-Pfad in Iter 16 schon aktiv) | KNX-Stats-Review #3 |
| P2-2 | Alarm-Schwellen via Config-Flow konfigurierbar — derzeit hardcoded | Webrecherche H, KNX-Stats-Review #3 |
| P2-3 | Rate-Limit für `/api/messagehub/knx-stats/alarms` (Token-Bucket) | Webrecherche O, KNX-Stats-Review §2.6 |

## 3. KNX-Bus-Monitoring (Webrecherche + Screenshot-Findings)

Aus der Branchen-Recherche (ETS, captureKNX, Foren) sowie zweiter
Screenshot-Runde. A, K, B+J, C, N sind in 0.12.0 released — Rest hier:

| # | Was | Value | Effort | Quelle |
|---|---|---|---|---|
| WR-I | Trend-Vergleich heute-vs-Vorperiode (Anomalie-Detection) — Card mit „+/−% gegenüber Vorperiode" | hoch | 1–2 Iter | Webrecherche I |
| WR-F | GA-Werteverlauf-Export CSV/JSON aus dem Detail-Pane | mittel | 1 Iter | Webrecherche F |
| WR-P | Direktlink ins HA-KNX-Geräte-Konfig (knx-Entity-Lookup) | mittel | 0.5 Iter | Webrecherche P |
| WR-G | GA-Heatmap (Zeit × Geräte) als zweite Visualisierung | hoch | 2–3 Iter | Webrecherche G |
| WR-T | DPT-Auto-Erkennung wenn ETS keinen DPT liefert — heute zeigt Top-Sender bei allen 10 Einträgen DPT „—", weshalb die Recommendation-Engine auf den `_default`-Soll (5,0 Tel/Min) zurückfällt und nichts spezifisches sagt; aus Werte-Range/Pattern den DPT raten (z. B. 0/1 → 1.001, 2-Byte-Float-Range → 9.x) | hoch | 1–2 Iter | Screenshot Bus-Analyse |
| WR-V | Multi-byte-ASCII-Telegramme (DPT 16.x) als String dekodieren — heute zeigt eine Zentralfunktions-Nachricht „Alarm = (32, 32, 37, 32, 84, 111, 116, 97, 108, 32, 32, 32, 32, 37)" statt „  %  Total %"; UTF-8/Latin-1-Decoder im Wert-Formatter ergänzen | mittel | 0.5 Iter | Screenshot Nachrichten |

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

Kriterium: **erst Bugs** (sichtbar gebrochen, höchstes User-Vertrauens-
Risiko) → **dann Quick-Wins** (sichtbarer Effekt, klein) → **dann
funktionale Defizite die das Kernfeature lahmlegen** (WR-T DPT-Erkennung)
→ **dann neue Features value-pro-aufwand absteigend**.

| Reihenfolge | Iter | Inhalt | Aufwand |
|---|---|---|---|
| 1 | — | M1 + M2: Tags `v0.12.0` und `v0.12.1` setzen (manuell) | 5 min |
| 2 | 59 | **Bug-Fix-Iter — B1 + B2 + B3 + B4** in einem Commit (Audit-Detail-Renderer, Status-Pille-Mapping, Timeline-Render-Pfad, Umlaut-Drift) | 1 Iter |
| 3 | 60 | UX-Quick-Wins-Sammel-Iter Visual — U1, U2, U4, U5, U6, U7, U8, U10, U11, U12, U13 (alle CSS/Tabellen-Polish) | 1 Iter |
| 4 | 61 | UX-Quick-Wins-Sammel-Iter Frontend-Logik — U3 (Verwaiste-GAs-Pagination), U9 (Filter-Pill-State), U14 (Tooltip-Zeit), U15 (Read-Filter) | 1 Iter |
| 5 | 62 | **WR-T: DPT-Auto-Erkennung** — ohne DPT greift die Recommendation-Engine nicht; aktuell Top-10-Sender alle mit Soll = `_default` (5,0 Tel/Min). Höchster Hebel für KNX-Stats-Tab | 1–2 Iter |
| 6 | 63 | WR-P: Direktlink ins HA-KNX-Geräte-Konfig — User-Workflow „Sender klicken → in HA editieren" | 0.5 Iter |
| 7 | 64 | P2-3: Rate-Limit für `/alarms` — Security-Hygiene, klein | 0.5 Iter |
| 8 | 65 | WR-V: Multi-byte-ASCII-Decoder (DPT 16.x) — kleiner, aber sichtbarer Quick-Win für Nachrichten-Tab | 0.5 Iter |
| 9 | 66 | WR-I: Trend-Vergleich heute-vs-Vorperiode — neue KPI-Card, hochwertig | 1–2 Iter |
| 10 | 67 | WR-F: GA-Werteverlauf-Export CSV/JSON | 1 Iter |
| 11 | 68 | P2-2: Alarm-Schwellen via Config-Flow-Options | 1–2 Iter |
| 12 | 69 | P2-1: Schatten-Counter-Lese-API + UI | 2 Iter |
| 13 | 70 | WR-G: GA-Heatmap (Zeit × Geräte) — Frontend-heavy | 2–3 Iter |
| 14 | 71 | K2: Prometheus `/metrics` — eigenständiger Endpoint, kein UI-Aufwand | 0.5 Iter |
| 15 | 72 | K1: Saved Filters serverseitig — größerer Schema-Eingriff (DB-Tabelle, REST + UI) | 2 Iter |
| 16 | parallel | M3 (Brand-PR), M4 (Repo-Topics), M5/M6 (manuelle Verifikation) jederzeit | manuell |

**Begründung der neuen Reihenfolge:**

- **Iter 59 (Bugs) ganz vorne**: B1 lässt das Audit-Log wie kaputt
  aussehen, B2 entwertet die Ampel-Logik, B3 zeigt einen leeren Chart,
  B4 ist Sprach-Hygiene. Alle vier sichtbar im normalen Workflow,
  zusammen ein Iter — größter Vertrauens-Hebel pro Aufwand.
- **Iter 60 + 61 (Quick-Wins gesplittet)**: U1–U15 wären zu viel für
  einen Commit. Iter 60 sammelt rein visuelle Anpassungen (Pill-Form,
  Tooltip, Sortierung, Selektoren), Iter 61 die Frontend-Logik-Items
  (Pagination, Filter-State, Read-Toggle). Klare Trennung in der
  Review.
- **Iter 62 (WR-T DPT-Auto-Erkennung) vor anderen Features**: ohne
  DPT zeigt der Bus-Analyse-Tab pro Top-Sender immer den `_default`-
  Soll von 5,0 Tel/Min und keine spezifische Empfehlung. Das ist die
  Hauptfunktion des Tabs — solange das nicht greift, sind WR-I (Trend)
  und WR-G (Heatmap) Schmuck am Nachthemd.
- **WR-P + P2-3 + WR-V** als nächste kleine Wins (je ≤ 0.5 Iter).
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
