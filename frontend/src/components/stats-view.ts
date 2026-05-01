// Stats-Dashboard: KPI-Cards + Severity-Verteilung + Top-Sources.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ApiClient, StatsDto } from "../api-client.js";

const SEVERITY_LABELS: Record<string, string> = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
  debug: "Debug",
};

const SEVERITY_VARS: Record<string, string> = {
  error: "var(--error-color, #db4437)",
  warning: "var(--warning-color, #ff9800)",
  info: "var(--info-color, #03a9f4)",
  debug: "var(--secondary-text-color, #888)",
};

@customElement("stats-view")
export class StatsView extends LitElement {
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
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
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
    const labelDays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    return html`
      <div class="heatmap">
        <div class="heatmap-header">
          <span></span>
          ${Array.from({ length: 24 }, (_, h) =>
            html`<span class="hour-label">${h % 3 === 0 ? h : ""}</span>`
          )}
        </div>
        ${grid.map(
          (row, dayIdx) => html`
            <div class="heatmap-row">
              <span class="day-label">${labelDays[dayIdx]}</span>
              ${row.map((count) => {
                const intensity = count === 0 ? 0 : Math.max(0.1, count / max);
                return html`
                  <div
                    class="heatmap-cell"
                    style=${`background: rgba(3, 169, 244, ${intensity})`}
                    title=${`${labelDays[dayIdx]} ${row.indexOf(count)}:00 — ${count} msg`}
                  ></div>
                `;
              })}
            </div>
          `
        )}
      </div>
      <p class="muted small">Helligkeit ∝ Nachrichtenanzahl (max: ${max}).</p>
    `;
  }

  private _renderSeverityBars(): TemplateResult {
    if (!this._stats) return html``;
    const counts = this._stats.severity_24h;
    const total = Math.max(1, Object.values(counts).reduce((a, b) => a + b, 0));
    const order = ["error", "warning", "info", "debug"];
    return html`
      <div class="bars">
        ${order.map((sev) => {
          const c = counts[sev] ?? 0;
          const pct = (c / total) * 100;
          return html`
            <div class="bar-row">
              <span class="bar-label">${SEVERITY_LABELS[sev] ?? sev}</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  style=${`width: ${pct}%; background: ${SEVERITY_VARS[sev]}`}
                ></div>
              </div>
              <span class="bar-count">${c}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  override render(): TemplateResult {
    if (this._loading && !this._stats) {
      return html`<div class="root"><p class="status">lade…</p></div>`;
    }
    if (!this._stats) {
      return html`<div class="root"><p class="status">Keine Daten verfuegbar.</p></div>`;
    }

    const s = this._stats;
    const totals24 = Object.values(s.severity_24h).reduce((a, b) => a + b, 0);

    return html`
      <div class="root">
        <section>
          <h2>Live-Status</h2>
          <div class="kpis">
            <div class="kpi">
              <span class="kpi-label">Gesamt</span>
              <span class="kpi-value">${s.total.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">Nachrichten in der Datenbank</span>
            </div>
            <div class="kpi accent-info">
              <span class="kpi-label">Letzte 24h</span>
              <span class="kpi-value">${totals24.toLocaleString("de-DE")}</span>
              <span class="kpi-hint">alle Severities</span>
            </div>
            <div class="kpi accent-error">
              <span class="kpi-label">Errors 24h</span>
              <span class="kpi-value">${s.severity_24h.error ?? 0}</span>
              <span class="kpi-hint">unbehoben + bestaetigt</span>
            </div>
            <div class="kpi accent-warning">
              <span class="kpi-label">Warnings 24h</span>
              <span class="kpi-value">${s.severity_24h.warning ?? 0}</span>
              <span class="kpi-hint">letzte 24 Stunden</span>
            </div>
          </div>
        </section>

        <section>
          <h2>Severity-Verteilung (24h)</h2>
          <div class="card">${this._renderSeverityBars()}</div>
        </section>

        <section>
          <h2>Aktive Quellen</h2>
          <div class="card">
            ${this._sources.length === 0
              ? html`<p class="status">
                  Noch keine Quellen erfasst. Sobald die erste Nachricht reinkommt,
                  erscheint sie hier.
                </p>`
              : html`<ul class="sources">
                  ${this._sources.map(
                    (src) => html`<li><code>${src}</code></li>`
                  )}
                </ul>`}
          </div>
        </section>

        <section>
          <h2>Heatmap (Stunde × Wochentag, letzte 30 Tage)</h2>
          <div class="card">${this._renderHeatmap()}</div>
        </section>

        <section>
          <h2>Top-10 Quellen (30 Tage)</h2>
          <div class="card">
            ${this._topSources.length === 0
              ? html`<p class="muted">Keine Daten.</p>`
              : html`<table class="top">
                  <thead>
                    <tr><th>Source</th><th>Nachrichten</th></tr>
                  </thead>
                  <tbody>
                    ${this._topSources.map(
                      (t) => html`<tr>
                        <td><code>${t.source}</code></td>
                        <td>${t.count.toLocaleString("de-DE")}</td>
                      </tr>`
                    )}
                  </tbody>
                </table>`}
          </div>
        </section>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      overflow-y: auto;
      height: 100%;
    }
    .root {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    h2 {
      margin: 0;
      font-size: 1.1em;
      color: var(--primary-text-color, #222);
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .kpi {
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-left: 4px solid var(--divider-color, #e0e0e0);
    }
    .kpi.accent-info {
      border-left-color: var(--info-color, #03a9f4);
    }
    .kpi.accent-error {
      border-left-color: var(--error-color, #db4437);
    }
    .kpi.accent-warning {
      border-left-color: var(--warning-color, #ff9800);
    }
    .kpi-label {
      font-size: 0.85em;
      color: var(--secondary-text-color, #666);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 2em;
      font-weight: 600;
      color: var(--primary-text-color, #222);
      line-height: 1;
      margin: 4px 0;
    }
    .kpi-hint {
      font-size: 0.78em;
      color: var(--secondary-text-color, #888);
    }
    .card {
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
    }
    .bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 80px 1fr 50px;
      gap: 12px;
      align-items: center;
    }
    .bar-label {
      font-size: 0.9em;
      color: var(--primary-text-color, #222);
    }
    .bar-track {
      height: 8px;
      background: var(--secondary-background-color, #f3f3f3);
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      transition: width 0.3s ease;
      min-width: 1px;
    }
    .bar-count {
      text-align: right;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
      font-variant-numeric: tabular-nums;
    }
    .sources {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .sources li {
      padding: 4px 8px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 4px;
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
    }
    .heatmap {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-x: auto;
    }
    .heatmap-header,
    .heatmap-row {
      display: grid;
      grid-template-columns: 30px repeat(24, 1fr);
      gap: 2px;
      align-items: center;
      min-width: 540px;
    }
    .day-label,
    .hour-label {
      font-size: 0.7em;
      color: var(--secondary-text-color, #888);
      text-align: center;
    }
    .heatmap-cell {
      aspect-ratio: 1;
      border-radius: 2px;
      background: var(--secondary-background-color, #f3f3f3);
      min-height: 14px;
    }
    .top {
      width: 100%;
      border-collapse: collapse;
    }
    .top th,
    .top td {
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1px solid var(--divider-color, #eee);
      font-size: 0.9em;
    }
    .top th {
      font-size: 0.78em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color, #666);
    }
    .small {
      font-size: 0.78em;
    }
    .status {
      color: var(--secondary-text-color, #666);
      padding: 8px 0;
      margin: 0;
    }
  `;
}
