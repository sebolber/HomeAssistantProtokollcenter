// Iter D2: Wiederverwendbarer Drawer fuer Detail-Panes.
//
// Konzept-Schwaeche D2: stats-knx-view und findings-view hatten jeweils
// einen eigenen Drawer (Backdrop, Animation, Escape-Handler) — ~250 Zeilen
// Duplikat-Code, divergentes Verhalten moeglich.
//
// Vertrag:
// - <mh-drawer .open=${...} @mh-drawer-close=${...}>
//     <span slot="header">Title</span>
//     <div>Body</div>
//   </mh-drawer>
// - Aufrufer setzt `open` (boolean) und behandelt das `mh-drawer-close`-
//   Event (vom Backdrop-Click oder Escape).
// - Konsistente Animation, prefers-reduced-motion-Schutz, Backdrop +
//   position:fixed-Drawer (rechts).

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { customElement } from "../utils/custom-element.js";
import { tokens } from "../styles/tokens.js";

@customElement("mh-drawer")
export class MhDrawer extends LitElement {
  /** Sichtbar/unsichtbar — toggle ueber Aufrufer. */
  @property({ type: Boolean }) open = false;

  /** Optional: Aria-Label fuer den Drawer (Screenreader). */
  @property({ type: String }) label = "";

  /** Optional: Datentest-Token, damit Tests den Drawer adressieren koennen. */
  @property({ type: String, attribute: "data-test-id" }) dataTestId = "";

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this._onKeydown);
  }

  override disconnectedCallback(): void {
    window.removeEventListener("keydown", this._onKeydown);
    super.disconnectedCallback();
  }

  private _onKeydown = (e: KeyboardEvent): void => {
    if (!this.open) return;
    if (e.key === "Escape") {
      this._close();
    }
  };

  private _close(): void {
    // Aufrufer schliesst den Drawer typischerweise durch open=false.
    // Wir feuern ein bubbles+composed Event, damit es ueber Shadow-DOM
    // hinweg gefangen werden kann.
    this.dispatchEvent(
      new CustomEvent("mh-drawer-close", { bubbles: true, composed: true }),
    );
  }

  override render(): TemplateResult | typeof nothing {
    if (!this.open) return nothing;
    return html`
      <div
        class="backdrop"
        @click=${this._close}
        aria-hidden="true"
        data-test="mh-drawer-backdrop"
      ></div>
      <aside
        class="drawer"
        role="dialog"
        aria-modal="true"
        aria-label=${this.label || "Detail"}
        data-test="mh-drawer"
        data-test-id=${this.dataTestId}
      >
        <header class="drawer-header">
          <slot name="header"></slot>
          <button
            class="drawer-close"
            type="button"
            @click=${this._close}
            aria-label="Schliessen"
            title="Schliessen (Escape)"
            data-test="mh-drawer-close-btn"
          >
            ✕
          </button>
        </header>
        <div class="drawer-body">
          <slot></slot>
        </div>
      </aside>
    `;
  }

  static override styles = [
    tokens,
    css`
      :host {
        display: contents;
      }
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        z-index: 100;
        animation: mh-drawer-backdrop-in 160ms ease-out;
      }
      .drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: clamp(360px, 42vw, 640px);
        z-index: 101;
        margin: 0;
        background: var(--mh-surface);
        border: none;
        border-left: 1px solid var(--mh-divider);
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: mh-drawer-in 200ms ease-out;
      }
      .drawer-header {
        flex: 0 0 auto;
        position: sticky;
        top: 0;
        background: var(--mh-surface);
        border-bottom: 1px solid var(--mh-divider);
        padding: var(--mh-space-3);
        z-index: 1;
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        margin: 0;
      }
      .drawer-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin-left: auto;
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--mh-radius-sm);
        color: var(--mh-fg-muted);
        cursor: pointer;
        font-size: var(--mh-text-md);
        transition:
          background var(--mh-transition-fast),
          border-color var(--mh-transition-fast),
          color var(--mh-transition-fast);
      }
      .drawer-close:hover {
        background: var(--mh-surface-2);
        border-color: var(--mh-divider);
        color: var(--mh-fg);
      }
      .drawer-close:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: var(--mh-focus-offset);
      }
      .drawer-body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: var(--mh-space-3);
      }
      @media (max-width: 720px) {
        .drawer {
          width: 100vw;
        }
      }
      @keyframes mh-drawer-backdrop-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes mh-drawer-in {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .backdrop,
        .drawer {
          animation: none;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "mh-drawer": MhDrawer;
  }
}
