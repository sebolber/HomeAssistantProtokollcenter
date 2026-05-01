// Iter 44: Audit-Log-Tab.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ApiClient } from "../api-client.js";

@customElement("audit-view")
export class AuditView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: Array<Record<string, unknown>> = [];
  @state() private _loading = false;

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    try {
      this._items = await this.api.listAudit(200);
    } finally {
      this._loading = false;
    }
  }

  override render(): TemplateResult {
    return html`
      <div class="root">
        <header>
          <h2>Audit-Log</h2>
          <button @click=${() => void this._load()}>↻ Aktualisieren</button>
        </header>
        <p class="hint">
          Letzte 200 administrativen Aktionen: Loeschen, Status-Aenderungen,
          Webhook-CRUD. Eintraege sind unveraenderlich.
        </p>
        ${this._loading
          ? html`<p class="status">lade…</p>`
          : this._items.length === 0
            ? html`<p class="status">Noch keine Audit-Eintraege.</p>`
            : html`<table>
                <thead>
                  <tr>
                    <th>Zeit</th>
                    <th>Wer</th>
                    <th>Aktion</th>
                    <th>Ziel</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  ${this._items.map(
                    (item) => html`<tr>
                      <td class="ts">${String(item.timestamp).replace("T", " ").replace(/\+00:00$/, "")}</td>
                      <td>${item.actor}</td>
                      <td><code>${item.action}</code></td>
                      <td>
                        ${item.target_type}${item.target_id ? html` #${item.target_id}` : ""}
                      </td>
                      <td>
                        ${item.details
                          ? html`<code>${JSON.stringify(item.details)}</code>`
                          : ""}
                      </td>
                    </tr>`
                  )}
                </tbody>
              </table>`}
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
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    h2 {
      margin: 0;
      font-size: 1.1em;
    }
    .hint {
      margin: 0 0 16px 0;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    button {
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font: inherit;
      font-size: 0.85em;
    }
    button:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .status {
      color: var(--secondary-text-color, #666);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      font-size: 0.9em;
    }
    th,
    td {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 1px solid var(--divider-color, #eee);
    }
    th {
      background: var(--secondary-background-color, #f3f3f3);
      font-size: 0.78em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color, #666);
    }
    .ts {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      white-space: nowrap;
      color: var(--secondary-text-color, #666);
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 5px;
      border-radius: 3px;
    }
  `;
}
