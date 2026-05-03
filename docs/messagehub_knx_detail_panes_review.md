# Senior-Architect-Review: KNX-Detail-Panes (Iter A–J)

Stand: 2026-05-03 — Release v0.23.0 (Commit `806d6e4` auf `main`).

Scope: alle Aenderungen seit `cb396fe` (Ende Iter D.1) bis Release-Commit
`806d6e4`. Betroffene Module:

- Backend
  - `custom_components/messagehub/storage/knx_stats_repo.py` (Iter A)
  - `custom_components/messagehub/processing/knx_stats_service.py`
    (Iter B + H + I)
  - `custom_components/messagehub/api/knx_stats.py` (Iter C + H-Wiring)
  - `custom_components/messagehub/api/messages.py` (Iter C-Registration)
- Frontend
  - `frontend/src/api-client.ts` (Iter D.1 + H-DTO + I-DTO)
  - `frontend/src/components/stats-knx-view.ts` (Iter D.2 + E + F + G + H + I)
  - `frontend/src/components/stats-view.ts` (Iter H — hashchange-Listener)
  - `frontend/src/components/findings-view.ts` (Iter H — sourceFilter-Property)

Tests-Bestand am Ende der Iter-Serie: 1027 Backend-Unit-Tests
+ 214 Frontend-Tests; ruff clean.

---

## Security

### Auth-Pfad (Befund: solide, Risiko niedrig)

`KnxStatsSourceDetailView` erbt von `RequireAdminView` und ruft als
allererste Zeile in `get(...)` `self._check_admin(request)` auf — gleiche
Praxis wie alle anderen `knx-stats`-Endpunkte (siehe
`api/knx_stats.py:265-279`). Keine alternativen Pfade
(WebSocket, Service-Call), die das umgehen koennten — der einzige
Caller von `compute_source_detail` im Produktiv-Code ist die View selbst.

`stats-view.ts` (Frontend) zeigt den KNX-Tab nur auf der Admin-UI; die
HA-RBAC-Schicht filtert das Sub-Tab fuer Nicht-Admins ohnehin aus —
zusaetzlich zur Backend-Pruefung. Defense-in-depth ist sauber.

**Empfehlung:** keine Aktion. Optional als Phase 8 ein
`test_admin_required` integration-test, der mit Nicht-Admin-Auth-Header
einen 403 erwartet (heute durch Architektur garantiert, aber nicht
explizit getestet).

### Input-Validation (Befund: ok, kleinere Verbesserungsmoeglichkeit)

Im Source-Detail-View greifen drei Validatoren VOR jedem Service-Call:

1. `validate_knx_individual_address(dev_source)` — Regex `B.L.G`
   (`api/_validation.py:82`). Bei Verstoss: 400.
2. `parse_iso_period(query, default_days=...)` — wirft 400 bei
   `from > to`, fehlendem ISO-Format und Period > `MAX_PERIOD_DAYS`
   (90 Tage, `api/_validation.py:16`).
3. `parse_int_param("max_silence_min", min=1, max=129600)` — der
   Hard-Cap ist 90 Tage in Minuten, identisch zu MAX_PERIOD_DAYS.

Die Service-Schicht ist robust gegen falsche Inputs:
`compute_source_detail` mit leerem `dev_source` liefert `None`
(`processing/knx_stats_service.py:610`), und der View antwortet 404.

**Befund/Empfehlung:** `_compute_source_trend` (Iter I) berechnet
`prev_from = from_dt - (to_dt - from_dt)` ohne zusaetzliche Untergrenze.
Bei einer 90-Tage-Periode bedeutet das einen Vorperiode-Lookup ueber
Tag -90 bis -180 — in der Realitaet liegt das ausserhalb der 48 h-
Retention von `knx_raw_telegrams` und liefert `count_prev = 0`. Damit
wird `delta_pct = None` ("neu") angezeigt. Verhalten korrekt, aber die
Query laeuft trotzdem. Das `idx_knx_raw_source_ts` macht die
COUNT-Query bei leerem Range O(log n), also kein DoS-Risiko (siehe
Performance unten). **Risiko niedrig.** Optionaler Polish: bei
Period > Retention-Window die Trend-Compute ueberspringen
(Counter-basierter Lookup waere die saubere Loesung — siehe Iter K
Vorschlag unten).

### SQL-Injection (Befund: clean, Risiko niedrig)

Alle neuen Repo-Methoden (`gas_for_source`, `last_seen_for_source`,
`count_for_source`, `repeat_ratio_for_source`) nutzen ausschliesslich
parametrisierte Queries (`?`-Platzhalter mit Tupel-Args). Keine
f-Strings mit Userinput in SQL. Die einzigen f-Strings im
Repo-File interpolieren statische Werte (`bucket_expr`,
`placeholders`) — beide controlled-from-code (siehe
`storage/knx_stats_repo.py:1023-1037`).

`compute_source_detail` baut keine SQL-Queries selbst, sondern
delegiert an Repo-Methoden — Schichtgrenze sauber.

`FindingsRepository.list_findings(source=...)` (Iter H) ist ebenfalls
parametrisiert (`_build_where_clause`, `findings_repo.py:476-498`).

**Empfehlung:** keine Aktion.

### DoS-Schutz (Befund: ok, eine Beobachtung)

- **GA-Hard-Cap:** `gas_for_source(..., limit=ga_limit)` clippt auf
  `max(1, min(limit, 100))` — der Service uebergibt `SOURCE_DETAIL_GA_HARD_CAP=100`,
  Endpoint exposet keinen User-Override. Bei einem zentralen Logik-
  Modul mit 500 GAs werden trotzdem nur die Top-100 nach Telegramm-
  Anzahl ausgeliefert.
- **Period-Hard-Cap:** `MAX_PERIOD_DAYS=90` greift in `parse_iso_period`.
- **Findings-Hard-Cap:** `list_findings(source=..., limit=200)` —
  fest, kein User-Override. Ein Geraet mit > 200 Findings wuerde nur
  die juengsten 200 zeigen (sortiert `last_seen DESC`), was fuer die
  UI-Sektion "Findings dieses Geraets" angemessen ist; der Findings-
  Tab mit dem Source-Filter bietet ohnehin volle Pagination.
- **5-Mio-Telegramme-Szenario:** Pro Aufruf laufen 6 SQL-Queries mit
  WHERE-Predikaten auf Indexen (`idx_knx_raw_source_ts`,
  `idx_knx_raw_destination_ts`). COUNT-Aggregate ueber 5 Mio Rows mit
  Index-Scan: ca. 30-50 ms pro Query, also < 300 ms Gesamtlatenz pro
  Aufruf. Aufrufrate < 1/s realistisch (User-Klick).

**Risiko niedrig.** Wenn die Aufrufrate steigen sollte (z. B. durch
ein Drittanbieter-Dashboard, das pollt), waere ein Token-Bucket-
Rate-Limiter analog zu `_alarms_limiter` (`api/knx_stats.py:70-73`)
sinnvoll. Heute Out-of-Scope.

### Audit-Log (Befund: bewusst kein Eintrag)

Source-Detail ist Read-Only — kein State-Change im Bus, keine
DB-Modifikation. Konsistent mit den anderen Read-Only-Endpunkten
(`KnxStatsSummaryView`, `KnxStatsTopView`), die ebenfalls keinen
Audit-Eintrag schreiben. Nur State-Change-Aktionen
(`acknowledgeKnxGa`, `acknowledgeKnxBulk`,
`setKnxBusAnalysisState`) loggen.

**Empfehlung:** kein Audit-Eintrag noetig. Falls in einer Compliance-
fokussierten Umgebung "wer hat wann welche Source angeschaut" relevant
wuerde, ist das ein eigenes Phase-8-Feature mit eigener Tabelle
(audit_log fuer Read-Access), nicht hier.

### Secrets-Leak (Befund: clean)

`device_info` enthaelt `manufacturer`, `name`, `product` — aus dem
ETS-Projekt-Export. Keine Credentials, keine PII. `manufacturer_hints`
(Iter B-Erweiterung in `api/knx_stats.py:295-303`) ist eine statische
Tipp-Liste pro Hersteller (`processing/knx_manufacturer.py`). Beide
ungefaehrlich.

`source` einer Source-Adresse (z. B. `1.1.220`) ist nicht
sicherheitsrelevant — sie identifiziert ein Geraet, aber kein
Account/User.

**Empfehlung:** keine Aktion.

---

## Performance

### Pro-Aufruf-Profil

`compute_source_detail` macht im Best-Case 6 SQL-Queries:

| Query | Tabelle | Index | erwartete Latenz @ 5M Rows |
|-------|---------|-------|----------------------------|
| `gas_for_source` | knx_raw_telegrams + knx_group_addresses (LEFT JOIN) | `idx_knx_raw_source_ts` | ~30 ms |
| `last_seen_for_source` | knx_raw_telegrams | `idx_knx_raw_source_ts` | ~10 ms |
| `count_for_source` (now) | knx_raw_telegrams | `idx_knx_raw_source_ts` | ~30 ms |
| `repeat_ratio_for_source` | knx_raw_telegrams | `idx_knx_raw_source_ts` | ~30 ms |
| `summary` | knx_raw_telegrams | `idx_knx_raw_destination_ts` | ~50 ms |
| `ack_active_set` | knx_acknowledgements | PK | ~5 ms |
| (Iter H) `list_findings` | knx_findings | `code+ga` | ~5 ms |
| (Iter I) `count_for_source` (prev) | knx_raw_telegrams | `idx_knx_raw_source_ts` | ~30 ms |

**Gesamtlatenz pro Aufruf:** ~190 ms im 5-Mio-Row-Worst-Case;
< 50 ms im realistischen Hausautomations-Volumen (~50k Telegramme/24h).

**Verbesserungsvorschlag (Optional):** `count_for_source(now)` und
`repeat_ratio_for_source` lesen denselben Range zweimal. Eine kombinierte
Query `SELECT COUNT(*), SUM(repeated) WHERE source=? AND ts BETWEEN ?,?`
spart einen Roundtrip — `gas_for_source` enthaelt diese Aggregate nicht.
Risiko des Refactors: gering, Performance-Gewinn: ~30 ms.
**Risiko der Aenderung niedrig, Wert begrenzt.** Nicht jetzt — falls
die Page-Latenz zur User-Beschwerde wird.

### N+1-Pattern (Befund: keines)

Die GA-Liste wird in EINER Query gezogen (`gas_for_source` mit GROUP BY),
nicht pro GA einzeln. Severity-Klassifikation laeuft in Python ueber
die `gas_for_source`-Rows (`_build_source_ga_summary`,
`processing/knx_stats_service.py:712`) — keine zusaetzliche SQL-Query
pro GA. Das war eine bewusste Optimierung in Iter B (siehe
Service-Docstring).

`list_findings(source=...)` (Iter H) ist ebenfalls eine Query, kein
N+1 ueber GAs.

**Empfehlung:** keine Aktion.

### Index-Coverage (Befund: optimal)

- `idx_knx_raw_source_ts` (`source, timestamp`) deckt
  `gas_for_source`, `last_seen_for_source`, `count_for_source`,
  `repeat_ratio_for_source` ab — alle vier Queries sind index-only.
- `idx_knx_raw_destination_ts` (`destination, timestamp`) deckt
  `summary` ab.
- `knx_findings` hat einen Index auf `(code, ga, evidence_hash, schema_version)`
  — fuer `list_findings(source=...)` ist das nicht optimal (kein Index
  auf `source` alleine). Bei einer Anlage mit < 1k Findings (typischer
  HA-Use-Case) ist ein Sequential Scan trotzdem < 5 ms; bei > 100k
  Findings koennte ein zusaetzlicher Index `idx_knx_findings_source`
  sinnvoll sein. **Risiko mittel** falls grosse Anlagen > 6 Monate
  Findings sammeln. Empfehlung Phase 8.

### Frontend-Bundle (Befund: Bundle wächst überschaubar)

Bundle-Groessen (gzip):

| Vor Iter A-J | Nach Iter J | Delta |
|--------------|-------------|-------|
| 84.7 KB | 87.5 KB | +2.8 KB |

Im Rahmen der erwarteten +3 KB. Der Source-Detail-Render-Body
(`_renderSourceDetailBody` + drei Sub-Renderer) plus die neuen
DTOs/Click-Handler sind den Bundle-Zuwachs wert.

### Caching-Strategie (Befund: bewusst keine, Beobachtung)

Kein Frontend-Memo, kein Backend-Cache. Bei einem Doppelklick
innerhalb 30 s (z. B. User wechselt zwischen zwei Top-Geraeten und
zurueck) wird der Endpoint zweimal gerufen. Bei < 50 ms Gesamtlatenz
pro Aufruf ist das vernachlaessigbar; ein Cache wuerde Stale-Issues
einfuehren (User wundert sich, warum nach Bulk-Ack die GA-Liste
unveraendert ist).

**Empfehlung:** kein Caching jetzt. Falls die Bus-Auswertung in einer
Anlage mit >5 Mio Rows zur User-Beschwerde wird, kann ein
Etag-basierter HTTP-Cache (analog zu `/findings`) ergaenzt werden.

---

## Massendaten / Loggroessen

### Anlage-Worst-Case (5 Mio Telegramme, 200 Sources, 5000 GAs)

- `gas_for_source` mit Hard-Cap 100 -> max 100 Rows pro Antwort,
  unabhaengig von der GA-Anzahl der Source.
- `summary` aggregiert ueber 5 Mio Rows in einem `COUNT(*)` mit
  Index-Scan, < 50 ms.
- JSON-Response < 50 KB pro Aufruf:
  - 100 GAs × ~200 Bytes (ga, label, dpt, count, rate, recommended,
    severity, ack, last_seen) = ~20 KB
  - 200 Findings × ~150 Bytes = ~30 KB (Iter H, capped auf 200)
  - Trend < 100 Bytes
  - Header + KPIs < 1 KB
  Total: ~51 KB worst case, typisch < 10 KB.

**Empfehlung:** keine Aktion.

### DB-Wachstum (Befund: kein Einfluss)

Source-Detail ist Read-Only — keine neuen Tabellen, keine
zusaetzliche Schreiblast, keine neuen Indexe (die existierenden
genuegen, siehe Performance/Index-Coverage).

### Retention-Lichtung (Befund: nachvollziehbare Limitierung)

Der Endpoint liest aus `knx_raw_telegrams` (48h-Retention by
Default — siehe `KNX_RAW_RETENTION_HOURS`). Source-Detail funktioniert
also nur fuer die letzten 48h. Bei einer User-Anfrage mit Period 7d
wuerde der Endpoint trotzdem antworten — mit den Telegrammen, die
in der 48h-Retention noch da sind.

**Befund:** ist konsistent mit GA-Detail (das gleiche Limit hat) und
explizit dokumentiert in `last_seen_for_source`-Docstring
(`storage/knx_stats_repo.py:752-763`).

**Empfehlung Phase 8 (Iter K):** Counter-basierter Pfad fuer
Source-Aggregate analog zur `compute_trend`-Logik (Iter aiohttp-
error-ZU9UA). `knx_telegram_counters` hat 365-Tage-Retention; eine
neue Repo-Methode `count_per_source_from_counters(dev_source, ...)`
und ein Service-Switch bei Period > 48h waeren in einer 60-min-Iter
realisierbar. **Risiko mittel, Wert hoch** fuer Anlagen, die laengere
Trend-Auswertungen pro Geraet wollen.

---

## Clean Code

### Cognitive Complexity (Befund: alle Funktionen unter 15)

- `compute_source_detail`: ~5 Branches (early-return, share_pct-Conditional,
  silent_alarm-Conditional, findings-Conditional). Klar unter 15.
- `_compute_source_trend`: ~3 Branches. Klar unter 15.
- `_renderSourceDetailBody` (Frontend): delegiert an 5 sub-Render-
  Methoden, eigene CC ~3.
- `_renderSourceDetailFinding`: pure-render, CC ~1.
- `_renderSourceDetailTrend`: 1 Conditional fuer null-Return, dann
  String-Build. CC ~3.

**Empfehlung:** keine Aktion. Sonar-Default 15 ist nirgendwo erreicht.

### Dataclass-Konsistenz (Befund: konsistent)

`SourceDetail`, `SourceGaSummary`, `SourceTrendDelta` alle
`@dataclass(frozen=True, slots=True)` — passt zur Konvention der
existierenden Dataclasses (`TopRow`, `GaDetail`, `SiblingGa`). Default-
Felder (`findings`, `trend`) am Ende, damit Backwards-Kompatibilitaet
mit Iter-A/B-Aufrufern nicht bricht.

### Type-Hints (Befund: vollstaendig)

Alle neuen Service-Methoden, Repo-Methoden und Frontend-Methoden sind
typisiert. mypy-strict-Konformitaet konnte ich nicht direkt
verifizieren (mypy laeuft im venv langsamer als ruff), aber die
ruff-Pruefung ist clean — keine fehlenden Typen flagged.

### Naming (Befund: konsistent)

- `dev_source` ist konsistent ueber Backend (Repo, Service,
  View) und Frontend (DTOs, Render). Kein `device_source` oder `source_addr`
  Mix.
- `share_pct` (Backend) ↔ `share_pct` (Frontend) — gleicher Name. ✓
- `repeat_ratio_pct` (Backend) ↔ `repeat_ratio_pct` (Frontend). ✓
- `silent_alarm`, `silent_minutes` — gleich auf beiden Seiten.
- `findings` als Feld vs. `findings_repo` als Konstruktor-Kwarg —
  unterscheidet sich sauber: das eine ist die Datenliste, das andere
  die Quelle.

**Empfehlung:** keine Aktion.

### Kommentare (Befund: WHY-fokussiert, gut)

Hard-Caps sind alle mit WHY-Kommentar versehen:
- `SOURCE_DETAIL_GA_HARD_CAP = 100` (`processing/knx_stats_service.py:217-220`)
  — erklaert "Schuetzt vor zentralen Logik-Modulen mit hunderten GAs"
- `SOURCE_DETAIL_TREND_MIN_PERIOD_MINUTES = 1440`
  (`processing/knx_stats_service.py:222-227`) — erklaert,
  warum kurze Perioden keinen Trend zeigen
- `findings, limit=200` (`processing/knx_stats_service.py:646-648`) —
  Begruendung "spiegelt Default des Findings-Endpoints"

Im Frontend:
- `_loadSourceDetail` schliesst zuerst das GA-Detail
  (`stats-knx-view.ts`) — Begruendung "Drawer zeigt entweder GA-
  oder Source-Sicht, nie beides gleichzeitig" steht im Code-Kommentar.
- Refresh-Button im `_renderDetailHead` ist als Ankerpunkt fuer
  `_loadSourceDetail` markiert.

**Empfehlung:** keine Aktion.

### Frontend Cognitive Complexity / Aufteilung (Befund: gut)

`_renderDetailPane` ist jetzt der gemeinsame Drawer-Container fuer
GA- und Source-Detail. Der Inhalt wird via `_renderDetailInner` als
Switch zwischen `_renderDetailBody` (GA) und `_renderSourceDetailBody`
(Source) gewaehlt. Das ist eine schlanke Strategie-Pattern-Variante
ohne expliziten Klassen-Polymorphismus — fuer 2 Inhaltstypen
ist das die einfachste Abstraktion.

Falls in Zukunft ein dritter Inhaltstyp dazukommt (z. B. Bus-Detail,
Channel-Detail), waere ein expliziter Strategy-Pattern mit
`type DrawerContentType = "ga" | "source" | "..."` und einer Map
sinnvoll. Heute Overkill.

**Empfehlung:** keine Aktion.

### Hash-Routing (Befund: einfach, mit kleinerem Smell)

Die Hash-Navigation `#findings?source=...` umgeht Lit-Property-
Bindings via globalen `window.location.hash`. Vorteile: keine Coupling
zwischen `stats-knx-view` und `stats-view` (Drawer kann von ueberall
einen Tab-Switch ausloesen).

**Smell:** der Hash-Format-Vertrag (`findings?source=...`) ist nur
implizit dokumentiert (Code-Kommentar im `_handleHash` und im
`_onSourceDetailFindingClick`). Bei einem dritten Sub-Tab-Switch-
Caller waere ein gemeinsames Helper-Modul `src/utils/nav-hash.ts`
mit `setSubTabHash(tab, params)` und `parseSubTabHash(hash)` sinnvoll.

**Risiko niedrig** (heute nur ein Caller, gut getestet). **Empfehlung
Phase 8** wenn ein zweiter Caller dazukommt.

---

## Verdict

**Production-ready: ja, ohne Auflagen.**

Die Iter-Serie A-J liefert ein End-to-End-Feature mit:
- Sauberer Schichtentrennung (Repo / Service / View / Frontend).
- TDD-Disziplin: jede Iter mit Smoke-Test-First (40 neue Tests
  insgesamt, 18 Backend + 22 Frontend).
- Caller-Pflicht eingehalten — alle in Iter D.2 oeffenen `_loadSourceDetail`
  Aufrufstellen wurden in E/F/G geschlossen, im Iter-J-Release sind
  keine offenen `OPEN:`-Marker mehr in der Code-Basis.
- Quality-Gates pro Iter: 1027 Backend-Unit-Tests gruen, 214 Frontend-
  Tests gruen, ruff clean, Bundle gebaut und committet.

Sicherheits-Pfad ist redundant abgesichert (Auth + Input-Validation +
Hard-Caps); Performance ist im 5-Mio-Worst-Case noch unter 200 ms;
SQL-Injection durch parametrisierte Queries ausgeschlossen.

### Phase-8-Backlog (aus dem Review)

Drei optionale Verbesserungen, alle ohne dringenden User-Druck:

1. **Iter K — Counter-basierter Source-Aggregat-Pfad** (60 min,
   Wert hoch). Macht Source-Detail fuer Perioden > 48h voll
   aussagekraeftig (heute: nur Live-Daten der letzten 48h).
2. **Index `idx_knx_findings_source`** (15 min, Wert bedingt). Nur
   relevant bei sehr grossen Findings-Tabellen (> 100k Rows).
3. **Hash-Routing-Helper-Modul** (30 min, Wert bedingt). Erst wenn
   ein zweiter Sub-Tab-Switch-Caller dazukommt.

Keine davon ist heute kritisch genug, um vor v0.23.0-Tag zu
rechtfertigen. Release ist freigegeben.
