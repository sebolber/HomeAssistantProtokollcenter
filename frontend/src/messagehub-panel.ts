// Hauptkomponente fuer das messagehub-Sidebar-Panel.
// Iter 16-22 + UX-Polish.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ApiClient, type MessageDto } from "./api-client.js";
import { tokens, buttons } from "./styles/tokens.js";
import "./components/message-table.js";
import "./components/severity-filter.js";
import "./components/source-filter.js";
import "./components/time-range-filter.js";
import "./components/detail-pane.js";
import "./components/settings-view.js";
import "./components/stats-view.js";
import "./components/audit-view.js";

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

  @state() private _tab: "messages" | "settings" | "stats" | "audit" = "messages";
  @state() private _items: MessageDto[] = [];
  @state() private _total = 0;
  @state() private _loading = false;
  @state() private _selected: MessageDto | null = null;
  @state() private _filters: UiFilters = this._loadFilters();
  @state() private _newCount = 0;
  @state() private _testing = false;
  @state() private _toast = "";
  @state() private _overflowOpen = false;

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

  private _onSeverityChangeMessage = async (
    e: CustomEvent<{ id: number; severity: string; previous: string }>
  ): Promise<void> => {
    const { id, severity, previous } = e.detail;
    // Optimistic update
    this._items = this._items.map((m) =>
      m.id === id ? { ...m, severity: severity as MessageDto["severity"] } : m
    );
    if (this._selected?.id === id) {
      this._selected = { ...this._selected, severity: severity as MessageDto["severity"] };
    }
    try {
      await this._api.setMessageSeverity(id, severity);
      this._showToast(`Severity geändert: ${previous} → ${severity}`);
    } catch (err) {
      // Rollback
      this._items = this._items.map((m) =>
        m.id === id ? { ...m, severity: previous as MessageDto["severity"] } : m
      );
      if (this._selected?.id === id) {
        this._selected = {
          ...this._selected,
          severity: previous as MessageDto["severity"],
        };
      }
      this._showToast(`Änderung fehlgeschlagen: ${(err as Error).message}`);
    }
  };

  private _onDelete = async (e: CustomEvent<{ id: number }>): Promise<void> => {
    try {
      await this._api.deleteMessage(e.detail.id);
      this._items = this._items.filter((m) => m.id !== e.detail.id);
      this._total = Math.max(0, this._total - 1);
      this._selected = null;
      this._showToast("Nachricht gelöscht");
    } catch (err) {
      this._showToast(`Löschen fehlgeschlagen: ${(err as Error).message}`);
    }
  };

  private async _bulkDelete(scope: "filter" | "all"): Promise<void> {
    if (this._total === 0) return;
    const count = scope === "all" ? this._total : this._total;
    const label =
      scope === "all"
        ? `ALLE ${count} Nachrichten dauerhaft löschen?`
        : `${count} gefilterte Nachrichten dauerhaft löschen?`;
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
      this._showToast(`${deleted} Nachrichten gelöscht`);
      this._selected = null;
      await this._reload();
    } catch (err) {
      this._showToast(`Löschen fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  private async _sendTestMessage(): Promise<void> {
    if (!this.hass?.callService) {
      this._showToast("Test nicht verfügbar — hass.callService fehlt");
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
      // Demo-Variation fuer den Test-Button — nicht-kryptographisch.
      // Kein Token, keine Auth, kein Secret — nur Auswahl unter 4 Demo-Texten.
      const r = (n: number) => Math.floor(Math.random() * n); // NOSONAR S2245
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

  private _toggleOverflow = (): void => {
    this._overflowOpen = !this._overflowOpen;
  };

  private _closeOverflow = (): void => {
    if (this._overflowOpen) this._overflowOpen = false;
  };

  private _hasActiveFilters(): boolean {
    return (
      this._filters.severity.length !== DEFAULT_FILTERS.severity.length ||
      this._filters.source !== "" ||
      this._filters.search !== "" ||
      this._filters.fromIso !== undefined
    );
  }

  private _exportUrl(format: "jsonl" | "csv"): string {
    return this._api.exportUrl({
      severity: this._filters.severity,
      source: this._filters.source || undefined,
      search: this._filters.search || undefined,
      from: this._filters.fromIso,
      to: this._filters.toIso,
      limit: 10000,
      format,
    });
  }

  private _renderEmptyMessages(): TemplateResult {
    return html`
      <div class="empty">
        <h3>Noch keine Nachrichten ${this._hasActiveFilters() ? "für diese Filter" : ""}</h3>
        <p>
          ${this._hasActiveFilters()
            ? "Probiere weniger restriktive Filter oder setze sie zurück."
            : "Sobald Nachrichten über Webhook, MQTT, Eventbus oder den Service messagehub.add_message reinkommen, erscheinen sie hier."}
        </p>
        <div class="empty-actions">
          ${this._hasActiveFilters()
            ? html`<button class="mh-btn" @click=${this._resetFilters}>
                Filter zurücksetzen
              </button>`
            : null}
          <button
            class="mh-btn mh-btn--primary"
            ?disabled=${this._testing}
            @click=${this._sendTestMessage}
          >
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
              Filter zurücksetzen
            </button>`
          : null}
      </div>

      <div class="status-bar">
        <span class="status-count">
          ${this._loading
            ? "lade…"
            : html`<strong>${this._items.length.toLocaleString("de-DE")}</strong>
                <span class="muted">von ${this._total.toLocaleString("de-DE")}</span>`}
          ${this._newCount > 0
            ? html`<span class="new-badge">+${this._newCount} neu</span>`
            : null}
        </span>
        <div class="status-actions">
          ${this._total > 0
            ? html`<a
                  class="mh-btn mh-btn--sm"
                  href=${this._exportUrl("jsonl")}
                  download="messagehub-export.jsonl"
                  title="Als JSONL exportieren"
                  >↓ JSONL</a
                >
                <a
                  class="mh-btn mh-btn--sm"
                  href=${this._exportUrl("csv")}
                  download="messagehub-export.csv"
                  title="Als CSV exportieren"
                  >↓ CSV</a
                >`
            : null}
          ${this._total > 0 && this._hasActiveFilters()
            ? html`<button
                class="mh-btn mh-btn--sm mh-btn--danger"
                @click=${() => this._bulkDelete("filter")}
              >
                Gefilterte löschen
              </button>`
            : null}
          <button
            class="mh-btn mh-btn--sm"
            ?disabled=${this._testing}
            @click=${this._sendTestMessage}
          >
            ${this._testing ? "sende…" : "+ Testnachricht"}
          </button>
          <div class="overflow" @click=${(e: Event) => e.stopPropagation()}>
            <button
              class="mh-btn mh-btn--sm mh-btn--icon mh-btn--ghost"
              aria-label="Weitere Aktionen"
              aria-haspopup="menu"
              aria-expanded=${this._overflowOpen}
              @click=${this._toggleOverflow}
            >
              ⋯
            </button>
            ${this._overflowOpen
              ? html`<div class="overflow-menu" role="menu">
                  <button
                    role="menuitem"
                    class="overflow-item danger"
                    ?disabled=${this._total === 0}
                    @click=${() => {
                      this._overflowOpen = false;
                      void this._bulkDelete("all");
                    }}
                  >
                    🗑 Alle ${this._total} Nachrichten löschen
                  </button>
                </div>`
              : null}
          </div>
        </div>
      </div>

      ${this._items.length === 0 && !this._loading
        ? this._renderEmptyMessages()
        : html`<message-table
            .items=${this._items}
            @select=${this._onSelect}
            @severity-change=${this._onSeverityChangeMessage}
          ></message-table>`}

      ${this._selected
        ? html`<detail-pane
            .msg=${this._selected}
            .api=${this._api}
            @close=${() => (this._selected = null)}
            @delete=${this._onDelete}
            @status-change=${() => void this._reload()}
            @error=${(e: CustomEvent<{ message: string }>) =>
              this._showToast(e.detail.message)}
          ></detail-pane>`
        : null}
    `;
  }

  override render(): TemplateResult {
    type TabId = "messages" | "settings" | "stats" | "audit";
    const tabs: Array<{ id: TabId; label: string }> = [
      { id: "messages", label: "Nachrichten" },
      { id: "stats", label: "Statistik" },
      { id: "settings", label: "Einstellungen" },
      { id: "audit", label: "Audit" },
    ];
    return html`
      <div class="root" @click=${this._closeOverflow}>
        <header>
          <div class="brand">
            <span class="logo" aria-hidden="true">📨</span>
            <h1>Message Hub</h1>
          </div>
          <nav role="tablist" class="tabs">
            ${tabs.map(
              (t) => html`<button
                role="tab"
                aria-selected=${this._tab === t.id}
                class=${`tab ${this._tab === t.id ? "active" : ""}`}
                @click=${() => (this._tab = t.id)}
              >
                ${t.label}
              </button>`
            )}
          </nav>
          <div class="header-actions">
            <button
              class="mh-btn mh-btn--icon mh-btn--ghost"
              aria-label="Aktualisieren"
              title="Aktualisieren"
              @click=${() => void this._reload()}
            >
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        </header>

        <main>
          ${this._tab === "messages" ? this._renderMessages() : null}
          ${this._tab === "stats"
            ? html`<stats-view .api=${this._api}></stats-view>`
            : null}
          ${this._tab === "settings"
            ? html`<settings-view .api=${this._api}></settings-view>`
            : null}
          ${this._tab === "audit"
            ? html`<audit-view .api=${this._api}></audit-view>`
            : null}
        </main>

        ${this._toast ? html`<div class="toast">${this._toast}</div>` : null}
      </div>
    `;
  }

  static override styles = [
    tokens,
    buttons,
    css`
      :host {
        display: block;
        height: 100vh;
        background: var(--mh-bg);
        color: var(--mh-fg);
        font-family: var(--ha-font-family-body, "Inter", system-ui, -apple-system, "Segoe UI",
          Roboto, sans-serif);
        font-size: var(--mh-text-md);
      }
      .root {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      /* Top-Header: ruhig, neutral, mit dezenter Bottom-Border */
      header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--mh-space-4);
        padding: var(--mh-space-3) var(--mh-space-5);
        background: var(--mh-surface);
        border-bottom: 1px solid var(--mh-divider);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .logo {
        font-size: 1.4em;
      }
      h1 {
        font-size: var(--mh-text-lg);
        margin: 0;
        font-weight: var(--mh-weight-semibold);
        letter-spacing: -0.01em;
      }

      /* Segmented Tabs: ein gemeinsamer Container, klare aktiv/inaktiv-States */
      .tabs {
        display: inline-flex;
        gap: 2px;
        background: var(--mh-surface-2);
        padding: 4px;
        border-radius: var(--mh-radius-md);
        justify-self: center;
      }
      .tab {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 6px 14px;
        font: inherit;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg-muted);
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
        transition: background var(--mh-transition-fast), color var(--mh-transition-fast);
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
      .header-actions {
        display: flex;
        gap: var(--mh-space-2);
        align-items: center;
        justify-self: end;
      }
      @media (max-width: 720px) {
        header {
          grid-template-columns: 1fr auto;
          row-gap: var(--mh-space-2);
        }
        .tabs {
          grid-column: 1 / -1;
          justify-self: stretch;
          overflow-x: auto;
        }
      }

      main {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Filter-Bar */
      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
        padding: var(--mh-space-3) var(--mh-space-5);
        border-bottom: 1px solid var(--mh-divider);
        background: var(--mh-surface);
        align-items: center;
      }
      @media (max-width: 600px) {
        .filter-bar {
          padding: var(--mh-space-2);
        }
        .filter-bar > * {
          flex: 1 1 auto;
        }
      }
      input.search {
        padding: 7px 12px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        min-width: 200px;
        flex: 1;
        max-width: 320px;
        font: inherit;
        font-size: var(--mh-text-sm);
        background: var(--mh-surface);
        color: var(--mh-fg);
        transition: border-color var(--mh-transition-fast), box-shadow var(--mh-transition-fast);
      }
      input.search:focus-visible {
        outline: none;
        border-color: var(--mh-accent);
        box-shadow: 0 0 0 3px var(--mh-accent-soft);
      }
      .filter-reset {
        padding: 6px 12px;
        border: 1px solid var(--mh-divider);
        background: transparent;
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
        color: var(--mh-fg-muted);
        font: inherit;
        font-size: var(--mh-text-xs);
      }
      .filter-reset:hover {
        background: var(--mh-surface-2);
        color: var(--mh-fg);
      }

      /* Status-Bar */
      .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--mh-space-2) var(--mh-space-5);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        background: var(--mh-bg);
        border-bottom: 1px solid var(--mh-divider);
      }
      .status-count {
        display: inline-flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .status-count strong {
        color: var(--mh-fg);
        font-variant-numeric: tabular-nums;
      }
      .status-count .muted {
        color: var(--mh-fg-muted);
      }
      .new-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: var(--mh-accent);
        color: var(--mh-accent-fg);
        border-radius: var(--mh-radius-pill);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        animation: pulse 1.4s ease-in-out infinite alternate;
      }
      @keyframes pulse {
        from {
          opacity: 0.65;
        }
        to {
          opacity: 1;
        }
      }
      .status-actions {
        display: flex;
        gap: var(--mh-space-2);
        flex-wrap: wrap;
        align-items: center;
      }
      a.mh-btn {
        text-decoration: none;
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
        min-width: 240px;
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        padding: 4px;
        animation: menu-in 120ms ease-out;
      }
      @keyframes menu-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
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
      .overflow-item:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .overflow-item.danger {
        color: var(--mh-error);
      }
      .overflow-item.danger:hover:not(:disabled) {
        background: var(--mh-error-soft);
      }

      /* Empty-State */
      .empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--mh-space-7) var(--mh-space-5);
        text-align: center;
        color: var(--mh-fg-muted);
      }
      .empty h3 {
        margin: 0 0 var(--mh-space-2) 0;
        color: var(--mh-fg);
        font-size: var(--mh-text-lg);
      }
      .empty p {
        margin: 0 0 var(--mh-space-5) 0;
        max-width: 460px;
        line-height: 1.5;
      }
      .empty-actions {
        display: flex;
        gap: var(--mh-space-2);
        flex-wrap: wrap;
        justify-content: center;
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
        z-index: 100;
        animation: slidein 200ms ease-out;
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
