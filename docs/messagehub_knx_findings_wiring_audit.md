# KNX-Findings Wiring-Audit (Iter 1–29)

Stand: 2026-05-03, vor Beginn von Iter 29a-29x.

## Methodik

Pro Iter aus dem Commit-Diff die neuen Symbole (Funktionen / Klassen
/ Migrationen) extrahiert, dann via `grep` geprueft, ob sie ausserhalb
von `tests/` und ihrer Definitionsdatei in produktivem Code referenziert
sind. Status:

- `wired` — mindestens ein nicht-Test-Caller im Produktiv-Code
- `leaf-only` — nur durch Test/Doc/eigenes `__all__` referenziert,
  hat aber legitimen Daseinsgrund (reine Lib, die spaeter
  zusammengesteckt wird)
- `orphan` — kein Caller, sollte aber einen haben

Quelle: `custom_components/messagehub/**`. Frontend wird separat
inspiziert (TypeScript-Imports), ist aber aus dem Audit-Fokus heraus
strikt produktiv-relevant nur fuer Iter 9/10/26/27.

## Audit-Tabelle Iter 1-29

| Iter | Neue Symbole | Caller (nicht-Test) | Status |
|------|--------------|---------------------|--------|
| 1 | `processing/findings.py:Finding` + `FindingSeverity` + `EvidencePayload` + `to_dict/to_json/from_dict/from_json` | `storage/findings_repo.py` (Insert/List), 11 Detector-Module (`processing/findings/*.py`), `processing/findings_service.py`, `processing/findings_markdown.py` | wired |
| 2 | SQL `0024_knx_findings.sql`; `storage/findings_repo.py:FindingsRepository.record/list_findings/count_findings` | `processing/findings_service.py:list_findings_response/findings_markdown_response`; `api/findings.py:FindingsListView/FindingsMarkdownExportView`. **Aber:** `record(...)` hat KEINEN Produktiv-Caller — wird nur in Tests aufgerufen. | record orphan, list/count wired |
| 3 | SQL `0025_knx_finding_acks.sql`; `acknowledge/unacknowledge/is_acknowledged/list_acknowledgements` | `processing/findings_service.py:ack_finding_response/unack_finding_response`; `api/findings.py:FindingsAckView/FindingsAckDetailView` | wired |
| 4 | SQL `0026_knx_finding_severity_overrides.sql`; `set_severity_override/clear_severity_override/get_severity_override/list_severity_overrides/resolve_severity` | set/clear/list ueber `findings_service.py` -> `api/findings.py:FindingsSeverityOverrides*`; **`resolve_severity` ohne Produktiv-Caller** (nur Tests). User-Override greift damit nirgends. | set/clear/list/get wired, **resolve_severity orphan** |
| 5 | `processing/findings/__init__.py:lift_health_findings` + `lift_pattern_findings` (Mapping Legacy → neuer Vertrag) | keine; nur Tests. Bestandsdetektoren produzieren weiterhin `HealthFinding` / Legacy `Finding` direkt im KNX-Stats-View, statt ueber das neue Repo zu laufen. | **orphan** |
| 6 | `api/findings.py:FindingsListView` + `processing/findings_service.py:list_findings_response` | `api/messages.py:async_register_views` registriert View | wired |
| 7 | `api/findings.py:FindingsAckView` + `FindingsAckDetailView` + `ack_finding_response/unack_finding_response` | `async_register_views` | wired |
| 8 | `api/findings.py:FindingsSeverityOverridesView` + `FindingsSeverityOverrideDetailView` + `list_severity_overrides_response/set_severity_override_response/clear_severity_override_response` | `async_register_views` | wired |
| 9 | `frontend/src/components/findings-view.ts` (leere Komponente) | `frontend/src/messagehub-panel.ts` rendert Tab; gebundelt in `frontend_dist/messagehub-panel.js` | wired |
| 10 | `findings-view.ts`-Items + Severity-Pill + Detail-Pane + Ack-Action; `api-client.ts:listFindings/ackFinding/unackFinding` | findings-view via Panel, ApiClient via View | wired |
| 11 | SQL `0027_knx_dpt_inferred.sql`; `processing/knx_repo.py:KnxAddressRepository.set_dpt_inferred/get_dpt_inferred` | keine. `knx_stats_service.py` baut zwar einen `inferred_map` aus `infer_dpt_from_samples`, persistiert ihn aber NICHT via `set_dpt_inferred`. Der frische DB-Wert bleibt damit immer NULL. | **set_dpt_inferred orphan**, get_dpt_inferred orphan |
| 12 | `processing/findings/dpt_mismatch.py:detect_dpt_mismatch` + `DPT_MISMATCH_CONFIDENCE_THRESHOLD` | keine | **orphan** |
| 13 | `processing/findings/value_range.py:detect_value_out_of_range` + `KNX_DPT_VALUE_RANGES` (const.py) | `KNX_DPT_VALUE_RANGES` ist konsumiert, `detect_value_out_of_range` nicht. | **orphan** |
| 14 | i18n-Strings `findings.dpt_mismatch.*` + `findings.value_out_of_range.*` in 6 `translations/*.json` + `frontend/src/utils/findings-i18n.ts` | UI rendert via `getFindingTitle/Description` aus i18n-Modul; greift, sobald die Detektoren Findings emittieren. | wired (nur die UI-Komponente; ohne Detektoren keine Findings, deren Strings sich aufloesen) |
| 15 | `processing/findings/multi_responder.py:detect_multi_responder` | keine | **orphan** |
| 16 | `processing/findings/read_no_response.py:detect_read_no_response` + `READ_NO_RESPONSE_TIMEOUT_SEC` | keine | **orphan** |
| 17 | `processing/findings/toggle_loop.py:detect_toggle_loop` + Konstanten | keine | **orphan** |
| 18 | `processing/findings/multi_time_master.py:detect_multi_time_master` + `CLOCK_DPTS` | keine | **orphan** |
| 19 | i18n-Strings Phase 3 in 6 Sprachen | UI via i18n-Modul | wired (siehe 14) |
| 20 | `processing/findings/reconnect_storm.py:detect_reconnect_storm` + Konstanten | keine | **orphan** |
| 21 | `processing/findings/send_cycle_drift.py:detect_send_cycle_drift` + Konstanten | keine | **orphan** |
| 22 | `processing/findings/repeat_approximation.py:detect_repeat_approximation` + Konstanten | keine | **orphan** |
| 23 | i18n-Strings Phase 4 in 6 Sprachen | UI via i18n-Modul | wired (siehe 14) |
| 24 | `processing/findings/orphan_ga.py:detect_orphan_ga` | keine | **orphan** |
| 25 | `processing/findings/stale_ga.py:detect_stale_ga` + `STALE_GA_DEFAULT_THRESHOLD_DAYS` | keine | **orphan** |
| 26 | i18n-Strings Phase 5; `frontend/src/utils/findings-i18n.ts:PROJECT_RELATED_CODES/isProjectRelated`; Filter "Nur Projekt-Befunde" in `findings-view.ts` | findings-view nutzt isProjectRelated im Filter | wired |
| 27 | `frontend/src/components/severity-override-form.ts` + ApiClient-Methoden `getSeverityOverrides/putSeverityOverride/deleteSeverityOverride` | findings-view rendert Form-Submenue | wired |
| 28 | `processing/prometheus.py:format_prometheus_metrics(finding_total=...)` | `api/messages.py:MetricsView.get` ruft `format_prometheus_metrics` OHNE `finding_total`-Parameter auf — die Aggregation `(code, severity) -> count` aus `knx_findings` wird NIE ueber den /metrics-Endpoint exponiert. | **orphan (finding_total Param)** |
| 29 | `processing/findings_markdown.py:format_findings_markdown` + `findings_markdown_response`; `api/findings.py:FindingsMarkdownExportView`; ApiClient-`fetchFindingsMarkdown` + UI-Button "MD-Export" | View registriert via `async_register_views`; Frontend-Button im findings-view-Header | wired |

## Bilanz (vor Folge-Iter 29a-29x)

- **wired:** Iter 3, 6, 7, 8, 9, 10, 14, 19, 23, 26, 27, 29 (12 Iter)
- **partial wired:** Iter 1, 2, 4, 28 (4 Iter — Hauptpfad da, aber
  einzelne Symbole orphan: `record`, `resolve_severity`, `finding_total`)
- **orphan:** Iter 5, 11, 12, 13, 15, 16, 17, 18, 20, 21, 22, 24, 25
  (13 Iter — alle 11 neuen Detektoren plus `lift_health_findings` /
  `lift_pattern_findings` plus `set_dpt_inferred`)

## Status nach Iter 29a (Per-GA-Detector-Runner on-demand)

Geschlossen durch `processing/findings_runner.py:run_per_ga_detectors`,
gerufen aus `processing/findings_service.py:refresh_findings_response`,
gerufen aus `api/findings.py:FindingsRefreshView` (`POST
/api/messagehub/findings/refresh`), gerufen aus dem Frontend-Button
`Aktualisieren` in `findings-view.ts`.

| Iter | Symbol | Caller jetzt |
|------|--------|--------------|
| 2 | `FindingsRepository.record` | `_record_with_severity_override` im Runner |
| 4 | `resolve_severity` | `_record_with_severity_override` im Runner |
| 5 | `lift_pattern_findings` | `_legacy_pattern_findings` im Runner |
| 11 | `KnxAddressRepository.set_dpt_inferred` | `_persist_inferred_dpt` im Runner |
| 12 | `detect_dpt_mismatch` | `_per_ga_findings` im Runner |
| 13 | `detect_value_out_of_range` | `_per_sample_findings` im Runner |
| 15 | `detect_multi_responder` | `_per_ga_findings` im Runner |
| 16 | `detect_read_no_response` | `_per_ga_findings` im Runner |
| 17 | `detect_toggle_loop` | `_per_ga_findings` im Runner |
| 22 | `detect_repeat_approximation` | `_per_ga_findings` im Runner |

Verbleibend orphan: `lift_health_findings` (5), `detect_multi_time_master`
(18), `detect_reconnect_storm` (20), `detect_send_cycle_drift` (21),
`detect_orphan_ga` (24), `detect_stale_ga` (25), `format_prometheus_metrics(finding_total=)` (28).
Alle bus-weit (oder `MULTI_TIME_MASTER` als pseudo-bus-weit) und werden
in Iter 29b / 29c verdrahtet.

## Konsequenz: Was sieht der User HEUTE im laufenden System?

- Konfigurations-Check-Tab als 3. Sub-Tab: **leere Tabelle**, weil
  niemand `FindingsRepository.record(...)` aufruft.
- Severity-Override-Form, Markdown-Export-Button, Filter "Nur Projekt-
  Befunde": **funktional, aber leerlauf**, weil keine Daten zum Filtern
  / Exportieren da sind.
- Prometheus `/metrics`: **kein `messagehub_knx_finding_total`**,
  weder mit Daten noch mit dem leeren `# HELP/# TYPE`-Header.
- KNX-Stats-Tab funktioniert weiterhin (nutzt seinen eigenen
  Bestand-Pfad ueber `compute_health_score` + `detect_patterns`),
  ueberlappt aber NICHT mit dem neuen Findings-Tab.

## Folge-Iter (Hybrid-Wiring nach Konzept §9.9)

Nach User-Designentscheidung (Option C):

- **Iter 29a** — Per-GA-Detector-Runner (on-demand via API):
  schliesst Iter 11 (`set_dpt_inferred`), Iter 12, 13, 15, 16, 17,
  22, plus Lift fuer Iter 5 (`lift_pattern_findings`). Inkl.
  Severity-Resolver-Anwendung in `record(...)` (Iter 4-Luecke).
- **Iter 29b** — Bus-wide-Detector-Runner (periodisch via Job):
  schliesst Iter 5 (`lift_health_findings`), 18, 20, 21, 24, 25.
- **Iter 29c** — Prometheus `finding_total` aus `knx_findings`-Tabelle
  in `MetricsView` aggregieren und durchreichen: schliesst Iter 28.
- **Iter 29d** — falls Audit nach 29a zeigt, dass `resolve_severity`
  immer noch nicht in `record` greift, separater Iter.

Nach den 29x-Iter: Audit-Eintraege pro vorher-orphan-Symbol von
`orphan` auf `wired` umstellen, mit Verweis auf den Caller.
