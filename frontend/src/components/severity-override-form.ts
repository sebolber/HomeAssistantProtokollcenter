// Iter 27 (knx-findings): Form fuer User-Severity-Overrides.
//
// Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.3.
// Zeigt eine Tabelle "Code | Default | Override" mit Inline-Select pro Row;
// PUT setzt einen Override, DELETE entfernt ihn.

import { LitElement, css, html, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  ApiClient,
  FindingSeverity,
  SeverityOverrideItemDto,
} from "../api-client.js";
import { buttons, cards, forms, pills, tokens } from "../styles/tokens.js";
import { customElement } from "../utils/custom-element.js";
import { getFindingTitle } from "../utils/findings-i18n.js";

const SEVERITY_VALUES: ReadonlyArray<FindingSeverity> = [
  "debug",
  "info",
  "warning",
  "error",
];

@customElement("severity-override-form")
export class SeverityOverrideForm extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: SeverityOverrideItemDto[] = [];
  @state() private _loading = false;
  @state() private _error: string | null = null;

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    this._error = null;
    try {
      const resp = await this.api.listSeverityOverrides();
      this._items = resp.items;
    } catch (err) {
      this._error = (err as Error).message ?? "Unbekannter Fehler";
    } finally {
      this._loading = false;
    }
  }

  private async _setOverride(
    code: string,
    severity: FindingSeverity
  ): Promise<void> {
    if (!this.api) return;
    try {
      await this.api.setSeverityOverride(code, severity);
      await this._load();
    } catch (err) {
      this._error = (err as Error).message ?? "Override konnte nicht gesetzt werden";
    }
  }

  private async _clearOverride(code: string): Promise<void> {
    if (!this.api) return;
    try {
      await this.api.clearSeverityOverride(code);
      await this._load();
    } catch (err) {
      this._error = (err as Error).message ?? "Override konnte nicht entfernt werden";
    }
  }

  private _onSelectChange(ev: Event, code: string): void {
    const target = ev.target as HTMLSelectElement;
    const newSeverity = target.value as FindingSeverity | "_default";
    if (newSeverity === "_default") {
      void this._clearOverride(code);
    } else {
      void this._setOverride(code, newSeverity);
    }
  }

  private _lang(): string {
    if (typeof document !== "undefined" && document.documentElement.lang) {
      return document.documentElement.lang;
    }
    return "en";
  }

  override render(): TemplateResult {
    if (this._error) {
      return html`<div class="error" data-test="override-error">
        Fehler: ${this._error}
      </div>`;
    }
    if (this._loading && this._items.length === 0) {
      return html`<div class="loading">Wird geladen…</div>`;
    }
    return html`
      <table class="overrides" data-test="severity-overrides-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Default</th>
            <th>Override</th>
          </tr>
        </thead>
        <tbody>
          ${this._items.map((item) => this._renderRow(item))}
        </tbody>
      </table>
    `;
  }

  private _renderRow(item: SeverityOverrideItemDto): TemplateResult {
    const lang = this._lang();
    const title = getFindingTitle(item.code, lang) || item.code;
    const currentValue = item.override_severity ?? "_default";
    return html`
      <tr data-test="override-row" data-code=${item.code}>
        <td class="code">
          <span class="code-text" title=${item.code}>${title}</span>
        </td>
        <td>
          <span class=${`mh-pill mh-pill--${item.default_severity}`}>
            ${item.default_severity}
          </span>
        </td>
        <td>
          <select
            class="mh-select"
            data-test="override-select"
            .value=${currentValue}
            @change=${(ev: Event) => this._onSelectChange(ev, item.code)}
          >
            <option value="_default">— Default —</option>
            ${SEVERITY_VALUES.map(
              (sev) => html`<option value=${sev}>${sev}</option>`
            )}
          </select>
        </td>
      </tr>
    `;
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
      }
      .error {
        padding: var(--mh-space-3);
        background: var(--mh-error-soft);
        color: var(--mh-error);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }
      .loading {
        padding: var(--mh-space-4);
        text-align: center;
        color: var(--mh-fg-muted);
      }
      .overrides {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mh-text-sm);
      }
      .overrides th,
      .overrides td {
        padding: var(--mh-space-2) var(--mh-space-3);
        text-align: left;
        border-bottom: 1px solid var(--mh-divider);
      }
      .overrides th {
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg-muted);
        background: var(--mh-surface-2);
      }
      .code-text {
        font-family: var(--code-font-family, monospace);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "severity-override-form": SeverityOverrideForm;
  }
}
