# Snapshot-Fixtures fuer KNX-Findings (Iter 30)

Pro Detector ein anonymisiertes SQL-Snapshot, das beim Laden in eine
frische DB eine reproduzierbare Konstellation erzeugt. Tests in
`tests/test_finding_snapshots.py` laden das Snapshot, rufen den
passenden Runner auf (per-GA oder bus-wide) und vergleichen den
Finding-Set mit der Erwartung.

## Liste

| Datei | Detector | Erwartung |
|-------|----------|-----------|
| `dpt_mismatch.sql` | DPT_MISMATCH | Soll 9.001, Ist 1.001 (>=30 Samples) -> Finding |
| `value_out_of_range.sql` | VALUE_OUT_OF_RANGE | DPT 5.001 mit Wert 200 -> Finding |
| `multi_responder.sql` | MULTI_RESPONDER | 2 Sources antworten binnen 1 s -> Finding |
| `read_no_response.sql` | READ_NO_RESPONSE | Read ohne Response binnen 3 s -> Finding |
| `toggle_loop.sql` | TOGGLE_LOOP | DPT 1.001 alterniert in <2 s ueber 4+ Zyklen -> Finding |
| `repeat_approximation.sql` | REPEAT_APPROXIMATION | 6 Doppel-Telegramme innerhalb 100 ms binnen 24 h -> Finding |
| `multi_time_master.sql` | MULTI_TIME_MASTER | 2 Sources schreiben auf DPT 10.001 -> Finding |
| `reconnect_storm.sql` | RECONNECT_STORM | Stille >=60 s + 100-Telegramm-Burst in 30 s danach -> Finding |
| `send_cycle_drift.sql` | SEND_CYCLE_DRIFT | Recent-Median(Δt) <50% von Baseline -> Finding |
| `orphan_ga.sql` | ORPHAN_GA | Whitelist-GA mit 0 Telegrammen -> Finding |
| `stale_ga.sql` | STALE_GA | Whitelist-GA mit last_seen > 30 Tage -> Finding |
| `health_busload.sql` | HEALTH_BUSLOAD | 1500 Telegramme in 10 s -> Buslast > 20% -> Finding |

## Konvention

- Eine GA-/Source-Adresse pro Detector, damit das Snapshot isoliert
  testbar ist (kein Cross-Talk).
- Timestamps absolut, basierend auf `2026-05-03T08:00:00+00:00` als
  Stichtag (siehe CLAUDE.md `currentDate`).
- Anonymisiert: keine echten Geraete-Adressen, nur `1.1.x` mit x
  pro Detector unterschiedlich, damit Tests parallel laufen koennen.
- INSERT statements in der Reihenfolge:
  1. `knx_group_addresses` (wenn der Detector die braucht).
  2. `knx_raw_telegrams`.

## Wartung

Heuristik-Schwellen aendern sich (z. B. `DPT_MISMATCH_CONFIDENCE_THRESHOLD`,
`STALE_GA_DEFAULT_THRESHOLD_DAYS`). Wenn ein Snapshot nach einer
Threshold-Aenderung das Finding nicht mehr ausloest, ist die Snapshot-
Inhalt zu erweitern (mehr Samples, weiter zurueck), NICHT die Schwelle
zu loosen — das Snapshot ist die Regression-Probe.
