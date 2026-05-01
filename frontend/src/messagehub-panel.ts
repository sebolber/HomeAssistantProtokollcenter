// Hauptkomponente fuer das messagehub-Sidebar-Panel.
// Iter 16: Panel-Registrierung + Bootstrap
// Iter 17: Tabellen-Komponente
// Iter 18: Severity-Filter
// Iter 19: Source/Volltext/Zeitraum-Filter
// Iter 20: Detail-Pane + Delete
// Iter 21: WebSocket Live-Update

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ApiClient, type MessageDto } from "./api-client.js";
import "./components/message-table.js";
import "./components/severity-filter.js";
import "./components/source-filter.js";
import "./components/time-range-filter.js";
import "./components/detail-pane.js";
import "./components/webhook-list.js";

interface HassLike {
  callApi?: (
    method: string,
    path: string,
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

  private _api = new ApiClient();
  private _unsubLive?: () => void;

  protected override firstUpdated(): void {
    if (this.hass?.auth) this._api.setAuth(this.hass.auth.data.access_token);
    this._reload();
    this._subscribeLive();
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
      }
    }, "messagehub_message_added");
  }

  private _matchesFilters(msg: MessageDto): boolean {
    if (this._filters.severity.length && !this._filters.severity.includes(msg.severity)) {
      return false;
    }
    if (this._filters.source && msg.source !== this._filters.source) return false;
    if (this._filters.search && !msg.text.toLowerCase().includes(this._filters.search.toLowerCase())) {
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
    await this._api.deleteMessage(e.detail.id);
    this._items = this._items.filter((m) => m.id !== e.detail.id);
    this._selected = null;
  };

  private _renderMessages(): TemplateResult {
    return html`
      <div class="filter-bar">
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
          placeholder="Volltextsuche..."
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
      </div>
      <div class="status">
        ${this._loading ? "lade..." : `Anzeige: ${this._items.length} von ${this._total}`}
      </div>
      <message-table
        .items=${this._items}
        @select=${this._onSelect}
      ></message-table>
      ${this._selected
        ? html`<detail-pane
            .msg=${this._selected}
            @close=${() => (this._selected = null)}
            @delete=${this._onDelete}
          ></detail-pane>`
        : null}
    `;
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

  private _renderSettings(): TemplateResult {
    return html`<webhook-list .api=${this._api}></webhook-list>`;
  }

  private _renderStats(): TemplateResult {
    return html`<div class="stats">Statistik-Dashboard (Iter 41)</div>`;
  }

  override render(): TemplateResult {
    return html`
      <div class="root">
        <header>
          <h1>Message Hub</h1>
          <nav>
            <button class=${this._tab === "messages" ? "active" : ""} @click=${() => (this._tab = "messages")}>Nachrichten</button>
            <button class=${this._tab === "stats" ? "active" : ""} @click=${() => (this._tab = "stats")}>Statistik</button>
            <button class=${this._tab === "settings" ? "active" : ""} @click=${() => (this._tab = "settings")}>Einstellungen</button>
            <button @click=${() => this._reload()}>Aktualisieren</button>
          </nav>
        </header>
        <main>
          ${this._tab === "messages" ? this._renderMessages() : null}
          ${this._tab === "settings" ? this._renderSettings() : null}
          ${this._tab === "stats" ? this._renderStats() : null}
        </main>
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
      padding: 8px 16px;
      border-bottom: 1px solid var(--divider-color, #ddd);
      background: var(--app-header-background-color, var(--primary-color, #03a9f4));
      color: var(--app-header-text-color, white);
    }
    header h1 {
      font-size: 1.1em;
      margin: 0;
    }
    nav button {
      background: transparent;
      color: inherit;
      border: 1px solid currentColor;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 4px;
    }
    nav button.active {
      background: currentColor;
      color: var(--app-header-background-color, var(--primary-color, #03a9f4));
    }
    main {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--divider-color, #ddd);
      align-items: center;
    }
    input.search {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      min-width: 220px;
    }
    .status {
      padding: 4px 16px;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    .stats {
      padding: 24px;
    }
  `;
}
