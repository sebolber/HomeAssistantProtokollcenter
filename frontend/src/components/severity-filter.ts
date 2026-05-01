// Iter 18 + UI-Polish: Multi-Select Chips fuer Severity, semantisch farbig.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { tokens } from "../styles/tokens.js";

const ALL = ["error", "warning", "info", "debug"] as const;
type Severity = (typeof ALL)[number];

@customElement("severity-filter")
export class SeverityFilter extends LitElement {
  @property({ attribute: false }) selected: string[] = [...ALL];

  private _toggle(sev: Severity): void {
    const next = this.selected.includes(sev)
      ? this.selected.filter((s) => s !== sev)
      : [...this.selected, sev];
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { severities: next },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render(): TemplateResult {
    return html`
      <div class="chips" role="group" aria-label="Severity-Filter">
        ${ALL.map((s) => {
          const active = this.selected.includes(s);
          return html`<button
            class=${`chip sev-${s} ${active ? "active" : ""}`}
            aria-pressed=${active}
            @click=${() => this._toggle(s)}
          >
            <span class="dot" aria-hidden="true"></span>
            ${s}
          </button>`;
        })}
      </div>
    `;
  }

  static override styles = [
    tokens,
    css`
      .chips {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: var(--mh-radius-pill);
        border: 1px solid var(--mh-divider);
        background: var(--mh-surface);
        cursor: pointer;
        font: inherit;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg-muted);
        text-transform: capitalize;
        transition: background var(--mh-transition-fast), color var(--mh-transition-fast),
          border-color var(--mh-transition-fast);
      }
      .chip:hover {
        background: var(--mh-surface-2);
        color: var(--mh-fg);
      }
      .chip:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: var(--mh-focus-offset);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.6;
      }
      .chip.active {
        color: var(--mh-fg);
        border-color: transparent;
        font-weight: var(--mh-weight-semibold);
      }
      .chip.sev-error .dot {
        color: var(--mh-error);
        opacity: 1;
      }
      .chip.sev-error.active {
        background: var(--mh-error-soft);
        color: var(--mh-error);
      }
      .chip.sev-warning .dot {
        color: var(--mh-warning);
        opacity: 1;
      }
      .chip.sev-warning.active {
        background: var(--mh-warning-soft);
        color: var(--mh-warning);
      }
      .chip.sev-info .dot {
        color: var(--mh-info);
        opacity: 1;
      }
      .chip.sev-info.active {
        background: var(--mh-info-soft);
        color: var(--mh-info);
      }
      .chip.sev-debug .dot {
        color: var(--mh-debug);
        opacity: 1;
      }
      .chip.sev-debug.active {
        background: var(--mh-debug-soft);
        color: var(--mh-debug);
      }
    `,
  ];
}
