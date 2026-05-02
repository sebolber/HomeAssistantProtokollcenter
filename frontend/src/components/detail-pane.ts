// Iter 20/29/42/43: Slide-In-Pane mit Acknowledge, Tags, Runbook, Delete.

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type { ApiClient, MessageDto } from "../api-client.js";

@customElement("detail-pane")
export class DetailPane extends LitElement {
  @property({ attribute: false }) msg!: MessageDto;
  @property({ attribute: false }) api?: ApiClient;

  @state() private _status = "new";
  @state() private _tags: string[] = [];
  @state() private _newTag = "";
  @state() private _runbook: { title: string; markdown: string } | null = null;
  @state() private _busy = false;

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("msg") && this.msg) {
      this._status =
        ((this.msg as unknown as { status?: string }).status ?? "new") as string;
      void this._loadTags();
      void this._loadRunbook();
    }
  }

  private async _loadTags(): Promise<void> {
    if (!this.api || !this.msg) return;
    try {
      this._tags = await this.api.getMessageTags(this.msg.id);
    } catch {
      this._tags = [];
    }
  }

  private async _loadRunbook(): Promise<void> {
    if (!this.api || !this.msg) return;
    try {
      this._runbook = await this.api.getRunbookForSource(this.msg.source);
    } catch {
      this._runbook = null;
    }
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private async _setStatus(status: string): Promise<void> {
    if (!this.api) return;
    this._busy = true;
    try {
      await this.api.setMessageStatus(this.msg.id, status);
      this._status = status;
      this.dispatchEvent(
        new CustomEvent("status-change", {
          detail: { id: this.msg.id, status },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      this.dispatchEvent(
        new CustomEvent("error", {
          detail: { message: (err as Error).message },
          bubbles: true,
          composed: true,
        })
      );
    } finally {
      this._busy = false;
    }
  }

  private async _addTag(): Promise<void> {
    if (!this.api || !this._newTag.trim()) return;
    const tag = this._newTag.trim().toLowerCase().replaceAll(/[^a-z0-9._-]+/g, "-");
    try {
      this._tags = await this.api.addMessageTag(this.msg.id, tag);
      this._newTag = "";
    } catch {
      // ignore
    }
  }

  private async _removeTag(tag: string): Promise<void> {
    if (!this.api) return;
    try {
      this._tags = await this.api.removeMessageTag(this.msg.id, tag);
    } catch {
      // ignore
    }
  }

  private async _delete(): Promise<void> {
    if (!confirm(`Nachricht #${this.msg.id} endgültig löschen?`)) return;
    this.dispatchEvent(
      new CustomEvent("delete", {
        detail: { id: this.msg.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _statusBadge(): TemplateResult {
    const labels: Record<string, string> = {
      new: "Neu",
      acknowledged: "Bestätigt",
      resolved: "Gelöst",
      expired: "Abgelaufen",
    };
    return html`<span class=${`status-badge status-${this._status}`}>
      ${labels[this._status] ?? this._status}
    </span>`;
  }

  override render(): TemplateResult {
    return html`
      <aside>
        <header>
          <h2>
            #${this.msg.id}
            ${this._statusBadge()}
          </h2>
          <button class="close" aria-label="Schliessen" @click=${this._close}>×</button>
        </header>

        <div class="status-actions" role="group" aria-label="Status">
          <button
            ?disabled=${this._busy || this._status === "acknowledged"}
            @click=${() => this._setStatus("acknowledged")}
          >
            ✓ Bestätigen
          </button>
          <button
            ?disabled=${this._busy || this._status === "resolved"}
            @click=${() => this._setStatus("resolved")}
          >
            ✓✓ Gelöst
          </button>
          <button
            ?disabled=${this._busy || this._status === "new"}
            @click=${() => this._setStatus("new")}
          >
            ↺ Neu öffnen
          </button>
        </div>

        <dl>
          <dt>Severity</dt>
          <dd class=${`sev-${this.msg.severity}`}>${this.msg.severity}</dd>
          <dt>Source</dt>
          <dd><code>${this.msg.source}</code></dd>
          <dt>Timestamp</dt>
          <dd>${this.msg.timestamp}</dd>
          <dt>Webhook</dt>
          <dd>${this.msg.webhook_id ?? "—"}</dd>
        </dl>

        <h3>Text</h3>
        <pre class="text">${this.msg.text}</pre>

        ${this.msg.metadata
          ? html`<h3>Metadata</h3>
              <pre class="meta">${JSON.stringify(this.msg.metadata, null, 2)}</pre>`
          : nothing}

        <h3>Tags</h3>
        <div class="tags">
          ${this._tags.length === 0
            ? html`<span class="hint">keine Tags</span>`
            : this._tags.map(
                (t) => html`
                  <span class="tag">
                    #${t}
                    <button
                      class="tag-remove"
                      aria-label=${`Tag ${t} entfernen`}
                      @click=${() => this._removeTag(t)}
                    >
                      ×
                    </button>
                  </span>
                `
              )}
        </div>
        <div class="tag-input">
          <input
            type="text"
            placeholder="neuer Tag"
            .value=${this._newTag}
            @input=${(e: InputEvent) =>
              (this._newTag = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._addTag();
            }}
          />
          <button @click=${this._addTag} ?disabled=${!this._newTag.trim()}>+ Hinzufügen</button>
        </div>

        ${this._runbook
          ? html`<h3>Runbook: ${this._runbook.title}</h3>
              <pre class="runbook">${this._runbook.markdown}</pre>`
          : nothing}

        <footer>
          <button class="del" @click=${this._delete}>Löschen</button>
        </footer>
      </aside>
    `;
  }

  static override styles = css`
    :host {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(480px, 100%);
      background: var(--card-background-color, white);
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
      display: flex;
      z-index: 50;
    }
    @media (max-width: 600px) {
      :host {
        width: 100%;
      }
    }
    aside {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 16px;
      overflow: auto;
      gap: 12px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--divider-color, #ddd);
      padding-bottom: 8px;
    }
    h2 {
      margin: 0;
      font-size: 1em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h3 {
      margin: 0;
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color, #666);
    }
    .status-badge {
      font-size: 0.7em;
      padding: 2px 8px;
      border-radius: 10px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 600;
    }
    .status-new {
      background: rgba(3, 169, 244, 0.15);
      color: var(--info-color, #03a9f4);
    }
    .status-acknowledged {
      background: rgba(255, 152, 0, 0.15);
      color: var(--warning-color, #ff9800);
    }
    .status-resolved {
      background: rgba(76, 175, 80, 0.15);
      color: #2e7d32;
    }
    .status-expired {
      background: rgba(0, 0, 0, 0.08);
      color: var(--secondary-text-color, #666);
    }
    .close {
      font-size: 1.4em;
      background: transparent;
      border: 0;
      cursor: pointer;
      color: inherit;
    }
    .status-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .status-actions button {
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font: inherit;
      font-size: 0.85em;
    }
    .status-actions button:hover:not(:disabled) {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .status-actions button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    dl {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 4px 12px;
      margin: 0;
    }
    dt {
      color: var(--secondary-text-color, #666);
      font-size: 0.85em;
    }
    dd {
      margin: 0;
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.9em;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 6px;
      border-radius: 3px;
    }
    .sev-error {
      color: var(--error-color, #db4437);
      font-weight: bold;
    }
    .sev-warning {
      color: var(--warning-color, #ff9800);
      font-weight: bold;
    }
    pre.text,
    pre.meta,
    pre.runbook {
      margin: 0;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 8px;
      border-radius: 4px;
      overflow: auto;
      max-height: 240px;
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      white-space: pre-wrap;
    }
    pre.runbook {
      background: rgba(255, 235, 59, 0.08);
      border-left: 3px solid var(--warning-color, #ff9800);
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .hint {
      color: var(--secondary-text-color, #888);
      font-size: 0.85em;
      font-style: italic;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      padding: 2px 4px 2px 8px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 12px;
      font-size: 0.85em;
      color: var(--primary-text-color, #222);
    }
    .tag-remove {
      margin-left: 4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 0;
      background: transparent;
      color: var(--secondary-text-color, #666);
      cursor: pointer;
      font-size: 0.9em;
      line-height: 1;
    }
    .tag-remove:hover {
      background: rgba(219, 68, 55, 0.15);
      color: var(--error-color, #db4437);
    }
    .tag-input {
      display: flex;
      gap: 6px;
    }
    .tag-input input {
      flex: 1;
      padding: 6px 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font: inherit;
      font-size: 0.9em;
    }
    .tag-input button {
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font: inherit;
      font-size: 0.85em;
    }
    .tag-input button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    footer {
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color, #ddd);
      display: flex;
      justify-content: flex-end;
    }
    .del {
      padding: 6px 16px;
      background: var(--error-color, #db4437);
      color: white;
      border: 0;
      border-radius: 4px;
      cursor: pointer;
    }
  `;
}
