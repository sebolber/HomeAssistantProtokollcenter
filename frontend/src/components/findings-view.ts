// Iter 9 (knx-findings): leerer Konfigurations-Check-Tab.
//
// Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.1:
// drittes Sub-Tab neben Live-Status + KNX-Bus-Analyse. Iter 9 rendert nur
// den leeren Container — Iter 10 verdrahtet Items, Severity-Pills, Ack-
// Action und Detail-Pane.

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import type { ApiClient, FindingDto, FindingsListResponse } from "../api-client.js";
import { buttons, cards, forms, pills, tokens } from "../styles/tokens.js";
import { customElement } from "../utils/custom-element.js";

type SeverityFilter = "" | "debug" | "info" | "warning" | "error";

const SEVERITY_OPTIONS: ReadonlyArray<{ value: SeverityFilter; label: string }> =
  [
    { value: "", label: "Alle Severities" },
    { value: "error", label: "Error" },
    { value: "warning", label: "Warning" },
    { value: "info", label: "Info" },
    { value: "debug", label: "Debug" },
  ];

@customElement("findings-view")
export class FindingsView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: FindingDto[] = [];
  @state() private _total = 0;
  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _severityFilter: SeverityFilter = "";

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    this._error = null;
    try {
      const resp: FindingsListResponse = await this.api.listFindings({
        severity: this._severityFilter || undefined,
      });
      this._items = resp.items;
      this._total = resp.total;
    } catch (err) {
      this._error = (err as Error).message ?? "Unbekannter Fehler";
    } finally {
      this._loading = false;
    }
  }

  private _onSeverityChange(ev: Event): void {
    const target = ev.target as HTMLSelectElement;
    this._severityFilter = target.value as SeverityFilter;
    void this._load();
  }

  override render(): TemplateResult {
    return html`
      <section class="root">
        <header class="header" data-test="findings-header">
          <h2 class="mh-card__title">Konfigurations-Check</h2>
          <p class="subtitle">
            Erkannte KNX-Konfigurations-Anomalien aus dem Telegrammverkehr.
          </p>
        </header>

        <div class="filters mh-card mh-card--flat" data-test="findings-filters">
          <label class="filter-label">
            Severity:
            <select
              class="mh-select"
              data-test="findings-severity-filter"
              .value=${this._severityFilter}
              @change=${this._onSeverityChange}
            >
              ${SEVERITY_OPTIONS.map(
                (opt) => html`<option value=${opt.value}>${opt.label}</option>`
              )}
            </select>
          </label>
          <span class="total" data-test="findings-total"
            >${this._total} Findings</span
          >
        </div>

        <div class="body" data-test="findings-table">
          ${this._renderBody()}
        </div>
      </section>
    `;
  }

  private _renderBody(): TemplateResult | typeof nothing {
    if (this._error) {
      return html`<div class="empty error" data-test="findings-error">
        Fehler beim Laden: ${this._error}
      </div>`;
    }
    if (this._loading) {
      return html`<div class="empty">Wird geladen…</div>`;
    }
    if (this._items.length === 0) {
      return html`<div class="empty" data-test="findings-empty">
        Keine Findings im aktuellen Filter — die Konfiguration sieht
        unauffaellig aus.
      </div>`;
    }
    // Iter 10 verdrahtet die Detail-Anzeige; bis dahin Platzhalter mit Code.
    return html`<ul class="items" data-test="findings-items">
      ${this._items.map(
        (it) => html`<li class="item">
          <span class="code">${it.code}</span>
          <span class="ga">${it.ga ?? ""}</span>
        </li>`
      )}
    </ul>`;
  }

  static override styles = [
    tokens,
    buttons,
    forms,
    pills,
    cards,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .root {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
        padding: var(--mh-space-4);
        height: 100%;
        overflow: auto;
      }
      .header {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .subtitle {
        margin: 0;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
      .filters {
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        flex-wrap: wrap;
      }
      .filter-label {
        display: flex;
        gap: var(--mh-space-2);
        align-items: center;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .total {
        margin-left: auto;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .body {
        flex: 1;
        min-height: 0;
      }
      .empty {
        padding: var(--mh-space-6);
        text-align: center;
        color: var(--mh-fg-muted);
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
      }
      .empty.error {
        color: var(--mh-error);
        border-color: var(--mh-error);
        background: var(--mh-error-soft);
      }
      .items {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
      }
      .item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--mh-space-3);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
      }
      .code {
        font-family: var(--code-font-family, monospace);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
      }
      .ga {
        font-family: var(--code-font-family, monospace);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "findings-view": FindingsView;
  }
}
