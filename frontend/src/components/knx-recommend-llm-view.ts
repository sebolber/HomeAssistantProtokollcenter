// Iter L4.3 (Sprint Recommendations / Phase 9): UI fuer LLM-Provider-
// Konfiguration. Lebt im Settings-Tab unter "KI-Empfehlungen".
//
// Sicherheits-/UX-Vorgaben:
// - API-Key-Feld ist `type="password"`, kein Echo im DOM-Inspektor.
// - Speichern ohne Key: bestehender Key bleibt erhalten (Backend
//   pflegt das, Frontend signalisiert es als "[Key bleibt unveraendert]").
// - Master-Toggle "deaktivieren" wirkt sofort auch auf den Recommendation-
//   Cache (Server flusht).

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type {
  ApiClient,
  KnxRecommendLlmSettingsDto,
  KnxRecommendLlmSettingsPutBody,
} from "../api-client.js";
import { tokens, cards, buttons } from "../styles/tokens.js";


@customElement("knx-recommend-llm-view")
export class KnxRecommendLlmView extends LitElement {
  static override styles = [
    tokens,
    cards,
    buttons,
    css`
      .llm-section {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
        max-width: 720px;
      }
      .llm-section h2 {
        margin: 0;
      }
      .llm-section p.muted {
        margin: 0;
      }
      .llm-form {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
      }
      .llm-form label {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .llm-form input,
      .llm-form textarea {
        padding: var(--mh-space-1) var(--mh-space-2);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm, 4px);
        background: var(--mh-surface-2);
        color: var(--mh-fg-default);
        font: inherit;
      }
      .llm-form textarea {
        min-height: 6em;
        resize: vertical;
      }
      .llm-form .toggle-row {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .llm-form .help {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .llm-presets {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-1);
      }
      .llm-actions {
        display: flex;
        gap: var(--mh-space-2);
      }
      .api-key-row {
        display: flex;
        gap: var(--mh-space-2);
        align-items: center;
      }
      .api-key-row input {
        flex: 1;
      }
      .llm-warning {
        background: var(--mh-warning-soft);
        color: var(--mh-warning);
        padding: var(--mh-space-2);
        border-radius: var(--mh-radius-sm, 4px);
      }
    `,
  ];

  @property({ attribute: false }) api?: ApiClient;

  @state() private _settings: KnxRecommendLlmSettingsDto | null = null;
  @state() private _loading = true;
  @state() private _saving = false;
  @state() private _error = "";
  @state() private _draft: KnxRecommendLlmSettingsPutBody = {
    enabled: false,
    base_url: "",
    model: "",
  };
  @state() private _apiKeyEdit = false;
  @state() private _info = "";

  override async firstUpdated(): Promise<void> {
    await this._reload();
  }

  private async _reload(): Promise<void> {
    if (!this.api) {
      this._error = "API-Client fehlt";
      this._loading = false;
      return;
    }
    this._loading = true;
    this._error = "";
    try {
      this._settings = await this.api.getKnxRecommendLlmSettings();
      this._draft = {
        enabled: this._settings.enabled,
        base_url: this._settings.base_url,
        model: this._settings.model,
        timeout_s: this._settings.timeout_s,
        max_tokens: this._settings.max_tokens,
        system_prompt_override: this._settings.system_prompt_override,
      };
      this._apiKeyEdit = !this._settings.api_key_set;
    } catch (err) {
      this._error = (err as Error).message;
    } finally {
      this._loading = false;
    }
  }

  private async _save(): Promise<void> {
    if (!this.api) return;
    this._saving = true;
    this._error = "";
    this._info = "";
    try {
      const body: KnxRecommendLlmSettingsPutBody = {
        enabled: this._draft.enabled,
        base_url: this._draft.base_url,
        model: this._draft.model,
        timeout_s: this._draft.timeout_s,
        max_tokens: this._draft.max_tokens,
        system_prompt_override: this._draft.system_prompt_override,
      };
      // API-Key nur senden, wenn der User ihn editiert hat — sonst
      // bleibt der bestehende Wert im Server-Store erhalten.
      if (this._apiKeyEdit) {
        body.api_key = this._draft.api_key ?? "";
      }
      this._settings = await this.api.putKnxRecommendLlmSettings(body);
      this._draft = {
        enabled: this._settings.enabled,
        base_url: this._settings.base_url,
        model: this._settings.model,
        timeout_s: this._settings.timeout_s,
        max_tokens: this._settings.max_tokens,
        system_prompt_override: this._settings.system_prompt_override,
      };
      this._apiKeyEdit = false;
      this._info = "Einstellungen gespeichert.";
    } catch (err) {
      this._error = (err as Error).message;
    } finally {
      this._saving = false;
    }
  }

  private _setDraft<K extends keyof KnxRecommendLlmSettingsPutBody>(
    key: K,
    value: KnxRecommendLlmSettingsPutBody[K],
  ): void {
    this._draft = { ...this._draft, [key]: value };
  }

  private _applyPreset(
    preset: "openai" | "azure" | "ollama" | "groq",
  ): void {
    const presets: Record<typeof preset, Partial<KnxRecommendLlmSettingsPutBody>> = {
      openai: {
        base_url: "https://api.openai.com/v1",
        model: "gpt-4o-mini",
      },
      azure: {
        base_url: "https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT",
        model: "gpt-4o-mini",
      },
      ollama: {
        base_url: "http://localhost:11434/v1",
        model: "llama3.2",
      },
      groq: {
        base_url: "https://api.groq.com/openai/v1",
        model: "llama-3.3-70b-versatile",
      },
    };
    this._draft = { ...this._draft, ...presets[preset] };
  }

  override render(): TemplateResult {
    if (this._loading) {
      return html`<p class="muted">Lade Einstellungen…</p>`;
    }
    return html`
      <section class="llm-section mh-card">
        <header>
          <h2>KI-Empfehlungen (Layer 4)</h2>
          <p class="muted">
            Optional: ein externes LLM gibt Sende-Modus-Empfehlungen
            fuer Geraete, deren DPT/Modell die Empfehlungs-Engine
            nicht kennt. <strong>Default: deaktiviert.</strong>
            Funktioniert mit allen OpenAI-Chat-Completions-kompatiblen
            Anbietern (OpenAI, Azure, Ollama, Groq, LiteLLM-Gateway, …).
          </p>
        </header>

        ${this._error
          ? html`<p class="mh-error">${this._error}</p>`
          : nothing}
        ${this._info
          ? html`<p class="muted small">${this._info}</p>`
          : nothing}

        <div class="llm-form">
          <div class="toggle-row">
            <input
              type="checkbox"
              id="llm-enabled"
              .checked=${this._draft.enabled}
              ?disabled=${this._saving}
              @change=${(e: Event) =>
                this._setDraft(
                  "enabled",
                  (e.target as HTMLInputElement).checked,
                )}
            />
            <label for="llm-enabled">
              <strong>KI-Empfehlungen aktivieren</strong>
            </label>
          </div>

          ${this._draft.enabled
            ? html`<div class="llm-warning">
                Bei jedem geoeffneten Source-Detail-Drawer kann der
                Provider angefragt werden — das verursacht Kosten +
                Latenz. Cache (30 Tage TTL) reduziert wiederholte Calls.
              </div>`
            : nothing}

          <div class="llm-presets">
            <span class="help">Voreinstellung:</span>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => this._applyPreset("openai")}
            >OpenAI</button>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => this._applyPreset("azure")}
            >Azure</button>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => this._applyPreset("ollama")}
            >Ollama (lokal)</button>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => this._applyPreset("groq")}
            >Groq</button>
          </div>

          <label>
            <span>Base URL</span>
            <input
              type="url"
              placeholder="https://api.openai.com/v1"
              .value=${this._draft.base_url}
              ?disabled=${this._saving}
              @input=${(e: InputEvent) =>
                this._setDraft(
                  "base_url",
                  (e.target as HTMLInputElement).value,
                )}
            />
            <span class="help">
              Endpoint des Providers ohne <code>/chat/completions</code>.
              Erlaubt sind <code>http://</code> und <code>https://</code>.
            </span>
          </label>

          <label>
            <span>Modell</span>
            <input
              type="text"
              placeholder="gpt-4o-mini"
              .value=${this._draft.model}
              ?disabled=${this._saving}
              @input=${(e: InputEvent) =>
                this._setDraft(
                  "model",
                  (e.target as HTMLInputElement).value,
                )}
            />
            <span class="help">
              Modellname laut Provider-Dokumentation
              (z. B. <code>gpt-4o-mini</code>, <code>llama3.2</code>).
            </span>
          </label>

          <label>
            <span>API-Key</span>
            <div class="api-key-row">
              ${this._apiKeyEdit
                ? html`<input
                    type="password"
                    placeholder="sk-..."
                    .value=${this._draft.api_key ?? ""}
                    ?disabled=${this._saving}
                    @input=${(e: InputEvent) =>
                      this._setDraft(
                        "api_key",
                        (e.target as HTMLInputElement).value,
                      )}
                  />`
                : html`<input
                    type="text"
                    disabled
                    .value=${this._settings?.api_key_set
                      ? "[Schluessel gespeichert — unveraendert lassen oder \"Aendern\" klicken]"
                      : "[kein Schluessel]"}
                  />`}
              <button
                type="button"
                class="mh-button mh-button--ghost"
                ?disabled=${this._saving}
                @click=${() => {
                  this._apiKeyEdit = !this._apiKeyEdit;
                  if (!this._apiKeyEdit) {
                    this._draft = { ...this._draft, api_key: undefined };
                  }
                }}
              >
                ${this._apiKeyEdit ? "Abbrechen" : "Aendern"}
              </button>
            </div>
            <span class="help">
              Wird nur als Authorization-Header gesendet, niemals
              im Audit-Log oder in den Antworten ausgegeben.
            </span>
          </label>

          <label>
            <span>Timeout (Sekunden)</span>
            <input
              type="number"
              min="1"
              max="120"
              step="1"
              .value=${String(this._draft.timeout_s ?? 15)}
              ?disabled=${this._saving}
              @input=${(e: InputEvent) =>
                this._setDraft(
                  "timeout_s",
                  Number((e.target as HTMLInputElement).value),
                )}
            />
          </label>

          <label>
            <span>Max Tokens</span>
            <input
              type="number"
              min="100"
              max="4000"
              step="50"
              .value=${String(this._draft.max_tokens ?? 800)}
              ?disabled=${this._saving}
              @input=${(e: InputEvent) =>
                this._setDraft(
                  "max_tokens",
                  Number((e.target as HTMLInputElement).value),
                )}
            />
            <span class="help">Cap auf die Antwort-Tokens (Cost-Schutz).</span>
          </label>

          <label>
            <span>System-Prompt-Override (optional)</span>
            <textarea
              placeholder="Leer = Default-Prompt"
              .value=${this._draft.system_prompt_override ?? ""}
              ?disabled=${this._saving}
              @input=${(e: InputEvent) =>
                this._setDraft(
                  "system_prompt_override",
                  (e.target as HTMLTextAreaElement).value,
                )}
            ></textarea>
            <span class="help">
              Ueberschreibt den eingebauten Prompt. Antwort-Schema bleibt
              erforderlich (siehe Doku) — sonst kann der Service die
              Antwort nicht parsen.
            </span>
          </label>

          <div class="llm-actions">
            <button
              type="button"
              class="mh-button"
              ?disabled=${this._saving}
              @click=${() => void this._save()}
            >
              ${this._saving ? "Speichere…" : "Speichern"}
            </button>
            <button
              type="button"
              class="mh-button mh-button--ghost"
              ?disabled=${this._saving}
              @click=${() => void this._reload()}
            >
              Verwerfen
            </button>
          </div>
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "knx-recommend-llm-view": KnxRecommendLlmView;
  }
}
