// Iter 22: Settings-Tab Webhook-Liste (read-only)
// Iter 23: Webhook Add/Edit/Delete (Stub - vollstaendiges UI haengt
//          an Iter 23 Backend-Endpoints, hier nur Read + Copy-URL)

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ApiClient, WebhookDto } from "../api-client.js";

@customElement("webhook-list")
export class WebhookList extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: WebhookDto[] = [];
  @state() private _loading = false;

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    try {
      this._items = await this.api.listWebhooks();
    } finally {
      this._loading = false;
    }
  }

  private _copyUrl(webhookId: string): void {
    const url = `${window.location.origin}/api/webhook/${webhookId}`;
    void navigator.clipboard.writeText(url);
  }

  override render(): TemplateResult {
    if (this._loading) return html`<div class="status">lade...</div>`;
    if (!this._items.length)
      return html`<div class="status">Keine Webhooks angelegt.</div>`;
    return html`
      <ul>
        ${this._items.map(
          (w) => html`<li>
            <div class="row">
              <span class="name">${w.name}</span>
              <span class="src">${w.default_source}</span>
              <span class="sev">${w.default_severity}</span>
              <span class=${w.enabled ? "ok" : "off"}>
                ${w.enabled ? "aktiv" : "deaktiviert"}
              </span>
              <button @click=${() => this._copyUrl(w.webhook_id)}>URL kopieren</button>
            </div>
          </li>`
        )}
      </ul>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      padding: 16px;
    }
    .status {
      color: var(--secondary-text-color, #666);
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 160px 80px 90px 130px;
      gap: 12px;
      padding: 8px;
      border-bottom: 1px solid var(--divider-color, #eee);
      align-items: center;
    }
    .ok {
      color: var(--success-color, #4caf50);
    }
    .off {
      color: var(--secondary-text-color, #999);
    }
    button {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
    }
  `;
}
