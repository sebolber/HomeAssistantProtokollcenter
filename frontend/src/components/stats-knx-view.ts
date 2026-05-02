// Stats-Sub-Tab "KNX-Bus-Analyse".
// Iter 7: Skelett (erledigt).
// Iter 8: Filter-Bar (Periode, Top-N, Min-Rate, Acknowledged-Toggle) + KPIs.
// Iter 9: Top-Tabelle + Detail-Pane (folgt).
// Iter 10: Timeline-Sparkline (folgt).

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  ApiClient,
  KnxStatsFilters,
  KnxStatsGaDetailDto,
  KnxStatsSummaryDto,
  KnxStatsTimelineDto,
  KnxStatsTopRowDto,
} from "../api-client.js";
import { tokens, cards, pills, buttons } from "../styles/tokens.js";
import "./knx-timeline-chart.js";

const STORAGE_KEY = "messagehub.knx-stats.filters";

// Periode-Presets in Tagen
const PERIOD_PRESETS: ReadonlyArray<{ id: string; label: string; days: number }> = [
  { id: "1h", label: "1 Std", days: 1 / 24 },
  { id: "24h", label: "24 Std", days: 1 },
  { id: "7d", label: "7 Tage", days: 7 },
  { id: "30d", label: "30 Tage", days: 30 },
];

const TOP_N_OPTIONS = [10, 25, 50, 100] as const;

interface UiFilters {
  periodId: string; // einer der PERIOD_PRESETS.id oder "custom"
  topN: number;
  minRate: number;
  includeAck: boolean;
}

const DEFAULT_FILTERS: UiFilters = {
  periodId: "7d",
  topN: 50,
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

@customElement("stats-knx-view")
export class StatsKnxView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _filters: UiFilters = loadFilters();
  @state() private _summary: KnxStatsSummaryDto | null = null;
  @state() private _top: KnxStatsTopRowDto[] = [];
  @state() private _timeline: KnxStatsTimelineDto | null = null;
  @state() private _selectedGa: string | null = null;
  @state() private _detail: KnxStatsGaDetailDto | null = null;
  @state() private _detailLoading = false;
  @state() private _loading = false;
  @state() private _error = "";
  @state() private _toast = "";

  override async firstUpdated(): Promise<void> {
    await this._load();
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

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    this._error = "";
    try {
      const f = this._apiFilters();
      const [summary, top] = await Promise.all([
        this.api.getKnxStatsSummary(f),
        this.api.getKnxStatsTop(f),
      ]);
      this._summary = summary;
      this._top = top.items;
      // Timeline fuer Top-5 GAs (mehr Linien werden unleserlich).
      const topGas = top.items.slice(0, 5).map((r) => r.ga);
      if (topGas.length > 0) {
        this._timeline = await this.api.getKnxStatsTimeline({
          ...f,
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
      this._timeline = null;
    } finally {
      this._loading = false;
    }
  }

  private _suggestBucketMinutes(): number {
    // 1h -> 1min, 24h -> 10min, 7d -> 60min, 30d -> 60min
    switch (this._filters.periodId) {
      case "1h":
        return 1;
      case "24h":
        return 10;
      case "7d":
      case "30d":
      default:
        return 60;
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
      `Notiz fuer ${ga} (optional, leer = keine Notiz):`,
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

        <div class="filter-group">
          <span class="filter-label">Top-N</span>
          <div class="seg">
            ${TOP_N_OPTIONS.map(
              (n) => html`<button
                class=${`seg-btn ${this._filters.topN === n ? "active" : ""}`}
                @click=${() => this._onTopN(n)}
              >
                ${n}
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

        <button
          class="mh-btn mh-btn--sm"
          @click=${() => void this._load()}
          ?disabled=${this._loading}
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
    const busloadClass =
      s.estimated_busload_pct >= 30
        ? "danger"
        : s.estimated_busload_pct >= 20
          ? "warning"
          : s.estimated_busload_pct >= 10
            ? "elevated"
            : "ok";
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
          <span class="kpi-label">Aktive Geraete</span>
          <span class="kpi-value">${s.active_devices.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">Source-Adressen</span>
        </div>
        <div class=${`kpi busload busload--${busloadClass}`}>
          <span class="kpi-label">Geschaetzte Buslast</span>
          <span class="kpi-value">${s.estimated_busload_pct.toLocaleString(
            "de-DE",
            { minimumFractionDigits: 1, maximumFractionDigits: 1 }
          )} %</span>
          <span class="kpi-hint">Ø ueber Zeitraum</span>
        </div>
      </div>
      <div class="severity-counts">
        ${(["red", "orange", "yellow", "green"] as const).map(
          (sev) => html`<span class=${`mh-pill mh-pill--${sev === "red" ? "error" : sev === "orange" ? "warning" : sev === "yellow" ? "info" : "neutral"}`}>
            <span class="mh-pill__dot"></span>
            ${this._severityLabel(sev)}: ${counts[sev] ?? 0}
          </span>`
        )}
      </div>
    `;
  }

  private _severityLabel(sev: "green" | "yellow" | "orange" | "red"): string {
    switch (sev) {
      case "green":
        return "OK";
      case "yellow":
        return "leicht erhoeht";
      case "orange":
        return "auffaellig";
      case "red":
        return "kritisch";
    }
  }

  override render(): TemplateResult {
    return html`
      <div class="root">
        ${this._renderFilterBar()}
        ${this._error
          ? html`<div class="error">${this._error}</div>`
          : nothing}

        <section class="mh-card kpi-card">
          <header class="card-head">
            <h3>Uebersicht</h3>
            <span class="muted small">letzte ${this._filters.periodId}</span>
          </header>
          ${this._loading && this._summary === null
            ? html`<p class="muted">lade…</p>`
            : this._renderKpis()}
        </section>

        <section class="mh-card">
          <header class="card-head">
            <h3>Top-Sender</h3>
            <span class="muted small">${this._top.length} sichtbar</span>
          </header>
          ${this._renderTopTable()}
        </section>

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
    return html`
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>GA</th>
              <th>Label</th>
              <th>DPT</th>
              <th class="num">Tel/Min</th>
              <th class="num">Soll</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${this._top.map(
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
                    ? html`<code class="dpt">${row.dpt}</code>`
                    : html`<span class="muted">—</span>`}
                </td>
                <td class="num strong">${row.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td class="num muted">${row.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td>
                  <span class=${`mh-pill ${this._severityPillClass(row.severity)}`}>
                    <span class="mh-pill__dot"></span>
                    ${this._severityLabel(row.severity)}
                  </span>
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
          <h3>${d.ga} — ${d.label ?? "Detail"}</h3>
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
      </section>
    `;
  }

  private _severityPillClass(
    sev: "green" | "yellow" | "orange" | "red"
  ): string {
    switch (sev) {
      case "red":
        return "mh-pill--error";
      case "orange":
        return "mh-pill--warning";
      case "yellow":
        return "mh-pill--info";
      case "green":
        return "mh-pill--neutral";
    }
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
        text-transform: uppercase;
        letter-spacing: 0.04em;
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
        text-transform: uppercase;
        letter-spacing: 0.05em;
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
        border-left: 3px solid var(--mh-info);
      }
      .busload--warning {
        border-left: 3px solid var(--mh-warning);
      }
      .busload--danger {
        border-left: 3px solid var(--mh-error);
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
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
        position: sticky;
        top: 0;
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
      .ack-pill {
        display: inline-block;
        margin-left: 6px;
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
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
