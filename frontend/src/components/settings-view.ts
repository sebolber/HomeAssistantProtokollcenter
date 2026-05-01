// Settings-Tab: Webhook-Verwaltung mit Add/Edit/Delete + Quick-Help.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ApiClient, WebhookDto } from "../api-client.js";
import { tokens, buttons, cards } from "../styles/tokens.js";
import "./webhook-form.js";
import "./knx-addresses-view.js";
import "./channels-view.js";
import "./simple-list-view.js";

@customElement("settings-view")
export class SettingsView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: WebhookDto[] = [];
  @state() private _loading = false;
  @state() private _showForm = false;
  @state() private _editing: WebhookDto | null = null;
  @state() private _toast = "";
  @state() private _menuOpenId: string | null = null;

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

  private async _copyUrl(webhookId: string): Promise<void> {
    const url = `${window.location.origin}/api/webhook/${webhookId}`;
    try {
      await navigator.clipboard.writeText(url);
      this._showToast("URL kopiert");
    } catch {
      this._showToast("Kopieren fehlgeschlagen");
    }
  }

  private async _delete(item: WebhookDto): Promise<void> {
    if (!this.api) return;
    if (!window.confirm(`Webhook „${item.name}" wirklich löschen?`)) return;
    await this.api.deleteWebhook(item.webhook_id);
    this._showToast(`„${item.name}" gelöscht`);
    await this._load();
  }

  private _toggleMenu(id: string): void {
    this._menuOpenId = this._menuOpenId === id ? null : id;
  }

  private _closeMenu = (): void => {
    if (this._menuOpenId !== null) this._menuOpenId = null;
  };

  private async _toggle(item: WebhookDto): Promise<void> {
    if (!this.api) return;
    await this.api.updateWebhook(item.webhook_id, { enabled: !item.enabled });
    await this._load();
  }

  private _onSaved(_e: CustomEvent<{ webhook: WebhookDto }>): void {
    this._showForm = false;
    this._editing = null;
    this._showToast("Webhook gespeichert");
    void this._load();
  }

  private _onCancel(): void {
    this._showForm = false;
    this._editing = null;
  }

  private _add(): void {
    this._editing = null;
    this._showForm = true;
  }

  private _edit(item: WebhookDto): void {
    this._editing = item;
    this._showForm = true;
  }

  private _toastTimer?: number;
  private _showToast(text: string): void {
    this._toast = text;
    if (this._toastTimer) window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = ""), 2400);
  }

  private _renderEmpty(): TemplateResult {
    return html`
      <div class="empty">
        <h3>Noch keine Webhooks</h3>
        <p>
          Lege deinen ersten Webhook an, um Nachrichten von externen Quellen
          (Pi-hole, Grafana, Skripte, IoT-Geräte) zu empfangen. Jeder Webhook
          bekommt eine eigene Geheim-URL nach
          <code>https://&lt;ha-host&gt;/api/webhook/&lt;id&gt;</code>.
        </p>
        <button class="mh-btn mh-btn--primary" @click=${this._add}>+ Webhook anlegen</button>
      </div>
    `;
  }

  private _renderItem(item: WebhookDto): TemplateResult {
    const url = `${window.location.origin}/api/webhook/${item.webhook_id}`;
    const menuOpen = this._menuOpenId === item.webhook_id;
    return html`
      <div class=${`webhook-card ${item.enabled ? "" : "disabled"}`}>
        <header class="card-header">
          <div class="title">
            <span
              class=${`status-dot ${item.enabled ? "ok" : "off"}`}
              title=${item.enabled ? "Aktiv" : "Deaktiviert"}
              aria-hidden="true"
            ></span>
            <h4>${item.name}</h4>
            <span class=${`status-text ${item.enabled ? "ok" : "off"}`}>
              ${item.enabled ? "Aktiv" : "Deaktiviert"}
            </span>
          </div>
          <div class="card-actions" @click=${(e: Event) => e.stopPropagation()}>
            <button
              class="mh-btn mh-btn--sm"
              title="Webhook bearbeiten"
              @click=${() => this._edit(item)}
            >
              <span aria-hidden="true">✎</span> Bearbeiten
            </button>
            <div class="overflow">
              <button
                class="mh-btn mh-btn--icon mh-btn--ghost"
                aria-label="Weitere Aktionen"
                aria-haspopup="menu"
                aria-expanded=${menuOpen}
                @click=${() => this._toggleMenu(item.webhook_id)}
              >
                ⋮
              </button>
              ${menuOpen
                ? html`<div class="overflow-menu" role="menu">
                    <button
                      role="menuitem"
                      class="overflow-item"
                      @click=${() => {
                        this._menuOpenId = null;
                        void this._toggle(item);
                      }}
                    >
                      ${item.enabled ? "Deaktivieren" : "Aktivieren"}
                    </button>
                    <hr />
                    <button
                      role="menuitem"
                      class="overflow-item danger"
                      @click=${() => {
                        this._menuOpenId = null;
                        void this._delete(item);
                      }}
                    >
                      Löschen
                    </button>
                  </div>`
                : null}
            </div>
          </div>
        </header>

        <div class="meta">
          <span class="meta-pill">
            <span class="meta-key">Source</span>
            <code>${item.default_source}</code>
          </span>
          <span class="meta-pill">
            <span class="meta-key">Severity</span>
            <code>${item.default_severity}</code>
          </span>
        </div>

        <div class="url-row">
          <code class="url" title=${url}>${url}</code>
          <button
            class="mh-btn mh-btn--sm"
            @click=${() => this._copyUrl(item.webhook_id)}
            title="URL in Zwischenablage kopieren"
          >
            <span aria-hidden="true">⧉</span> Kopieren
          </button>
        </div>

        ${item.field_map
          ? html`<details class="mapping">
              <summary>JSONPath-Mapping anzeigen</summary>
              <pre><code>${JSON.stringify(item.field_map, null, 2)}</code></pre>
            </details>`
          : null}
      </div>
    `;
  }

  override render(): TemplateResult {
    return html`
      <div class="root" @click=${this._closeMenu}>
        <section>
          <header class="section-head">
            <div>
              <h2>Webhooks</h2>
              <p class="hint">
                Eingehende Nachrichten via HTTP-POST. Pro Webhook eigene URL +
                optionales JSONPath-Mapping für beliebige Payload-Strukturen.
              </p>
            </div>
            ${this._items.length > 0 && !this._showForm
              ? html`<button class="mh-btn mh-btn--primary" @click=${this._add}>
                  + Webhook anlegen
                </button>`
              : null}
          </header>

          ${this._showForm
            ? html`<webhook-form
                .api=${this.api}
                .editing=${this._editing}
                @saved=${this._onSaved}
                @cancel=${this._onCancel}
              ></webhook-form>`
            : null}

          ${this._loading
            ? html`<p class="status">lade…</p>`
            : this._items.length === 0 && !this._showForm
              ? this._renderEmpty()
              : html`<div class="grid">${this._items.map((item) => this._renderItem(item))}</div>`}
        </section>

        <knx-addresses-view .api=${this.api}></knx-addresses-view>

        <channels-view .api=${this.api}></channels-view>

        <mqtt-topics-view .api=${this.api}></mqtt-topics-view>

        <heartbeats-view .api=${this.api}></heartbeats-view>

        <remediation-view .api=${this.api}></remediation-view>

        <section style="display:none;">
          <header class="section-head">
            <div>
              <h2>Alt-Notification-Channels</h2>
              <p class="hint">
                Telegram, Pushover, ntfy, Signal — mit Quiet Hours und Throttling.
              </p>
            </div>
          </header>
          <div class="placeholder">
            <p>
              Channel-Verwaltung kommt in Iteration v0.2. Backend-Logik ist
              implementiert (Forwarder, Quiet Hours, Throttling), das UI folgt.
            </p>
          </div>
        </section>

        <section>
          <header class="section-head">
            <div>
              <h2>Heartbeat-Quellen</h2>
              <p class="hint">
                Stille Quellen erkennen und alarmieren — Backend-Job läuft 60s,
                UI-Editor folgt in v0.2 (REST-Endpoint
                <code>/api/messagehub/heartbeats</code> ist da).
              </p>
            </div>
          </header>
        </section>

        ${this._toast ? html`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }

  static override styles = [
    tokens,
    buttons,
    cards,
    css`
      :host {
        display: block;
        overflow-y: auto;
        height: 100%;
        background: var(--mh-bg);
      }
      .root {
        max-width: 1024px;
        margin: 0 auto;
        padding: var(--mh-space-5);
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-6);
      }
      section {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: var(--mh-space-4);
        flex-wrap: wrap;
      }
      h2 {
        margin: 0;
        font-size: var(--mh-text-xl);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg);
        letter-spacing: -0.01em;
      }
      .hint {
        margin: 4px 0 0 0;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        line-height: 1.5;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--mh-space-3);
      }

      /* Webhook-Card */
      .webhook-card {
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-4);
        box-shadow: var(--mh-shadow-1);
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
        transition: opacity var(--mh-transition-fast);
      }
      .webhook-card.disabled {
        opacity: 0.6;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .card-actions {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .title {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      h4 {
        margin: 0;
        font-size: var(--mh-text-md);
        font-weight: var(--mh-weight-semibold);
      }
      .status-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
      }
      .status-dot.ok {
        background: var(--mh-success);
        box-shadow: 0 0 0 3px var(--mh-success-soft);
      }
      .status-dot.off {
        background: var(--mh-divider-strong);
      }
      .status-text {
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .status-text.ok {
        color: var(--mh-success);
      }
      .status-text.off {
        color: var(--mh-fg-muted);
      }

      /* Meta-Pills */
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
      }
      .meta-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-pill);
        padding: 3px 10px;
        font-size: var(--mh-text-xs);
      }
      .meta-key {
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-medium);
      }
      .meta-pill code {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        background: transparent;
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
      }

      /* URL-Zeile */
      .url-row {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
        background: var(--mh-bg);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        padding: 6px 10px;
      }
      code.url {
        flex: 1;
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        background: transparent;
        padding: 0;
      }

      /* Mapping-Details */
      .mapping {
        font-size: var(--mh-text-sm);
      }
      .mapping summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-medium);
        padding: 4px 0;
      }
      .mapping summary:hover {
        color: var(--mh-fg);
      }
      .mapping pre {
        margin: var(--mh-space-2) 0 0 0;
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-bg);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        overflow: auto;
        max-width: 100%;
        font-size: var(--mh-text-xs);
      }
      .mapping pre code {
        background: transparent;
        padding: 0;
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
      }

      /* Overflow-Menu */
      .overflow {
        position: relative;
      }
      .overflow-menu {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        z-index: 50;
        min-width: 180px;
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        padding: 4px;
      }
      .overflow-menu hr {
        border: none;
        border-top: 1px solid var(--mh-divider);
        margin: 4px 0;
      }
      .overflow-item {
        display: block;
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        padding: 8px 12px;
        border-radius: var(--mh-radius-sm);
        font: inherit;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
        cursor: pointer;
      }
      .overflow-item:hover:not(:disabled) {
        background: var(--mh-surface-2);
      }
      .overflow-item.danger {
        color: var(--mh-error);
      }
      .overflow-item.danger:hover:not(:disabled) {
        background: var(--mh-error-soft);
      }

      /* Empty / Placeholder */
      .empty {
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-6);
        text-align: center;
      }
      .empty h3 {
        margin: 0 0 var(--mh-space-2) 0;
        color: var(--mh-fg);
      }
      .empty p {
        margin: 0 0 var(--mh-space-4) 0;
        color: var(--mh-fg-muted);
        max-width: 460px;
        margin-inline: auto;
        line-height: 1.5;
      }
      .empty code {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        background: var(--mh-surface-2);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-xs);
      }
      .placeholder {
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-4);
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
      .placeholder p {
        margin: 0;
      }

      .status {
        color: var(--mh-fg-muted);
        padding: var(--mh-space-2) 0;
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
        animation: slidein 0.2s ease-out;
      }
      @keyframes slidein {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `,
  ];
}
