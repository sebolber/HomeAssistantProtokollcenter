// Stats-Sub-Tab-Container.
// Trennt "Live-Status" (= bisheriger Inhalt, jetzt in stats-live-view.ts)
// vom "KNX-Bus-Analyse"-Tab (stats-knx-view.ts).
// Persistenz des aktiven Sub-Tabs via localStorage.

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type { ApiClient } from "../api-client.js";
import { tokens } from "../styles/tokens.js";
import { parseHashRoute } from "../utils/hash-route.js";
import "./stats-live-view.js";
import "./stats-knx-view.js";
import "./findings-view.js";

export type StatsSubTab = "live" | "knx" | "findings";

const STORAGE_KEY = "messagehub.stats.subtab";
const VALID_TABS: ReadonlySet<StatsSubTab> = new Set(["live", "knx", "findings"]);

@customElement("stats-view")
export class StatsView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;
  // Iter E2: hass-Property an die Sub-Views durchreichen, damit
  // findings-view.locale-Aufloesung greift.
  @property({ attribute: false }) hass?: { locale?: { language?: string } };

  @state() private _tab: StatsSubTab = this._loadTab();
  // Iter H (knx-detail-panes): vorbefuellter Source-Filter fuer den
  // Findings-Sub-Tab. Wird ueber URL-Hash uebergeben
  // (#findings?source=1.1.42 — siehe stats-knx-view.
  // _onSourceDetailFindingClick).
  @state() private _findingsSourceFilter: string | null = null;

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

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("hashchange", this._onHashChange);
    // Initial-Hash beim Mount auswerten — User kann die Seite mit
    // #findings?source=... direkt aufrufen.
    this._handleHash(window.location.hash);
  }

  override disconnectedCallback(): void {
    window.removeEventListener("hashchange", this._onHashChange);
    super.disconnectedCallback();
  }

  private _onHashChange = (): void => {
    this._handleHash(window.location.hash);
  };

  // F-010: Hash-basierte Tab-Navigation (Iter H + Iter +11).
  // Akzeptierte Formate:
  //   #findings              -> Findings-Tab (Backwards-Compat)
  //   #findings?source=X     -> Findings-Tab, Source-Filter
  //   #stats/live            -> Live-Status-Tab
  //   #stats/knx             -> KNX-Bus-Analyse-Tab
  //   #stats/findings        -> Findings-Tab
  //   #stats/findings?source=X.Y.Z  -> Findings + Source-Filter
  // Andere Hashes bleiben unbeachtet (#settings/... gehoert zu
  // settings-view, nicht zu uns).
  private _handleHash(rawHash: string): void {
    // Iter E6: Zentraler Parser. Aliases (z. B. ``#findings`` ->
    // ``stats/findings``) werden im Helper aufgeloest.
    const route = parseHashRoute(rawHash);
    if (route.top !== "stats") return;
    const tabPart = route.sub;
    if (tabPart === "live" || tabPart === "knx" || tabPart === "findings") {
      this._setTab(tabPart);
    }
    if (tabPart === "findings") {
      const source = route.query.get("source");
      this._findingsSourceFilter = source && source.length > 0 ? source : null;
    } else {
      this._findingsSourceFilter = null;
    }
  }

  override render(): TemplateResult {
    const tabs: Array<{ id: StatsSubTab; label: string }> = [
      { id: "live", label: "Live-Status" },
      { id: "knx", label: "KNX-Bus-Analyse" },
      // Iter 9 (knx-findings): Konfigurations-Check als 3. Sub-Tab.
      { id: "findings", label: "Konfigurations-Check" },
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
          ${this._tab === "findings"
            ? html`<findings-view
                .api=${this.api}
                .hass=${this.hass}
                .sourceFilter=${this._findingsSourceFilter}
              ></findings-view>`
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
