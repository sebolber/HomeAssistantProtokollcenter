// Iter 17 + UI-Polish: scrollbare Tabelle der Nachrichten.
// - Severity als farbige Pille mit Icon + Label, Click oeffnet Inline-Popover
//   zum Aendern der Severity ohne Detail-Dialog
// - Relative Zeit (z. B. "vor 3 Min") als Default, absolute Zeit als Tooltip
// - Source als dezente Pille
// - Hover-/Focus-States ueber Design-Tokens

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
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

const SEVERITY_OPTIONS: Array<keyof typeof SEVERITY_LABEL> = ["error", "warning", "info", "debug"];

@customElement("message-table")
export class MessageTable extends LitElement {
  @property({ attribute: false }) items: MessageDto[] = [];

  @state() private _now = new Date();
  @state() private _editSeverityFor: number | null = null;
  @state() private _popoverPos: { top: number; left: number } | null = null;
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

  private _closePopover(): void {
    this._editSeverityFor = null;
    this._popoverPos = null;
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

  private _onSeverityClick = (e: Event, msg: MessageDto): void => {
    // Verhindert dass die Row den Detail-Dialog oeffnet.
    e.stopPropagation();
    e.preventDefault();
    if (this._editSeverityFor === msg.id) {
      this._closePopover();
      return;
    }
    // Position des Popovers anhand des Trigger-Buttons berechnen.
    // Wir nutzen position: fixed, damit der overflow:auto-Scrollcontainer
    // das Popover nicht abschneiden kann.
    const trigger = e.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    const POPOVER_HEIGHT_HINT = 200;
    const placeBelow = rect.bottom + POPOVER_HEIGHT_HINT < window.innerHeight;
    this._popoverPos = {
      top: placeBelow ? rect.bottom + 4 : rect.top - POPOVER_HEIGHT_HINT - 4,
      left: rect.left,
    };
    this._editSeverityFor = msg.id;
  };

  private _onSeverityPick = (e: Event, msgId: number, currentSev: string, severity: string): void => {
    e.stopPropagation();
    this._closePopover();
    if (severity === currentSev) return;
    this.dispatchEvent(
      new CustomEvent("severity-change", {
        detail: { id: msgId, severity, previous: currentSev },
        bubbles: true,
        composed: true,
      })
    );
  };

  private _renderPopover(): TemplateResult {
    if (this._editSeverityFor === null || this._popoverPos === null) {
      return html``;
    }
    const activeMsg = this.items.find((m) => m.id === this._editSeverityFor);
    if (!activeMsg) return html``;
    const currentSev = activeMsg.severity ?? "info";
    const msgId = activeMsg.id;
    return html`
      <div class="popover-backdrop" @click=${() => this._closePopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._popoverPos.top}px; left: ${this._popoverPos.left}px`}
        @click=${(e: Event) => e.stopPropagation()}
      >
        ${SEVERITY_OPTIONS.map(
          (opt) => html`<button
            role="menuitemradio"
            aria-checked=${opt === currentSev}
            class=${`sev-option ${opt === currentSev ? "active" : ""}`}
            @click=${(e: Event) => this._onSeverityPick(e, msgId, currentSev, opt)}
          >
            <span class=${`mh-pill mh-pill--${opt}`}>
              <span class="sev-icon" aria-hidden="true">${SEVERITY_ICON[opt]}</span>
              ${SEVERITY_LABEL[opt]}
            </span>
            ${opt === currentSev
              ? html`<span class="check" aria-hidden="true">✓</span>`
              : nothing}
          </button>`
        )}
      </div>
    `;
  }

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
                  class=${`row sev-${sev} ${this._editSeverityFor === msg.id ? "row-active" : ""}`}
                  tabindex="0"
                  role="listitem button"
                  @click=${() => this._onClick(msg)}
                  @keydown=${(e: KeyboardEvent) => this._onKey(e, msg)}
                >
                  <span class="col-sev">
                    <button
                      class=${`mh-pill mh-pill--${sev} sev-trigger`}
                      title="Severity ändern"
                      aria-haspopup="menu"
                      aria-expanded=${this._editSeverityFor === msg.id}
                      @click=${(e: Event) => this._onSeverityClick(e, msg)}
                    >
                      <span class="sev-icon" aria-hidden="true">${sevIcon}</span>
                      ${sevLabel}
                      <span class="caret" aria-hidden="true">▾</span>
                    </button>
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
        ${this._renderPopover()}
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
      button.sev-trigger {
        appearance: none;
        border: 0;
        cursor: pointer;
        font: inherit;
        padding: 2px 8px;
        gap: 4px;
        transition: filter var(--mh-transition-fast), box-shadow var(--mh-transition-fast);
      }
      button.sev-trigger:hover {
        filter: brightness(0.95);
        box-shadow: 0 0 0 2px var(--mh-divider);
      }
      button.sev-trigger:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: 2px;
      }
      .caret {
        font-size: 0.7em;
        opacity: 0.65;
        margin-left: 2px;
      }
      .row.row-active {
        background: var(--mh-surface-2);
      }
      .popover-backdrop {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: transparent;
      }
      .sev-popover {
        position: fixed;
        z-index: 70;
        min-width: 180px;
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        animation: pop-in 120ms ease-out;
      }
      @keyframes pop-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      button.sev-option {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 6px 8px;
        border-radius: var(--mh-radius-sm);
        cursor: pointer;
        font: inherit;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-2);
      }
      button.sev-option:hover {
        background: var(--mh-surface-2);
      }
      button.sev-option.active {
        background: var(--mh-surface-2);
      }
      button.sev-option:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: -2px;
      }
      .check {
        color: var(--mh-success);
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
