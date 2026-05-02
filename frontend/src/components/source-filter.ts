// Iter 19: Source-Dropdown, laedt /api/messagehub/sources

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type { ApiClient } from "../api-client.js";

@customElement("source-filter")
export class SourceFilter extends LitElement {
  @property({ attribute: false }) api?: ApiClient;
  @property({ attribute: false }) selected = "";

  @state() private _sources: string[] = [];

  override async firstUpdated(): Promise<void> {
    if (!this.api) return;
    try {
      this._sources = await this.api.listSources();
    } catch {
      this._sources = [];
    }
  }

  private _onChange(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { source: v },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render(): TemplateResult {
    return html`
      <select @change=${this._onChange} .value=${this.selected}>
        <option value="">Alle Quellen</option>
        ${this._sources.map((s) => html`<option value=${s}>${s}</option>`)}
      </select>
    `;
  }

  static override styles = css`
    select {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: inherit;
    }
  `;
}
