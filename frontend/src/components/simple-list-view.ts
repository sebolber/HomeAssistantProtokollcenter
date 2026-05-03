// Generischer Quick-Editor fuer MQTT-Topics, Heartbeats, Remediation-Hooks.
// Pro Use-Case eine eigene Komponente, die diese Logik wiederverwendet.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type {
  ApiClient,
  HeartbeatDto,
  MqttTopicDto,
  RemediationHookDto,
} from "../api-client.js";

const sharedStyles = css`
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 1.2em;
  }
  .hint {
    margin: 4px 0 0 0;
    font-size: 0.9em;
    color: var(--secondary-text-color, #666);
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    background: var(--card-background-color, white);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 8px;
    padding: 12px;
  }
  .add > input,
  .add > select {
    flex: 1;
    min-width: 140px;
    padding: 6px 10px;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 4px;
    font: inherit;
    background: var(--card-background-color, white);
    color: var(--primary-text-color, #222);
  }
  label.inline {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85em;
  }
  button {
    padding: 6px 12px;
    border: 1px solid var(--divider-color, #ccc);
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    font: inherit;
    font-size: 0.85em;
  }
  button:hover {
    background: var(--secondary-background-color, #f3f3f3);
  }
  button.primary {
    background: var(--primary-color, #03a9f4);
    color: white;
    border-color: var(--primary-color, #03a9f4);
  }
  button.danger {
    color: var(--error-color, #db4437);
    border-color: var(--error-color, #db4437);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--card-background-color, white);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 8px;
    overflow: hidden;
  }
  th,
  td {
    text-align: left;
    padding: 6px 12px;
    border-bottom: 1px solid var(--divider-color, #eee);
    font-size: 0.9em;
  }
  th {
    background: var(--secondary-background-color, #f3f3f3);
    font-size: 0.78em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--secondary-text-color, #666);
  }
  td.actions {
    text-align: right;
    white-space: nowrap;
  }
  .muted {
    color: var(--secondary-text-color, #888);
  }
  .ok {
    color: var(--success-color, #4caf50);
  }
  .alert {
    color: var(--warning-color, #ff9800);
    font-weight: 600;
  }
  code {
    font-family: var(--ha-font-family-code, monospace);
    font-size: 0.85em;
    background: var(--secondary-background-color, #f5f5f5);
    padding: 1px 5px;
    border-radius: 3px;
  }
  .empty {
    padding: 24px;
    text-align: center;
    background: var(--card-background-color, white);
    border: 1px dashed var(--divider-color, #ccc);
    border-radius: 8px;
    color: var(--secondary-text-color, #666);
  }
`;

@customElement("mqtt-topics-view")
export class MqttTopicsView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;
  @state() private _items: MqttTopicDto[] = [];
  @state() private _newPattern = "";
  @state() private _newSource = "";
  @state() private _newSeverity: "debug" | "info" | "warning" | "error" = "info";
  // F-002: Edit-State pro Zeile.
  @state() private _editId: number | null = null;
  @state() private _editDraft: MqttTopicDto | null = null;

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._items = await this.api.listMqttTopics();
  }

  private async _add(): Promise<void> {
    if (!this.api || !this._newPattern.trim() || !this._newSource.trim()) return;
    await this.api.createMqttTopic({
      topic_pattern: this._newPattern.trim(),
      source: this._newSource.trim(),
      severity: this._newSeverity,
      enabled: true,
    });
    this._newPattern = "";
    this._newSource = "";
    await this._load();
  }

  private async _delete(it: MqttTopicDto): Promise<void> {
    if (!this.api || it.id == null) return;
    if (!window.confirm(`Subscription '${it.topic_pattern}' löschen?`)) return;
    await this.api.deleteMqttTopic(it.id);
    await this._load();
  }

  // F-002: Edit-Modus aktivieren — Draft mit aktuellem Item befuellen.
  private _startEdit(it: MqttTopicDto): void {
    if (it.id == null) return;
    this._editId = it.id;
    this._editDraft = { ...it };
  }

  private _cancelEdit(): void {
    this._editId = null;
    this._editDraft = null;
  }

  private async _saveEdit(): Promise<void> {
    if (!this.api || this._editId == null || !this._editDraft) return;
    const d = this._editDraft;
    if (!d.topic_pattern.trim() || !d.source.trim()) return;
    await this.api.updateMqttTopic(this._editId, {
      topic_pattern: d.topic_pattern.trim(),
      source: d.source.trim(),
      severity: d.severity,
      enabled: d.enabled,
    });
    this._cancelEdit();
    await this._load();
  }

  private _patchDraft(patch: Partial<MqttTopicDto>): void {
    if (!this._editDraft) return;
    this._editDraft = { ...this._editDraft, ...patch };
  }

  override render(): TemplateResult {
    return html`
      <section>
        <header>
          <h2>MQTT-Topic-Subscriptions</h2>
          <p class="hint">
            Wildcards <code>+</code> (ein Segment) und <code>#</code>
            (Subtree) werden direkt von HA-MQTT aufgelöst. Subscriptions
            werden nach Restart neu gesetzt.
          </p>
        </header>

        <div class="add">
          <input
            placeholder="Topic-Pattern (z. B. zigbee2mqtt/+/availability)"
            .value=${this._newPattern}
            @input=${(e: InputEvent) =>
              (this._newPattern = (e.target as HTMLInputElement).value)}
          />
          <input
            placeholder="Source (z. B. zigbee.health)"
            .value=${this._newSource}
            @input=${(e: InputEvent) =>
              (this._newSource = (e.target as HTMLInputElement).value)}
          />
          <select
            .value=${this._newSeverity}
            @change=${(e: Event) => {
              this._newSeverity = (e.target as HTMLSelectElement).value as
                | "debug"
                | "info"
                | "warning"
                | "error";
            }}
          >
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
          </select>
          <button class="primary" @click=${this._add}>+ Hinzufügen</button>
        </div>

        ${this._items.length === 0
          ? html`<p class="empty">Noch keine Topics abonniert.</p>`
          : html`<table>
              <thead>
                <tr>
                  <th>Topic-Pattern</th>
                  <th>Source</th>
                  <th>Severity</th>
                  <th>Aktiv</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._items.map((it) => this._renderRow(it))}
              </tbody>
            </table>`}
      </section>
    `;
  }

  private _renderRow(it: MqttTopicDto): TemplateResult {
    const isEditing = it.id != null && it.id === this._editId && this._editDraft;
    if (isEditing) {
      const d = this._editDraft!;
      return html`<tr>
        <td>
          <input
            .value=${d.topic_pattern}
            @input=${(e: InputEvent) =>
              this._patchDraft({ topic_pattern: (e.target as HTMLInputElement).value })}
          />
        </td>
        <td>
          <input
            .value=${d.source}
            @input=${(e: InputEvent) =>
              this._patchDraft({ source: (e.target as HTMLInputElement).value })}
          />
        </td>
        <td>
          <select
            .value=${d.severity}
            @change=${(e: Event) =>
              this._patchDraft({
                severity: (e.target as HTMLSelectElement).value as
                  | "debug"
                  | "info"
                  | "warning"
                  | "error",
              })}
          >
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
          </select>
        </td>
        <td>
          <input
            type="checkbox"
            .checked=${d.enabled}
            @change=${(e: Event) =>
              this._patchDraft({ enabled: (e.target as HTMLInputElement).checked })}
          />
        </td>
        <td class="actions">
          <button class="primary" @click=${() => void this._saveEdit()}>Speichern</button>
          <button @click=${() => this._cancelEdit()}>Abbrechen</button>
        </td>
      </tr>`;
    }
    return html`<tr>
      <td><code>${it.topic_pattern}</code></td>
      <td>${it.source}</td>
      <td>${it.severity}</td>
      <td>${it.enabled ? "✓" : "—"}</td>
      <td class="actions">
        <button @click=${() => this._startEdit(it)}>Bearbeiten</button>
        <button class="danger" @click=${() => void this._delete(it)}>Löschen</button>
      </td>
    </tr>`;
  }
  static override styles = sharedStyles;
}

@customElement("heartbeats-view")
export class HeartbeatsView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;
  @state() private _items: HeartbeatDto[] = [];
  @state() private _newSource = "";
  @state() private _newInterval = 3600;

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._items = await this.api.listHeartbeats();
  }

  private async _add(): Promise<void> {
    if (!this.api || !this._newSource.trim()) return;
    await this.api.upsertHeartbeat(this._newSource.trim(), this._newInterval);
    this._newSource = "";
    await this._load();
  }

  // F-005: Loescht eine Source — destruktiv, daher Confirm-Dialog.
  private async _delete(it: HeartbeatDto): Promise<void> {
    if (!this.api) return;
    if (!window.confirm(`Heartbeat '${it.source}' loeschen?`)) return;
    await this.api.deleteHeartbeat(it.source);
    await this._load();
  }

  // F-005: Pause/Aktivieren — non-destruktiv, kein Confirm.
  private async _toggleEnabled(it: HeartbeatDto): Promise<void> {
    if (!this.api) return;
    await this.api.setHeartbeatEnabled(it.source, !it.enabled);
    await this._load();
  }

  override render(): TemplateResult {
    return html`
      <section>
        <header>
          <h2>Heartbeat-Quellen</h2>
          <p class="hint">
            Der Heartbeat-Job prüft alle 60 s. Wenn <code>last_seen + 1.5 ×
            interval</code> überschritten ist, generiert er eine Warning mit
            Source <code>messagehub.heartbeat</code>. Der Status reset sich,
            wenn die Quelle wieder sendet.
          </p>
        </header>
        <div class="add">
          <input
            placeholder="Source (z. B. raspi-keller)"
            .value=${this._newSource}
            @input=${(e: InputEvent) =>
              (this._newSource = (e.target as HTMLInputElement).value)}
          />
          <input
            type="number"
            min="60"
            placeholder="Intervall (Sek)"
            .value=${String(this._newInterval)}
            @input=${(e: InputEvent) =>
              (this._newInterval = +(e.target as HTMLInputElement).value)}
          />
          <button class="primary" @click=${this._add}>+ Hinzufügen</button>
        </div>
        ${this._items.length === 0
          ? html`<p class="empty">Noch keine Heartbeat-Quellen.</p>`
          : html`<table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Intervall (s)</th>
                  <th>Letzte Sichtung</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._items.map(
                  (it) => html`<tr>
                    <td><code>${it.source}</code></td>
                    <td>${it.expected_interval_seconds}</td>
                    <td>${it.last_seen ?? html`<span class="muted">—</span>`}</td>
                    <td>
                      ${!it.enabled
                        ? html`<span class="muted">paused</span>`
                        : it.silent_alert_active
                          ? html`<span class="alert">⚠ silent</span>`
                          : html`<span class="ok">✓ ok</span>`}
                    </td>
                    <td class="actions">
                      <button @click=${() => void this._toggleEnabled(it)}>
                        ${it.enabled ? "Pause" : "Aktivieren"}
                      </button>
                      <button class="danger" @click=${() => void this._delete(it)}>
                        Löschen
                      </button>
                    </td>
                  </tr>`
                )}
              </tbody>
            </table>`}
      </section>
    `;
  }
  static override styles = sharedStyles;
}

@customElement("remediation-view")
export class RemediationView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;
  @state() private _items: RemediationHookDto[] = [];
  @state() private _newName = "";
  @state() private _newSource = "";
  @state() private _newAutomation = "";
  @state() private _newAuto = false;

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._items = await this.api.listRemediationHooks();
  }

  private async _add(): Promise<void> {
    if (!this.api) return;
    await this.api.createRemediationHook({
      name: this._newName.trim(),
      source_pattern: this._newSource.trim(),
      automation_id: this._newAutomation.trim(),
      confirm_required: !this._newAuto,
      enabled: true,
    });
    this._newName = "";
    this._newSource = "";
    this._newAutomation = "";
    await this._load();
  }

  private async _delete(it: RemediationHookDto): Promise<void> {
    if (!this.api || it.id == null) return;
    if (!window.confirm(`Hook '${it.name}' löschen?`)) return;
    await this.api.deleteRemediationHook(it.id);
    await this._load();
  }

  override render(): TemplateResult {
    return html`
      <section>
        <header>
          <h2>Auto-Remediation</h2>
          <p class="hint">
            Wenn eine Source-Pattern matcht (auch SQL-Wildcard <code>%</code>),
            ruft messagehub die <code>script.</code>- oder
            <code>automation.</code>-Entity auf. Modus
            <strong>Vorschlag</strong>: nur Log-Eintrag.
            <strong>Auto</strong>: direkter Service-Call. Audit-Eintrag pro
            Ausfuehrung.
          </p>
        </header>
        <div class="add">
          <input
            placeholder="Name (z. B. AP-Restart)"
            .value=${this._newName}
            @input=${(e: InputEvent) =>
              (this._newName = (e.target as HTMLInputElement).value)}
          />
          <input
            placeholder="Source-Pattern (% erlaubt)"
            .value=${this._newSource}
            @input=${(e: InputEvent) =>
              (this._newSource = (e.target as HTMLInputElement).value)}
          />
          <input
            placeholder="automation.foo / script.bar"
            .value=${this._newAutomation}
            @input=${(e: InputEvent) =>
              (this._newAutomation = (e.target as HTMLInputElement).value)}
          />
          <label class="inline">
            <input
              type="checkbox"
              .checked=${this._newAuto}
              @change=${(e: Event) =>
                (this._newAuto = (e.target as HTMLInputElement).checked)}
            />
            <span>Auto</span>
          </label>
          <button class="primary" @click=${this._add}>+ Hinzufügen</button>
        </div>
        ${this._items.length === 0
          ? html`<p class="empty">Noch keine Hooks.</p>`
          : html`<table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Source-Pattern</th>
                  <th>Automation</th>
                  <th>Modus</th>
                  <th>Aktiv</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._items.map(
                  (it) => html`<tr>
                    <td>${it.name}</td>
                    <td><code>${it.source_pattern}</code></td>
                    <td><code>${it.automation_id}</code></td>
                    <td>
                      ${it.confirm_required
                        ? html`<span class="muted">Vorschlag</span>`
                        : html`<span class="alert">Auto</span>`}
                    </td>
                    <td>${it.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button class="danger" @click=${() => void this._delete(it)}>
                        Löschen
                      </button>
                    </td>
                  </tr>`
                )}
              </tbody>
            </table>`}
      </section>
    `;
  }
  static override styles = sharedStyles;
}

