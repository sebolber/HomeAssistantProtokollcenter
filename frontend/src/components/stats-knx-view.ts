// Stats-Sub-Tab "KNX-Bus-Analyse".
// Iter 7: Skelett (erledigt).
// Iter 8: Filter-Bar (Periode, Top-N, Min-Rate, Acknowledged-Toggle) + KPIs.
// Iter 9: Top-Tabelle + Detail-Pane (folgt).
// Iter 10: Timeline-Sparkline (folgt).

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type {
  ApiClient,
  KnxStatsAlarmsDto,
  KnxStatsBurstsDto,
  KnxStatsBusHealthDto,
  KnxStatsBusloadDto,
  KnxStatsFilters,
  KnxStatsGaDetailDto,
  KnxStatsHealthScoreDto,
  KnxStatsLongTermDto,
  KnxStatsOrphansDto,
  KnxStatsSensitiveLogDto,
  KnxStatsSilenceDto,
  KnxStatsSummaryDto,
  KnxStatsTimelineDto,
  KnxStatsTopRowDto,
} from "../api-client.js";
import { tokens, cards, pills, buttons } from "../styles/tokens.js";
import "./knx-timeline-chart.js";
import "./knx-value-sparkline.js";

const STORAGE_KEY = "messagehub.knx-stats.filters";

// Periode-Presets in Tagen.
// Iter 22: Raw-Telegramm-Tabelle hat 48h Retention.
// Iter 39: > 48h sind Long-Term-Perioden — die UI wechselt in den
// degradierten Modus (Counter-Tabelle: nur Counts, keine Werte/Source).
const PERIOD_PRESETS: ReadonlyArray<{ id: string; label: string; days: number }> = [
  { id: "1h", label: "1 Std", days: 1 / 24 },
  { id: "6h", label: "6 Std", days: 0.25 },
  { id: "24h", label: "24 Std", days: 1 },
  { id: "48h", label: "48 Std", days: 2 },
  { id: "7d", label: "7 Tage", days: 7 },
  { id: "30d", label: "30 Tage", days: 30 },
  { id: "365d", label: "365 Tage", days: 365 },
];

// Periode-IDs, die Long-Term-Modus aktivieren (Counter-Tabelle statt Raw).
const LONG_TERM_PERIOD_IDS: ReadonlySet<string> = new Set(["7d", "30d", "365d"]);

const TOP_N_OPTIONS = [10, 25, 50, 100] as const;
// Iter 45 (N6): zwei separate Top-N-Einstellungen, eine fuer die
// Adress-Tabelle und eine fuer die Geraete-Tabelle. Werden im
// localStorage persistiert wie alle anderen Filter.

interface UiFilters {
  periodId: string; // einer der PERIOD_PRESETS.id oder "custom"
  topN: number; // Anzahl GAs in "Top-Sender (Gruppenadressen)"
  topNDevices: number; // Anzahl Geraete in "Top-Geraete (Source-Adressen)"
  minRate: number;
  includeAck: boolean;
}

const DEFAULT_FILTERS: UiFilters = {
  periodId: "24h",
  topN: 50,
  topNDevices: 25,
  minRate: 1.0,
  includeAck: true,
};

function loadFilters(): UiFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UiFilters>;
      return { ...DEFAULT_FILTERS, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_FILTERS };
}

function saveFilters(f: UiFilters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  } catch {
    // ignore
  }
}

function periodToIso(periodId: string): { from: string; to: string } {
  const preset = PERIOD_PRESETS.find((p) => p.id === periodId) ?? PERIOD_PRESETS[2];
  const to = new Date();
  const from = new Date(to.getTime() - preset.days * 86_400_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

// Iter 39: Im Long-Term-Modus muessen Raw-Endpoints (top, summary, busload,
// timeline, bus-health, silence) auf die letzten 48h gekappt werden — sie
// lesen aus knx_raw_telegrams (max 48h Retention) und wuerden bei groesseren
// Perioden 400-Bad-Request liefern.
const RAW_LIVE_WINDOW_HOURS = 48;
function rawLiveWindow(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - RAW_LIVE_WINDOW_HOURS * 3600 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

// Iter 59 / B2: 4-stufige Ampel-Klassifizierung aus dem Konzept
// (docs/messagehub_knx_statistik.md §3.1) auf mh-pill-Varianten mappen.
// Vorher griff green->neutral (grau) und yellow->info (blau) — entwertete
// die Ampel-Optik. Pure helper, modul-level export fuer Tests.
export function severityPillClass(
  sev: "green" | "yellow" | "orange" | "red"
): string {
  switch (sev) {
    case "red":
      return "mh-pill--error";
    case "orange":
      return "mh-pill--warning";
    case "yellow":
      return "mh-pill--caution";
    case "green":
      return "mh-pill--success";
  }
}

// Iter 60 / U5: Sortierbare Top-Sender-Tabelle. Pure helper, damit ohne
// Mount testbar. Severity-Sort nutzt Schweregrad-Rang (rot > orange >
// gelb > gruen).
export type TopSenderSortKey =
  | "ga"
  | "label"
  | "rate_per_min"
  | "recommended_rate"
  | "severity";

const _SEVERITY_RANK: Record<"green" | "yellow" | "orange" | "red", number> = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3,
};

interface SortableTopSenderRow {
  ga: string;
  label?: string | null;
  rate_per_min: number;
  recommended_rate: number;
  severity: "green" | "yellow" | "orange" | "red";
}

export function sortTopSender<T extends SortableTopSenderRow>(
  rows: T[],
  key: TopSenderSortKey,
  dir: "asc" | "desc"
): T[] {
  const sorted = [...rows].sort((a, b) => {
    let cmp: number;
    switch (key) {
      case "ga":
        cmp = a.ga.localeCompare(b.ga);
        break;
      case "label": {
        // Leere Labels ans Ende, egal ob asc/desc — sind nicht sinnvoll
        // sortierbar und stoeren bei Suche.
        const aEmpty = !a.label;
        const bEmpty = !b.label;
        if (aEmpty && bEmpty) cmp = 0;
        else if (aEmpty) return 1;
        else if (bEmpty) return -1;
        else cmp = (a.label as string).localeCompare(b.label as string);
        break;
      }
      case "rate_per_min":
        cmp = a.rate_per_min - b.rate_per_min;
        break;
      case "recommended_rate":
        cmp = a.recommended_rate - b.recommended_rate;
        break;
      case "severity":
        cmp = _SEVERITY_RANK[a.severity] - _SEVERITY_RANK[b.severity];
        break;
    }
    return dir === "desc" ? -cmp : cmp;
  });
  return sorted;
}

@customElement("stats-knx-view")
export class StatsKnxView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _filters: UiFilters = loadFilters();
  @state() private _summary: KnxStatsSummaryDto | null = null;
  @state() private _busHealth: KnxStatsBusHealthDto | null = null;
  @state() private _busload: KnxStatsBusloadDto | null = null;
  @state() private _health: KnxStatsHealthScoreDto | null = null;
  @state() private _longTerm: KnxStatsLongTermDto | null = null;
  @state() private _bursts: KnxStatsBurstsDto | null = null;
  @state() private _sensitiveLog: KnxStatsSensitiveLogDto | null = null;
  // Iter 49 (N1): Bus-Analyse-Toggle. true = Listener nimmt Telegramme
  // weiter auf; false = ressourcen-sparend, aber keine neuen Daten.
  @state() private _busAnalysisEnabled: boolean = true;
  @state() private _busAnalysisLoaded: boolean = false;
  // Iter 57: Sortierung der Top-Geraete-Tabelle. Default: count desc
  // (haeufigster Sender oben).
  @state() private _devicesSortKey: "dev_source" | "ga_count" | "count" = "count";
  @state() private _devicesSortDir: "asc" | "desc" = "desc";
  // Iter 60 / U5: Sortierung Top-Sender-Tabelle. Default: nach
  // Tel/Min desc (= heutige Reihenfolge vom Backend).
  @state() private _topSortKey: TopSenderSortKey = "rate_per_min";
  @state() private _topSortDir: "asc" | "desc" = "desc";
  // Iter 61 / U3: Verwaiste-GAs-Card mit Suche + Pagination. Vorher
  // hartes Cap auf 15 mit "und N weitere" — bei 3000+ Eintraegen
  // unhandlich. Default-Page = 50.
  @state() private _orphansMissingFilter = "";
  @state() private _orphansExtraFilter = "";
  @state() private _orphansMissingShow = 50;
  @state() private _orphansExtraShow = 50;
  // Iter 51: Sichtbarkeit fuer einzeln gefailte Endpunkte. Vorher hat
  // .catch(() => null) Fehler stillschweigend geschluckt — und der User
  // sah leere Cards, ohne zu wissen warum. Jetzt: Banner mit Liste der
  // gefailten Endpoints + Hinweise zu typischen Ursachen.
  @state() private _apiErrors: Map<string, string> = new Map();
  @state() private _apiErrorsDismissed: boolean = false;
  @state() private _silence: KnxStatsSilenceDto | null = null;
  @state() private _orphans: KnxStatsOrphansDto | null = null;
  @state() private _alarms: KnxStatsAlarmsDto | null = null;
  @state() private _top: KnxStatsTopRowDto[] = [];
  @state() private _topBySource: Array<{
    dev_source: string;
    count: number;
    ga_count: number;
    manufacturer?: string;
    device_name?: string;
  }> = [];
  @state() private _timeline: KnxStatsTimelineDto | null = null;
  @state() private _selectedGa: string | null = null;
  @state() private _detail: KnxStatsGaDetailDto | null = null;
  @state() private _detailLoading = false;
  @state() private _loading = false;
  @state() private _error = "";
  @state() private _toast = "";

  override async firstUpdated(): Promise<void> {
    await Promise.all([this._loadBusAnalysisState(), this._load()]);
  }

  private async _loadBusAnalysisState(): Promise<void> {
    if (!this.api) return;
    try {
      const result = await this.api.getKnxBusAnalysisState();
      this._busAnalysisEnabled = result.enabled;
    } catch {
      // API nicht erreichbar -> Default true belassen, kein Banner
    } finally {
      this._busAnalysisLoaded = true;
    }
  }

  // Iter 51: zeigt einen warnenden Banner ueber gefailte Endpunkte +
  // Hinweise zu typischen Ursachen. Banner ist dismissable (per Klick),
  // aber kommt beim naechsten _load() wieder, falls die Endpoints noch
  // immer failen. So bleibt der User nicht im Dunkeln, kann aber kurz
  // wegklicken um die anderen Cards sauber zu sehen.
  private _renderApiErrorBanner(): TemplateResult {
    const failed = Array.from(this._apiErrors.keys()).sort();
    const labels: Record<string, string> = {
      "health-score": "Bus-Health-Score",
      busload: "Buslast-KPI",
      "long-term": "Long-Term-Sicht",
      bursts: "Burst-Detector",
      "sensitive-log": "Sicherheits-Audit",
      orphans: "Verwaiste GAs",
      alarms: "Alarme",
    };
    const labeled = failed.map((k) => labels[k] || k).join(", ");
    return html`
      <div class="api-error-banner" role="alert">
        <div class="api-error-banner__head">
          <strong>Folgende Statistik-Bereiche sind nicht erreichbar:</strong>
          <button
            class="api-error-banner__dismiss"
            @click=${() => (this._apiErrorsDismissed = true)}
            title="Banner schliessen"
            aria-label="Banner schliessen"
          >×</button>
        </div>
        <p class="api-error-banner__list">${labeled}</p>
        <details class="api-error-banner__details">
          <summary>Moegliche Ursachen + Diagnose</summary>
          <ul>
            <li>HACS-Update wurde noch nicht installiert (Backend kennt die neuen Endpunkte nicht).</li>
            <li>Home-Assistant wurde nach dem Update nicht neu gestartet.</li>
            <li>Browser-Cache haelt das alte Bundle vor — harter Reload (Strg+Shift+R) probieren.</li>
            <li>Der HA-User hat keine Admin-Rechte (alle KNX-Stats-Endpoints sind Admin-only).</li>
          </ul>
          <p class="muted small">Original-Fehlermeldungen:</p>
          <ul class="api-error-banner__raw">
            ${Array.from(this._apiErrors.entries()).map(
              ([k, msg]) => html`<li><code>${k}</code>: ${msg}</li>`
            )}
          </ul>
        </details>
      </div>
    `;
  }

  private async _toggleBusAnalysis(): Promise<void> {
    if (!this.api) return;
    const nextValue = !this._busAnalysisEnabled;
    if (
      !nextValue &&
      !window.confirm(
        "Bus-Analyse deaktivieren?\n\n" +
          "Solange aus, schreibt das Plugin keine neuen Telegramme mehr in " +
          "die Raw- oder Counter-Tabelle. Bestehende Daten bleiben sichtbar, " +
          "altern aber nach 48 h (Raw) bzw. 365 Tagen (Counter)."
      )
    ) {
      return;
    }
    try {
      const result = await this.api.setKnxBusAnalysisState(nextValue);
      this._busAnalysisEnabled = result.enabled;
    } catch (err) {
      window.alert(`Fehler: ${(err as Error).message}`);
    }
  }

  private _apiFilters(): KnxStatsFilters {
    const { from, to } = periodToIso(this._filters.periodId);
    return {
      from,
      to,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck,
    };
  }

  private _isLongTermMode(): boolean {
    return LONG_TERM_PERIOD_IDS.has(this._filters.periodId);
  }

  // Im Long-Term-Modus laufen die Raw-Endpunkte auf die letzten 48h —
  // alles dahinter liegt in der Counter-Tabelle und wird ueber den
  // Long-Term-Endpoint geliefert.
  private _liveFiltersForRaw(): KnxStatsFilters {
    if (!this._isLongTermMode()) return this._apiFilters();
    const { from, to } = rawLiveWindow();
    return {
      from,
      to,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck,
    };
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    this._error = "";
    // Iter 51: Fehler-Map pro Load zuruecksetzen — sonst wuerden
    // dauerhafte Errors angezeigt selbst nachdem das Backend wieder lebt.
    const errors = new Map<string, string>();
    const captureError = <T>(name: string, p: Promise<T>): Promise<T | null> =>
      p.catch((err) => {
        errors.set(name, (err as Error).message);
        return null;
      });
    try {
      const longTermMode = this._isLongTermMode();
      const fLongTerm = this._apiFilters();
      const fRaw = this._liveFiltersForRaw();
      // Geraete-Tabelle nutzt separate Top-N-Einstellung (Iter 45).
      const fRawDevices: KnxStatsFilters = { ...fRaw, limit: this._filters.topNDevices };
      const [
        summary,
        top,
        topBySource,
        busHealth,
        silence,
        orphans,
        alarms,
        busload,
        health,
        longTerm,
        bursts,
        sensitiveLog,
      ] = await Promise.all([
        this.api.getKnxStatsSummary(fRaw),
        this.api.getKnxStatsTop(fRaw),
        this.api.getKnxStatsTopBySource(fRawDevices),
        this.api.getKnxStatsBusHealth(fRaw),
        this.api.getKnxStatsSilence({
          ...fRaw,
          maxSilenceMinutes: this._suggestSilenceMinutes(),
        }),
        captureError("orphans", this.api.getKnxStatsOrphans(fRaw)),
        captureError("alarms", this.api.getKnxStatsAlarms(fRaw)),
        captureError(
          "busload",
          this.api.getKnxStatsBusload(fRaw, this._suggestBusloadBucketSeconds())
        ),
        captureError("health-score", this.api.getKnxStatsHealthScore(fRaw)),
        longTermMode
          ? captureError("long-term", this.api.getKnxStatsLongTerm(fLongTerm))
          : Promise.resolve(null),
        captureError("bursts", this.api.getKnxStatsBursts(fRaw)),
        captureError("sensitive-log", this.api.getKnxStatsSensitiveLog(fRaw)),
      ]);
      this._summary = summary;
      this._top = top.items;
      this._topBySource = topBySource.items;
      this._busHealth = busHealth;
      this._silence = silence;
      this._orphans = orphans;
      this._alarms = alarms;
      this._busload = busload;
      this._health = health;
      this._longTerm = longTerm;
      this._bursts = bursts;
      this._sensitiveLog = sensitiveLog;
      // Iter 51: Errors-Snapshot setzen (Reassignment triggert Re-Render).
      this._apiErrors = errors;
      this._apiErrorsDismissed = false;
      // Timeline fuer Top-5 GAs (mehr Linien werden unleserlich).
      // Nutzt fRaw (kappiert auf 48h im Long-Term-Modus) — Timeline-Endpoint
      // liest aus knx_raw_telegrams.
      const topGas = top.items.slice(0, 5).map((r) => r.ga);
      if (topGas.length > 0) {
        this._timeline = await this.api.getKnxStatsTimeline({
          ...fRaw,
          gas: topGas,
          bucketMinutes: this._suggestBucketMinutes(),
        });
      } else {
        this._timeline = null;
      }
    } catch (err) {
      this._error = (err as Error).message;
      this._summary = null;
      this._top = [];
      this._topBySource = [];
      this._timeline = null;
      this._busHealth = null;
      this._silence = null;
      this._orphans = null;
      this._alarms = null;
      this._busload = null;
      this._health = null;
      this._longTerm = null;
      this._bursts = null;
      this._sensitiveLog = null;
    } finally {
      this._loading = false;
    }
  }

  private _suggestBucketMinutes(): number {
    switch (this._filters.periodId) {
      case "1h":
        return 1;
      case "6h":
        return 5;
      case "24h":
        return 10;
      case "48h":
      default:
        return 30;
    }
  }

  // Iter 36 (Feature A): pro Periode passende Bucket-Groesse fuer Buslast-%
  // damit das Frontend bei laengeren Perioden nicht 17280 Buckets bekommt.
  // 1h -> 10s (ETS-Standard, 360 Punkte)
  // 6h -> 60s (360 Punkte)
  // 24h -> 5min (288 Punkte)
  // 48h -> 10min (288 Punkte)
  private _suggestBusloadBucketSeconds(): number {
    switch (this._filters.periodId) {
      case "1h":
        return 10;
      case "6h":
        return 60;
      case "24h":
        return 300;
      case "48h":
      default:
        return 600;
    }
  }

  private _suggestSilenceMinutes(): number {
    // Stille-Schwelle proportional zur Periode: kuerzere Periode → kuerzere Stille
    switch (this._filters.periodId) {
      case "1h":
        return 30;
      case "6h":
        return 120; // 2h
      case "24h":
        return 360; // 6h
      case "48h":
      default:
        return 720; // 12h
    }
  }

  private async _loadDetail(ga: string): Promise<void> {
    if (!this.api) return;
    this._detailLoading = true;
    this._detail = null;
    try {
      const f = this._apiFilters();
      this._detail = await this.api.getKnxStatsGaDetail(ga, f);
    } catch (err) {
      this._showToast(`Detail laden fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      this._detailLoading = false;
    }
  }

  private async _onSelectGa(ga: string): Promise<void> {
    if (this._selectedGa === ga) {
      this._selectedGa = null;
      this._detail = null;
      return;
    }
    this._selectedGa = ga;
    await this._loadDetail(ga);
  }

  private async _ackGa(ga: string): Promise<void> {
    if (!this.api) return;
    const note = window.prompt(
      `Notiz für ${ga} (optional, leer = keine Notiz):`,
      ""
    );
    if (note === null) return; // Abbrechen
    try {
      await this.api.acknowledgeKnxGa(ga, { note: note || undefined });
      this._showToast(`${ga} als bekannt markiert`);
      await this._load();
    } catch (err) {
      this._showToast(`Fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  private async _unackGa(ga: string): Promise<void> {
    if (!this.api) return;
    try {
      await this.api.unacknowledgeKnxGa(ga);
      this._showToast(`${ga}: Acknowledge entfernt`);
      await this._load();
    } catch (err) {
      this._showToast(`Fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  private _toastTimer?: number;
  private _showToast(text: string): void {
    this._toast = text;
    if (this._toastTimer) window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = ""), 2800);
  }

  private _onPeriod(periodId: string): void {
    this._filters = { ...this._filters, periodId };
    saveFilters(this._filters);
    void this._load();
  }

  private _onTopN(topN: number): void {
    this._filters = { ...this._filters, topN };
    saveFilters(this._filters);
    void this._load();
  }

  private _onTopNDevices(topNDevices: number): void {
    this._filters = { ...this._filters, topNDevices };
    saveFilters(this._filters);
    void this._load();
  }

  private _renderInlineTopN(
    current: number,
    onChange: (n: number) => void
  ): TemplateResult {
    // Iter 60 / U6: Label "zeige" davor, mehr Padding pro Button.
    // Macht den Selektor sichtbarer und eindeutiger interpretierbar.
    return html`
      <span class="inline-topn-wrap">
        <span class="inline-topn-label">zeige</span>
        <span class="inline-topn" role="group" aria-label="Anzahl Einträge">
          ${TOP_N_OPTIONS.map(
            (n) => html`<button
              class=${`inline-topn__btn ${current === n ? "active" : ""}`}
              @click=${() => onChange(n)}
            >
              ${n}
            </button>`
          )}
        </span>
      </span>
    `;
  }

  private _onMinRate(value: number): void {
    this._filters = { ...this._filters, minRate: Math.max(0, value) };
    saveFilters(this._filters);
    void this._load();
  }

  private _onAckToggle(): void {
    this._filters = { ...this._filters, includeAck: !this._filters.includeAck };
    saveFilters(this._filters);
    void this._load();
  }

  private _renderFilterBar(): TemplateResult {
    return html`
      <div class="filters" role="toolbar" aria-label="KNX-Stats-Filter">
        <div class="filter-group">
          <span class="filter-label">Zeitraum</span>
          <div class="seg">
            ${PERIOD_PRESETS.map(
              (p) => html`<button
                class=${`seg-btn ${this._filters.periodId === p.id ? "active" : ""}`}
                @click=${() => this._onPeriod(p.id)}
              >
                ${p.label}
              </button>`
            )}
          </div>
        </div>

        <label class="filter-group">
          <span class="filter-label">Min. Tel/Min</span>
          <input
            type="number"
            min="0"
            step="0.5"
            class="mh-input narrow"
            .value=${String(this._filters.minRate)}
            @change=${(e: Event) =>
              this._onMinRate(parseFloat((e.target as HTMLInputElement).value) || 0)}
          />
        </label>

        <label class="filter-group toggle">
          <input
            type="checkbox"
            ?checked=${!this._filters.includeAck}
            @change=${this._onAckToggle}
          />
          <span>Bekannte ausblenden</span>
        </label>

        <label class="filter-group toggle">
          <input
            type="checkbox"
            ?checked=${this._busAnalysisEnabled}
            ?disabled=${!this._busAnalysisLoaded}
            @change=${() => void this._toggleBusAnalysis()}
          />
          <span title="Schaltet die bus-weite Erfassung der Telegramme">Bus-Analyse aktiv</span>
        </label>

        <button
          class="mh-btn mh-btn--sm mh-btn--primary"
          @click=${() => void this._load()}
          ?disabled=${this._loading}
          title="Alle Cards neu vom Backend laden"
        >
          ${this._loading ? "lade…" : "↻ Aktualisieren"}
        </button>
      </div>
    `;
  }

  private _renderKpis(): TemplateResult {
    const s = this._summary;
    if (s === null) {
      return html`<p class="muted">Keine Daten verfuegbar.</p>`;
    }
    const counts = s.counts_by_severity;
    // Iter 36 (Feature A): Buslast bevorzugt aus dem 10s/60s/5m-Bucket-
    // Endpoint (current/max/avg). Fallback auf den Period-Avg im Summary.
    const bl = this._busload;
    const refPct = bl !== null ? bl.summary.max_pct : s.estimated_busload_pct;
    const busloadClass =
      refPct >= 30
        ? "danger"
        : refPct >= 20
          ? "warning"
          : refPct >= 10
            ? "elevated"
            : "ok";
    const fmtPct = (p: number) =>
      p.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    return html`
      <div class="kpis">
        <div class="kpi">
          <span class="kpi-label">Telegramme</span>
          <span class="kpi-value">${s.total_telegrams.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">im Zeitraum</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Aktive GAs</span>
          <span class="kpi-value">${s.active_gas.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">im Protokoll</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Aktive Geräte</span>
          <span class="kpi-value">${s.active_devices.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">Source-Adressen</span>
        </div>
        <div class=${`kpi busload busload--${busloadClass}`}>
          <span class="kpi-label">Buslast</span>
          ${bl === null
            ? html`<span class="kpi-value">${fmtPct(s.estimated_busload_pct)} %</span>
                <span class="kpi-hint">Ø über Zeitraum</span>`
            : html`<span class="kpi-value">${fmtPct(bl.summary.max_pct)} %</span>
                <span class="kpi-hint">
                  jetzt ${fmtPct(bl.summary.current_pct)} % · Ø ${fmtPct(bl.summary.avg_pct)} %
                  · Bucket ${this._formatBucket(bl.bucket_seconds)}
                </span>`}
          <!-- Iter 60 / U7: 0–100 %-Verlaufs-Bar statt nur Schwellen-
               Sprung. Hintergrund mit linear-gradient gruen→gelb→orange→
               rot, Marker an Position min(refPct, 100). -->
          <div
            class="busload-bar"
            role="meter"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow=${refPct.toFixed(1)}
            title=${`Buslast ${fmtPct(refPct)} % auf Skala 0–100`}
          >
            <div
              class="busload-bar__marker"
              style=${`left: ${Math.min(100, Math.max(0, refPct)).toFixed(1)}%;`}
            ></div>
          </div>
        </div>
      </div>
      <div class="severity-counts">
        ${(["red", "orange", "yellow", "green"] as const).map(
          (sev) => html`<span class=${`mh-pill ${severityPillClass(sev)}`}>
            <span class="mh-pill__dot"></span>
            ${this._severityLabel(sev)}: ${counts[sev] ?? 0}
          </span>`
        )}
      </div>
    `;
  }

  private _renderHealthScore(): TemplateResult {
    const h = this._health!;
    return html`
      <section class=${`mh-card health-score health-score--${h.severity}`}>
        <header class="card-head">
          <h3>Bus-Health-Score</h3>
          <span class="muted small">aggregiert aus 4 KPIs · letzte ${this._filters.periodId}</span>
        </header>
        <div class="health-score__body">
          <div class="health-score__big">
            <span class="health-score__value">${h.score}</span>
            <span class="health-score__unit">/ 100</span>
            <span class="health-score__label">${this._healthLabel(h.severity)}</span>
          </div>
          <div class="health-score__components">
            ${(["repeat", "busload", "silence", "alarms"] as const).map(
              (key) => html`<div class="health-score__component">
                <span class="health-score__component-label">${this._componentLabel(key)}</span>
                <div class="health-score__bar">
                  <div
                    class="health-score__bar-fill"
                    style=${`width: ${h.components[key]}%`}
                  ></div>
                </div>
                <span class="health-score__component-value">${h.components[key]}</span>
              </div>`
            )}
          </div>
          ${h.findings.length > 0
            ? html`<ul class="health-score__findings">
                ${h.findings.map(
                  (f) => html`<li class=${`health-finding health-finding--${f.severity}`}>
                    <span class="health-finding__dot"></span>
                    <span>${f.message}</span>
                  </li>`
                )}
              </ul>`
            : html`<p class="muted small">Alle Indikatoren im gruenen Bereich.</p>`}
        </div>
      </section>
    `;
  }

  private _healthLabel(severity: "green" | "yellow" | "orange" | "red"): string {
    switch (severity) {
      case "green":
        return "gesund";
      case "yellow":
        return "leicht erhöht";
      case "orange":
        return "auffällig";
      case "red":
        return "kritisch";
    }
  }

  private _componentLabel(key: "repeat" | "busload" | "silence" | "alarms"): string {
    switch (key) {
      case "repeat":
        return "Wiederholungen";
      case "busload":
        return "Buslast-Spitze";
      case "silence":
        return "stumme Geräte";
      case "alarms":
        return "offene Alarme";
    }
  }

  // Iter 42: Sicherheits-Audit-Card ---------------------------------------

  private _renderSensitiveLog(): TemplateResult {
    const log = this._sensitiveLog!;
    const fmtTs = (ts: string) => this._formatTs(ts);
    return html`
      <section class="mh-card sensitive">
        <header class="card-head">
          <h3>Sicherheits-Audit</h3>
          <span class="muted small">
            ${log.addresses.length} markierte GAs · ${log.telegrams.length} Telegramme im Zeitraum
          </span>
        </header>
        <div class="sensitive__addresses">
          <h4>Sensitive GAs</h4>
          <ul class="sensitive__addr-list">
            ${log.addresses.map(
              (a) => html`<li>
                <code>${a.ga}</code>
                ${a.label ? html`<span class="muted small">${a.label}</span>` : nothing}
                ${a.dpt ? html`<span class="mh-pill mh-pill--neutral">${a.dpt}</span>` : nothing}
              </li>`
            )}
          </ul>
        </div>
        <div class="sensitive__telegrams">
          <h4>Letzte Telegramme</h4>
          ${log.telegrams.length === 0
            ? html`<p class="muted small">Keine Aktivitaet im Zeitraum.</p>`
            : html`<div class="table-wrap">
                <table class="sensitive__table">
                  <thead>
                    <tr>
                      <th>Zeit</th>
                      <th>GA</th>
                      <th>Gerät</th>
                      <th>Wert</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${log.telegrams.slice(0, 50).map(
                      (t) => html`<tr>
                        <td class="bursts__ts">${fmtTs(t.ts)}</td>
                        <td>
                          <code>${t.ga}</code>
                          ${t.label ? html`<span class="muted small">${t.label}</span>` : nothing}
                        </td>
                        <td><code>${t.dev_source}</code></td>
                        <td><code>${t.value ?? "—"}</code></td>
                      </tr>`
                    )}
                  </tbody>
                </table>
              </div>
              ${log.telegrams.length > 50
                ? html`<p class="muted small">… und ${log.telegrams.length - 50} weitere</p>`
                : nothing}`}
        </div>
      </section>
    `;
  }

  // Iter 41: Burst-Detector-Card -----------------------------------------

  private _renderBursts(): TemplateResult {
    const b = this._bursts!;
    const fmtNum = (n: number) => n.toLocaleString("de-DE");
    const fmtPct = (n: number) =>
      n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return html`
      <section class="mh-card bursts">
        <header class="card-head">
          <h3>Telegrammfluten (Bursts)</h3>
          <span class="muted small">
            ${b.bursts.length} Spitzen über ${fmtPct(b.threshold_pct)} % Buslast
            (${b.window_seconds}s-Fenster)
          </span>
        </header>
        <div class="bursts__intro">
          <p class="muted small">
            Kurze Spitzen, die im Period-Avg untergehen — typisch für
            Sturm-Automatik, gleichzeitige Rolladen-Befehle oder Szene-Trigger.
            Spalte „GAs" zeigt die Anzahl unterschiedlicher Gruppenadressen,
            „Geräte" die Anzahl unterschiedlicher Source-Adressen.
          </p>
        </div>
        <div class="table-wrap">
          <table class="bursts__table">
            <thead>
              <tr>
                <th>Zeit</th>
                <th class="num">Tel</th>
                <th class="num">Buslast</th>
                <th class="num">GAs</th>
                <th class="num">Geräte</th>
              </tr>
            </thead>
            <tbody>
              ${b.bursts.slice(0, 20).map(
                (burst) => html`<tr>
                  <td class="bursts__ts">${this._formatTs(burst.bucket)}</td>
                  <td class="num">${fmtNum(burst.telegrams)}</td>
                  <td class="num bursts__pct">${fmtPct(burst.busload_pct)} %</td>
                  <td class="num">${burst.ga_count}</td>
                  <td class="num">${burst.source_count}</td>
                </tr>`
              )}
            </tbody>
          </table>
        </div>
        ${b.bursts.length > 20
          ? html`<p class="muted small">… und ${b.bursts.length - 20} weitere</p>`
          : nothing}
      </section>
    `;
  }

  // Iter 39: Long-Term-Modus-Hinweis + Counter-Karte ----------------------

  private _renderLongTermBanner(): TemplateResult {
    return html`
      <div class="long-term-banner">
        <span class="long-term-banner__icon">⏳</span>
        <div>
          <strong>Long-Term-Modus aktiv</strong>
          <p class="muted small">
            Periode über 48 Std — die Counter-Tabelle liefert Telegramm-Counts pro
            Stunde/Tag, aber keine Source-Adressen, keine Werte und keine Repeats.
            Live-KPIs darunter zeigen die letzten 48 Std aus den Roh-Telegrammen.
          </p>
        </div>
      </div>
    `;
  }

  private _renderLongTerm(): TemplateResult {
    const lt = this._longTerm!;
    const maxCount = Math.max(1, ...lt.series.map((b) => b.count));
    const fmtNum = (n: number) => n.toLocaleString("de-DE");
    return html`
      <section class="mh-card long-term">
        <header class="card-head">
          <h3>Long-Term-Sicht</h3>
          <span class="muted small">
            ${fmtNum(lt.total)} Telegramme · ${lt.bucket === "day" ? "Tages-Buckets" : "Stunden-Buckets"}
          </span>
        </header>
        <div class="long-term__body">
          <div class="long-term__chart">
            ${lt.series.length === 0
              ? html`<p class="muted">Keine Daten in der Counter-Tabelle.</p>`
              : html`<div class="long-term__bars">
                  ${lt.series.map(
                    (b) => html`<div
                      class="long-term__bar"
                      style=${`height: ${(b.count / maxCount) * 100}%`}
                      title="${b.bucket} — ${fmtNum(b.count)}"
                    ></div>`
                  )}
                </div>`}
          </div>
          <div class="long-term__top">
            <h4>Top-GAs in der Periode</h4>
            ${lt.top_gas.length === 0
              ? html`<p class="muted small">Keine GAs aktiv.</p>`
              : html`<ol class="long-term__top-list">
                  ${lt.top_gas.slice(0, 10).map(
                    (g) => html`<li>
                      <code>${g.ga}</code>
                      ${g.label ? html`<span class="muted small">${g.label}</span>` : nothing}
                      <span class="long-term__top-count">${fmtNum(g.count)}</span>
                    </li>`
                  )}
                </ol>`}
          </div>
        </div>
      </section>
    `;
  }

  private _formatBucket(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  }

  private _severityLabel(sev: "green" | "yellow" | "orange" | "red"): string {
    switch (sev) {
      case "green":
        return "OK";
      case "yellow":
        return "leicht erhöht";
      case "orange":
        return "auffällig";
      case "red":
        return "kritisch";
    }
  }

  override render(): TemplateResult {
    return html`
      <div class="root">
        <div class="info-banner">
          <strong>Bus-weite Auswertung:</strong>
          alle Telegramme aus dem Gruppenmonitor werden 48 h vorgehalten —
          unabhaengig davon, ob die GA in der Whitelist (Einstellungen →
          KNX-Adressen) als „Loggen aktiv" markiert ist. Whitelisted GAs
          landen zusaetzlich im Logbuch (Tab „Nachrichten").
        </div>
        ${this._renderFilterBar()}
        ${this._apiErrors.size > 0 && !this._apiErrorsDismissed
          ? this._renderApiErrorBanner()
          : nothing}
        ${this._busAnalysisLoaded && !this._busAnalysisEnabled
          ? html`<div class="bus-analysis-banner">
              <strong>Bus-Analyse ist aus.</strong>
              Es werden keine neuen Telegramme erfasst — bestehende Daten bleiben
              sichtbar, altern aber raus (Raw 48 h, Counter 365 Tage). Toggle in
              der Filter-Leiste oben rechts schaltet sie wieder ein.
            </div>`
          : nothing}
        ${this._error
          ? html`<div class="error">${this._error}</div>`
          : nothing}
        ${this._alarms !== null && this._alarms.triggered_count > 0
          ? this._renderAlarmBanner()
          : nothing}

        ${this._isLongTermMode() ? this._renderLongTermBanner() : nothing}
        ${this._health !== null ? this._renderHealthScore() : nothing}
        ${this._longTerm !== null ? this._renderLongTerm() : nothing}
        ${this._bursts !== null && this._bursts.bursts.length > 0
          ? this._renderBursts()
          : nothing}
        ${this._sensitiveLog !== null && this._sensitiveLog.addresses.length > 0
          ? this._renderSensitiveLog()
          : nothing}

        <section class="mh-card kpi-card">
          <header class="card-head">
            <h3>${this._isLongTermMode() ? "Live-Snapshot (letzte 48 Std)" : "Uebersicht"}</h3>
            <span class="muted small">letzte ${this._filters.periodId}</span>
          </header>
          ${this._loading && this._summary === null
            ? html`<p class="muted">lade…</p>`
            : this._renderKpis()}
        </section>

        ${this._busHealth !== null && this._busHealth.summary.total > 0
          ? this._renderBusHealth()
          : nothing}
        ${this._silence !== null && this._silence.alarm_count > 0
          ? this._renderSilenceAlarms()
          : nothing}
        ${this._orphans !== null &&
        (this._orphans.missing_in_log.length > 0 ||
          this._orphans.extra_in_log.length > 0)
          ? this._renderOrphans()
          : nothing}

        <section class="mh-card">
          <header class="card-head">
            <h3>Top-Sender (Gruppenadressen)</h3>
            <div class="card-head__meta">
              ${this._renderInlineTopN(this._filters.topN, (n) => this._onTopN(n))}
              <span class="muted small">
                Welche GA sendet am häufigsten? · ${this._top.length} sichtbar
              </span>
            </div>
          </header>
          ${this._renderTopTable()}
        </section>

        ${this._topBySource.length > 0
          ? html`<section class="mh-card">
              <header class="card-head">
                <h3>Top-Geräte (Source-Adressen)</h3>
                <div class="card-head__meta">
                  ${this._renderInlineTopN(this._filters.topNDevices, (n) =>
                    this._onTopNDevices(n)
                  )}
                  <span class="muted small">
                    Welches physische Gerät erzeugt am meisten Last?
                  </span>
                </div>
              </header>
              ${this._renderTopBySource()}
            </section>`
          : nothing}

        ${this._timeline !== null && this._timeline.items.length > 0
          ? html`<section class="mh-card">
              <header class="card-head">
                <h3>Tagesverlauf (Top-5, ${this._timeline.bucket_minutes}-Min-Buckets)</h3>
              </header>
              <knx-timeline-chart
                .items=${this._timeline.items}
                .width=${800}
                .height=${140}
              ></knx-timeline-chart>
            </section>`
          : nothing}

        ${this._detail !== null || this._detailLoading
          ? this._renderDetailPane()
          : nothing}
        ${this._toast ? html`<div class="toast">${this._toast}</div>` : nothing}
      </div>
    `;
  }

  private _renderTopTable(): TemplateResult {
    if (this._loading && this._top.length === 0) {
      return html`<p class="muted">lade…</p>`;
    }
    if (this._top.length === 0) {
      return html`<p class="muted">Keine Telegramme in diesem Zeitraum.</p>`;
    }
    // Iter 60 / U5: Sortierte Kopie. Backend liefert per rate_per_min
    // desc, der User soll aber nach allen anderen Spalten sortieren
    // koennen. Pure Funktion — kein Backend-Roundtrip pro Klick.
    const sortKey = this._topSortKey;
    const sortDir = this._topSortDir;
    const sorted = sortTopSender(this._top, sortKey, sortDir);
    return html`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("ga")}
                title="Nach Gruppenadresse sortieren"
              >
                GA${this._sortArrow(sortKey, "ga", sortDir)}
              </th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("label")}
                title="Nach Label sortieren"
              >
                Label${this._sortArrow(sortKey, "label", sortDir)}
              </th>
              <th>DPT</th>
              <th
                class="num sortable"
                @click=${() => this._toggleTopSort("rate_per_min")}
                title="Nach Telegrammen/Min sortieren"
              >
                Tel/Min${this._sortArrow(sortKey, "rate_per_min", sortDir)}
              </th>
              <th
                class="num sortable"
                @click=${() => this._toggleTopSort("recommended_rate")}
                title="Nach Soll-Rate sortieren"
              >
                Soll${this._sortArrow(sortKey, "recommended_rate", sortDir)}
              </th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("severity")}
                title="Nach Schweregrad sortieren"
              >
                Status${this._sortArrow(sortKey, "severity", sortDir)}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(
              (row, idx) => html`<tr
                class=${`row-${row.severity} ${row.acknowledged ? "ack" : ""} ${
                  this._selectedGa === row.ga ? "selected" : ""
                }`}
                @click=${() => void this._onSelectGa(row.ga)}
              >
                <td class="num muted">${idx + 1}</td>
                <td><code class="ga">${row.ga}</code></td>
                <td class="label-cell" title=${row.label ?? ""}>
                  ${row.label ?? html`<span class="muted">—</span>`}
                </td>
                <td>
                  ${row.dpt
                    ? html`<code
                        class=${`dpt ${row.dpt_inferred ? "dpt--inferred" : ""}`}
                        title=${row.dpt_inferred
                          ? "DPT geraten aus Werten (im ETS-Projekt nicht gepflegt)"
                          : ""}
                        >${row.dpt}${row.dpt_inferred
                          ? html`<span class="dpt__hint" aria-hidden="true">?</span>`
                          : nothing}</code
                      >`
                    : html`<span class="muted">—</span>`}
                </td>
                <td class="num strong">${row.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td class="num muted">${row.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td>
                  <span class=${`mh-pill ${this._severityPillClass(row.severity)}`}>
                    <span class="mh-pill__dot"></span>
                    ${this._severityLabel(row.severity)}
                  </span>
                  ${row.has_findings
                    ? html`<span
                        class="finding-badge"
                        title="Anti-Pattern erkannt — Detail-Pane zeigt mehr (z. B. Konstant-Wert-Spam, Read-Burst, Heartbeat)"
                        >⚠ auffällig</span
                      >`
                    : nothing}
                  ${row.acknowledged
                    ? html`<span class="ack-pill" title="acknowledged">✓ bekannt</span>`
                    : nothing}
                </td>
                <td class="actions">
                  ${row.acknowledged
                    ? html`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          void this._unackGa(row.ga);
                        }}
                      >
                        ✗ Ack entfernen
                      </button>`
                    : html`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          void this._ackGa(row.ga);
                        }}
                      >
                        ✓ Bekannt
                      </button>`}
                </td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  private _renderDetailPane(): TemplateResult {
    if (this._detailLoading && this._detail === null) {
      return html`<section class="mh-card detail-pane">
        <p class="muted">lade Details…</p>
      </section>`;
    }
    if (this._detail === null) return html``;
    const d = this._detail;
    const rec = d.recommendation;
    return html`
      <section class="mh-card detail-pane">
        <header class="card-head">
          <div class="detail-head-text">
            <h3>${d.ga} — ${d.label ?? "Detail"}</h3>
            <span class="muted small">
              Gerät:
              <code>${d.dev_source || "?"}</code>
              ${d.dpt ? html` • DPT <code>${d.dpt}</code>` : nothing}
            </span>
          </div>
          <button
            class="mh-btn mh-btn--sm mh-btn--ghost"
            @click=${() => {
              this._selectedGa = null;
              this._detail = null;
            }}
          >
            ✕ Schliessen
          </button>
        </header>

        <div class="detail-stats">
          <div class="detail-stat">
            <span class="muted small">Ist-Rate</span>
            <strong>${d.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Tel/Min</strong>
          </div>
          <div class="detail-stat">
            <span class="muted small">Soll-Rate</span>
            <strong>${d.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Tel/Min</strong>
          </div>
          <div class="detail-stat">
            <span class="muted small">Verhaeltnis</span>
            <strong>${
              isFinite(rec.ratio)
                ? rec.ratio.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "x"
                : "∞"
            }</strong>
          </div>
          ${rec.estimated_reduction_pct !== null
            ? html`<div class="detail-stat">
                <span class="muted small">Geschaetzte Reduktion</span>
                <strong>−${rec.estimated_reduction_pct.toLocaleString(
                  "de-DE",
                  { maximumFractionDigits: 0 }
                )} %</strong>
              </div>`
            : nothing}
        </div>

        <div class=${`recommendation rec-${rec.severity}`}>
          <strong>Empfehlung:</strong>
          <p>${rec.text}</p>
        </div>

        ${d.findings.length > 0
          ? html`<div class="findings">
              <strong>Erkannte Muster:</strong>
              <ul>
                ${d.findings.map(
                  (f) => html`<li class=${`finding-${f.severity}`}>
                    <span class=${`mh-pill ${this._severityPillClass(f.severity)}`}>
                      ${f.kind}
                    </span>
                    <span>${f.text}</span>
                  </li>`
                )}
              </ul>
            </div>`
          : nothing}

        ${d.value_history.length >= 2
          ? html`<div class="value-history">
              <strong>Wertverlauf:</strong>
              <knx-value-sparkline
                .points=${d.value_history}
                .width=${800}
                .height=${100}
              ></knx-value-sparkline>
            </div>`
          : nothing}

        ${d.device || d.manufacturer_hints
          ? this._renderDeviceInfo(d)
          : nothing}

        ${d.sibling_gas.length > 0
          ? this._renderSiblingGas(d)
          : nothing}

        ${this._renderHaKnxLinks(d)}
      </section>
    `;
  }

  /**
   * Iter 64 / WR-P: Direktlinks aus dem Detail-Pane. Spart dem User
   * den Weg "Settings → Geräte & Dienste → KNX → suchen" und macht
   * das KNX-User-Forum als Recherche-Pfad sichtbar.
   *
   * Tab-Wechsel innerhalb messagehub (z. B. zu Settings → KNX-Adressen
   * mit GA-Filter vorbefüllt) wuerde Top-Level-State-Sharing brauchen
   * — bewusst NICHT hier verdrahtet, weil das mehr Refactor-Aufwand
   * waere als der Mehrwert. User kann den GA-Code copy-pasten.
   */
  private _renderHaKnxLinks(d: KnxStatsGaDetailDto): TemplateResult {
    const forumUrl = `https://knx-user-forum.de/forum/search?searchword=${encodeURIComponent(
      d.ga,
    )}`;
    return html`
      <div class="ha-links">
        <strong>Schnell-Aktionen:</strong>
        <ul class="ha-links__list">
          <li>
            <a
              href="/config/integrations/integration/knx"
              target="_top"
              title="HA-Integration KNX-Konfig öffnen"
              >HA-KNX-Konfig öffnen ↗</a
            >
          </li>
          <li>
            <a
              href=${forumUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="KNX-User-Forum nach GA-Code durchsuchen"
              >Im KNX-User-Forum suchen ↗</a
            >
          </li>
        </ul>
      </div>
    `;
  }

  private _renderDeviceInfo(d: KnxStatsGaDetailDto): TemplateResult {
    const dev = d.device;
    const hints = d.manufacturer_hints;
    return html`
      <div class="device-info">
        ${dev
          ? html`<strong>
              Gerät: ${dev.manufacturer || "?"}
              ${dev.name ? html` — ${dev.name}` : nothing}
              ${dev.product
                ? html`<span class="muted small">(${dev.product})</span>`
                : nothing}
            </strong>`
          : html`<strong>Hersteller-Hinweise</strong>`}
        ${hints && hints.tips.length > 0
          ? html`<ul class="hints">
              ${hints.tips.map((t) => html`<li>${t}</li>`)}
            </ul>`
          : nothing}
        ${hints?.doc_url
          ? html`<p class="muted small">
              Hersteller-Doku:
              <a href=${hints.doc_url} target="_blank" rel="noopener noreferrer">
                ${hints.doc_url}
              </a>
            </p>`
          : nothing}
      </div>
    `;
  }

  private _renderSiblingGas(d: KnxStatsGaDetailDto): TemplateResult {
    return html`
      <div class="siblings">
        <strong>Andere GAs des Geräts <code>${d.dev_source}</code>:</strong>
        <ul>
          ${d.sibling_gas.slice(0, 10).map(
            (s) => html`<li
              class="sibling-row"
              @click=${() => void this._onSelectGa(s.ga)}
              title="Detail-Pane für ${s.ga} öffnen"
            >
              <code class="ga">${s.ga}</code>
              <span class="muted">${s.label ?? "—"}</span>
              <span class="num">
                ${s.rate_per_min.toLocaleString("de-DE", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })} Tel/Min
              </span>
              <span class="num muted">${s.count}</span>
            </li>`
          )}
        </ul>
        ${d.sibling_gas.length > 10
          ? html`<p class="muted small">
              … und ${d.sibling_gas.length - 10} weitere
            </p>`
          : nothing}
      </div>
    `;
  }

  // Iter 57: Sortier-Klick toggelt Richtung bei gleichem Key, sonst
  // wechselt auf den neuen Key mit desc als Default (haeufigste Werte
  // oben — typisch fuer "Top-N"-Tabellen).
  private _toggleDevicesSort(
    key: "dev_source" | "ga_count" | "count"
  ): void {
    if (this._devicesSortKey === key) {
      this._devicesSortDir = this._devicesSortDir === "desc" ? "asc" : "desc";
    } else {
      this._devicesSortKey = key;
      this._devicesSortDir = key === "dev_source" ? "asc" : "desc";
    }
  }

  // Iter 60 / U5: Sort-Toggle Top-Sender. Default-Direction asc fuer
  // String-Spalten (ga, label), desc fuer numerische und severity (red
  // top zeigt Probleme zuerst).
  private _toggleTopSort(key: TopSenderSortKey): void {
    if (this._topSortKey === key) {
      this._topSortDir = this._topSortDir === "desc" ? "asc" : "desc";
    } else {
      this._topSortKey = key;
      this._topSortDir = key === "ga" || key === "label" ? "asc" : "desc";
    }
  }

  private _sortArrow(
    activeKey: string,
    columnKey: string,
    dir: "asc" | "desc"
  ): TemplateResult | typeof nothing {
    if (activeKey !== columnKey) return nothing;
    return html`<span class="sort-arrow" aria-hidden="true">${dir === "desc" ? "▼" : "▲"}</span>`;
  }

  private _renderTopBySource(): TemplateResult {
    // Iter 45 (N6): Slice nutzt jetzt topNDevices statt fester 25.
    // Iter 57: vor dem Slice noch sortieren — Backend liefert per
    // count desc, aber der User soll Telegramme/GAs/Source frei waehlen.
    const limit = this._filters.topNDevices;
    const sortKey = this._devicesSortKey;
    const sortDir = this._devicesSortDir;
    const sorted = [...this._topBySource].sort((a, b) => {
      let cmp: number;
      if (sortKey === "dev_source") {
        cmp = a.dev_source.localeCompare(b.dev_source);
      } else {
        cmp = (a[sortKey] || 0) - (b[sortKey] || 0);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return html`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th
                class="sortable"
                @click=${() => this._toggleDevicesSort("dev_source")}
                title="Nach Source-Adresse sortieren"
              >
                Gerät (Source)${this._sortArrow(sortKey, "dev_source", sortDir)}
              </th>
              <th>Hersteller / Modell</th>
              <th
                class="num sortable"
                @click=${() => this._toggleDevicesSort("ga_count")}
                title="Nach GA-Anzahl sortieren"
              >
                GAs${this._sortArrow(sortKey, "ga_count", sortDir)}
              </th>
              <th
                class="num sortable"
                @click=${() => this._toggleDevicesSort("count")}
                title="Nach Telegramm-Anzahl sortieren"
              >
                Telegramme${this._sortArrow(sortKey, "count", sortDir)}
              </th>
              <th class="num">Anteil</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${sorted.slice(0, limit).map((row, idx) => {
              const total = this._summary?.total_telegrams ?? 0;
              const pct = total > 0 ? (row.count / total) * 100 : 0;
              const manufacturer = row.manufacturer ?? "";
              const deviceName = row.device_name ?? "";
              const fullDeviceText = manufacturer && deviceName
                ? `${manufacturer} — ${deviceName}`
                : manufacturer || deviceName;
              return html`<tr>
                <td class="num muted">${idx + 1}</td>
                <td><code class="ga">${row.dev_source}</code></td>
                <td class="device-cell">
                  ${fullDeviceText
                    ? html`<span
                        class="muted small device-cell__text"
                        title=${fullDeviceText}
                        >${fullDeviceText}</span
                      >`
                    : html`<span class="muted small">—</span>`}
                </td>
                <td class="num">${row.ga_count}</td>
                <td class="num strong">${row.count.toLocaleString("de-DE")}</td>
                <td class="num muted">
                  ${pct.toLocaleString("de-DE", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })} %
                </td>
                <td class="actions">
                  <button
                    class="mh-btn mh-btn--sm mh-btn--ghost"
                    title="Alle GAs dieses Geräts als bekannt markieren"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      void this._ackBulk(row.dev_source);
                    }}
                  >
                    ✓ Alle ${row.ga_count} bekannt
                  </button>
                </td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  private async _ackBulk(devSource: string): Promise<void> {
    if (!this.api) return;
    if (
      !window.confirm(
        `Alle GAs des Geräts ${devSource} als bekannt markieren?`
      )
    ) {
      return;
    }
    const note = window.prompt(
      `Notiz für Bulk-Ack ${devSource} (optional):`,
      "akzeptiert nach Prüfung"
    );
    if (note === null) return;
    try {
      const { from, to } = periodToIso(this._filters.periodId);
      const result = await this.api.acknowledgeKnxBulk(devSource, {
        note: note || undefined,
        from,
        to,
      });
      this._showToast(
        `${devSource}: ${result.count} GAs als bekannt markiert`
      );
      await this._load();
    } catch (err) {
      this._showToast(`Bulk-Ack fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  private _renderAlarmBanner(): TemplateResult {
    const a = this._alarms!;
    const triggered = a.alarms.filter((x) => x.triggered);
    return html`
      <section class="alarm-banner">
        <strong>⚠ ${triggered.length} Alarm(e) aktiv</strong>
        <ul>
          ${triggered.map(
            (alarm) => html`<li>
              <span class="alarm-rule">${alarm.rule}</span>
              <span class="alarm-msg">${alarm.message}</span>
            </li>`
          )}
        </ul>
      </section>
    `;
  }

  // Iter 61 / U3: Filter-Helper case-insensitive auf address/label/dpt.
  private _matchesOrphanFilter(
    text: string,
    fields: Array<string | null | undefined>,
  ): boolean {
    if (text === "") return true;
    const needle = text.toLowerCase();
    return fields.some(
      (f) => typeof f === "string" && f.toLowerCase().includes(needle),
    );
  }

  private _renderOrphans(): TemplateResult {
    const o = this._orphans!;
    const missingFiltered = o.missing_in_log.filter((m) =>
      this._matchesOrphanFilter(this._orphansMissingFilter, [m.address, m.name, m.dpt]),
    );
    const extraFiltered = o.extra_in_log.filter((e) =>
      this._matchesOrphanFilter(this._orphansExtraFilter, [e.address, e.label]),
    );
    const missingShown = missingFiltered.slice(0, this._orphansMissingShow);
    const extraShown = extraFiltered.slice(0, this._orphansExtraShow);
    return html`
      <section class="mh-card">
        <header class="card-head">
          <h3>Verwaiste GAs (Projekt vs Realität)</h3>
          <span class="muted small">
            Projekt: ${o.project_total} • geloggt: ${o.log_total}
          </span>
        </header>
        <div class="orphans-grid">
          ${o.missing_in_log.length > 0
            ? html`<div>
                <strong
                  >Im Projekt, nie gesehen (${missingFiltered.length}${
                    this._orphansMissingFilter ? ` von ${o.missing_in_log.length}` : ""
                  })</strong
                >
                <input
                  class="mh-input orphans-search"
                  type="search"
                  placeholder="Filter nach GA / Label / DPT…"
                  .value=${this._orphansMissingFilter}
                  @input=${(e: Event) => {
                    this._orphansMissingFilter = (e.target as HTMLInputElement).value;
                    this._orphansMissingShow = 50;
                  }}
                />
                <ul class="orphans-list muted-list">
                  ${missingShown.map(
                    (m) => html`<li>
                      <code>${m.address}</code>
                      <span>${m.name || "—"}</span>
                      ${m.dpt
                        ? html`<code class="dpt">${m.dpt}</code>`
                        : nothing}
                    </li>`
                  )}
                </ul>
                ${missingFiltered.length > this._orphansMissingShow
                  ? html`<div class="orphans-pager">
                      <button
                        class="mh-btn mh-btn--sm"
                        @click=${() => {
                          this._orphansMissingShow += 50;
                        }}
                      >
                        Mehr laden (${missingFiltered.length - this._orphansMissingShow} übrig)
                      </button>
                      <button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${() => {
                          this._orphansMissingShow = missingFiltered.length;
                        }}
                      >
                        Alle ${missingFiltered.length} zeigen
                      </button>
                    </div>`
                  : nothing}
              </div>`
            : nothing}
          ${o.extra_in_log.length > 0
            ? html`<div>
                <strong
                  >Geloggt, nicht im Projekt (${extraFiltered.length}${
                    this._orphansExtraFilter ? ` von ${o.extra_in_log.length}` : ""
                  })</strong
                >
                <input
                  class="mh-input orphans-search"
                  type="search"
                  placeholder="Filter nach GA / Label…"
                  .value=${this._orphansExtraFilter}
                  @input=${(e: Event) => {
                    this._orphansExtraFilter = (e.target as HTMLInputElement).value;
                    this._orphansExtraShow = 50;
                  }}
                />
                <ul class="orphans-list extra-list">
                  ${extraShown.map(
                    (e) => html`<li>
                      <code>${e.address}</code>
                      <span>${e.label ?? "—"}</span>
                      <span class="muted num">${e.count}</span>
                    </li>`
                  )}
                </ul>
                ${extraFiltered.length > this._orphansExtraShow
                  ? html`<div class="orphans-pager">
                      <button
                        class="mh-btn mh-btn--sm"
                        @click=${() => {
                          this._orphansExtraShow += 50;
                        }}
                      >
                        Mehr laden (${extraFiltered.length - this._orphansExtraShow} übrig)
                      </button>
                      <button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${() => {
                          this._orphansExtraShow = extraFiltered.length;
                        }}
                      >
                        Alle ${extraFiltered.length} zeigen
                      </button>
                    </div>`
                  : nothing}
              </div>`
            : nothing}
        </div>
      </section>
    `;
  }

  private _renderSilenceAlarms(): TemplateResult {
    const s = this._silence!;
    const alarms = s.items.filter((i) => i.alarm);
    if (alarms.length === 0) return html``;
    return html`
      <section class="mh-card silence-card">
        <header class="card-head">
          <h3>Stille-Alarme (${s.alarm_count})</h3>
          <span class="muted small">
            Schwelle: &gt; ${s.max_silence_minutes} Min ohne Telegramm
          </span>
        </header>
        <ul class="silence-list">
          ${alarms.slice(0, 10).map(
            (a) => html`<li>
              <code>${a.dev_source}</code>
              <span class="muted">
                seit ${this._formatSilence(a.silent_minutes)} stumm
              </span>
              <span class="muted small">last_seen ${this._formatTs(a.last_seen)}</span>
            </li>`
          )}
        </ul>
        ${s.alarm_count > 10
          ? html`<p class="muted small">
              … und ${s.alarm_count - 10} weitere
            </p>`
          : nothing}
      </section>
    `;
  }

  private _formatSilence(minutes: number): string {
    if (minutes >= 1440) return `${Math.floor(minutes / 1440)} Tagen`;
    if (minutes >= 60) return `${Math.floor(minutes / 60)} Std`;
    return `${Math.round(minutes)} Min`;
  }

  private _formatTs(iso: string): string {
    try {
      return new Date(iso).toLocaleString("de-DE");
    } catch {
      return iso;
    }
  }

  private _renderBusHealth(): TemplateResult {
    const h = this._busHealth!;
    const ratio = h.summary.ratio_pct;
    const cls =
      ratio >= 1.0
        ? "danger"
        : ratio >= 0.5
          ? "warning"
          : ratio > 0
            ? "elevated"
            : "ok";
    return html`
      <section class="mh-card">
        <header class="card-head">
          <h3>Bus-Gesundheit (Wiederholrate)</h3>
          <span class="muted small">
            xknx-Repeated-Flag — hoher Wert deutet auf Verkabelung/EMV
          </span>
        </header>
        <div class="kpis">
          <div class=${`kpi busload busload--${cls}`}>
            <span class="kpi-label">Wiederhol-Quote</span>
            <span class="kpi-value">${ratio.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} %</span>
            <span class="kpi-hint">
              ${h.summary.repeated.toLocaleString("de-DE")} von
              ${h.summary.total.toLocaleString("de-DE")} Telegrammen
            </span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Schwelle gesund</span>
            <span class="kpi-value">&lt; 0,5 %</span>
            <span class="kpi-hint">Empfehlung KNX-Praxis</span>
          </div>
        </div>
        ${h.per_ga.length > 0
          ? html`<div class="bus-health-list">
              <strong>Top-GAs mit Wiederholungen:</strong>
              <ul>
                ${h.per_ga.slice(0, 5).map(
                  (g) => html`<li>
                    <code>${g.ga}</code>
                    <span class="muted">${g.label ?? "—"}</span>
                    <span class="num">${g.repeated} / ${g.total}</span>
                    <span class="num">${g.ratio_pct.toLocaleString("de-DE", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })} %</span>
                  </li>`
                )}
              </ul>
            </div>`
          : nothing}
      </section>
    `;
  }

  private _severityPillClass(
    sev: "green" | "yellow" | "orange" | "red"
  ): string {
    return severityPillClass(sev);
  }

  static override styles = [
    tokens,
    cards,
    pills,
    buttons,
    css`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
        background: var(--mh-bg);
      }
      .root {
        max-width: 1024px;
        margin: 0 auto;
        padding: var(--mh-space-5);
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-4);
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-4);
        align-items: flex-end;
        padding: var(--mh-space-3);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .filter-group.toggle {
        flex-direction: row;
        align-items: center;
        gap: 6px;
      }
      .filter-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        /* Iter 57: Sentence-Case statt CAPS-Lock */
        letter-spacing: 0.02em;
        font-weight: var(--mh-weight-semibold);
      }
      .seg {
        display: inline-flex;
        gap: 1px;
        background: var(--mh-surface-2);
        padding: 2px;
        border-radius: var(--mh-radius-sm);
      }
      .seg-btn {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 4px 10px;
        font: inherit;
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
      }
      .seg-btn:hover {
        color: var(--mh-fg);
      }
      .seg-btn.active {
        background: var(--mh-surface);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
        box-shadow: var(--mh-shadow-1);
      }
      .mh-input.narrow {
        max-width: 100px;
        padding: 5px 10px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        font: inherit;
        font-size: var(--mh-text-sm);
        background: var(--mh-surface);
        color: var(--mh-fg);
      }
      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-3);
        margin-bottom: var(--mh-space-3);
        flex-wrap: wrap;
      }
      /* Iter 45 (N6): Inline-Top-N-Selektor in Card-Headern */
      .card-head__meta {
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        flex-wrap: wrap;
      }
      .inline-topn-wrap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .inline-topn-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        text-transform: lowercase;
        letter-spacing: 0.02em;
      }
      .inline-topn {
        display: inline-flex;
        gap: 0;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        overflow: hidden;
      }
      .inline-topn__btn {
        background: transparent;
        border: 0;
        padding: 4px 10px;
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        cursor: pointer;
        font-variant-numeric: tabular-nums;
      }
      .inline-topn__btn:hover {
        background: var(--mh-bg-hover, rgba(0, 0, 0, 0.04));
      }
      .inline-topn__btn.active {
        background: var(--mh-primary);
        color: var(--mh-on-primary, white);
        font-weight: var(--mh-weight-semibold);
      }
      h3 {
        margin: 0;
        font-size: var(--mh-text-md);
        font-weight: var(--mh-weight-semibold);
      }
      .small {
        font-size: var(--mh-text-xs);
      }
      .muted {
        color: var(--mh-fg-muted);
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--mh-space-3);
      }
      .kpi {
        background: var(--mh-bg);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-4);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .kpi-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        /* Iter 57: Sentence-Case statt CAPS-Lock */
        letter-spacing: 0.02em;
        font-weight: var(--mh-weight-semibold);
      }
      .kpi-value {
        font-size: var(--mh-text-2xl);
        font-weight: var(--mh-weight-bold);
        color: var(--mh-fg);
        line-height: 1.1;
        margin: 4px 0;
        font-variant-numeric: tabular-nums;
      }
      .kpi-hint {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .busload--ok {
        border-left: 3px solid var(--mh-success);
      }
      .busload--elevated {
        /* Iter 60: gelb statt info-blau, konsistent mit Ampel-Mapping. */
        border-left: 3px solid var(--mh-caution);
      }
      .busload--warning {
        border-left: 3px solid var(--mh-warning);
      }
      .busload--danger {
        border-left: 3px solid var(--mh-error);
      }
      /* Iter 60 / U7: 0–100 %-Verlaufs-Bar unter dem Buslast-KPI-Wert.
         Gradient zeigt Skala (gruen → gelb → orange → rot), Marker
         visualisiert aktuellen Wert ohne Schwellen-Sprung. */
      .busload-bar {
        position: relative;
        height: 4px;
        margin-top: 6px;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--mh-success) 0%,
          var(--mh-caution) 33%,
          var(--mh-warning) 66%,
          var(--mh-error) 100%
        );
        opacity: 0.5;
      }
      .busload-bar__marker {
        position: absolute;
        top: -2px;
        bottom: -2px;
        width: 2px;
        background: var(--mh-fg);
        border-radius: 1px;
        transform: translateX(-1px);
      }
      /* Iter 37 (Feature K): Bus-Health-Score-Card */
      .health-score {
        border-left: 4px solid var(--mh-divider);
      }
      .health-score--green {
        border-left-color: var(--mh-success);
      }
      .health-score--yellow {
        /* Iter 60: gelb statt info-blau, konsistent mit B2-Mapping. */
        border-left-color: var(--mh-caution);
      }
      .health-score--orange {
        border-left-color: var(--mh-warning);
      }
      .health-score--red {
        border-left-color: var(--mh-error);
      }
      .health-score__body {
        display: grid;
        grid-template-columns: minmax(140px, 200px) 1fr;
        gap: var(--mh-space-4);
        align-items: start;
      }
      @media (max-width: 640px) {
        .health-score__body {
          grid-template-columns: 1fr;
        }
      }
      .health-score__big {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .health-score__value {
        font-size: 3rem;
        font-weight: var(--mh-weight-bold);
        line-height: 1;
        color: var(--mh-fg);
        font-variant-numeric: tabular-nums;
      }
      .health-score__unit {
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .health-score__label {
        margin-top: var(--mh-space-2);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .health-score--green .health-score__label {
        color: var(--mh-success);
      }
      .health-score--yellow .health-score__label {
        color: var(--mh-caution);
      }
      .health-score--orange .health-score__label {
        color: var(--mh-warning);
      }
      .health-score--red .health-score__label {
        color: var(--mh-error);
      }
      .health-score__components {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
      }
      .health-score__component {
        display: grid;
        grid-template-columns: 130px 1fr 30px;
        align-items: center;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
      }
      .health-score__component-label {
        color: var(--mh-fg-muted);
      }
      .health-score__bar {
        height: 6px;
        background: var(--mh-divider);
        border-radius: 3px;
        overflow: hidden;
      }
      .health-score__bar-fill {
        height: 100%;
        background: var(--mh-success);
        transition: width 0.2s ease;
      }
      .health-score__component-value {
        text-align: right;
        font-variant-numeric: tabular-nums;
        color: var(--mh-fg);
      }
      .health-score__findings {
        grid-column: 1 / -1;
        list-style: none;
        margin: var(--mh-space-3) 0 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .health-finding {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
      }
      .health-finding__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--mh-info);
      }
      .health-finding--warn .health-finding__dot {
        background: var(--mh-warning);
      }
      .health-finding--critical .health-finding__dot {
        background: var(--mh-error);
      }
      /* Iter 51: API-Error-Banner — gefailte Endpoints + Diagnose */
      .api-error-banner {
        padding: var(--mh-space-3) var(--mh-space-4);
        background: var(--mh-warning-soft, rgba(255, 165, 0, 0.12));
        border-left: 3px solid var(--mh-warning);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
        margin-bottom: var(--mh-space-3);
      }
      .api-error-banner__head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--mh-space-3);
      }
      .api-error-banner__dismiss {
        background: transparent;
        border: 0;
        font-size: 1.4em;
        line-height: 1;
        color: var(--mh-fg-muted);
        cursor: pointer;
        padding: 0 4px;
      }
      .api-error-banner__dismiss:hover {
        color: var(--mh-fg);
      }
      .api-error-banner__list {
        margin: var(--mh-space-2) 0 0 0;
        font-weight: var(--mh-weight-semibold);
      }
      .api-error-banner__details {
        margin-top: var(--mh-space-2);
      }
      .api-error-banner__details summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
      }
      .api-error-banner__details ul {
        margin: var(--mh-space-2) 0;
        padding-left: var(--mh-space-4);
      }
      .api-error-banner__raw code {
        font-family: var(--mh-font-mono, monospace);
      }
      /* Iter 49 (N1): Bus-Analyse-Toggle-Banner, sichtbar wenn aus */
      .bus-analysis-banner {
        padding: var(--mh-space-3) var(--mh-space-4);
        background: var(--mh-warning-soft, rgba(255, 165, 0, 0.12));
        border-left: 3px solid var(--mh-warning);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
        margin-bottom: var(--mh-space-3);
      }
      .bus-analysis-banner strong {
        margin-right: var(--mh-space-2);
      }
      /* Iter 39: Long-Term-Modus */
      .long-term-banner {
        display: flex;
        align-items: flex-start;
        gap: var(--mh-space-3);
        padding: var(--mh-space-3) var(--mh-space-4);
        background: var(--mh-info-soft, rgba(0, 120, 255, 0.08));
        border-left: 3px solid var(--mh-info);
        border-radius: var(--mh-radius-md);
      }
      .long-term-banner__icon {
        font-size: 1.5em;
        line-height: 1;
      }
      .long-term__body {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--mh-space-4);
      }
      @media (max-width: 768px) {
        .long-term__body {
          grid-template-columns: 1fr;
        }
      }
      .long-term__chart {
        min-height: 120px;
      }
      .long-term__bars {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 120px;
        padding: var(--mh-space-2) 0;
      }
      .long-term__bar {
        flex: 1;
        min-height: 2px;
        background: var(--mh-info);
        border-radius: 2px 2px 0 0;
        transition: opacity 0.2s ease;
      }
      .long-term__bar:hover {
        opacity: 0.7;
      }
      .long-term__top h4 {
        margin: 0 0 var(--mh-space-2) 0;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .long-term__top-list {
        margin: 0;
        padding-left: var(--mh-space-4);
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: var(--mh-text-sm);
      }
      .long-term__top-list li {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .long-term__top-list code {
        font-family: var(--mh-font-mono, monospace);
      }
      .long-term__top-count {
        margin-left: auto;
        font-variant-numeric: tabular-nums;
        color: var(--mh-fg-muted);
      }
      /* Iter 41: Burst-Detector-Card */
      .bursts__intro {
        margin-bottom: var(--mh-space-2);
      }
      .bursts__table {
        width: 100%;
        border-collapse: collapse;
      }
      .bursts__table th,
      .bursts__table td {
        padding: var(--mh-space-1) var(--mh-space-2);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-sm);
      }
      .bursts__table th {
        text-align: left;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
      }
      .bursts__table .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .bursts__ts {
        font-family: var(--mh-font-mono, monospace);
        white-space: nowrap;
      }
      .bursts__pct {
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-warning);
      }
      /* Iter 42: Sensitive-Log-Card */
      .sensitive {
        border-left: 4px solid var(--mh-error);
      }
      .sensitive h4 {
        margin: var(--mh-space-3) 0 var(--mh-space-2) 0;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .sensitive__addr-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
      }
      .sensitive__addr-list li {
        display: inline-flex;
        align-items: center;
        gap: var(--mh-space-1);
        padding: var(--mh-space-1) var(--mh-space-2);
        background: var(--mh-bg-subtle, rgba(0, 0, 0, 0.04));
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }
      .sensitive__table {
        width: 100%;
        border-collapse: collapse;
      }
      .sensitive__table th,
      .sensitive__table td {
        padding: var(--mh-space-1) var(--mh-space-2);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-sm);
        text-align: left;
      }
      .sensitive__table th {
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
      }
      .severity-counts {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
        margin-top: var(--mh-space-3);
      }
      .error {
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-error-soft);
        border-left: 3px solid var(--mh-error);
        color: var(--mh-error);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }
      .info-banner {
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-surface);
        border-left: 3px solid var(--mh-info);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        line-height: 1.5;
      }
      .info-banner strong {
        color: var(--mh-fg);
      }

      /* Top-Tabelle */
      .table-wrap {
        overflow-x: auto;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        background: var(--mh-bg);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mh-text-sm);
      }
      th,
      td {
        padding: 8px var(--mh-space-3);
        border-bottom: 1px solid var(--mh-divider);
        text-align: left;
        vertical-align: middle;
      }
      tr:last-child td {
        border-bottom: 0;
      }
      th {
        background: var(--mh-surface);
        font-size: var(--mh-text-xs);
        /* Iter 57: Sentence-Case statt uppercase — liest sich ruhiger
         * und harmoniert besser mit dem deutschen Label-Set. */
        letter-spacing: 0.02em;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
        position: sticky;
        top: 0;
      }
      /* Iter 57: sortierbare Header — visueller Hint via Cursor + Sort-Pfeil */
      th.sortable {
        cursor: pointer;
        user-select: none;
      }
      th.sortable:hover {
        color: var(--mh-fg);
      }
      th.sortable .sort-arrow {
        margin-left: 4px;
        opacity: 0.6;
      }
      tbody tr {
        cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      tbody tr:hover {
        background: var(--mh-surface-2);
      }
      tbody tr.selected {
        background: var(--mh-accent-soft);
      }
      tbody tr.ack td {
        opacity: 0.6;
      }
      .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .strong {
        font-weight: var(--mh-weight-semibold);
      }
      code.ga {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg);
      }
      /* Iter 62 / WR-T: Geraten-DPT visuell als gepunktet markieren,
         damit User auf einen Blick sieht "das ist nicht aus ETS". */
      code.dpt--inferred {
        font-style: italic;
        opacity: 0.85;
        border-bottom: 1px dotted var(--mh-fg-muted);
      }
      .dpt__hint {
        margin-left: 2px;
        font-size: 0.85em;
        color: var(--mh-fg-muted);
      }
      code.dpt {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        background: var(--mh-surface-2);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
      }
      .label-cell {
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      /* Iter 64 / WR-P: Detail-Pane Schnell-Aktionen mit HA-Konfig +
         Forum-Link. Anchors als kompakte Liste, kein Button-Stil. */
      .ha-links {
        margin-top: var(--mh-space-3);
        padding-top: var(--mh-space-3);
        border-top: 1px solid var(--mh-divider);
      }
      .ha-links__list {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-3);
      }
      .ha-links__list a {
        color: var(--mh-accent);
        text-decoration: none;
        font-size: var(--mh-text-sm);
      }
      .ha-links__list a:hover {
        text-decoration: underline;
      }
      /* Iter 63 / U13: Auffaelligkeit-Badge in Top-Sender-Status-Spalte.
         Caution-Style (gelb), klein und neben der Severity-Pille. */
      .finding-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: var(--mh-radius-pill);
        background: var(--mh-caution-soft);
        color: var(--mh-caution);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        cursor: help;
      }
      /* Iter 60 / U4: Acknowledge-Status als dezente Pille mit
         success-soft-Hintergrund. Vorher reiner muted Text — heute klar
         als positiver Status erkennbar, ohne aufdringlich zu sein. */
      .ack-pill {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: var(--mh-radius-pill);
        background: var(--mh-success-soft);
        color: var(--mh-success);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }
      td.actions {
        text-align: right;
        white-space: nowrap;
      }

      /* Detail-Pane */
      .detail-pane {
        border: 1px solid var(--mh-accent-soft);
      }
      .detail-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--mh-space-3);
        margin-bottom: var(--mh-space-3);
      }
      .detail-stat {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .detail-stat strong {
        font-size: var(--mh-text-md);
        color: var(--mh-fg);
        font-variant-numeric: tabular-nums;
      }
      .recommendation {
        padding: var(--mh-space-3);
        border-left: 3px solid var(--mh-divider);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
      }
      .recommendation p {
        margin: 4px 0 0 0;
        line-height: 1.5;
      }
      .rec-red {
        border-left-color: var(--mh-error);
      }
      .rec-orange {
        border-left-color: var(--mh-warning);
      }
      .rec-yellow {
        border-left-color: var(--mh-info);
      }
      .rec-green {
        border-left-color: var(--mh-success);
      }

      .findings {
        margin-top: var(--mh-space-3);
      }
      .findings ul {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
      }
      .findings li {
        display: flex;
        align-items: flex-start;
        gap: var(--mh-space-2);
        padding: var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }

      /* Detail-Pane: Sibling-GAs (Iter 30) */
      .detail-head-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .detail-head-text code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        background: var(--mh-surface-2);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
        color: var(--mh-fg);
      }
      .siblings {
        margin-top: var(--mh-space-3);
      }
      .siblings ul {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .sibling-row {
        display: grid;
        grid-template-columns: 80px 1fr auto auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
        cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      .sibling-row:hover {
        background: var(--mh-accent-soft);
      }
      .sibling-row code.ga {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Hersteller-Info (Iter 34) */
      .device-info {
        margin-top: var(--mh-space-3);
        padding: var(--mh-space-3);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
      }
      .device-info ul.hints {
        list-style: disc;
        margin: var(--mh-space-2) 0 0 var(--mh-space-4);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: var(--mh-text-sm);
      }
      .device-info a {
        color: var(--mh-accent);
        text-decoration: none;
      }
      .device-info a:hover {
        text-decoration: underline;
      }
      .device-cell {
        max-width: 240px;
      }
      /* Iter 60 / U11: Tooltip-fähig durch title-Attr auf dem inneren
         span. Truncation via inline-block + overflow:hidden, weil td
         direkt overflow:hidden nicht zuverlässig trimmt. */
      .device-cell__text {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }

      /* Alarm-Banner */
      .alarm-banner {
        padding: var(--mh-space-3);
        background: var(--mh-error-soft);
        border-left: 4px solid var(--mh-error);
        border-radius: var(--mh-radius-sm);
      }
      .alarm-banner strong {
        color: var(--mh-error);
        display: block;
        margin-bottom: var(--mh-space-2);
      }
      .alarm-banner ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .alarm-banner li {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
      }
      .alarm-rule {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-error);
      }

      /* Orphans-Card */
      .orphans-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--mh-space-4);
      }
      /* Iter 61 / U3: Such-Input + Pager fuer paginierte Orphans-Liste. */
      .orphans-search {
        margin: var(--mh-space-2) 0;
        width: 100%;
        max-width: 320px;
      }
      .orphans-pager {
        display: flex;
        gap: var(--mh-space-2);
        margin-top: var(--mh-space-2);
        flex-wrap: wrap;
      }
      .orphans-list {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .orphans-list li {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .orphans-list.muted-list li {
        background: var(--mh-surface-2);
      }
      .orphans-list.extra-list li {
        background: color-mix(in srgb, var(--mh-warning) 8%, transparent);
      }
      .orphans-list code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Silence-Card */
      .silence-card {
        border-left: 3px solid var(--mh-error);
      }
      .silence-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .silence-list li {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-error-soft);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .silence-list code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Bus-Health-Liste */
      .bus-health-list {
        margin-top: var(--mh-space-3);
      }
      .bus-health-list ul {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .bus-health-list li {
        display: grid;
        grid-template-columns: 80px 1fr auto auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .bus-health-list li code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Toast */
      .toast {
        position: fixed;
        bottom: var(--mh-space-5);
        right: var(--mh-space-5);
        background: var(--mh-fg);
        color: var(--mh-bg);
        padding: var(--mh-space-3) var(--mh-space-4);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        font-size: var(--mh-text-sm);
        z-index: 100;
      }
    `,
  ];
}
