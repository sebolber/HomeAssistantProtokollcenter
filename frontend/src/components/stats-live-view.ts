// Stats-Sub-Tab "Live-Status" — KPIs, Severity-Verteilung, aktive Quellen,
// Heatmap, Top-Sources. Bisher direkt in stats-view.ts; jetzt extrahiert,
// damit stats-view.ts ein reiner Sub-Tab-Container wird.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type { ApiClient, StatsDto } from "../api-client.js";
import { tokens, cards, pills } from "../styles/tokens.js";

const SEVERITY_LABELS: Record<string, string> = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug",
};

const SEVERITY_VARS: Record<string, string> = {
  error: "var(--mh-error)",
  warning: "var(--mh-warning)",
  info: "var(--mh-info)",
  debug: "var(--mh-debug)",
};

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

@customElement("stats-live-view")
export class StatsLiveView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _stats: StatsDto | null = null;
  @state() private _sources: string[] = [];
  @state() private _heatmap: Array<{ hour: number; weekday: number; count: number }> = [];
  @state() private _topSources: Array<{ source: string; count: number }> = [];
  @state() private _loading = false;

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    try {
      const [stats, sources, ext] = await Promise.all([
        this.api.getStats(),
        this.api.listSources(),
        this.api.getStatsExtended(30),
      ]);
      this._stats = stats;
      this._sources = sources;
      this._heatmap = ext.heatmap;
      this._topSources = ext.top_sources;
    } finally {
      this._loading = false;
    }
  }

  private _renderHeatmap(): TemplateResult {
    const grid: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    let max = 0;
    for (const cell of this._heatmap) {
      if (cell.weekday >= 0 && cell.weekday < 7 && cell.hour >= 0 && cell.hour < 24) {
        grid[cell.weekday][cell.hour] = cell.count;
        if (cell.count > max) max = cell.count;
      }
    }
    if (max === 0) {
      return html`<p class="muted">Keine Daten in den letzten 30 Tagen.</p>`;
    }
    return html`
      <div class="heatmap-wrap">
        <div class="heatmap">
          <div class="heatmap-header">
            <span></span>
            ${Array.from(
              { length: 24 },
              (_, h) => html`<span class="hour-label">${h % 3 === 0 ? h : ""}</span>`
            )}
          </div>
          ${WEEKDAY_ORDER.map((dayIdx, rowIdx) => {
            const row = grid[dayIdx];
            return html`
              <div class="heatmap-row">
                <span class="day-label">${DAYS[rowIdx]}</span>
                ${row.map((count, hour) => {
                  const intensity = count === 0 ? 0 : Math.max(0.15, count / max);
                  const bg =
                    count === 0
                      ? "transparent"
                      : `color-mix(in srgb, var(--mh-accent) ${Math.round(
                          intensity * 100
                        )}%, transparent)`;
                  return html`
                    <div
                      class=${`heatmap-cell ${count === 0 ? "empty" : ""}`}
                      style=${`background: ${bg}`}
                      title=${`${DAYS[rowIdx]} ${hour}:00 — ${count} Nachricht${count === 1 ? "" : "en"}`}
                    ></div>
                  `;
                })}
              </div>
            `;
          })}
        </div>
        <div class="heatmap-legend">
          <span class="muted small">weniger</span>
          <span class="legend-cell" style="background: transparent; border: 1px solid var(--mh-divider)"></span>
          <span class="legend-cell" style="background: color-mix(in srgb, var(--mh-accent) 25%, transparent)"></span>
          <span class="legend-cell" style="background: color-mix(in srgb, var(--mh-accent) 50%, transparent)"></span>
          <span class="legend-cell" style="background: color-mix(in srgb, var(--mh-accent) 75%, transparent)"></span>
          <span class="legend-cell" style="background: var(--mh-accent)"></span>
          <span class="muted small">mehr (max ${max})</span>
        </div>
      </div>
    `;
  }

  private _renderSeverityStack(): TemplateResult {
    if (!this._stats) return html``;
    const counts = this._stats.severity_24h;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const order = ["error", "warning", "info", "debug"] as const;

    if (total === 0) {
      return html`<p class="muted">Keine Nachrichten in den letzten 24 Stunden.</p>`;
    }

    return html`
      <div class="stack-bar" role="img" aria-label="Severity-Verteilung der letzten 24 Stunden">
        ${order.map((sev) => {
          const c = counts[sev] ?? 0;
          if (c === 0) return null;
          const pct = (c / total) * 100;
          return html`
            <div
              class=${`stack-seg sev-${sev}`}
              style=${`width: ${pct}%; background: ${SEVERITY_VARS[sev]}`}
              title=${`${SEVERITY_LABELS[sev]}: ${c} (${pct.toFixed(0)}%)`}
            ></div>
          `;
        })}
      </div>
      <ul class="legend">
        ${order.map((sev) => {
          const c = counts[sev] ?? 0;
          const pct = total > 0 ? (c / total) * 100 : 0;
          return html`
            <li>
              <span class="legend-dot" style=${`background: ${SEVERITY_VARS[sev]}`}></span>
              <span class="legend-label">${SEVERITY_LABELS[sev]}</span>
              <span class="legend-count">${c.toLocaleString("de-DE")}</span>
              <span class="legend-pct muted">${pct.toFixed(0)}%</span>
            </li>
          `;
        })}
      </ul>
    `;
  }

  override render(): TemplateResult {
    if (this._loading && !this._stats) {
      return html`<div class="root"><p class="status">lade…</p></div>`;
    }
    if (!this._stats) {
      return html`<div class="root"><p class="status">Keine Daten verfügbar.</p></div>`;
    }

    const s = this._stats;
    const totals24 = Object.values(s.severity_24h).reduce((a, b) => a + b, 0);
    const errors24 = s.severity_24h.error ?? 0;
    const warnings24 = s.severity_24h.warning ?? 0;
    const errorRate = totals24 > 0 ? (errors24 / totals24) * 100 : 0;

    return html`
      <div class="root">
        <section>
          <header class="section-head">
            <h2>Live-Status</h2>
            <button class="mh-btn-mini" @click=${() => void this._load()}>
              ↻ Aktualisieren
            </button>
          </header>
          <div class="kpis">
            <div class="kpi">
              <span class="kpi-label">Gesamt</span>
              <span class="kpi-value">${s.total.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">Nachrichten in der Datenbank</span>
            </div>
            <div class="kpi accent-info">
              <span class="kpi-label">Letzte 24 h</span>
              <span class="kpi-value">${totals24.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">alle Severities</span>
            </div>
            <div class="kpi accent-error">
              <span class="kpi-label">Errors 24 h</span>
              <span class="kpi-value">${errors24}</span>
              <span class="kpi-hint">
                ${totals24 === 0 ? "—" : `${errorRate.toFixed(1)} % Anteil`}
              </span>
            </div>
            <div class="kpi accent-warning">
              <span class="kpi-label">Warnings 24 h</span>
              <span class="kpi-value">${warnings24}</span>
              <span class="kpi-hint">letzte 24 Stunden</span>
            </div>
          </div>
        </section>

        <section>
          <div class="mh-card">
            <div class="mh-card__header">
              <h3 class="mh-card__title">Severity-Verteilung (24 h)</h3>
              <span class="muted small">${totals24.toLocaleString("de-DE")} Nachrichten</span>
            </div>
            ${this._renderSeverityStack()}
          </div>
        </section>

        <section>
          <div class="mh-card">
            <div class="mh-card__header">
              <h3 class="mh-card__title">Aktive Quellen</h3>
              <span class="muted small">${this._sources.length}</span>
            </div>
            ${this._sources.length === 0
              ? html`<p class="muted">
                  Noch keine Quellen erfasst. Sobald die erste Nachricht reinkommt,
                  erscheint sie hier.
                </p>`
              : html`<ul class="sources">
                  ${this._sources.map(
                    (src) => html`<li class="source-pill">${src}</li>`
                  )}
                </ul>`}
          </div>
        </section>

        <section>
          <div class="mh-card">
            <div class="mh-card__header">
              <h3 class="mh-card__title">Heatmap (Stunde × Wochentag, 30 Tage)</h3>
            </div>
            ${this._renderHeatmap()}
          </div>
        </section>

        <section>
          <div class="mh-card">
            <div class="mh-card__header">
              <h3 class="mh-card__title">Top-10 Quellen (30 Tage)</h3>
            </div>
            ${this._topSources.length === 0
              ? html`<p class="muted">Keine Daten.</p>`
              : html`<ul class="top-sources">
                  ${this._topSources.map((t, i) => {
                    const max = this._topSources[0]?.count ?? 1;
                    const pct = (t.count / max) * 100;
                    return html`<li>
                      <span class="rank">${i + 1}</span>
                      <code class="source-name">${t.source}</code>
                      <span class="bar-track">
                        <span class="bar-fill" style=${`width: ${pct}%`}></span>
                      </span>
                      <span class="bar-count">${t.count.toLocaleString("de-DE")}</span>
                    </li>`;
                  })}
                </ul>`}
          </div>
        </section>
      </div>
    `;
  }

  static override styles = [
    tokens,
    cards,
    pills,
    css`
      :host { display: block; height: 100%; overflow-y: auto; background: var(--mh-bg); }
      .root {
        max-width: 1024px; margin: 0 auto;
        padding: var(--mh-space-5);
        display: flex; flex-direction: column; gap: var(--mh-space-5);
      }
      section { display: flex; flex-direction: column; gap: var(--mh-space-3); }
      .section-head { display: flex; justify-content: space-between; align-items: center; gap: var(--mh-space-3); }
      h2 { margin: 0; font-size: var(--mh-text-lg); font-weight: var(--mh-weight-semibold); color: var(--mh-fg); letter-spacing: -0.01em; }
      h3.mh-card__title { font-size: var(--mh-text-md); }
      .mh-btn-mini {
        font: inherit; font-size: var(--mh-text-xs); padding: 4px 10px;
        border: 1px solid var(--mh-divider); background: var(--mh-surface);
        color: var(--mh-fg-muted); border-radius: var(--mh-radius-sm); cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      .mh-btn-mini:hover { background: var(--mh-surface-2); color: var(--mh-fg); }
      .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--mh-space-3); }
      .kpi {
        background: var(--mh-surface); border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md); padding: var(--mh-space-4);
        display: flex; flex-direction: column; gap: 2px;
        position: relative; overflow: hidden; box-shadow: var(--mh-shadow-1);
      }
      .kpi::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--mh-divider); }
      .kpi.accent-info::before { background: var(--mh-info); }
      .kpi.accent-error::before { background: var(--mh-error); }
      .kpi.accent-warning::before { background: var(--mh-warning); }
      .kpi-label { font-size: var(--mh-text-xs); color: var(--mh-fg-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: var(--mh-weight-semibold); }
      .kpi-value { font-size: var(--mh-text-3xl); font-weight: var(--mh-weight-bold); color: var(--mh-fg); line-height: 1.1; margin: 4px 0; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
      .kpi-hint { font-size: var(--mh-text-xs); color: var(--mh-fg-muted); }
      .stack-bar { display: flex; height: 14px; border-radius: var(--mh-radius-pill); overflow: hidden; background: var(--mh-surface-2); }
      .stack-seg { height: 100%; transition: width var(--mh-transition-med); min-width: 2px; }
      .legend { list-style: none; padding: 0; margin: var(--mh-space-3) 0 0 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--mh-space-2) var(--mh-space-4); }
      .legend li { display: grid; grid-template-columns: 12px 1fr auto auto; gap: var(--mh-space-2); align-items: center; font-size: var(--mh-text-sm); }
      .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
      .legend-label { color: var(--mh-fg); }
      .legend-count { font-variant-numeric: tabular-nums; font-weight: var(--mh-weight-semibold); color: var(--mh-fg); }
      .legend-pct { font-size: var(--mh-text-xs); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }
      .sources { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
      .source-pill { padding: 4px 10px; background: var(--mh-surface-2); border-radius: var(--mh-radius-sm); font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace); font-size: var(--mh-text-xs); color: var(--mh-fg-muted); font-weight: var(--mh-weight-medium); }
      .top-sources { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
      .top-sources li { display: grid; grid-template-columns: 24px 1fr 1fr auto; gap: var(--mh-space-3); align-items: center; font-size: var(--mh-text-sm); }
      .rank { font-variant-numeric: tabular-nums; font-weight: var(--mh-weight-semibold); color: var(--mh-fg-muted); font-size: var(--mh-text-xs); text-align: right; }
      .source-name { font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace); font-size: var(--mh-text-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--mh-fg); }
      .bar-track { position: relative; height: 6px; background: var(--mh-surface-2); border-radius: var(--mh-radius-pill); overflow: hidden; }
      .bar-fill { position: absolute; inset: 0; background: var(--mh-accent); opacity: 0.7; border-radius: inherit; }
      .bar-count { font-variant-numeric: tabular-nums; font-weight: var(--mh-weight-semibold); color: var(--mh-fg); min-width: 40px; text-align: right; }
      .heatmap-wrap { display: flex; flex-direction: column; gap: var(--mh-space-3); }
      .heatmap { display: flex; flex-direction: column; gap: 3px; overflow-x: auto; }
      .heatmap-header, .heatmap-row { display: grid; grid-template-columns: 32px repeat(24, minmax(18px, 1fr)); gap: 3px; align-items: center; min-width: 600px; }
      .day-label, .hour-label { font-size: var(--mh-text-xs); color: var(--mh-fg-muted); text-align: center; font-weight: var(--mh-weight-medium); }
      .day-label { text-align: right; padding-right: 6px; }
      .heatmap-cell { aspect-ratio: 1; border-radius: 3px; min-height: 18px; transition: transform var(--mh-transition-fast); cursor: default; }
      .heatmap-cell.empty { border: 1px solid var(--mh-divider); }
      .heatmap-cell:hover { transform: scale(1.18); outline: 1px solid var(--mh-fg); }
      .heatmap-legend { display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
      .legend-cell { width: 14px; height: 14px; border-radius: 3px; }
      .muted { color: var(--mh-fg-muted); }
      .small { font-size: var(--mh-text-xs); }
      .status { color: var(--mh-fg-muted); padding: var(--mh-space-2) 0; margin: 0; }
    `,
  ];
}
