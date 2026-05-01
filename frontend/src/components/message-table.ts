// Iter 17: scrollbare Tabelle der Nachrichten.
// Hinweis: lit-virtualizer raus, weil HA-Frontend es schon registriert.
// Bei <=200 Items reicht plain `.map()` mit CSS-Scrolling problemlos.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { MessageDto } from "../api-client.js";

const SEVERITY_ICON: Record<string, string> = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·",
};

const SEVERITY_LABEL: Record<string, string> = {
  error: "Error",
  warning: "Warning",
  info: "Info",
  debug: "Debug",
};

@customElement("message-table")
export class MessageTable extends LitElement {
  @property({ attribute: false }) items: MessageDto[] = [];

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
        <span class="col-icon" role="columnheader" title="Severity (Schweregrad)">
          Sev
        </span>
        <span class="col-ts" role="columnheader" title="Empfangs-Zeitpunkt (UTC)">
          Zeit
        </span>
        <span class="col-src" role="columnheader" title="Quelle / Herkunft der Nachricht">
          Quelle
        </span>
        <span class="col-text" role="columnheader" title="Nachrichten-Text (Klick: Detail)">
          Nachricht
        </span>
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
            (msg) => html`
              <div
                class=${`row sev-${msg.severity}`}
                tabindex="0"
                role="listitem button"
                @click=${() => this._onClick(msg)}
                @keydown=${(e: KeyboardEvent) => this._onKey(e, msg)}
              >
                <span
                  class="col-icon icon"
                  aria-label=${SEVERITY_LABEL[msg.severity] ?? msg.severity}
                  title=${SEVERITY_LABEL[msg.severity] ?? msg.severity}
                >
                  ${SEVERITY_ICON[msg.severity] ?? "·"}
                </span>
                <span class="col-ts ts">
                  ${msg.timestamp.replace("T", " ").replace(/\+00:00$/, "Z")}
                </span>
                <span class="col-src src">${msg.source}</span>
                <span class="col-text text">${msg.text}</span>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      flex: 1;
      overflow: hidden;
    }
    .root {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .header,
    .row {
      display: grid;
      grid-template-columns: 40px 180px 160px 1fr;
      gap: 12px;
      padding: 6px 16px;
      align-items: center;
    }
    .header {
      background: var(--secondary-background-color, #f3f3f3);
      border-bottom: 2px solid var(--divider-color, #ddd);
      font-size: 0.78em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--secondary-text-color, #666);
      padding-top: 8px;
      padding-bottom: 8px;
      position: sticky;
      top: 0;
      z-index: 1;
      cursor: default;
    }
    .header span {
      cursor: help;
    }
    .col-icon {
      text-align: center;
    }
    .col-ts {
      font-variant-numeric: tabular-nums;
    }
    .scroll {
      flex: 1;
      overflow: auto;
    }
    .row {
      border-bottom: 1px solid var(--divider-color, #eee);
      cursor: pointer;
    }
    .row:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .row:focus-visible {
      background: var(--secondary-background-color, #f3f3f3);
      outline: 2px solid var(--primary-color, #03a9f4);
      outline-offset: -2px;
    }
    .icon {
      font-size: 1.2em;
    }
    .row.sev-error .icon {
      color: var(--error-color, #db4437);
    }
    .row.sev-warning .icon {
      color: var(--warning-color, #ff9800);
    }
    .row.sev-info .icon {
      color: var(--info-color, #03a9f4);
    }
    .row.sev-debug .icon {
      color: var(--secondary-text-color, #888);
    }
    .ts {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      color: var(--secondary-text-color, #666);
    }
    .src {
      font-weight: 500;
    }
    .text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .empty {
      padding: 32px;
      text-align: center;
      color: var(--secondary-text-color, #666);
    }
    @media (max-width: 600px) {
      .header,
      .row {
        grid-template-columns: 28px 120px 1fr;
        gap: 8px;
        padding: 6px 8px;
      }
      .col-src {
        display: none;
      }
    }
  `;
}
