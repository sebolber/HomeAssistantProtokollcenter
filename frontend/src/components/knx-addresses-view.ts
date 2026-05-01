// Iter 48 (UI-Variante, erweitert): KNX-Adressen mit Logging-Whitelist.
// Pro GA: an/aus, Severity (auto fuer Boolean: True->severity_on_true,
// False->severity_on_false). Nur GAs mit log_enabled=1 landen aus dem
// Bus-Eventbus im Protokoll.

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ApiClient, KnxAddressDto } from "../api-client.js";

const GA_PATTERN = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/;
const SEVERITY_OPTIONS = ["debug", "info", "warning", "error"] as const;
const LOG_SEVERITY_OPTIONS = [...SEVERITY_OPTIONS, "auto"] as const;

@customElement("knx-addresses-view")
export class KnxAddressesView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: KnxAddressDto[] = [];
  @state() private _loading = false;
  @state() private _filter = "";
  @state() private _onlyEnabled = false;
  @state() private _newAddr = "";
  @state() private _newLabel = "";
  @state() private _newDpt = "";
  @state() private _discovery: Array<{ address: string; name: string; dpt: string | null }> = [];
  @state() private _discoveryStatus = "loading";
  @state() private _editing: KnxAddressDto | null = null;
  @state() private _toast = "";
  @state() private _error = "";

  override async firstUpdated(): Promise<void> {
    await this._load();
    await this._loadDiscovery();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    try {
      this._items = await this.api.listKnxAddresses();
    } finally {
      this._loading = false;
    }
  }

  private async _loadDiscovery(): Promise<void> {
    if (!this.api) return;
    try {
      const res = await this.api.discoverKnxFromProject();
      this._discovery = res.items;
      this._discoveryStatus = res.status;
    } catch (err) {
      this._discovery = [];
      this._discoveryStatus = `error: ${(err as Error).message}`;
    }
  }

  private _renderDiscoveryStatus(): TemplateResult | null {
    if (this._discoveryStatus === "ok" && this._discovery.length > 0) return null;
    const messages: Record<string, string> = {
      loading: "🔄 Lade KNX-Projekt-Daten…",
      no_knx_integration:
        "ℹ️ Keine KNX-Integration in HA gefunden. Lege erst die KNX-Integration unter " +
        "Einstellungen → Geräte & Dienste an, dann erscheinen die GAs hier automatisch.",
      no_project_loaded:
        "ℹ️ KNX-Integration ist da, aber kein ETS-Projekt hochgeladen. " +
        "Lade dein .knxproj in der KNX-Integration unter Konfigurieren → Projekt hoch.",
      project_empty:
        "ℹ️ ETS-Projekt enthält keine Gruppenadressen — pruefe den Export.",
    };
    const text = messages[this._discoveryStatus] ?? `Status: ${this._discoveryStatus}`;
    return html`<div class="discovery-status">${text}</div>`;
  }

  private _onAddressInput(e: InputEvent): void {
    const value = (e.target as HTMLInputElement).value;
    this._newAddr = value;
    // Wenn die Eingabe eine vollstaendige GA aus dem Projekt ist,
    // automatisch Label + DPT vorbefuellen, falls leer.
    const hit = this._discovery.find((d) => d.address === value);
    if (hit) {
      if (!this._newLabel.trim()) this._newLabel = hit.name;
      if (!this._newDpt.trim() && hit.dpt) this._newDpt = hit.dpt;
    }
  }

  private async _bulkImportFromProject(): Promise<void> {
    if (!this.api || this._discovery.length === 0) return;
    const existing = new Set(this._items.map((i) => i.address));
    const fresh = this._discovery.filter((d) => !existing.has(d.address));
    if (fresh.length === 0) {
      this._showToast("Alle Projekt-GAs sind bereits angelegt");
      return;
    }
    if (
      !window.confirm(
        `${fresh.length} fehlende Projekt-GAs anlegen? (Logging bleibt zunaechst aus, Severity-Mapping kannst du danach pro Adresse setzen.)`
      )
    ) {
      return;
    }
    let imported = 0;
    for (const d of fresh) {
      try {
        await this.api.upsertKnxAddress({
          address: d.address,
          label: d.name || d.address,
          dpt: d.dpt,
          log_enabled: false,
          log_severity: "info",
        });
        imported += 1;
      } catch {
        // einzelne Fehler ignorieren, weiter machen
      }
    }
    this._showToast(`${imported} aus ETS-Projekt uebernommen`);
    await this._load();
  }

  private async _add(): Promise<void> {
    this._error = "";
    if (!this.api) return;
    const addr = this._newAddr.trim();
    if (!GA_PATTERN.test(addr)) {
      this._error = "Bitte Format N/N/N (z. B. 1/2/3)";
      return;
    }
    if (!this._newLabel.trim()) {
      this._error = "Label darf nicht leer sein";
      return;
    }
    try {
      await this.api.upsertKnxAddress({
        address: addr,
        label: this._newLabel.trim(),
        dpt: this._newDpt.trim() || null,
        log_enabled: false,
        log_severity: "info",
      });
      this._newAddr = "";
      this._newLabel = "";
      this._newDpt = "";
      this._showToast(`${addr} gespeichert`);
      await this._load();
    } catch (err) {
      this._error = (err as Error).message;
    }
  }

  private async _toggleLog(item: KnxAddressDto): Promise<void> {
    if (!this.api) return;
    const target = !item.log_enabled;
    try {
      await this.api.upsertKnxAddress({
        ...item,
        log_enabled: target,
      });
      await this._load();
      // Verifizieren: Truthy-Vergleich, weil SQLite int 0/1 oder bool true/false liefern kann.
      const fresh = this._items.find((i) => i.address === item.address);
      const actuallyOn = Boolean(fresh?.log_enabled);
      if (fresh !== undefined && actuallyOn !== target) {
        this._showToast(
          `Backend hat log_enabled nicht gesetzt — Browser-Cache leeren ` +
            `(Cmd+Shift+R) und HA-Container neu starten`
        );
      } else {
        this._showToast(
          target
            ? `${item.address} im Protokoll aktiv`
            : `${item.address} aus Protokoll entfernt`
        );
      }
    } catch (err) {
      this._showToast((err as Error).message);
    }
  }

  private async _delete(addr: string): Promise<void> {
    if (!this.api) return;
    if (!window.confirm(`KNX-Adresse ${addr} loeschen?`)) return;
    try {
      await this.api.deleteKnxAddress(addr);
      this._showToast(`${addr} geloescht`);
      await this._load();
    } catch (err) {
      this._showToast((err as Error).message);
    }
  }

  private async _onCsvFile(e: Event): Promise<void> {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !this.api) return;
    const content = await file.text();
    try {
      const stats = await this.api.importKnxCsv(content);
      this._showToast(
        `Import: ${stats.imported} angelegt, ${stats.skipped} ueberlesen, ${stats.errors} Fehler`
      );
      await this._load();
    } catch (err) {
      this._showToast(`Import fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      (e.target as HTMLInputElement).value = "";
    }
  }

  private _toastTimer?: number;
  private _showToast(text: string): void {
    this._toast = text;
    if (this._toastTimer) window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = ""), 2800);
  }

  private _filtered(): KnxAddressDto[] {
    let items = this._items;
    if (this._onlyEnabled) items = items.filter((i) => Boolean(i.log_enabled));
    const f = this._filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter(
      (it) =>
        it.address.includes(f) ||
        it.label.toLowerCase().includes(f) ||
        (it.dpt ?? "").toLowerCase().includes(f)
    );
  }

  private _renderEditor(): TemplateResult | typeof nothing {
    if (!this._editing) return nothing;
    const e = this._editing;
    const update = (patch: Partial<KnxAddressDto>): void => {
      this._editing = { ...e, ...patch };
    };
    return html`
      <div class="modal-backdrop" @click=${() => (this._editing = null)}>
        <div class="modal" @click=${(ev: Event) => ev.stopPropagation()}>
          <h3>${e.address} bearbeiten</h3>
          <label>
            <span>Label</span>
            <input
              type="text"
              .value=${e.label}
              @input=${(ev: InputEvent) =>
                update({ label: (ev.target as HTMLInputElement).value })}
            />
          </label>
          <div class="row-2">
            <label>
              <span>DPT (z. B. 1.001, 5.001, 16.001)</span>
              <input
                type="text"
                .value=${e.dpt ?? ""}
                @input=${(ev: InputEvent) =>
                  update({ dpt: (ev.target as HTMLInputElement).value || null })}
              />
            </label>
            <label class="checkbox">
              <input
                type="checkbox"
                .checked=${e.log_enabled}
                @change=${(ev: Event) =>
                  update({ log_enabled: (ev.target as HTMLInputElement).checked })}
              />
              <span>Im Protokoll erfassen</span>
            </label>
          </div>

          ${e.log_enabled
            ? html`
                <label>
                  <span>Severity</span>
                  <select
                    .value=${e.log_severity}
                    @change=${(ev: Event) => {
                      const v = (ev.target as HTMLSelectElement).value as
                        | "debug"
                        | "info"
                        | "warning"
                        | "error"
                        | "auto";
                      update({ log_severity: v });
                    }}
                  >
                    ${LOG_SEVERITY_OPTIONS.map(
                      (s) => html`<option value=${s}>${s}</option>`
                    )}
                  </select>
                  <small>
                    <code>auto</code> nutzt fuer Boolean-DPTs (1.x) die
                    Severity-Map unten — z. B. fuer Stoer-Bits, die bei
                    <code>True</code> einen Fehler bedeuten.
                  </small>
                </label>
                ${e.log_severity === "auto"
                  ? html`<div class="row-2">
                      <label>
                        <span>Severity bei <code>True</code></span>
                        <select
                          .value=${e.severity_on_true ?? "warning"}
                          @change=${(ev: Event) =>
                            update({
                              severity_on_true: (ev.target as HTMLSelectElement).value,
                            })}
                        >
                          ${SEVERITY_OPTIONS.map(
                            (s) => html`<option value=${s}>${s}</option>`
                          )}
                        </select>
                      </label>
                      <label>
                        <span>Severity bei <code>False</code></span>
                        <select
                          .value=${e.severity_on_false ?? "info"}
                          @change=${(ev: Event) =>
                            update({
                              severity_on_false: (ev.target as HTMLSelectElement).value,
                            })}
                        >
                          ${SEVERITY_OPTIONS.map(
                            (s) => html`<option value=${s}>${s}</option>`
                          )}
                        </select>
                      </label>
                    </div>`
                  : nothing}
              `
            : nothing}

          <div class="modal-actions">
            <button @click=${() => (this._editing = null)}>Abbrechen</button>
            <button class="primary" @click=${() => void this._saveEdit()}>
              Speichern
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private async _saveEdit(): Promise<void> {
    if (!this.api || !this._editing) return;
    try {
      await this.api.upsertKnxAddress({
        address: this._editing.address,
        label: this._editing.label,
        dpt: this._editing.dpt,
        description: this._editing.description,
        log_enabled: this._editing.log_enabled,
        log_severity: this._editing.log_severity,
        severity_on_true: this._editing.severity_on_true,
        severity_on_false: this._editing.severity_on_false,
      });
      this._showToast("gespeichert");
      this._editing = null;
      await this._load();
    } catch (err) {
      this._showToast((err as Error).message);
    }
  }

  override render(): TemplateResult {
    const items = this._filtered();
    const enabledCount = this._items.filter((i) => i.log_enabled).length;
    return html`
      <section>
        <header class="head">
          <div>
            <h2>KNX-Gruppenadressen</h2>
            <p class="hint">
              ${this._items.length} Adressen,
              <strong>${enabledCount} im Protokoll aktiv</strong>. Voraussetzung
              fuer die Bus-Erfassung: HA-KNX-Integration mit IP-Tunneling/Routing
              ist eingerichtet — sie feuert das Event <code>knx_event</code>, das
              wir gegen diese Whitelist matchen. Nicht-aktivierte GAs werden
              ignoriert.
            </p>
          </div>
          <div class="header-actions">
            ${this._discovery.length > 0
              ? html`<button
                  class="from-project"
                  title=${`${this._discovery.length} GAs aus dem in HA hinterlegten ETS-Projekt`}
                  @click=${() => void this._bulkImportFromProject()}
                >
                  ✨ ${this._discovery.length} aus HA-KNX-Projekt uebernehmen
                </button>`
              : null}
            <label class="csv-upload">
              <input type="file" accept=".csv,text/csv" @change=${this._onCsvFile} />
              <span>📂 ETS-CSV importieren</span>
            </label>
          </div>
        </header>

        <div class="add-form">
          <input
            type="text"
            list="knx-discovery-list"
            placeholder="${this._discovery.length > 0
              ? `GA aus Projekt waehlen (${this._discovery.length} verfuegbar)`
              : "GA (z. B. 1/2/3)"}"
            .value=${this._newAddr}
            @input=${this._onAddressInput}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._add();
            }}
          />
          <datalist id="knx-discovery-list">
            ${this._discovery.map(
              (d) =>
                html`<option value=${d.address}>
                  ${d.name}${d.dpt ? ` (DPT ${d.dpt})` : ""}
                </option>`
            )}
          </datalist>
          <input
            type="text"
            placeholder="Label (z. B. Stoerung Heizung Pumpe)"
            .value=${this._newLabel}
            @input=${(e: InputEvent) =>
              (this._newLabel = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._add();
            }}
          />
          <input
            type="text"
            class="narrow"
            placeholder="DPT (z. B. 1.001)"
            .value=${this._newDpt}
            @input=${(e: InputEvent) =>
              (this._newDpt = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._add();
            }}
          />
          <button class="primary" @click=${this._add}>+ Hinzufuegen</button>
        </div>
        ${this._discovery.length > 0
          ? html`<p class="hint">
              💡 Tipp: Beim Tippen in das GA-Feld erscheinen Vorschlaege aus dem
              ETS-Projekt — Label und DPT werden dann automatisch vorbefuellt.
            </p>`
          : null}
        ${this._renderDiscoveryStatus()}
        ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

        <div class="filter-bar">
          <input
            type="search"
            placeholder="Suche (GA / Label / DPT)…"
            .value=${this._filter}
            @input=${(e: InputEvent) =>
              (this._filter = (e.target as HTMLInputElement).value)}
          />
          <label class="toggle">
            <input
              type="checkbox"
              .checked=${this._onlyEnabled}
              @change=${(e: Event) =>
                (this._onlyEnabled = (e.target as HTMLInputElement).checked)}
            />
            <span>nur aktive</span>
          </label>
          <span class="muted">${items.length} sichtbar</span>
        </div>

        ${this._loading
          ? html`<p class="muted">lade…</p>`
          : items.length === 0
            ? html`<div class="empty">
                ${this._items.length === 0
                  ? html`<p>
                      Noch keine Adressen. Lege oben den ersten Eintrag an oder
                      importiere eine ETS-CSV.
                    </p>`
                  : this._onlyEnabled && enabledCount === 0
                    ? html`<p>
                          <strong>Keine Adresse ist im Protokoll aktiv.</strong>
                        </p>
                        <p>
                          So aktivierst du eine: in der Liste den
                          <strong>OFF</strong>-Knopf einer Adresse klicken (er
                          wird gruen <strong>✓ ON</strong>) — oder im
                          Edit-Dialog &bdquo;Im Protokoll erfassen&ldquo;
                          anhaken und speichern.
                        </p>
                        <p class="muted small">
                          Falls du gerade aktiviert hast und es trotzdem nicht
                          erscheint: <strong>Browser-Cache leeren</strong>
                          (Cmd+Shift+R) — sonst liegt evtl. der alte Bundle
                          mit dem API-Bug vom 2026-05-01 vor 21:14 vor.
                        </p>`
                    : html`<p>
                        Keine Treffer fuer aktuelle Filter
                        (${this._items.length} Adressen total,
                        ${enabledCount} davon aktiv).
                      </p>`}
              </div>`
            : html`
                <table>
                  <thead>
                    <tr>
                      <th>GA</th>
                      <th>Label</th>
                      <th>DPT</th>
                      <th>Severity</th>
                      <th class="col-toggle">📝 Loggen</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map(
                      (it) => html`
                        <tr class=${it.log_enabled ? "enabled" : ""}>
                          <td><code>${it.address}</code></td>
                          <td>${it.label}</td>
                          <td>${it.dpt ?? html`<span class="muted">—</span>`}</td>
                          <td>
                            ${it.log_enabled
                              ? html`<span class=${`sev sev-${it.log_severity}`}>
                                  ${it.log_severity}${it.log_severity === "auto"
                                    ? html`<small>
                                        T:${it.severity_on_true ?? "warning"}/F:${it.severity_on_false ??
                                        "info"}
                                      </small>`
                                    : nothing}
                                </span>`
                              : html`<span class="muted">—</span>`}
                          </td>
                          <td class="col-toggle">
                            <button
                              class=${`toggle-btn ${it.log_enabled ? "on" : "off"}`}
                              @click=${() => void this._toggleLog(it)}
                              title=${it.log_enabled
                                ? "Loggen deaktivieren"
                                : "Loggen aktivieren"}
                            >
                              ${it.log_enabled ? "✓ ON" : "OFF"}
                            </button>
                          </td>
                          <td class="actions">
                            <button @click=${() => (this._editing = it)}>Edit</button>
                            <button
                              class="danger"
                              @click=${() => void this._delete(it.address)}
                            >
                              Loeschen
                            </button>
                          </td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>
              `}

        ${this._renderEditor()}
        ${this._toast ? html`<div class="toast">${this._toast}</div>` : nothing}
      </section>
    `;
  }

  static override styles = css`
    section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    h2 {
      margin: 0;
      font-size: 1.2em;
    }
    h3 {
      margin: 0 0 8px 0;
    }
    .hint {
      margin: 4px 0 0 0;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .from-project {
      cursor: pointer;
      padding: 6px 12px;
      border: 1px solid var(--primary-color, #03a9f4);
      border-radius: 4px;
      font-size: 0.85em;
      background: var(--primary-color, #03a9f4);
      color: white;
    }
    .from-project:hover {
      filter: brightness(0.95);
    }
    .discovery-status {
      padding: 8px 12px;
      background: rgba(255, 235, 59, 0.12);
      border-left: 3px solid var(--warning-color, #ff9800);
      border-radius: 3px;
      font-size: 0.85em;
      color: var(--primary-text-color, #222);
      line-height: 1.5;
    }
    .csv-upload {
      cursor: pointer;
      padding: 6px 12px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font-size: 0.85em;
      background: var(--card-background-color, white);
    }
    .csv-upload input[type="file"] {
      display: none;
    }
    .csv-upload:hover {
      background: var(--secondary-background-color, #f3f3f3);
    }
    .add-form {
      display: grid;
      grid-template-columns: 130px 1fr 130px auto;
      gap: 8px;
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 12px;
    }
    @media (max-width: 720px) {
      .add-form {
        grid-template-columns: 1fr 1fr;
      }
    }
    input[type="text"],
    input[type="search"],
    select {
      padding: 8px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      font: inherit;
      background: var(--card-background-color, white);
      color: var(--primary-text-color, #222);
    }
    input.narrow {
      max-width: 130px;
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
    button.primary:hover {
      filter: brightness(0.9);
    }
    button.danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    button.toggle-btn {
      min-width: 56px;
      font-weight: 600;
    }
    button.toggle-btn.on {
      background: var(--success-color, #4caf50);
      color: white;
      border-color: var(--success-color, #4caf50);
    }
    button.toggle-btn.off {
      color: var(--secondary-text-color, #666);
    }
    .filter-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.9em;
      cursor: pointer;
    }
    .muted {
      color: var(--secondary-text-color, #888);
      font-size: 0.85em;
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
    .col-toggle {
      text-align: center;
    }
    td.actions {
      text-align: right;
      white-space: nowrap;
    }
    td.actions button + button {
      margin-left: 4px;
    }
    tr.enabled {
      background: rgba(76, 175, 80, 0.04);
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.9em;
    }
    .sev {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 8px;
      font-size: 0.78em;
      font-weight: 600;
      text-transform: uppercase;
    }
    .sev small {
      display: block;
      font-size: 0.85em;
      font-weight: 400;
      text-transform: none;
      opacity: 0.85;
    }
    .sev-debug {
      background: rgba(0, 0, 0, 0.06);
      color: var(--secondary-text-color, #666);
    }
    .sev-info {
      background: rgba(3, 169, 244, 0.12);
      color: var(--info-color, #03a9f4);
    }
    .sev-warning {
      background: rgba(255, 152, 0, 0.15);
      color: var(--warning-color, #ff9800);
    }
    .sev-error {
      background: rgba(219, 68, 55, 0.15);
      color: var(--error-color, #db4437);
    }
    .sev-auto {
      background: rgba(156, 39, 176, 0.12);
      color: #6a1b9a;
    }
    .empty {
      padding: 24px;
      text-align: center;
      color: var(--secondary-text-color, #666);
      background: var(--card-background-color, white);
      border: 1px dashed var(--divider-color, #ccc);
      border-radius: 8px;
    }
    .error {
      color: var(--error-color, #db4437);
      font-size: 0.9em;
      padding: 6px 8px;
      background: rgba(219, 68, 55, 0.08);
      border-left: 3px solid var(--error-color, #db4437);
      border-radius: 2px;
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
    .modal-backdrop {
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
      width: min(520px, 92vw);
      max-height: 90vh;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .modal label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
    }
    .modal label > span {
      font-weight: 500;
      color: var(--primary-text-color, #222);
    }
    .modal label.checkbox {
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    .modal small {
      font-size: 0.78em;
      color: var(--secondary-text-color, #888);
    }
    .modal small code {
      background: var(--secondary-background-color, #f5f5f5);
      padding: 1px 4px;
      border-radius: 3px;
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
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
  `;
}
