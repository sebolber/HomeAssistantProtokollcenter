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
  KnxRecommendLlmTestBody,
  KnxRecommendLlmTestResultDto,
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
      /* Iter UX-4 — Test-Result-Anzeige */
      .llm-test-result {
        margin-top: var(--mh-space-2);
        padding: var(--mh-space-2);
        border-radius: var(--mh-radius-sm, 4px);
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .llm-test-result--ok {
        background: var(--mh-success-soft);
        color: var(--mh-success);
      }
      .llm-test-result--err {
        background: var(--mh-error-soft);
        color: var(--mh-error);
      }
      .llm-test-result details {
        margin-top: var(--mh-space-1);
        color: var(--mh-fg-default);
      }
      .llm-test-result dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: var(--mh-space-1) var(--mh-space-2);
        margin: var(--mh-space-1) 0 0;
        font-size: var(--mh-text-sm);
      }
      .llm-test-result dt {
        color: var(--mh-fg-muted);
      }
      .llm-test-result dd {
        margin: 0;
      }
      /* Iter UX-6 — Legende unter System-Prompt-Override */
      .llm-legend {
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm, 4px);
        padding: var(--mh-space-2);
      }
      .llm-legend > summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
      .llm-legend__cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--mh-space-3);
        margin-top: var(--mh-space-2);
      }
      .llm-legend section h4 {
        margin: 0 0 var(--mh-space-1) 0;
        font-size: var(--mh-text-sm);
      }
      .llm-legend dl {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: var(--mh-space-1) var(--mh-space-2);
        margin: var(--mh-space-1) 0;
        font-size: var(--mh-text-xs);
      }
      .llm-legend dt {
        color: var(--mh-fg-muted);
      }
      .llm-legend dd {
        margin: 0;
      }
      .llm-legend pre {
        background: var(--mh-surface);
        border-radius: var(--mh-radius-sm, 4px);
        padding: var(--mh-space-2);
        overflow-x: auto;
        font-size: var(--mh-text-xs);
        margin: var(--mh-space-1) 0;
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
  // Iter UX-4: Test-Knopf-State
  @state() private _testing = false;
  @state() private _testResult: KnxRecommendLlmTestResultDto | null = null;
  @state() private _testError = "";

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

  // Iter UX-4: Test-Aufruf gegen den konfigurierten Provider — der
  // Endpoint persistiert nichts, der Test laeuft auch ohne zuvor
  // gespeicherte Werte.
  private async _testConnection(): Promise<void> {
    if (!this.api || this._testing) return;
    this._testing = true;
    this._testResult = null;
    this._testError = "";
    const body: KnxRecommendLlmTestBody = {
      base_url: this._draft.base_url,
      model: this._draft.model,
      timeout_s: this._draft.timeout_s,
      max_tokens: this._draft.max_tokens,
      system_prompt_override: this._draft.system_prompt_override,
    };
    if (this._apiKeyEdit) {
      // User hat im Form einen Key eingetippt — diesen mitschicken.
      body.api_key = this._draft.api_key ?? "";
    }
    try {
      this._testResult = await this.api.testKnxRecommendLlm(body);
    } catch (err) {
      this._testError = (err as Error).message;
    } finally {
      this._testing = false;
    }
  }

  // Iter UX-6: Legende unter dem System-Prompt-Override — User sieht
  // genau welche Variablen ihm im Prompt zur Verfuegung stehen und
  // welches Antwort-Schema der Service erwartet. Kein Hover-Tooltip,
  // sondern ein dauerhaft sichtbarer Reference-Block.
  private _renderPromptLegend(): TemplateResult {
    return html`
      <details class="llm-legend" data-test="llm-prompt-legend">
        <summary>
          <strong>Legende:</strong> uebergebene Werte &amp; erwartetes
          Antwort-Schema
        </summary>
        <div class="llm-legend__cols">
          <section>
            <h4>Eingabe an das LLM</h4>
            <p class="muted small">
              Diese Felder werden bei jedem Call mitgesendet
              (Whitelist-sanitiert, max 80 Zeichen pro String):
            </p>
            <dl>
              <dt><code>DPT</code></dt>
              <dd>KNX-Datapoint-Type, z. B. <code>9.001</code></dd>
              <dt><code>Hersteller</code></dt>
              <dd>aus ETS-Discovery oder User-Override</dd>
              <dt><code>Modell</code></dt>
              <dd>aus ETS-Discovery oder User-Override</dd>
              <dt><code>observed_mode</code></dt>
              <dd>
                <code>cyclic</code> / <code>on_change</code> /
                <code>hybrid</code> (runtime-Klassifikation)
              </dd>
              <dt><code>median_interval_minutes</code></dt>
              <dd>Median-Sendeintervall der GA, numerisch</dd>
              <dt><code>sample_count</code></dt>
              <dd>Anzahl Telegramme im Beobachtungsfenster</dd>
            </dl>
            <p class="muted small">
              <strong>Nicht uebermittelt:</strong> GA-Adresse,
              Source-IA, Telegramm-Werte, GA-Bezeichnung, Last-Seen.
            </p>
          </section>

          <section>
            <h4>Erwartete Antwort (JSON)</h4>
            <p class="muted small">
              Antwort-Schema bleibt zwingend, auch beim Override —
              sonst wird die Antwort verworfen.
            </p>
            <pre><code>{
  "mode": "on_change" | "cyclic" | "hybrid",
  "cycle_minutes_min": null | int,
  "cycle_minutes_max": null | int,
  "hysteresis": null | string,
  "max_rate_per_min": float,
  "rationale": string
}</code></pre>
            <dl>
              <dt><code>mode</code></dt>
              <dd>empfohlener Sende-Modus (Pflicht)</dd>
              <dt><code>cycle_minutes_min</code> / <code>_max</code></dt>
              <dd>
                Heartbeat-Korridor in Minuten;
                <code>null</code> bei reinem <code>on_change</code>
              </dd>
              <dt><code>hysteresis</code></dt>
              <dd>
                menschen-lesbarer Hinweis (z. B.
                <code>"&gt;= 0.5 K"</code>); <code>null</code> bei
                Boolean-DPTs
              </dd>
              <dt><code>max_rate_per_min</code></dt>
              <dd>Sanity-Cap fuer die Telegrammrate</dd>
              <dt><code>rationale</code></dt>
              <dd>kurze WHY-Begruendung (max 2 Saetze)</dd>
            </dl>
          </section>
        </div>
      </details>
    `;
  }

  private _renderTestResult(): TemplateResult {
    if (this._testing) {
      return html`<p class="muted small">Teste Verbindung…</p>`;
    }
    if (this._testError !== "") {
      return html`<p class="mh-error">${this._testError}</p>`;
    }
    const r = this._testResult;
    if (r === null) return html``;
    if (r.ok && r.response !== null) {
      const cycle =
        r.response.cycle_minutes_min !== null &&
        r.response.cycle_minutes_max !== null
          ? `${r.response.cycle_minutes_min}–${r.response.cycle_minutes_max} Min`
          : "—";
      return html`<div class="llm-test-result llm-test-result--ok">
        <strong>✓ Verbindung erfolgreich</strong>
        <span class="muted small">Latenz: ${r.latency_ms} ms</span>
        <details>
          <summary>Antwort des Modells</summary>
          <dl>
            <dt>Modus</dt>
            <dd>${r.response.mode}</dd>
            <dt>Sendezyklus</dt>
            <dd>${cycle}</dd>
            <dt>Hysterese</dt>
            <dd>${r.response.hysteresis ?? "—"}</dd>
            <dt>Max-Rate</dt>
            <dd>${r.response.max_rate_per_min} /Min</dd>
            <dt>Begründung</dt>
            <dd>${r.response.rationale}</dd>
          </dl>
        </details>
      </div>`;
    }
    return html`<div class="llm-test-result llm-test-result--err">
      <strong>✗ Test fehlgeschlagen</strong>
      ${r.error
        ? html`<p>${r.error}</p>`
        : html`<p>Keine Antwort vom Provider.</p>`}
      ${r.error_category
        ? html`<p class="muted small">Kategorie: ${r.error_category}</p>`
        : nothing}
    </div>`;
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
              placeholder="Leer = Default-Prompt (siehe Legende unten)"
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
              zwingend (siehe "Erwartete Antwort" unten) — sonst kann der
              Service die Antwort nicht parsen.
            </span>
          </label>

          ${this._renderPromptLegend()}

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
              ?disabled=${this._saving || this._testing}
              title="Schickt einen kleinen Test-Request an den Provider — kostet ~1 LLM-Call. Speichert nichts."
              @click=${() => void this._testConnection()}
            >
              ${this._testing ? "Teste…" : "Verbindung testen"}
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
          ${this._renderTestResult()}
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
