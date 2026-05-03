# Konzept: Detail-Panes pro Widget im KNX-Analyse-Tab

Stand: 2026-05-03 (nach v0.22.0). Quelle Diskussion: User-Wunsch
Top-Geräte / Trend gegenüber Vorperiode / Stille-Alarme bekommen den
gleichen Click-into-Detail-Workflow wie Top-Sender heute.

## Ist-Zustand (Top-Sender)

Das Detail-Pane fuer eine Gruppenadresse (`KnxStatsGaDetailDto` aus
`compute_ga_detail`) zeigt heute:

- Header: GA, Label, Source-Adresse, DPT.
- KPIs: Ist-Rate, Soll-Rate, Verhaeltnis, geschaetzte Reduktion.
- Empfehlung mit Severity-Klasse.
- Erkannte Anti-Pattern-Findings (Legacy `detect_patterns`).
- Wertverlauf-Sparkline (max 200 Punkte).
- Geraete-Info (Hersteller / Modell, Manufacturer-Hints).
- Sibling-GAs (andere GAs derselben Source) mit Rate.
- Schnell-Aktionen: HA-KNX-Konfig, KNX-User-Forum-Suche, CSV/JSON-Export.

Endpoint: `GET /api/messagehub/knx-stats/ga/{ga}` (`KnxStatsGaDetailView`).

## Ziel

Drei zusaetzliche Detail-Pane-Workflows; bewusst KEIN sechstes Modal,
sondern Wiederverwendung der vorhandenen `detail-pane`-Komponente mit
zwei neuen Inhalts-Typen:

1. **Top-Geräte** → klickbare Zeile öffnet **Source-Detail**.
2. **Trend gegenueber Vorperiode** → klickbare Zeile öffnet **GA-Detail**
   (existiert, nur Verdrahtung fehlt).
3. **Stille-Alarme** → klickbare Zeile öffnet **Source-Detail**.

Damit sind nur zwei distinkte Detail-Inhalte zu pflegen:
`KnxStatsGaDetailDto` (heute) und ein neuer `KnxStatsSourceDetailDto`.

## Detail-Inhalte: GA-Detail (bereits implementiert, wiederverwenden)

Verwendet fuer **Top-Sender** (heute) und neu **Trend**. Die Trend-
Liste hat bereits `row.ga` und `row.label` — der Klick triggert
denselben `_loadDetail(ga)`-Pfad wie die Top-Sender-Tabelle. Keine
Backend-Aenderung noetig.

## Detail-Inhalte: Source-Detail (neu)

Anker ist die Geraete-Source-Adresse (`1.1.x`). Vorhandene Daten im
Repo (siehe `KnxStatsRepository.gas_for_source`, `top_by_source`,
`silence_detect`, `discover_knx_devices`) reichen voellig aus —
braucht es eine neue Aggregator-Methode und einen neuen View.

### Vorgeschlagenes DTO `KnxStatsSourceDetailDto`

| Feld | Typ | Quelle | Bemerkung |
|------|-----|--------|-----------|
| `dev_source` | str | URL-Parameter | "1.1.5" |
| `manufacturer` | str \| null | `discover_knx_devices` (ETS-Projekt) | "Gira" |
| `device_name` | str \| null | `discover_knx_devices` | "Tastsensor 4-fach" |
| `product` | str \| null | `discover_knx_devices` | Produkt-ID |
| `total_count` | int | SUM(count) ueber GAs | Telegramme im Zeitraum |
| `ga_count` | int | gas_for_source-Length | Anzahl GAs |
| `share_pct` | float | total_count / summary.total_telegrams | Bus-Anteil |
| `last_seen` | iso \| null | MAX(timestamp) WHERE source = ? | Last-Activity |
| `silent_minutes` | float \| null | now - last_seen | nur wenn last_seen vorhanden |
| `silent_alarm` | bool | silent_minutes > Schwelle | spiegelt Silence-Alarm |
| `gas` | list[GaSummary] | gas_for_source-Erweiterung | siehe unten |
| `bus_health_per_source` | dict \| null | bus_health-Untermenge | repeat_ratio_pct fuer diese Source |
| `findings` | list[FindingDto] | knx_findings WHERE source=? | Quellen-bezogene Findings (RECONNECT_STORM etc.) |
| `trend_total` | TrendDelta \| null | Counter-Compare diese Source | wenn Periode >= 24h |

### `GaSummary` pro GA des Geraets

```ts
{
  ga: string;            // "1/2/3"
  label: string | null;  // aus knx_group_addresses
  dpt: string | null;
  count: number;         // Telegramme im Zeitraum
  rate_per_min: number;
  recommended_rate: number;
  ratio: number;
  severity: "green" | "yellow" | "orange" | "red";
  acknowledged: boolean; // wegen ack-bulk
  has_findings: boolean; // markiert GAs mit knx_findings-Eintrag
  last_seen: string | null;
}
```

Damit kann das Frontend pro GA nicht nur den Namen, sondern direkt
einen Severity-Pill, einen "Findings vorhanden"-Badge und einen
Klick-zu-GA-Detail-Link rendern. Per-GA-Sortierbarkeit gleich wie
die Top-Sender-Haupttabelle.

### Endpoint

`GET /api/messagehub/knx-stats/source/{dev_source}?from=...&to=...`

Service-Methode `KnxStatsService.compute_source_detail(dev_source,
from_iso, to_iso)` aggregiert in einem Round-Trip:

1. ETS-Projekt-Lookup (`discover_knx_devices`).
2. `gas_for_source` mit Limit 100 (Hard-Cap).
3. Pro GA: parallel `_build_top_row`-Aequivalent fuer Rate-/Severity-
   Berechnung (existierende Helfer ausleihen).
4. `last_seen_per_source(dev_source)` — neue Repo-Methode oder
   inline-SQL via existing `silence_detect`-Subset.
5. `FindingsRepository.list_findings(source=dev_source)` — Repo-Methode
   existiert bereits.
6. Optional Trend-Compare (24h-Fenster vs. Vorperiode), wenn
   `KnxStatsRepository.counter_total_for_source` ergaenzt wird —
   sonst weglassen und in einer Folge-Iter nachziehen.

## UI-Layout des Source-Detail-Panes

Header analog zum GA-Detail:

```
1.1.5 — Gira Tastsensor 4-fach (J0Q1Z)
12 GAs · 4.512 Telegramme (8 % Bus) · letzte Aktivitaet 12:34
[✕ Schliessen]
```

Body:

1. **KPI-Reihe**: Total-Count, GA-Count, Bus-Anteil, Wiederhol-Quote.
2. **Stille-Status**: wenn `silent_alarm`, prominente Warn-Zeile mit
   "seit X Std stumm".
3. **GA-Liste**: sortierbar (gleiche Ergonomie wie Top-Sender), Spalten
   GA · Label · DPT · Rate · Soll · Severity-Pill · Findings-Badge ·
   Klick → öffnet GA-Detail (das alte Pane innerhalb desselben Modals;
   Breadcrumb "Source > GA").
4. **Findings-Liste**: pro Code/Severity, mit Link in den Findings-Tab
   (vorbefuellter Filter `?source=1.1.5`).
5. **Trend gegenueber Vorperiode** (wenn Periode >= 24h): selber
   Diff-Pattern wie das Top-Level-Trend-Widget, aber gefiltert
   auf diese Source.
6. **Schnell-Aktionen**:
   - "✓ Alle X GAs als bekannt markieren" (Bulk-Ack — existiert).
   - "Findings refreshen fuer diese Source" — Schleife ueber
     `refreshFindings(ga)` ueber alle GAs des Geraets.
   - "ETS-Projekt: ApplicationProgram-ID" (wenn verfuegbar).
   - "Audit-Log fuer diese Source" — Link in den Audit-Tab mit Filter.

## Frontend-Wiring (3 Integrationen)

### 1. Top-Geräte → Source-Detail

- `_topBySource`-Tabelle: Klick auf eine Zeile (TR) öffnet das Detail-
  Pane via `_loadSourceDetail(dev_source)`.
- Sortierbar ist die Tabelle bereits (Iter 57). Neuer Hover-Cursor +
  Selection-Highlight wie bei Top-Sender.
- `KnxStatsView`-State erweitern: `_selectedSource: string | null` +
  `_sourceDetail: KnxStatsSourceDetailDto | null`.
- `_renderDetailPane()` erweitert um conditional-rendering:
  `_sourceDetail !== null` → Source-Body; sonst GA-Body.

### 2. Trend gegenueber Vorperiode → GA-Detail

- `top_increase`/`top_decrease`-Zeilen werden klickbar; Klick triggert
  `_loadDetail(row.ga)` (bereits da).
- Keine Backend-Aenderung. Nur Cursor + `@click` + selected-style.

### 3. Stille-Alarme → Source-Detail

- `silence-list`-Zeilen klickbar; Klick triggert
  `_loadSourceDetail(item.dev_source)`.
- Wiederverwendung des Source-Detail-Panes aus Iter 1.

## Architektur-Entscheidungen (zur Diskussion)

1. **Ein Detail-Pane-Slot, mehrere Inhalte.** Das vorhandene
   `aside.detail-pane` rendern wir je nach State:
   `_detail` (GA) **oder** `_sourceDetail` (Source). Kein zweites
   Modal. Trade-off: leichter Coupling-Effekt im Render-Code; Vorteil:
   der User sieht nur einen Detail-Bereich, nicht zwei nebeneinander.

2. **Source-Detail enthaelt KEINE eingebettete GA-Detail-Anzeige
   inline** — stattdessen klickt der User auf eine GA in der Liste,
   und das Pane wechselt zu GA-Detail mit Breadcrumb-Backlink. Das
   spart vertikale Scroll-Tiefe und macht die State-Maschine flach.

3. **Trend bleibt rein client-seitig fuer das Detail-Wiring** —
   keine neue API-Aenderung. Backend liefert weiterhin das normale
   Trend-DTO.

4. **Findings-Integration** im Source-Detail nutzt
   `FindingsRepository.list_findings(source=dev_source)` — existiert
   schon, kein neues Endpoint-Feld noetig.

5. **Caching**: Source-Detail hat keine teuere DPT-Inferenz wie das
   GA-Detail. Aggregation pro Klick ist OK; bei wiederholtem Klick
   auf dieselbe Source innerhalb 30 s reicht ein einfacher Memo-Cache
   im Frontend (analog zum GA-Detail-Cache, der heute schon im
   `KnxStatsView`-State liegt).

## Iter-Aufteilung (Vorschlag)

| Iter | Inhalt | Erwartet |
|------|--------|----------|
| **A** | Repo: `last_seen_per_source(dev_source)` + Test | <30 min |
| **B** | Service: `compute_source_detail(...)` ohne Trend, ohne Findings — nur GAs + KPIs + last_seen | 60 min |
| **C** | API-View `KnxStatsSourceDetailView` + DTO + Smoke-Test | 60 min |
| **D** | Frontend: `_sourceDetail`-State + `_loadSourceDetail` + neuer Render-Body + Tests | 60 min |
| **E** | Top-Geräte-Tabelle: Click-Handler + Selection-Highlight | <30 min |
| **F** | Stille-Alarme: Click-Handler + Selection-Highlight | <30 min |
| **G** | Trend-Liste: Click-Handler oeffnet GA-Detail | <30 min |
| **H** | Source-Detail: Findings-Liste integrieren (`list_findings(source=)`) + Test | 30 min |
| **I** | Source-Detail: Trend-Compare integrieren (Counter-basiert), wenn Periode >= 24h | 60 min |
| **J** | Doku + CHANGELOG + Snapshot-Fixture optional | 30 min |

Iter A-G ergeben den Mindest-User-Wert (drei Widgets klickbar, Source-
Detail laeuft). H-I sind separate Polish-Iter, die der User ueber den
Findings-Tab heute schon parallel bekommt — wir koennen sie spaeter
nachziehen, wenn das Source-Detail-MVP eingeschwungen ist.

## Out-of-Scope (bewusst)

- Kein neues Modal-System — wir arbeiten mit dem vorhandenen
  `detail-pane`-Slot.
- Kein Backend-Caching der Source-Detail-Antworten — Pro-Klick-
  Aggregation ist bei Top-100-Klicks pro Stunde und ~200 GAs / Source
  vertretbar (<50 ms pro Roundtrip in unseren Benchmarks).
- Keine Filter-Persistenz "letzte gewaehlte Source" — die `_selectedSource`-
  Variable wird mit Tab-Wechsel resettet, wie heute `_selectedGa`.
- Kein Sub-Tab "Geraete" — die Top-Geraete-Tabelle bleibt im
  KNX-Analyse-Tab; das Source-Detail erscheint im selben Detail-Slot.
