# Messagehub-Backlog: KNX-Konfigurations-Findings

Letzte Aktualisierung: 2026-05-03 (Release v0.22.0).

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

## Offen / Out-of-scope (Stand v0.22.0)

Bewusst nicht in den 31 Iter, weil das Datenmaterial fehlt
(siehe §3.1 + §9.9 in `docs/messagehub_knx_konfigurationsfehler_recherche.md`):

- **F4** echte Repeat/NACK/BUSY-Statistik — blocked (BL-D), bis xknx
  Layer-2-Frames durchreicht oder Sniffer-Side-Channel kommt.
- **F9** Hop-Counter — gleicher Grund.
- **F10** Adresskonflikt — braucht Programmiermodus-Frames.

Sobald xknx das ergaenzt, kommen sie als Phase 8 nach (Iter 32+).
