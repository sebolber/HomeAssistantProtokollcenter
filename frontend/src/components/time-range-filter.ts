// Iter 19: Zeitraum-Presets (1h, 24h, 7d, Custom).

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property } from "lit/decorators.js";

type Preset = "1h" | "24h" | "7d" | "all";

@customElement("time-range-filter")
export class TimeRangeFilter extends LitElement {
  @property({ attribute: false }) fromIso?: string;
  @property({ attribute: false }) toIso?: string;

  private _set(preset: Preset): void {
    let fromIso: string | undefined;
    const now = new Date();
    if (preset === "1h") fromIso = new Date(now.getTime() - 3_600_000).toISOString();
    else if (preset === "24h") fromIso = new Date(now.getTime() - 86_400_000).toISOString();
    else if (preset === "7d") fromIso = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    else fromIso = undefined;

    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { fromIso, toIso: undefined },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render(): TemplateResult {
    return html`
      <div class="presets">
        <button @click=${() => this._set("1h")}>1h</button>
        <button @click=${() => this._set("24h")}>24h</button>
        <button @click=${() => this._set("7d")}>7d</button>
        <button @click=${() => this._set("all")}>Alle</button>
      </div>
    `;
  }

  static override readonly styles = css`
    .presets {
      display: flex;
      gap: 4px;
    }
    button {
      padding: 4px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
    }
  `;
}
