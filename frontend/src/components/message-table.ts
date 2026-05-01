// Iter 17: virtualisierte Tabelle der Nachrichten.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@lit-labs/virtualizer";
import type { MessageDto } from "../api-client.js";

const SEVERITY_ICON: Record<string, string> = {
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
  debug: "·",
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

  override render(): TemplateResult {
    if (!this.items.length) {
      return html`<div class="empty">Keine Nachrichten</div>`;
    }
    return html`
      <lit-virtualizer
        .items=${this.items}
        .renderItem=${(msg: MessageDto) => html`
          <div
            class=${`row sev-${msg.severity}`}
            tabindex="0"
            role="button"
            @click=${() => this._onClick(msg)}
            @keydown=${(e: KeyboardEvent) => this._onKey(e, msg)}
          >
            <span class="icon">${SEVERITY_ICON[msg.severity] ?? "·"}</span>
            <span class="ts">${msg.timestamp.replace("T", " ").replace(/\+00:00$/, "Z")}</span>
            <span class="src">${msg.source}</span>
            <span class="text">${msg.text}</span>
          </div>
        `}
      ></lit-virtualizer>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      flex: 1;
      overflow: auto;
    }
    lit-virtualizer {
      height: 100%;
    }
    .row {
      display: grid;
      grid-template-columns: 24px 160px 160px 1fr;
      gap: 12px;
      padding: 6px 16px;
      border-bottom: 1px solid var(--divider-color, #eee);
      cursor: pointer;
      align-items: center;
    }
    .row:focus,
    .row:hover {
      background: var(--secondary-background-color, #f3f3f3);
      outline: none;
    }
    .icon {
      font-size: 1.2em;
      text-align: center;
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
  `;
}
