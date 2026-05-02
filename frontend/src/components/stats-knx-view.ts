// Stats-Sub-Tab "KNX-Bus-Analyse".
// Iter 7: Skelett mit Loading-State und Empty-State.
// Iter 8 ergaenzt Filter-Bar + KPIs.
// Iter 9 ergaenzt Top-Sender-Tabelle + Detail-Pane.
// Iter 10 ergaenzt Timeline-Sparkline.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { ApiClient } from "../api-client.js";
import { tokens, cards } from "../styles/tokens.js";

@customElement("stats-knx-view")
export class StatsKnxView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  override render(): TemplateResult {
    return html`
      <div class="root">
        <div class="mh-card">
          <h3>KNX-Bus-Analyse</h3>
          <p class="muted">
            Wird in den naechsten Iterationen ausgebaut: Filter, KPIs,
            Top-Sender mit Empfehlung, Timeline.
          </p>
        </div>
      </div>
    `;
  }

  static override styles = [
    tokens,
    cards,
    css`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }
      .root {
        max-width: 1024px;
        margin: 0 auto;
        padding: var(--mh-space-5);
      }
      h3 {
        margin: 0 0 var(--mh-space-2);
        font-size: var(--mh-text-md);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg);
      }
      .muted {
        margin: 0;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
    `,
  ];
}
