// Iter 30/31: Notification-Channels (Telegram/Pushover/ntfy/Signal/notify).

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type { ApiClient, ChannelDto } from "../api-client.js";

const TYPES = ["telegram", "pushover", "ntfy", "signal", "notify"] as const;
const SEVS = ["debug", "info", "warning", "error"] as const;

@customElement("channels-view")
export class ChannelsView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;
  @state() private _items: ChannelDto[] = [];
  @state() private _editing: ChannelDto | null = null;
  @state() private _toast = "";

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._items = await this.api.listChannels();
  }

  private _new(): void {
    this._editing = {
      id: null,
      name: "",
      channel_type: "notify",
      enabled: true,
      severity_threshold: "warning",
      quiet_start: null,
      quiet_end: null,
      quiet_bypass_error: true,
      throttle_seconds: 600,
      config: { service: "" },
    };
  }

  private _edit(item: ChannelDto): void {
    this._editing = { ...item };
  }

  private async _save(): Promise<void> {
    if (!this.api || !this._editing) return;
    try {
      if (this._editing.id == null) {
        await this.api.createChannel(this._editing);
      } else {
        await this.api.updateChannel(this._editing.id, this._editing);
      }
      this._editing = null;
      this._toast = "gespeichert";
      await this._load();
    } catch (err) {
      this._toast = (err as Error).message;
    }
    window.setTimeout(() => (this._toast = ""), 2400);
  }

  private async _delete(item: ChannelDto): Promise<void> {
    if (!this.api || item.id == null) return;
    if (!window.confirm(`Channel '${item.name}' löschen?`)) return;
    await this.api.deleteChannel(item.id);
    await this._load();
  }

  private _renderTypeFields(
    e: ChannelDto,
    u: (p: Partial<ChannelDto>) => void
  ): TemplateResult {
    const cfg = e.config ?? {};
    const setCfg = (k: string, v: string): void => {
      u({ config: { ...cfg, [k]: v } });
    };
    if (e.channel_type === "telegram") {
      return html`
        <div class="row-2">
          <label>
            <span>Bot-Token</span>
            <input
              type="password"
              placeholder="123456:ABC..."
              .value=${(cfg.bot_token as string) ?? ""}
              @input=${(ev: InputEvent) =>
                setCfg("bot_token", (ev.target as HTMLInputElement).value)}
            />
            <small>Vom @BotFather erhalten.</small>
          </label>
          <label>
            <span>Chat-ID</span>
            <input
              placeholder="-100123456789 oder 12345678"
              .value=${(cfg.chat_id as string) ?? ""}
              @input=${(ev: InputEvent) =>
                setCfg("chat_id", (ev.target as HTMLInputElement).value)}
            />
            <small>An @userinfobot eine Nachricht senden, dort steht die ID.</small>
          </label>
        </div>
      `;
    }
    if (e.channel_type === "pushover") {
      return html`
        <div class="row-2">
          <label>
            <span>App-Token</span>
            <input
              type="password"
              placeholder="azGDORePK8gMaC0QOYAMyEEuzJnyUi"
              .value=${(cfg.app_token as string) ?? ""}
              @input=${(ev: InputEvent) =>
                setCfg("app_token", (ev.target as HTMLInputElement).value)}
            />
          </label>
          <label>
            <span>User-Key</span>
            <input
              .value=${(cfg.user_key as string) ?? ""}
              @input=${(ev: InputEvent) =>
                setCfg("user_key", (ev.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        <label>
          <span>Gerät (optional)</span>
          <input
            placeholder="iphone, oder leer = alle Geräte"
            .value=${(cfg.device as string) ?? ""}
            @input=${(ev: InputEvent) =>
              setCfg("device", (ev.target as HTMLInputElement).value)}
          />
        </label>
      `;
    }
    if (e.channel_type === "ntfy") {
      return html`
        <div class="row-2">
          <label>
            <span>Server (Default ntfy.sh)</span>
            <input
              placeholder="https://ntfy.sh"
              .value=${(cfg.base_url as string) ?? ""}
              @input=${(ev: InputEvent) =>
                setCfg("base_url", (ev.target as HTMLInputElement).value)}
            />
          </label>
          <label>
            <span>Topic</span>
            <input
              placeholder="ha_alerts_dein_topic"
              .value=${(cfg.topic as string) ?? ""}
              @input=${(ev: InputEvent) =>
                setCfg("topic", (ev.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        <label>
          <span>Auth-Token (optional, für geschützte Server)</span>
          <input
            type="password"
            .value=${(cfg.token as string) ?? ""}
            @input=${(ev: InputEvent) =>
              setCfg("token", (ev.target as HTMLInputElement).value)}
          />
        </label>
      `;
    }
    return html`
      <label>
        <span>Notify-Service-Name (ohne <code>notify.</code>)</span>
        <input
          placeholder="z. B. mobile_app_iphone, signal_messenger"
          .value=${(cfg.service as string) ?? ""}
          @input=${(ev: InputEvent) =>
            setCfg("service", (ev.target as HTMLInputElement).value)}
        />
      </label>
    `;
  }

  private _renderEditor(): TemplateResult {
    const e = this._editing!;
    const u = (p: Partial<ChannelDto>): void => {
      this._editing = { ...e, ...p };
    };
    return html`
      <div class="modal-bg" @click=${() => (this._editing = null)}>
        <div class="modal" @click=${(ev: Event) => ev.stopPropagation()}>
          <h3>${e.id == null ? "Neuen Channel anlegen" : `${e.name} bearbeiten`}</h3>
          <label
            ><span>Name</span
            ><input
              .value=${e.name}
              @input=${(ev: InputEvent) =>
                u({ name: (ev.target as HTMLInputElement).value })}
          /></label>
          <label>
            <span>Typ</span>
            <select
              .value=${e.channel_type}
              @change=${(ev: Event) => {
                const v = (ev.target as HTMLSelectElement).value as
                  | "telegram"
                  | "pushover"
                  | "ntfy"
                  | "signal"
                  | "notify";
                u({ channel_type: v, config: {} });
              }}
            >
              ${TYPES.map((t) => html`<option value=${t}>${t}</option>`)}
            </select>
            <small>
              ${e.channel_type === "telegram"
                ? "Direkt an Telegram-Bot-API. Bot-Token + Chat-ID unten."
                : e.channel_type === "pushover"
                  ? "Direkt an Pushover-API. App-Token + User-Key unten."
                  : e.channel_type === "ntfy"
                    ? "Direkt an ntfy-Server (ntfy.sh oder selbst-gehostet)."
                    : e.channel_type === "signal"
                      ? "Ueber HA-Service notify.<service>. Trag Namen unten ein."
                      : "Ueber HA-Service notify.<service>."}
            </small>
          </label>

          ${this._renderTypeFields(e, u)}

          <div class="row-2">
            <label>
              <span>Severity-Schwelle</span>
              <select
                .value=${e.severity_threshold}
                @change=${(ev: Event) => {
                  const v = (ev.target as HTMLSelectElement).value as
                    | "debug"
                    | "info"
                    | "warning"
                    | "error";
                  u({ severity_threshold: v });
                }}
              >
                ${SEVS.map((s) => html`<option value=${s}>${s}</option>`)}
              </select>
            </label>
            <label>
              <span>Throttle (Sek. pro Source)</span>
              <input
                type="number"
                min="0"
                .value=${String(e.throttle_seconds)}
                @input=${(ev: InputEvent) =>
                  u({ throttle_seconds: +(ev.target as HTMLInputElement).value })}
              />
            </label>
          </div>

          <div class="row-2">
            <label>
              <span>Quiet Hours Start (HH:MM)</span>
              <input
                placeholder="22:00"
                .value=${e.quiet_start ?? ""}
                @input=${(ev: InputEvent) =>
                  u({ quiet_start: (ev.target as HTMLInputElement).value || null })}
              />
            </label>
            <label>
              <span>Quiet Hours Ende (HH:MM)</span>
              <input
                placeholder="07:00"
                .value=${e.quiet_end ?? ""}
                @input=${(ev: InputEvent) =>
                  u({ quiet_end: (ev.target as HTMLInputElement).value || null })}
              />
            </label>
          </div>

          <label class="checkbox">
            <input
              type="checkbox"
              .checked=${e.quiet_bypass_error}
              @change=${(ev: Event) =>
                u({ quiet_bypass_error: (ev.target as HTMLInputElement).checked })}
            /><span>Errors umgehen Quiet Hours</span>
          </label>
          <label class="checkbox">
            <input
              type="checkbox"
              .checked=${e.enabled}
              @change=${(ev: Event) =>
                u({ enabled: (ev.target as HTMLInputElement).checked })}
            /><span>aktiv</span>
          </label>

          <div class="actions">
            <button @click=${() => (this._editing = null)}>Abbrechen</button>
            <button class="primary" @click=${() => void this._save()}>Speichern</button>
          </div>
        </div>
      </div>
    `;
  }

  override render(): TemplateResult {
    return html`
      <section>
        <header>
          <div>
            <h2>Notification-Channels</h2>
            <p class="hint">
              Pro Nachricht oberhalb der Severity-Schwelle wird
              <code>notify.&lt;service&gt;</code> aufgerufen. Quiet Hours +
              Throttling pro Source verhindern Spam.
            </p>
          </div>
          <button class="primary" @click=${this._new}>+ Channel</button>
        </header>
        ${this._items.length === 0
          ? html`<p class="empty">Noch kein Channel angelegt.</p>`
          : html`<table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Typ / Service</th>
                  <th>Schwelle</th>
                  <th>Quiet</th>
                  <th>Throttle</th>
                  <th>Aktiv</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._items.map(
                  (it) => html`<tr>
                    <td>${it.name}</td>
                    <td>
                      <code>${it.channel_type}</code>
                      ${it.channel_type === "telegram"
                        ? html` → <small>${it.config?.chat_id ?? "?"}</small>`
                        : it.channel_type === "pushover"
                          ? html` → <small>${(it.config?.user_key as string)?.slice(0, 8) ?? "?"}…</small>`
                          : it.channel_type === "ntfy"
                            ? html` → <small>${it.config?.topic ?? "?"}</small>`
                            : it.config?.service
                              ? html` → <code>notify.${it.config.service}</code>`
                              : html`<span class="muted">— unkonfiguriert</span>`}
                    </td>
                    <td>${it.severity_threshold}</td>
                    <td>
                      ${it.quiet_start && it.quiet_end
                        ? html`${it.quiet_start}–${it.quiet_end}${it.quiet_bypass_error
                            ? html` <small>(Err bypass)</small>`
                            : ""}`
                        : html`<span class="muted">—</span>`}
                    </td>
                    <td>${it.throttle_seconds}s</td>
                    <td>${it.enabled ? "✓" : "—"}</td>
                    <td class="actions">
                      <button @click=${() => this._edit(it)}>Edit</button>
                      <button class="danger" @click=${() => void this._delete(it)}>
                        Löschen
                      </button>
                    </td>
                  </tr>`
                )}
              </tbody>
            </table>`}
        ${this._editing ? this._renderEditor() : null}
        ${this._toast ? html`<div class="toast">${this._toast}</div>` : null}
      </section>
    `;
  }

  static override styles = css`
    section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
    }
    h2 {
      margin: 0;
      font-size: 1.2em;
    }
    h3 {
      margin: 0;
    }
    .hint {
      margin: 4px 0 0 0;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
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
    td.actions button + button {
      margin-left: 4px;
    }
    .muted {
      color: var(--secondary-text-color, #888);
      font-size: 0.85em;
    }
    .empty {
      padding: 24px;
      text-align: center;
      background: var(--card-background-color, white);
      border: 1px dashed var(--divider-color, #ccc);
      border-radius: 8px;
      color: var(--secondary-text-color, #666);
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.85em;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 5px;
      border-radius: 3px;
    }
    .modal-bg {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 60;
    }
    .modal {
      background: var(--card-background-color, white);
      border-radius: 8px;
      padding: 20px;
      width: min(560px, 92vw);
      max-height: 90vh;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
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
    label.checkbox {
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    input,
    select {
      padding: 8px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font: inherit;
      background: var(--card-background-color, white);
      color: var(--primary-text-color, #222);
    }
    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .row-2 {
        grid-template-columns: 1fr;
      }
    }
    small {
      font-size: 0.78em;
      color: var(--secondary-text-color, #888);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary-text-color, #222);
      color: var(--primary-background-color, white);
      padding: 10px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      font-size: 0.9em;
      z-index: 100;
    }
  `;
}
