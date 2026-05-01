// Iter 18: Multi-Select Chips fuer Severity.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

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
      <div class="chips">
        ${ALL.map(
          (s) => html`<button
            class=${`chip sev-${s} ${this.selected.includes(s) ? "active" : ""}`}
            @click=${() => this._toggle(s)}
          >
            ${s}
          </button>`
        )}
      </div>
    `;
  }

  static override styles = css`
    .chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .chip {
      padding: 4px 10px;
      border-radius: 14px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      font-size: 0.85em;
      text-transform: capitalize;
    }
    .chip.active {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }
    .chip.sev-error.active {
      background: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    .chip.sev-warning.active {
      background: var(--warning-color, #ff9800);
      border-color: var(--warning-color, #ff9800);
    }
  `;
}
