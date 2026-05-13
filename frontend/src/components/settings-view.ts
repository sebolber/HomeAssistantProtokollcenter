// Settings-Tab: Sub-Tabs fuer alle Eingangs-/Notification-Konfigurationen.
// Wegen der grossen KNX-Liste (3000+ Adressen) wird jede Konfig in einem
// eigenen Tab gerendert, damit nicht alle Sektionen untereinander stehen.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type { ApiClient, WebhookDto } from "../api-client.js";
import { tokens, buttons, cards } from "../styles/tokens.js";
import "./webhook-form.js";
import "./knx-addresses-view.js";
import "./knx-recommend-llm-view.js";
import "./channels-view.js";
import "./simple-list-view.js";

type SettingsTab =
  | "webhooks"
  | "knx"
  | "channels"
  | "mqtt"
  | "heartbeats"
  | "remediation"
  | "recommend-llm";

// Iter 44 (N3): Tabs ohne Icons — User-Feedback "Settings-Tableiste
// soll keine Icons verwenden". Reine Text-Buttons bleiben.
const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "webhooks", label: "Webhooks" },
  { id: "knx", label: "KNX-Bus" },
  { id: "channels", label: "Channels" },
  { id: "mqtt", label: "MQTT" },
  { id: "heartbeats", label: "Heartbeats" },
  { id: "remediation", label: "Auto-Remediation" },
  { id: "recommend-llm", label: "KI-Empfehlungen" },
];

const STORAGE_KEY_TAB = "messagehub.settings.tab";

function loadInitialTab(): SettingsTab {
  // F-010: URL-Hash hat Vorrang vor LocalStorage. Erlaubt Deep-Linking
  // wie #settings/mqtt direkt aus Bookmarks oder Cross-Tab-Navigation.
  if (typeof window !== "undefined" && window.location?.hash) {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (hash.startsWith("settings/")) {
      const sub = hash.slice("settings/".length);
      if (TABS.some((t) => t.id === sub)) return sub as SettingsTab;
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TAB);
    if (raw && TABS.some((t) => t.id === raw)) return raw as SettingsTab;
  } catch {
    // localStorage nicht verfuegbar (z. B. SSR / strict-iframe)
  }
  return "webhooks";
}

@customElement("settings-view")
export class SettingsView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: WebhookDto[] = [];
  @state() private _loading = false;
  @state() private _showForm = false;
  @state() private _editing: WebhookDto | null = null;
  @state() private _toast = "";
  @state() private _menuOpenId: string | null = null;
  @state() private _activeTab: SettingsTab = loadInitialTab();

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

  private readonly _closeMenu = (): void => {
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

  private _selectTab(tab: SettingsTab): void {
    this._activeTab = tab;
    try {
      localStorage.setItem(STORAGE_KEY_TAB, tab);
    } catch {
      // ignore
    }
    // F-010: Hash mitfuehren — erlaubt Browser-Back/Forward + Bookmark.
    if (typeof window !== "undefined" && window.history) {
      const newHash = `#settings/${tab}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
    }
  }

  // F-010: Reagiere auf hashchange-Events (Browser-Back, manuelles
  // Editieren der URL, Cross-Tab-Navigation).
  private readonly _onHashChange = (): void => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    if (!hash.startsWith("settings/")) return;
    const sub = hash.slice("settings/".length);
    if (TABS.some((t) => t.id === sub) && sub !== this._activeTab) {
      this._activeTab = sub as SettingsTab;
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", this._onHashChange);
    }
  }

  override disconnectedCallback(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("hashchange", this._onHashChange);
    }
    super.disconnectedCallback();
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
        <nav class="tabs" role="tablist" aria-label="Einstellungs-Bereiche">
          ${TABS.map(
            (t) => html`<button
              role="tab"
              aria-selected=${this._activeTab === t.id}
              class=${`tab ${this._activeTab === t.id ? "active" : ""}`}
              title=${t.label}
              @click=${() => this._selectTab(t.id)}
            >
              <span>${t.label}</span>
            </button>`
          )}
        </nav>

        <div class="tab-panel" role="tabpanel">
          ${this._renderActiveTab()}
        </div>

        ${this._toast ? html`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }

  private _renderActiveTab(): TemplateResult {
    switch (this._activeTab) {
      case "webhooks":
        return this._renderWebhooks();
      case "knx":
        return html`<knx-addresses-view .api=${this.api}></knx-addresses-view>`;
      case "channels":
        return html`<channels-view .api=${this.api}></channels-view>`;
      case "mqtt":
        return html`<mqtt-topics-view .api=${this.api}></mqtt-topics-view>`;
      case "heartbeats":
        return html`<heartbeats-view .api=${this.api}></heartbeats-view>`;
      case "remediation":
        return html`<remediation-view .api=${this.api}></remediation-view>`;
      case "recommend-llm":
        return html`<knx-recommend-llm-view .api=${this.api}></knx-recommend-llm-view>`;
    }
  }

  private _renderWebhooks(): TemplateResult {
    return html`
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

        ${this._renderWebhooksList()}
      </section>
    `;
  }

  private _renderWebhooksList(): TemplateResult {
    if (this._loading) return html`<p class="status">lade…</p>`;
    if (this._items.length === 0 && !this._showForm) return this._renderEmpty();
    return html`<div class="grid">${this._items.map((item) => this._renderItem(item))}</div>`;
  }

  static override readonly styles = [
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
        gap: var(--mh-space-4);
      }

      /* Sub-Tabs: segmented Tab-Bar im Material-Style, mit Icons */
      nav.tabs {
        display: flex;
        gap: 4px;
        background: var(--mh-surface-2);
        padding: 4px;
        border-radius: var(--mh-radius-md);
        overflow-x: auto;
        scrollbar-width: thin;
      }
      .tab {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 8px 14px;
        font: inherit;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg-muted);
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
        transition: background var(--mh-transition-fast),
          color var(--mh-transition-fast);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }
      .tab:hover {
        color: var(--mh-fg);
      }
      .tab:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: var(--mh-focus-offset);
      }
      .tab.active {
        background: var(--mh-surface);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
        box-shadow: var(--mh-shadow-1);
      }
      .tab-panel {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
      }
      @media (max-width: 720px) {
        .tab {
          padding: 8px 10px;
          font-size: var(--mh-text-xs);
        }
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
