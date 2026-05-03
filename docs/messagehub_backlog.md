# Messagehub-Backlog: KNX-Konfigurations-Findings

Letzte Aktualisierung: 2026-05-03 (Release v0.23.0 + minRate-Hotfix).

## Erledigt

Iter 1–31 plus Wiring-Audit (29.audit) plus Verdrahtungs-Iter 29a-29c
sind in `main` und in der HACS-Bundle-Distribution. Pro Iter ein
Conventional Commit (`Iteration: N` im Footer); Releases in
`CHANGELOG.md`.

| Iter | Inhalt | Release |
|------|--------|---------|
| 1 | `Finding`-Dataclass + `FindingSeverity` Enum + Roundtrip | 0.19.0 |
| 2 | Tabelle `knx_findings` + `FindingsRepository.record/list/count` | 0.19.0 |
| 3 | Tabelle `knx_finding_acknowledgements` + `acknowledge`/`unacknowledge` | 0.19.0 |
| 4 | Tabelle `knx_finding_severity_overrides` + Resolver | 0.19.0 |
| 5 | Bestand auf neuen Vertrag heben (Lift-Funktionen) | 0.19.0 |
| 6 | API `GET /findings` (Filter + Pagination) | 0.19.0 |
| 7 | API `POST /findings/ack` + `DELETE /findings/ack/{ga}/{code}` | 0.19.0 |
| 8 | API `GET/PUT/DELETE /findings/severity-overrides` | 0.19.0 |
| 9 | Frontend: leere `findings-view`-Komponente | 0.19.0 |
| 10 | Frontend: Items + Severity-Pill + Detail-Pane + Ack-Action | 0.19.0 |
| 11 | Migration `knx_group_addresses.dpt_inferred` + `set_dpt_inferred` | 0.20.0 |
| 12 | Detector `DPT_MISMATCH` | 0.20.0 |
| 13 | Wertbereich-Tabelle in `const.py` + Detector `VALUE_OUT_OF_RANGE` | 0.20.0 |
| 14 | i18n Phase 2 in 6 Sprachen + `frontend/src/utils/findings-i18n.ts` | 0.20.0 |
| 15 | Detector `MULTI_RESPONDER` | 0.20.0 |
| 16 | Detector `READ_NO_RESPONSE` | 0.20.0 |
| 17 | Detector `TOGGLE_LOOP` | 0.20.0 |
| 18 | Detector `MULTI_TIME_MASTER` | 0.20.0 |
| 19 | i18n Phase 3 (4 Codes in 6 Sprachen) | 0.20.0 |
| 20 | Detector `RECONNECT_STORM` | 0.21.0 |
| 21 | Detector `SEND_CYCLE_DRIFT` | 0.21.0 |
| 22 | Detector `REPEAT_APPROXIMATION` | 0.21.0 |
| 23 | i18n Phase 4 (3 Codes in 6 Sprachen) | 0.21.0 |
| 24 | Detector `ORPHAN_GA` | 0.21.0 |
| 25 | Detector `STALE_GA` | 0.21.0 |
| 26 | i18n Phase 5 + Filter "Nur Projekt-Befunde" | 0.21.0 |
| 27 | Severity-Override-UI + Frontend-Form | 0.22.0 |
| 28 | Prometheus-Counter `messagehub_knx_finding_total{code,severity}` | 0.22.0 |
| 29 | Markdown-Export der Findings (E15) — Endpoint + UI-Button | 0.22.0 |
| 29.audit | Wiring-Audit der Iter 1-29 (`docs/messagehub_knx_findings_wiring_audit.md`) | 0.22.0 |
| 29a | Per-GA-Detector-Runner on-demand (`POST /findings/refresh` + UI-Button) | 0.22.0 |
| 29b | Bus-wide-Detector-Runner periodisch (alle 15 Min via Job) | 0.22.0 |
| 29c | Prometheus-Aggregation verdrahtet (`MetricsView` -> `finding_total`) | 0.22.0 |
| 30 | Snapshot-Fixtures pro Detector (`tests/fixtures/knx_findings/`) | 0.22.0 |
| 31 | Detector `SEND_TO_NOWHERE` (komplexer Letzter, severity=info) | 0.22.0 |
| Detail-Pane A | Repo `last_seen_for_source` / `count_for_source` / `repeat_ratio_for_source` / `gas_for_source` | 0.23.0 |
| Detail-Pane B | Service `compute_source_detail` + `SourceDetail`/`SourceGaSummary` + `source_detail_to_dict` | 0.23.0 |
| Detail-Pane C | API-View `KnxStatsSourceDetailView` (`/knx-stats/source/{dev_source}`) | 0.23.0 |
| Detail-Pane D.1 | Frontend-API-Client `getKnxStatsSourceDetail` + DTOs | 0.23.0 |
| Detail-Pane D.2 | Source-Detail-Render-Body in `stats-knx-view` (KPI/Stille/GA-Liste/Geraete-Info) | 0.23.0 |
| Detail-Pane E | Top-Geraete-Tabelle Click-Handler oeffnet Source-Detail | 0.23.0 |
| Detail-Pane F | Stille-Alarme Click-Handler oeffnet Source-Detail | 0.23.0 |
| Detail-Pane G | Trend-Liste Click-Handler oeffnet GA-Detail | 0.23.0 |
| Detail-Pane H | Findings-Liste pro Source im Source-Detail (+ Hash-Navigation zum Findings-Tab) | 0.23.0 |
| Detail-Pane I | Trend-Compare pro Source im Source-Detail (>= 24h) | 0.23.0 |
| Detail-Pane J | CHANGELOG + Konzept-Status + Release v0.23.0 | 0.23.0 |

## Bekannte UX-Bugs: Top-N-Konsistenz pro Card (Stand v0.23.0 + Hotfix)

Hintergrund: Nach dem Hotfix vom 2026-05-03 (Default `minRate` 1.0 →
0.0, Commit `020a73f`) hat der User berichtet, dass der Top-N-Selektor
auch in anderen Cards keinen Effekt zeigt. Systematische Pruefung
der Pipeline `_load()` -> Backend-Endpunkt -> UI-Render im
stats-knx-view ergibt fuenf Cards mit dem **gleichen Pattern-Bug**:
das UI hat einen card-spezifischen Inline-Top-N-Selektor (`topNXxx`),
aber die Daten werden mit dem GLOBALEN `_filters.topN` (Top-Sender-
Limit) oder einem hardcodierten Wert geladen — der UI-Selektor sliced
nur lokal, kann aber nie mehr zeigen als das Backend liefert.

| Card | UI-Selektor | Backend-Aufruf | Diagnose |
|------|-------------|----------------|----------|
| Trend gegenüber Vorperiode | `topNTrend` | `getKnxStatsTrend(filters, **5**)` | Frontend hardcoded `top_n=5` als 2. Param. |
| Bus-Gesundheit (Top-GAs Wiederholrate) | `topNBusHealth` | `getKnxStatsBusHealth(fRaw)` | Backend (`KnxStatsBusHealthView`) hardcoded `bus_health_per_ga(..., limit=20)`; Query-Limit ignoriert. |
| Telegrammfluten (Bursts) | `topNBursts` | `getKnxStatsBursts(fRaw)` | `fRaw.limit = _filters.topN` — Backend-Default 50 wird durch Top-Sender-Limit ueberschrieben. |
| Long-Term-Sicht (Top-GAs) | `topNLongTerm` | `getKnxStatsLongTerm(fLongTerm)` | Gleiche Sache: `fLongTerm.limit = _filters.topN`. |
| Sicherheits-Audit (sensitive Telegramme) | `topNAudit` | `getKnxStatsSensitiveLog(fRaw)` | Gleiche Sache: `fRaw.limit = _filters.topN`. |

**Konsistente Cards (ohne Bug):**
- Top-Sender (`topN`), Top-Geräte (`topNDevices`) — `limit` korrekt
  pro Card durchgereicht.
- Stille-Alarme (`topNSilence`), Verwaiste GAs (`topNOrphansMissing/
  Extra`), Andere GAs des Geraets (`topNSiblings`) — Backend liefert
  vollstaendige Liste, UI-side Slice ist hier korrekt.
- Heatmap — kein UI-Selektor, hardcoded `top_n=10` ist intentional
  (CSS-Grid limitiert Anzeige).

### Iter-Aufteilung (Vorschlag)

| Iter | Inhalt | Erwartet |
|------|--------|----------|
| **TopN-1** | Trend-Card: `getKnxStatsTrend(filters, this._filters.topNTrend)` + Test, der bei `topNTrend=10` zehn `top_increase`-Eintraege erwartet. | <30 min |
| **TopN-2** | Bursts/Long-Term/Sensitive-Audit: jeden API-Aufruf um `{...fXxx, limit: this._filters.topNXxx}` erweitern; pro Card ein Test. | 60 min |
| **TopN-3** | Bus-Health: Backend-View `KnxStatsBusHealthView.get` muss `limit` aus Query lesen (default 25, max 500); Frontend reicht `topNBusHealth` durch. Plus Backend-Test, dass `limit` respektiert wird. | 60 min |
| **TopN-4** | Optional: Heatmap-UI-Selektor `topNHeatmap` (default 10, max 30 wegen CSS-Grid-Lesbarkeit) — nur wenn User-Bedarf. | 30 min |

Alle Iter folgen dem **TDD-Pattern**, das bei `minRate`-Hotfix
(Commit `020a73f`) etabliert wurde:
1. Smoke-Test First — der Test pruefen, dass UI-Selektor X tatsaechlich
   X Eintraege im DOM erzeugt (mock-API liefert genug Daten).
2. Frontend-Fix bzw. Backend-Erweiterung.
3. Quality-Gates: pytest + npm test + build + ruff clean, Bundle commit.
4. Conventional Commit `fix(frontend): TopN-Konsistenz Card-X` mit
   Footer `Iteration: topn-N`.

### Architektur-Lessons (Out-of-scope fuer Iter, aber dokumentiert)

Der Pattern-Fehler entstand, weil das Frontend einen geteilten
`KnxStatsFilters`-Block fuer ALLE Endpunkte nutzt (`fRaw`,
`fLongTerm`), in dem `limit` per Convention auf `_filters.topN`
(Top-Sender) zeigt. Card-spezifische Inline-Top-N-Selektoren wurden
spaeter ergaenzt (Iter 45 und Iter aiohttp-error-ZU9UA), aber die
Backend-Aufruf-Wiring blieb beim globalen `topN`.

Nachhaltige Loesung (Phase 8): das Frontend duerfte gar keinen
geteilten `fRaw.limit` haben — jeder API-Aufruf sollte sein
card-spezifisches `limit` explizit setzen. Heute leichter Smell, aber
mit den vier Iter oben adressiert.

## Offen / Out-of-scope (Stand v0.23.0)

Bewusst nicht in den 31 Iter, weil das Datenmaterial fehlt
(siehe §3.1 + §9.9 in `docs/messagehub_knx_konfigurationsfehler_recherche.md`):

- **F4** echte Repeat/NACK/BUSY-Statistik — blocked (BL-D), bis xknx
  Layer-2-Frames durchreicht oder Sniffer-Side-Channel kommt.
- **F9** Hop-Counter — gleicher Grund.
- **F10** Adresskonflikt — braucht Programmiermodus-Frames.

Sobald xknx das ergaenzt, kommen sie als Phase 8 nach (Iter 32+).
