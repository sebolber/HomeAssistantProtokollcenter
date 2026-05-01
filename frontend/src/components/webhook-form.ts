// Inline-Form fuer Webhook-Add/Edit mit JSONPath-Mapping-Editor.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ApiClient, WebhookDto } from "../api-client.js";

const SEVERITIES = ["debug", "info", "warning", "error"] as const;

const EXAMPLE_MAPPING = JSON.stringify(
  {
    severity: "$.level",
    source: "$.app.name",
    text: "$.message",
    metadata: "$.extra",
  },
  null,
  2
);

const SOURCE_PATTERN = /^[a-z0-9._-]{1,64}$/;

/** Konvertiert beliebige User-Eingaben in eine valide Source. */
function sanitizeSource(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[\s/\\]+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 64);
}

@customElement("webhook-form")
export class WebhookForm extends LitElement {
  @property({ attribute: false }) api?: ApiClient;
  @property({ attribute: false }) editing: WebhookDto | null = null;

  @state() private _name = "";
  @state() private _source = "";
  @state() private _severity = "info";
  @state() private _enabled = true;
  @state() private _mappingText = "";
  @state() private _error = "";
  @state() private _saving = false;

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("editing")) {
      const e = this.editing;
      this._name = e?.name ?? "";
      this._source = e?.default_source ?? "";
      this._severity = e?.default_severity ?? "info";
      this._enabled = e?.enabled ?? true;
      this._mappingText = e?.field_map ? JSON.stringify(e.field_map, null, 2) : "";
      this._error = "";
    }
  }

  private _validateMapping(): Record<string, unknown> | null {
    if (!this._mappingText.trim()) return null;
    try {
      const parsed = JSON.parse(this._mappingText);
      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("muss ein JSON-Objekt sein");
      }
      return parsed as Record<string, unknown>;
    } catch (err) {
      throw new Error(`Mapping-JSON ungueltig: ${(err as Error).message}`);
    }
  }

  private async _save(): Promise<void> {
    if (!this.api) return;
    this._error = "";
    this._saving = true;
    try {
      const mapping = this._validateMapping();
      if (!this._name.trim()) throw new Error("Name darf nicht leer sein");
      if (!SOURCE_PATTERN.test(this._source)) {
        throw new Error("Source ist leer oder ungueltig.");
      }

      let result: WebhookDto;
      if (this.editing) {
        result = await this.api.updateWebhook(this.editing.webhook_id, {
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: mapping,
          enabled: this._enabled,
        });
      } else {
        result = await this.api.createWebhook({
          name: this._name.trim(),
          default_source: this._source,
          default_severity: this._severity,
          field_map: mapping,
          enabled: this._enabled,
        });
      }

      this.dispatchEvent(
        new CustomEvent("saved", {
          detail: { webhook: result },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      this._error = (err as Error).message;
    } finally {
      this._saving = false;
    }
  }

  private _cancel(): void {
    this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true }));
  }

  private _useExample(): void {
    this._mappingText = EXAMPLE_MAPPING;
  }

  override render(): TemplateResult {
    const isEdit = this.editing !== null;
    return html`
      <div class="card">
        <h3>${isEdit ? "Webhook bearbeiten" : "Neuen Webhook anlegen"}</h3>

        <label>
          <span>Name</span>
          <input
            type="text"
            .value=${this._name}
            @input=${(e: InputEvent) =>
              (this._name = (e.target as HTMLInputElement).value)}
            placeholder="z. B. Pi-hole Alerts"
          />
        </label>

        <div class="row-2">
          <label>
            <span>
              Default-Source
              ${this._source && SOURCE_PATTERN.test(this._source)
                ? html`<span class="ok-badge" title="ok">✓</span>`
                : null}
            </span>
            <input
              type="text"
              class=${this._source && !SOURCE_PATTERN.test(this._source)
                ? "invalid"
                : ""}
              .value=${this._source}
              @input=${(e: InputEvent) => {
                const raw = (e.target as HTMLInputElement).value;
                this._source = sanitizeSource(raw);
              }}
              placeholder="z. B. pihole"
              autocomplete="off"
              spellcheck="false"
            />
            <small>
              Wird automatisch in <code>kebab-case</code> umgewandelt
              (Beispiele: <code>pihole</code>, <code>knx-bus</code>,
              <code>backup.job</code>, <code>nas-1</code>).
              Erlaubt: a–z, 0–9, „.", „_", „-" — max 64 Zeichen.
            </small>
          </label>

          <label>
            <span>Default-Severity</span>
            <select
              .value=${this._severity}
              @change=${(e: Event) =>
                (this._severity = (e.target as HTMLSelectElement).value)}
            >
              ${SEVERITIES.map(
                (s) => html`<option value=${s} ?selected=${this._severity === s}>${s}</option>`
              )}
            </select>
          </label>
        </div>

        <label class="checkbox">
          <input
            type="checkbox"
            .checked=${this._enabled}
            @change=${(e: Event) =>
              (this._enabled = (e.target as HTMLInputElement).checked)}
          />
          <span>aktiv</span>
        </label>

        <div class="mapping">
          <div class="mapping-head">
            <span>JSONPath-Mapping (optional)</span>
            <button class="link" @click=${this._useExample}>
              Beispiel einfügen
            </button>
          </div>
          <textarea
            .value=${this._mappingText}
            @input=${(e: InputEvent) =>
              (this._mappingText = (e.target as HTMLTextAreaElement).value)}
            placeholder=${'{"severity": "$.level", "source": "$.app.name", ...}'}
            rows="6"
            spellcheck="false"
          ></textarea>
          <small>
            Leer lassen für 1:1-Mapping (severity/source/text/metadata in der
            Top-Level-Payload).
          </small>
        </div>

        ${this._error ? html`<div class="error">${this._error}</div>` : null}

        <div class="actions">
          <button class="primary" ?disabled=${this._saving} @click=${this._save}>
            ${this._saving ? "speichere…" : isEdit ? "Speichern" : "Anlegen"}
          </button>
          <button @click=${this._cancel}>Abbrechen</button>
        </div>
      </div>
    `;
  }

  static override styles = css`
    .card {
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    h3 {
      margin: 0 0 4px 0;
      font-size: 1.05em;
      color: var(--primary-text-color, #222);
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    label > span {
      font-weight: 500;
      color: var(--primary-text-color, #222);
    }
    .row-2 {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .row-2 {
        grid-template-columns: 1fr;
      }
    }
    input[type="text"],
    select,
    textarea {
      padding: 8px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, white);
      color: var(--primary-text-color, #222);
      font: inherit;
    }
    textarea {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      resize: vertical;
    }
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
      outline: 2px solid var(--primary-color, #03a9f4);
      outline-offset: 1px;
    }
    input.invalid {
      border-color: var(--error-color, #db4437);
    }
    .ok-badge {
      display: inline-block;
      margin-left: 6px;
      color: var(--success-color, #2e7d32);
      font-size: 0.85em;
      font-weight: 700;
    }
    small code {
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 4px;
      border-radius: 3px;
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.95em;
    }
    small {
      font-size: 0.78em;
      color: var(--secondary-text-color, #888);
    }
    .checkbox {
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    .mapping {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mapping-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    button {
      padding: 8px 14px;
      border: 1px solid var(--divider-color, #ccc);
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: inherit;
      font: inherit;
    }
    button:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    button.primary {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }
    button.primary:hover {
      filter: brightness(0.9);
    }
    button.primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    button.link {
      padding: 2px 6px;
      border: 0;
      color: var(--primary-color, #03a9f4);
      background: transparent;
      cursor: pointer;
      font-size: 0.85em;
      text-decoration: underline;
    }
    .error {
      color: var(--error-color, #db4437);
      font-size: 0.9em;
      padding: 6px 8px;
      background: rgba(219, 68, 55, 0.08);
      border-left: 3px solid var(--error-color, #db4437);
      border-radius: 2px;
    }
    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 4px;
    }
  `;
}
