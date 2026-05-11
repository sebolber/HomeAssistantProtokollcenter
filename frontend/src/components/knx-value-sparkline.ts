// Wertverlauf-Sparkline fuer eine einzelne GA (Iter 31).
//
// Anders als knx-timeline-chart (zaehlt Telegramme pro Bucket) zeigt
// diese Komponente den ROHWERT-Verlauf — wichtig zur Beurteilung, ob
// eine GA "springende Werte ohne Hysterese" sendet (Anti-Pattern) oder
// kontinuierlich ansteigt (z. B. Energiezaehler).
//
// Akzeptiert numerische Werte (int/float) und Bools (0/1). Andere Typen
// (String / Object) werden uebersprungen — das Tracker-Pattern ist nur
// fuer Skalare sinnvoll.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property } from "lit/decorators.js";
import { tokens } from "../styles/tokens.js";

interface ValuePoint {
  ts: string;
  value: unknown;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "on") return 1;
    if (v === "false" || v === "off") return 0;
    const n = Number.parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

@customElement("knx-value-sparkline")
export class KnxValueSparkline extends LitElement {
  @property({ attribute: false }) points: ValuePoint[] = [];
  @property({ type: Number }) width = 600;
  @property({ type: Number }) height = 80;

  override render(): TemplateResult {
    const numeric = this.points
      .map((p) => ({ ts: p.ts, value: toNumber(p.value) }))
      .filter((p): p is { ts: string; value: number } => p.value !== null);

    if (numeric.length < 2) {
      return html`<p class="muted">
        Wertverlauf: zu wenige numerische Datenpunkte
        (${numeric.length} von ${this.points.length}).
      </p>`;
    }

    const values = numeric.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const padding = { top: 8, right: 8, bottom: 18, left: 40 };
    const innerW = this.width - padding.left - padding.right;
    const innerH = this.height - padding.top - padding.bottom;

    const xFor = (i: number): number =>
      padding.left + (i / Math.max(1, numeric.length - 1)) * innerW;
    const yFor = (v: number): number =>
      padding.top + (1 - (v - min) / range) * innerH;

    const points = numeric.map((p, i) => `${xFor(i)},${yFor(p.value)}`).join(" ");

    // Hysterese-Hinweis: Median Δ-value als Indikator
    const deltas = values.slice(1).map((v, i) => Math.abs(v - values[i]));
    const sorted = [...deltas].sort((a, b) => a - b);
    const medianDelta = sorted[Math.floor(sorted.length / 2)];

    return html`
      <div class="wrap">
        <svg
          viewBox=${`0 0 ${this.width} ${this.height}`}
          role="img"
          aria-label="Wertverlauf-Sparkline"
          preserveAspectRatio="none"
        >
          <line
            x1=${padding.left} y1=${padding.top}
            x2=${this.width - padding.right} y2=${padding.top}
            class="grid"
          ></line>
          <line
            x1=${padding.left} y1=${this.height - padding.bottom}
            x2=${this.width - padding.right} y2=${this.height - padding.bottom}
            class="grid"
          ></line>
          <text x="2" y=${padding.top + 4} class="axis-label">${max.toFixed(1)}</text>
          <text x="2" y=${this.height - padding.bottom + 4} class="axis-label">${min.toFixed(1)}</text>
          <polyline points=${points} class="series" fill="none"></polyline>
        </svg>
        <p class="muted small">
          ${numeric.length} Punkte • Min ${min.toFixed(1)} • Max ${max.toFixed(1)} •
          Median Δ ${medianDelta.toFixed(2)}
          ${medianDelta < 0.1 && range > 0
            ? html` <span class="hint">→ enge Hysterese</span>`
            : nothing}
        </p>
      </div>
    `;
  }

  static override styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      svg {
        width: 100%;
        height: auto;
        max-height: 100px;
        background: var(--mh-bg);
        border-radius: var(--mh-radius-sm);
      }
      .grid {
        stroke: var(--mh-divider);
        stroke-width: 0.5;
      }
      .axis-label {
        font-size: 10px;
        fill: var(--mh-fg-muted);
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
      }
      .series {
        stroke: var(--mh-accent);
        stroke-width: 1.5;
      }
      .muted {
        margin: 4px 0 0 0;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-xs);
      }
      .small {
        font-size: var(--mh-text-xs);
      }
      .hint {
        color: var(--mh-warning);
        font-weight: var(--mh-weight-semibold);
      }
    `,
  ];
}

const nothing = "";
