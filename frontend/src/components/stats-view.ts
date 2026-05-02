// Stats-Sub-Tab-Container.
// Trennt "Live-Status" (= bisheriger Inhalt, jetzt in stats-live-view.ts)
// vom "KNX-Bus-Analyse"-Tab (stats-knx-view.ts).
// Persistenz des aktiven Sub-Tabs via localStorage.

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type { ApiClient } from "../api-client.js";
import { tokens } from "../styles/tokens.js";
import "./stats-live-view.js";
import "./stats-knx-view.js";

export type StatsSubTab = "live" | "knx";

const STORAGE_KEY = "messagehub.stats.subtab";
const VALID_TABS: ReadonlySet<StatsSubTab> = new Set(["live", "knx"]);

@customElement("stats-view")
export class StatsView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _tab: StatsSubTab = this._loadTab();

  private _loadTab(): StatsSubTab {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && VALID_TABS.has(raw as StatsSubTab)) return raw as StatsSubTab;
    } catch {
      // localStorage nicht verfuegbar — Fallback default
    }
    return "live";
  }

  private _setTab(tab: StatsSubTab): void {
    this._tab = tab;
    try {
      localStorage.setItem(STORAGE_KEY, tab);
    } catch {
      // ignore
    }
  }

  override render(): TemplateResult {
    const tabs: Array<{ id: StatsSubTab; label: string }> = [
      { id: "live", label: "Live-Status" },
      { id: "knx", label: "KNX-Bus-Analyse" },
    ];
    return html`
      <div class="root">
        <nav class="subtabs" role="tablist" aria-label="Statistik-Bereiche">
          ${tabs.map(
            (t) => html`<button
              role="tab"
              aria-selected=${this._tab === t.id}
              class=${`subtab ${this._tab === t.id ? "active" : ""}`}
              @click=${() => this._setTab(t.id)}
            >
              ${t.label}
            </button>`
          )}
        </nav>
        <div class="body">
          ${this._tab === "live"
            ? html`<stats-live-view .api=${this.api}></stats-live-view>`
            : nothing}
          ${this._tab === "knx"
            ? html`<stats-knx-view .api=${this.api}></stats-knx-view>`
            : nothing}
        </div>
      </div>
    `;
  }

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
        height: 100%;
        background: var(--mh-bg);
      }
      .root {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .subtabs {
        display: inline-flex;
        gap: 2px;
        background: var(--mh-surface-2);
        padding: 4px;
        border-radius: var(--mh-radius-md);
        margin: var(--mh-space-3) auto;
        align-self: center;
      }
      .subtab {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 5px 12px;
        font: inherit;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg-muted);
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
        transition: background var(--mh-transition-fast),
          color var(--mh-transition-fast);
      }
      .subtab:hover {
        color: var(--mh-fg);
      }
      .subtab:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: var(--mh-focus-offset);
      }
      .subtab.active {
        background: var(--mh-surface);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
        box-shadow: var(--mh-shadow-1);
      }
      .body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
    `,
  ];
}
