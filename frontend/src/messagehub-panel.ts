// Hauptkomponente fuer das messagehub-Sidebar-Panel.
// Iter 16-22 + UX-Polish.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ApiClient, type MessageDto } from "./api-client.js";
import "./components/message-table.js";
import "./components/severity-filter.js";
import "./components/source-filter.js";
import "./components/time-range-filter.js";
import "./components/detail-pane.js";
import "./components/settings-view.js";
import "./components/stats-view.js";

interface HassLike {
  callApi?: (
    method: string,
    path: string,
    payload?: unknown
  ) => Promise<unknown>;
  callService?: (
    domain: string,
    service: string,
    payload?: unknown
  ) => Promise<unknown>;
  connection?: {
    subscribeEvents?: (
      cb: (ev: { data: unknown }) => void,
      type: string
    ) => Promise<() => void>;
  };
  auth?: { data: { access_token: string } };
}

const STORAGE_KEY_FILTERS = "messagehub.filters";

interface UiFilters {
  severity: string[];
  source: string;
  search: string;
  fromIso?: string;
  toIso?: string;
}

const DEFAULT_FILTERS: UiFilters = {
  severity: ["error", "warning", "info"],
  source: "",
  search: "",
};

@customElement("messagehub-panel")
export class MessageHubPanel extends LitElement {
  @property({ attribute: false }) hass?: HassLike;
  @property({ type: Boolean }) narrow = false;
  @property({ attribute: false }) panel?: unknown;

  @state() private _tab: "messages" | "settings" | "stats" = "messages";
  @state() private _items: MessageDto[] = [];
  @state() private _total = 0;
  @state() private _loading = false;
  @state() private _selected: MessageDto | null = null;
  @state() private _filters: UiFilters = this._loadFilters();
  @state() private _newCount = 0;
  @state() private _testing = false;
  @state() private _toast = "";

  private _api = new ApiClient();
  private _unsubLive?: () => void;

  protected override firstUpdated(): void {
    if (this.hass?.auth) this._api.setAuth(this.hass.auth.data.access_token);
    void this._reload();
    void this._subscribeLive();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubLive?.();
  }

  private async _subscribeLive(): Promise<void> {
    if (!this.hass?.connection?.subscribeEvents) return;
    this._unsubLive = await this.hass.connection.subscribeEvents((ev) => {
      const newMsg = ev.data as MessageDto;
      if (this._matchesFilters(newMsg)) {
        this._items = [newMsg, ...this._items].slice(0, 200);
        this._total += 1;
        this._newCount += 1;
        window.setTimeout(() => (this._newCount = Math.max(0, this._newCount - 1)), 4000);
      }
    }, "messagehub_message_added");
  }

  private _matchesFilters(msg: MessageDto): boolean {
    if (this._filters.severity.length && !this._filters.severity.includes(msg.severity)) {
      return false;
    }
    if (this._filters.source && msg.source !== this._filters.source) return false;
    if (
      this._filters.search &&
      !msg.text.toLowerCase().includes(this._filters.search.toLowerCase())
    ) {
      return false;
    }
    return true;
  }

  private _loadFilters(): UiFilters {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FILTERS);
      if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return { ...DEFAULT_FILTERS };
  }

  private _persistFilters(): void {
    try {
      localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(this._filters));
    } catch {
      // ignore
    }
  }

  private _resetFilters(): void {
    this._filters = { ...DEFAULT_FILTERS };
    this._persistFilters();
    void this._reload();
  }

  private async _reload(): Promise<void> {
    this._loading = true;
    try {
      const res = await this._api.listMessages({
        severity: this._filters.severity,
        source: this._filters.source || undefined,
        search: this._filters.search || undefined,
        from: this._filters.fromIso,
        to: this._filters.toIso,
        limit: 100,
      });
      this._items = res.items;
      this._total = res.total;
    } catch (err) {
      this._showToast(`Laden fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      this._loading = false;
    }
  }

  private _onSeverityChange = (e: CustomEvent<{ severities: string[] }>): void => {
    this._filters = { ...this._filters, severity: e.detail.severities };
    this._persistFilters();
    void this._reload();
  };

  private _onSourceChange = (e: CustomEvent<{ source: string }>): void => {
    this._filters = { ...this._filters, source: e.detail.source };
    this._persistFilters();
    void this._reload();
  };

  private _onTimeRange = (e: CustomEvent<{ fromIso?: string; toIso?: string }>): void => {
    this._filters = { ...this._filters, fromIso: e.detail.fromIso, toIso: e.detail.toIso };
    this._persistFilters();
    void this._reload();
  };

  private _onSelect = (e: CustomEvent<{ msg: MessageDto }>): void => {
    this._selected = e.detail.msg;
  };

  private _onDelete = async (e: CustomEvent<{ id: number }>): Promise<void> => {
    try {
      await this._api.deleteMessage(e.detail.id);
      this._items = this._items.filter((m) => m.id !== e.detail.id);
      this._total = Math.max(0, this._total - 1);
      this._selected = null;
      this._showToast("Nachricht geloescht");
    } catch (err) {
      this._showToast(`Loeschen fehlgeschlagen: ${(err as Error).message}`);
    }
  };

  private async _bulkDelete(scope: "filter" | "all"): Promise<void> {
    if (this._total === 0) return;
    const count = scope === "all" ? this._total : this._total;
    const label =
      scope === "all"
        ? `ALLE ${count} Nachrichten dauerhaft loeschen?`
        : `${count} gefilterte Nachrichten dauerhaft loeschen?`;
    if (!window.confirm(label)) return;

    try {
      const filters =
        scope === "all"
          ? {}
          : {
              severity: this._filters.severity,
              source: this._filters.source || undefined,
              search: this._filters.search || undefined,
              from: this._filters.fromIso,
              to: this._filters.toIso,
            };
      const deleted = await this._api.deleteMessages(filters);
      this._showToast(`${deleted} Nachrichten geloescht`);
      this._selected = null;
      await this._reload();
    } catch (err) {
      this._showToast(`Loeschen fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  private async _sendTestMessage(): Promise<void> {
    if (!this.hass?.callService) {
      this._showToast("Test nicht verfuegbar — hass.callService fehlt");
      return;
    }
    this._testing = true;
    try {
      const severities = ["info", "warning", "error", "info", "info"] as const;
      const sources = ["pihole", "knx-bus", "backup-job", "test-script"];
      const texts = [
        "Demo-Nachricht aus dem Panel",
        "Test: DNS-Query erfolgreich",
        "Backup abgeschlossen, Dauer 12 min",
        "KNX 1/2/3 — Wohnzimmer Deckenlicht ein",
      ];
      const r = (n: number) => Math.floor(Math.random() * n);
      await this.hass.callService("messagehub", "add_message", {
        severity: severities[r(severities.length)],
        source: sources[r(sources.length)],
        text: texts[r(texts.length)],
        metadata: { source_panel: true, ts: new Date().toISOString() },
      });
      this._showToast("Test-Nachricht gesendet");
      window.setTimeout(() => void this._reload(), 300);
    } catch (err) {
      this._showToast(`Service-Call fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      this._testing = false;
    }
  }

  private _toastTimer?: number;
  private _showToast(text: string): void {
    this._toast = text;
    if (this._toastTimer) window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = ""), 2800);
  }

  private _debounceTimer?: number;
  private _debounceSearch(v: string): void {
    if (this._debounceTimer) window.clearTimeout(this._debounceTimer);
    this._debounceTimer = window.setTimeout(() => {
      this._filters = { ...this._filters, search: v };
      this._persistFilters();
      void this._reload();
    }, 300);
  }

  private _hasActiveFilters(): boolean {
    return (
      this._filters.severity.length !== DEFAULT_FILTERS.severity.length ||
      this._filters.source !== "" ||
      this._filters.search !== "" ||
      this._filters.fromIso !== undefined
    );
  }

  private _renderEmptyMessages(): TemplateResult {
    return html`
      <div class="empty">
        <h3>Noch keine Nachrichten ${this._hasActiveFilters() ? "fuer diese Filter" : ""}</h3>
        <p>
          ${this._hasActiveFilters()
            ? "Probiere weniger restriktive Filter oder setze sie zurueck."
            : "Sobald Nachrichten ueber Webhook, MQTT, Eventbus oder den Service messagehub.add_message reinkommen, erscheinen sie hier."}
        </p>
        <div class="empty-actions">
          ${this._hasActiveFilters()
            ? html`<button @click=${this._resetFilters}>Filter zuruecksetzen</button>`
            : null}
          <button class="primary" ?disabled=${this._testing} @click=${this._sendTestMessage}>
            ${this._testing ? "sende…" : "+ Test-Nachricht senden"}
          </button>
        </div>
      </div>
    `;
  }

  private _renderMessages(): TemplateResult {
    return html`
      <div class="filter-bar" role="toolbar" aria-label="Filter">
        <severity-filter
          .selected=${this._filters.severity}
          @change=${this._onSeverityChange}
        ></severity-filter>
        <source-filter
          .api=${this._api}
          .selected=${this._filters.source}
          @change=${this._onSourceChange}
        ></source-filter>
        <input
          class="search"
          type="search"
          placeholder="Volltextsuche…"
          aria-label="Volltextsuche"
          .value=${this._filters.search}
          @input=${(e: InputEvent) => {
            const v = (e.target as HTMLInputElement).value;
            this._debounceSearch(v);
          }}
        />
        <time-range-filter
          .fromIso=${this._filters.fromIso}
          .toIso=${this._filters.toIso}
          @change=${this._onTimeRange}
        ></time-range-filter>
        ${this._hasActiveFilters()
          ? html`<button class="filter-reset" @click=${this._resetFilters}>
              Filter loeschen
            </button>`
          : null}
      </div>

      <div class="status-bar">
        <span>
          ${this._loading
            ? "lade…"
            : `${this._items.length.toLocaleString("de-DE")} von ${this._total.toLocaleString("de-DE")}`}
          ${this._newCount > 0
            ? html`<span class="new-badge"
                >+${this._newCount} neue</span
              >`
            : null}
        </span>
        <div class="status-actions">
          ${this._total > 0 && this._hasActiveFilters()
            ? html`<button class="danger" @click=${() => this._bulkDelete("filter")}>
                Gefilterte loeschen
              </button>`
            : null}
          ${this._total > 0
            ? html`<button class="danger" @click=${() => this._bulkDelete("all")}>
                Alle loeschen
              </button>`
            : null}
          <button ?disabled=${this._testing} @click=${this._sendTestMessage}>
            ${this._testing ? "sende…" : "+ Test"}
          </button>
        </div>
      </div>

      ${this._items.length === 0 && !this._loading
        ? this._renderEmptyMessages()
        : html`<message-table
            .items=${this._items}
            @select=${this._onSelect}
          ></message-table>`}

      ${this._selected
        ? html`<detail-pane
            .msg=${this._selected}
            @close=${() => (this._selected = null)}
            @delete=${this._onDelete}
          ></detail-pane>`
        : null}
    `;
  }

  override render(): TemplateResult {
    return html`
      <div class="root">
        <header>
          <div class="brand">
            <span class="logo" aria-hidden="true">📨</span>
            <h1>Message Hub</h1>
          </div>
          <nav role="tablist">
            <button
              role="tab"
              aria-selected=${this._tab === "messages"}
              class=${this._tab === "messages" ? "active" : ""}
              @click=${() => (this._tab = "messages")}
            >
              Nachrichten
            </button>
            <button
              role="tab"
              aria-selected=${this._tab === "stats"}
              class=${this._tab === "stats" ? "active" : ""}
              @click=${() => (this._tab = "stats")}
            >
              Statistik
            </button>
            <button
              role="tab"
              aria-selected=${this._tab === "settings"}
              class=${this._tab === "settings" ? "active" : ""}
              @click=${() => (this._tab = "settings")}
            >
              Einstellungen
            </button>
            <button
              class="refresh"
              aria-label="Aktualisieren"
              @click=${() => void this._reload()}
            >
              ↻
            </button>
          </nav>
        </header>

        <main>
          ${this._tab === "messages" ? this._renderMessages() : null}
          ${this._tab === "stats"
            ? html`<stats-view .api=${this._api}></stats-view>`
            : null}
          ${this._tab === "settings"
            ? html`<settings-view .api=${this._api}></settings-view>`
            : null}
        </main>

        ${this._toast ? html`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      height: 100vh;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color, #222);
      font-family: var(--ha-font-family-body, system-ui, sans-serif);
    }
    .root {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid var(--divider-color, #ddd);
      background: var(--app-header-background-color, var(--primary-color, #03a9f4));
      color: var(--app-header-text-color, white);
      flex-wrap: wrap;
      gap: 8px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo {
      font-size: 1.3em;
    }
    h1 {
      font-size: 1.1em;
      margin: 0;
      font-weight: 600;
    }
    nav {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    nav button {
      background: transparent;
      color: inherit;
      border: 1px solid currentColor;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font: inherit;
      font-size: 0.9em;
    }
    nav button:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    nav button:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }
    nav button.active {
      background: white;
      color: var(--app-header-background-color, var(--primary-color, #03a9f4));
      font-weight: 600;
    }
    nav button.refresh {
      font-size: 1.1em;
      padding: 6px 10px;
    }
    main {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: var(--primary-background-color, #fafafa);
    }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--divider-color, #ddd);
      background: var(--card-background-color, white);
      align-items: center;
    }
    @media (max-width: 600px) {
      .filter-bar {
        padding: 8px;
      }
      .filter-bar > * {
        flex: 1 1 auto;
      }
    }
    input.search {
      padding: 6px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      min-width: 200px;
      flex: 1;
      max-width: 320px;
      font: inherit;
      background: var(--card-background-color, white);
      color: var(--primary-text-color, #222);
    }
    input.search:focus-visible {
      outline: 2px solid var(--primary-color, #03a9f4);
      outline-offset: 1px;
    }
    .filter-reset {
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: var(--secondary-text-color, #666);
      font: inherit;
      font-size: 0.85em;
    }
    .filter-reset:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 16px;
      font-size: 0.85em;
      color: var(--secondary-text-color, #666);
      background: var(--primary-background-color, #fafafa);
      border-bottom: 1px solid var(--divider-color, #eee);
    }
    .new-badge {
      display: inline-block;
      margin-left: 8px;
      padding: 1px 8px;
      background: var(--primary-color, #03a9f4);
      color: white;
      border-radius: 10px;
      font-size: 0.78em;
      font-weight: 500;
      animation: pulse 1s ease-in-out infinite alternate;
    }
    @keyframes pulse {
      from {
        opacity: 0.7;
      }
      to {
        opacity: 1;
      }
    }
    .status-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .status-actions button {
      padding: 4px 10px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: inherit;
      font: inherit;
      font-size: 0.85em;
    }
    .status-actions button:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .status-actions button.danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    .status-actions button.danger:hover {
      background: rgba(219, 68, 55, 0.08);
    }
    .empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--secondary-text-color, #666);
    }
    .empty h3 {
      margin: 0 0 8px 0;
      color: var(--primary-text-color, #222);
    }
    .empty p {
      margin: 0 0 20px 0;
      max-width: 460px;
    }
    .empty-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .empty button {
      padding: 8px 16px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: inherit;
      font: inherit;
    }
    .empty button.primary {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }
    .empty button.primary:hover {
      filter: brightness(0.9);
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary-text-color, #222);
      color: var(--primary-background-color, white);
      padding: 10px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      font-size: 0.9em;
      z-index: 100;
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
  `;
}
