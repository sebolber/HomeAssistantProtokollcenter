# Backlog `messagehub`

**Stand:** 2026-05-02 (nach Iter 93 — Release 0.14.0).

Status der ursprünglichen Quellen:

- ✅ `messagehub_konzept.md` §14 (Optionale Erweiterungen) — alle
  Items released.
- ✅ `messagehub_erweiterungen.md` (Erweiterungs-Roadmap) — released.
- ✅ `messagehub_knx_statistik.md` Phase-2-Backlog: P2-1 (Iter 38-39),
  P2-2 (Iter 87), P2-3 (Iter 65) — alle released.
- ✅ Alle UX-Reviews (Bugs B1-B5, Quick-Wins U1-U15) — released.
- ✅ Webrecherche-Restposten WR-I, WR-F, WR-P, WR-G, WR-T, WR-V —
  released.
- ✅ Code-Review (37 Findings) — alle High + alle Medium + die
  meisten Low released; Restposten unten.

---

## 0. Manuell (kein Code)

| # | Was | Status |
|---|---|---|
| M2b | Tag `v0.14.0` setzen (`manifest.json` ist auf `0.14.0` gebumpt) | ⏳ User |
| M3 | PR an `home-assistant/brands` | ⏳ User |
| M4 | Repository-Topics + Description auf GitHub setzen | ⏳ User |
| M5 | Verifizieren: N4-Sync-Vorschau-Dialog | ⏳ User |
| M6 | Verifizieren: N2-Default beim Anlegen einer GA → severity = `warning` | ⏳ User |

## 1. Code-Review-Findings — verbleibend (LOW + Tech-Debt)

Alle als „akzeptiert" oder „verschoben" markiert. Konkrete Risiko-
Bewertung und Vorgehen im Kommentar.

| # | Was | Severity | Status |
|---|---|---|---|
| CR-2 | 22 inline `noqa: PLC0415` Imports in `api/messages.py` | medium | Verschoben — größerer Refactor (Cycle-Risiken), separate Iter ohne Zeitdruck. Mittelfristiger Tech-Debt. |
| CR-5 | `stats-knx-view.ts` 3131 Zeilen → Sub-Components | medium | Verschoben — separater Frontend-Refactor, 2-3 Iter. Aktueller Code funktional ok, Cognitive-Load durch konsequente `_render*`-Aufteilung schon reduziert. |
| CR-10 | KNX-Counter-Increment-N+1 (Hot-Path) | medium | Akzeptiert — beim Sturm-Test (200 Tel/s) hat das System keine Probleme im realen Betrieb gezeigt; Trigger-basierte Lösung birgt Komplexität ohne klaren ROI. Bei beobachteten Bottlenecks neu evaluieren. |
| CR-14 | `_top` wird bei Sort kopiert (Frontend) | low | Akzeptiert — premature optimization; 100-Element-Sort ist <1 ms. |
| CR-15 | `_renderHaKnxLinks` baut `URLSearchParams` jeden Render | low | Akzeptiert — premature optimization; <1 µs pro Render. |
| CR-31 | Rate-Limit-Test ohne HTTP-Roundtrip | medium | Verschoben — braucht `pytest-homeassistant-custom-component` HA-Test-Stack, das im Sandbox nicht installierbar ist. CI mit echtem HA-Stack würde es abdecken. |
| CR-36 | Frontend `_load`-Race-Condition mit AbortController | medium | Verschoben — größerer State-Management-Refactor; aktuell kein User-Bug-Report dazu, akzeptabler Trade-off. |

## 2. Offene Konzept-Fragen (Entscheidung User)

| # | Frage | Status |
|---|---|---|
| Q1 | Filter-Konfig: LocalStorage oder serverseitig? | ✅ K1 release ermöglicht beides |
| Q2 | Default-Zeitraum 24h oder 7d? | offen, kosmetische User-Präferenz |
| Q3 | Acknowledge-Auto-Ablauf-Default sticky-Konfig nur per API ausreichend? | offen, niedrige Priorität |

## 3. Blocked (Library-Limit)

| # | Was | Grund |
|---|---|---|
| BL-D | ACK/NAK-Statistik | xknx liefert nur Group-Layer |
| BL-E | Telegram-Tracer | xknx-Limit |
| BL-M | InfluxDB-Bridge | User-Priorität niedrig |

## 4. Erledigt seit Iter 58 (Release 0.14.0)

35 Iterationen, Detail im `CHANGELOG.md`-Block `[0.14.0]`:

| Iter | Inhalt |
|---|---|
| 59 | Bugs B1+B2+B3+B4 |
| 60 | UX-Quick-Wins Visual U1–U12 |
| 61 | UX-Quick-Wins Frontend-Logik U3+U9+U15+B5 |
| 62 | WR-T DPT-Auto-Erkennung |
| 63 | U13 Anti-Pattern-Badge |
| 64 | WR-P HA-KNX-Direktlinks |
| 65 | P2-3 Rate-Limit `/alarms` |
| 66 | WR-V Multi-byte-ASCII-Decoder |
| 67 | WR-I Trend-Vergleich |
| 68 | WR-F GA-Werteverlauf-Export |
| 69 | K2 Prometheus `/metrics` |
| 70 | CR-32 GA-Export-Tests + Refactor |
| 71 | CR-37 Auth-Tests via `_auth.py` |
| 72 | CR-1 Helper-Duplikat-Refactor |
| 73 | CR-8 N+1 in `compute_ga_detail` |
| 74 | CR-16 FTS5-Injection-Fix |
| 75 | CR-19 + CR-21 Sensitive-Audit + Channels-SSRF |
| 76 | CR-17 Alarm-Eventbus-Dedup |
| 77 | CR-12 + CR-23 `compute_top` Refactor |
| 78 | CR-9 Bulk-INSERT für `ack_set_bulk` |
| 79 | CR-11 + CR-13 Cache + Index |
| 80 | CR-18 Streaming-Export |
| 81 | CR-30 Audit-Fail-Handling |
| 82 | CR-35 High-Volume-Concurrency-Stress |
| 83 | CR-4 MQTT-Topic-PUT-Handler |
| 84 | CR-24 `format_value` Strategy-Pattern |
| 85 | CR-6 + CR-26 + CR-29 LOW-Sammel |
| 86 | CR-3 + CR-22 LOW-Sammel + Doku |
| 87 | P2-2 Alarm-Schwellen via Config-Flow |
| 88 | CR-20 ChannelTestView Rate-Limit |
| 89 | CR-7 Bus-Analyse-Flag Single-Source |
| 90 | CR-34 KNX-Listener-Crash-Resilienz |
| 91 | WR-G GA-Heatmap (Backend + Frontend) |
| 92 | K1 Saved Filters Backend |
| 93 | K1 Saved Filters Frontend |

---

**Hinweis zur Pflege:** Backlog ist nach Release 0.14.0 leer bis auf
manuelle Tasks und akzeptierte Tech-Debt. Bei nächstem Review-Pass
neue Findings hier einsortieren.
