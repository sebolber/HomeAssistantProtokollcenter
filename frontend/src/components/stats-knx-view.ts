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
  KnxStatsSummaryDto,
} from "../api-client.js";
import { tokens, cards, pills, buttons } from "../styles/tokens.js";

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
  @state() private _loading = false;
  @state() private _error = "";

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
      this._summary = await this.api.getKnxStatsSummary(this._apiFilters());
    } catch (err) {
      this._error = (err as Error).message;
      this._summary = null;
    } finally {
      this._loading = false;
    }
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
            <span class="muted small">Tabelle folgt in Iter 9</span>
          </header>
          <p class="muted">
            Detaillierte Top-Liste mit Empfehlung pro GA wird in der naechsten
            Iteration ergaenzt.
          </p>
        </section>
      </div>
    `;
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
    `,
  ];
}
