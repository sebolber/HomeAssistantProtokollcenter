// SVG-Sparkline-Chart fuer Timeline-Daten (Iter 10).
// Reine Eigen-Implementierung — keine Chart-Lib, keine Canvas. SVG ist
// klein, scharf, themable mit CSS-Variablen. Multi-Linien fuer Top-N GAs.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property } from "lit/decorators.js";
import { tokens } from "../styles/tokens.js";

interface TimelinePoint {
  ga: string;
  bucket: string; // ISO-String
  count: number;
}

const PALETTE = [
  "var(--mh-error)",
  "var(--mh-warning)",
  "var(--mh-info)",
  "var(--mh-accent)",
  "var(--mh-success)",
] as const;

@customElement("knx-timeline-chart")
export class KnxTimelineChart extends LitElement {
  @property({ attribute: false }) items: TimelinePoint[] = [];
  @property({ type: Number }) width = 600;
  @property({ type: Number }) height = 120;

  override render(): TemplateResult {
    if (this.items.length === 0) {
      return html`<p class="muted">Keine Timeline-Daten.</p>`;
    }

    const series = this._buildSeries();
    const buckets = this._allBuckets();
    const maxCount = Math.max(1, ...this.items.map((i) => i.count));
    const padding = { top: 8, right: 8, bottom: 18, left: 32 };
    const innerW = this.width - padding.left - padding.right;
    const innerH = this.height - padding.top - padding.bottom;

    const xFor = (bucketIdx: number): number =>
      padding.left + (bucketIdx / Math.max(1, buckets.length - 1)) * innerW;
    const yFor = (count: number): number =>
      padding.top + (1 - count / maxCount) * innerH;

    return html`
      <svg
        viewBox=${`0 0 ${this.width} ${this.height}`}
        role="img"
        aria-label="Telegrammrate Timeline"
        preserveAspectRatio="none"
      >
        <!-- Grid: horizontale Linien bei 0, max -->
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
        <!-- Y-Achse Labels -->
        <text x="2" y=${padding.top + 4} class="axis-label">${maxCount}</text>
        <text x="2" y=${this.height - padding.bottom + 4} class="axis-label">0</text>

        <!-- Series -->
        ${series.map((s, idx) => {
          const points = s.values.map(
            (v, i) => `${xFor(i)},${yFor(v)}`
          ).join(" ");
          const color = PALETTE[idx % PALETTE.length];
          return html`<polyline
            points=${points}
            class="series"
            fill="none"
            stroke=${color}
            stroke-width="1.5"
          ><title>${s.ga}</title></polyline>`;
        })}
      </svg>
      <div class="legend">
        ${series.map(
          (s, idx) => html`<span class="legend-item">
            <span
              class="dot"
              style=${`background: ${PALETTE[idx % PALETTE.length]}`}
            ></span>
            <code>${s.ga}</code>
          </span>`
        )}
      </div>
    `;
  }

  private _allBuckets(): string[] {
    const set = new Set<string>();
    for (const p of this.items) set.add(p.bucket);
    return Array.from(set).sort();
  }

  private _buildSeries(): Array<{ ga: string; values: number[] }> {
    const buckets = this._allBuckets();
    const bucketIdx = new Map(buckets.map((b, i) => [b, i]));
    const map = new Map<string, number[]>();
    for (const p of this.items) {
      let arr = map.get(p.ga);
      if (arr === undefined) {
        arr = new Array<number>(buckets.length).fill(0);
        map.set(p.ga, arr);
      }
      const idx = bucketIdx.get(p.bucket);
      if (idx !== undefined) arr[idx] = p.count;
    }
    return Array.from(map.entries()).map(([ga, values]) => ({ ga, values }));
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
        max-height: 160px;
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
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
        margin-top: var(--mh-space-2);
        font-size: var(--mh-text-xs);
      }
      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        color: var(--mh-fg-muted);
      }
      .muted {
        margin: 0;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
    `,
  ];
}
