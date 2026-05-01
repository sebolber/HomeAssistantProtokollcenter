// Iter 17 + UI-Polish: scrollbare Tabelle der Nachrichten.
// - Severity als farbige Pille mit Icon + Label
// - Relative Zeit (z. B. "vor 3 Min") als Default, absolute Zeit als Tooltip
// - Source als dezente Pille
// - Hover-/Focus-States ueber Design-Tokens

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { MessageDto } from "../api-client.js";
import { tokens, pills } from "../styles/tokens.js";
import { formatRelative, formatAbsolute } from "../utils/time.js";

const SEVERITY_ICON: Record<string, string> = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·",
};

const SEVERITY_LABEL: Record<string, string> = {
  error: "Error",
  warning: "Warn",
  info: "Info",
  debug: "Debug",
};

@customElement("message-table")
export class MessageTable extends LitElement {
  @property({ attribute: false }) items: MessageDto[] = [];

  @state() private _now = new Date();
  private _tickerId?: number;

  override connectedCallback(): void {
    super.connectedCallback();
    // Relativzeiten alle 30s aktualisieren
    this._tickerId = window.setInterval(() => (this._now = new Date()), 30_000);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._tickerId) window.clearInterval(this._tickerId);
  }

  private _onClick = (msg: MessageDto): void => {
    this.dispatchEvent(
      new CustomEvent("select", { detail: { msg }, bubbles: true, composed: true })
    );
  };

  private _onKey = (e: KeyboardEvent, msg: MessageDto): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this._onClick(msg);
    }
  };

  private _renderHeader(): TemplateResult {
    return html`
      <div class="header" role="row">
        <span class="col-sev" role="columnheader">Severity</span>
        <span class="col-ts" role="columnheader">Zeit</span>
        <span class="col-src" role="columnheader">Quelle</span>
        <span class="col-text" role="columnheader">Nachricht</span>
      </div>
    `;
  }

  override render(): TemplateResult {
    if (!this.items.length) {
      return html`
        <div class="root">
          ${this._renderHeader()}
          <div class="empty">Keine Nachrichten</div>
        </div>
      `;
    }
    return html`
      <div class="root">
        ${this._renderHeader()}
        <div class="scroll" role="list">
          ${repeat(
            this.items,
            (msg) => msg.id,
            (msg) => {
              const sev = msg.severity ?? "info";
              const sevLabel = SEVERITY_LABEL[sev] ?? sev;
              const sevIcon = SEVERITY_ICON[sev] ?? "·";
              const rel = formatRelative(msg.timestamp, this._now);
              const abs = formatAbsolute(msg.timestamp, this._now);
              return html`
                <div
                  class=${`row sev-${sev}`}
                  tabindex="0"
                  role="listitem button"
                  @click=${() => this._onClick(msg)}
                  @keydown=${(e: KeyboardEvent) => this._onKey(e, msg)}
                >
                  <span class="col-sev">
                    <span
                      class=${`mh-pill mh-pill--${sev}`}
                      title=${sevLabel}
                    >
                      <span class="sev-icon" aria-hidden="true">${sevIcon}</span>
                      ${sevLabel}
                    </span>
                  </span>
                  <span class="col-ts ts" title=${abs}>${rel}</span>
                  <span class="col-src">
                    <span class="source-pill">${msg.source}</span>
                  </span>
                  <span class="col-text text">${msg.text}</span>
                </div>
              `;
            }
          )}
        </div>
      </div>
    `;
  }

  static override styles = [
    tokens,
    pills,
    css`
      :host {
        display: block;
        flex: 1;
        overflow: hidden;
      }
      .root {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--mh-surface);
      }
      .header,
      .row {
        display: grid;
        grid-template-columns: 110px 110px 140px 1fr;
        gap: var(--mh-space-3);
        padding: 10px var(--mh-space-5);
        align-items: center;
      }
      .header {
        background: var(--mh-bg);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--mh-fg-muted);
        padding-top: var(--mh-space-2);
        padding-bottom: var(--mh-space-2);
        position: sticky;
        top: 0;
        z-index: 1;
      }
      .scroll {
        flex: 1;
        overflow: auto;
      }
      .row {
        border-bottom: 1px solid var(--mh-divider);
        cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      .row:hover {
        background: var(--mh-surface-2);
      }
      .row:focus-visible {
        background: var(--mh-surface-2);
        outline: var(--mh-focus-ring);
        outline-offset: -2px;
      }
      .row:last-child {
        border-bottom: 0;
      }

      .sev-icon {
        display: inline-flex;
        width: 14px;
        text-align: center;
        font-weight: var(--mh-weight-bold);
      }

      .ts {
        font-variant-numeric: tabular-nums;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        white-space: nowrap;
      }

      .source-pill {
        display: inline-block;
        padding: 2px 8px;
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-medium);
        max-width: 130px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }

      .text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
      }
      .empty {
        padding: var(--mh-space-7);
        text-align: center;
        color: var(--mh-fg-muted);
      }

      @media (max-width: 720px) {
        .header,
        .row {
          grid-template-columns: 90px 90px 1fr;
          gap: var(--mh-space-2);
          padding: var(--mh-space-2) var(--mh-space-3);
        }
        .col-src {
          display: none;
        }
      }
    `,
  ];
}
