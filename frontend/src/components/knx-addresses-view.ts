// Iter 48 (UI-Variante): KNX-Gruppenadressen verwalten.
// Quick-Add-Form, Liste mit Edit/Delete, optional ETS-CSV-Bulk-Import.

import { LitElement, css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ApiClient } from "../api-client.js";

interface KnxRow {
  address: string;
  label: string;
  dpt: string | null;
  description: string | null;
}

const GA_PATTERN = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/;

@customElement("knx-addresses-view")
export class KnxAddressesView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: KnxRow[] = [];
  @state() private _loading = false;
  @state() private _filter = "";
  @state() private _newAddr = "";
  @state() private _newLabel = "";
  @state() private _newDpt = "";
  @state() private _editingAddr: string | null = null;
  @state() private _editLabel = "";
  @state() private _editDpt = "";
  @state() private _error = "";
  @state() private _toast = "";

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    try {
      this._items = (await this.api.listKnxAddresses()) as KnxRow[];
    } finally {
      this._loading = false;
    }
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

  private _startEdit(item: KnxRow): void {
    this._editingAddr = item.address;
    this._editLabel = item.label;
    this._editDpt = item.dpt ?? "";
  }

  private _cancelEdit(): void {
    this._editingAddr = null;
  }

  private async _saveEdit(addr: string): Promise<void> {
    if (!this.api) return;
    try {
      await this.api.upsertKnxAddress({
        address: addr,
        label: this._editLabel.trim(),
        dpt: this._editDpt.trim() || null,
      });
      this._editingAddr = null;
      this._showToast(`${addr} aktualisiert`);
      await this._load();
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

  private _filtered(): KnxRow[] {
    const f = this._filter.trim().toLowerCase();
    if (!f) return this._items;
    return this._items.filter(
      (it) =>
        it.address.includes(f) ||
        it.label.toLowerCase().includes(f) ||
        (it.dpt ?? "").toLowerCase().includes(f)
    );
  }

  override render(): TemplateResult {
    const items = this._filtered();
    return html`
      <section>
        <header class="head">
          <div>
            <h2>KNX-Gruppenadressen</h2>
            <p class="hint">
              Mapping ${this._items.length === 0 ? "noch leer" : `${this._items.length} Eintraege`}.
              Wird beim KNX-Webhook automatisch genutzt — Nachricht mit
              <code>source=knx-bus</code> und einer GA im Text bekommt
              <code>metadata.knx_label</code> ergaenzt.
            </p>
          </div>
          <label class="csv-upload">
            <input type="file" accept=".csv,text/csv" @change=${this._onCsvFile} />
            <span>📂 ETS-CSV importieren</span>
          </label>
        </header>

        <div class="add-form">
          <input
            type="text"
            placeholder="GA (z. B. 1/2/3)"
            .value=${this._newAddr}
            @input=${(e: InputEvent) =>
              (this._newAddr = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._add();
            }}
          />
          <input
            type="text"
            placeholder="Label (z. B. Wohnzimmer Deckenlicht)"
            .value=${this._newLabel}
            @input=${(e: InputEvent) =>
              (this._newLabel = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._add();
            }}
          />
          <input
            type="text"
            placeholder="DPT (optional, z. B. 1.001)"
            class="narrow"
            .value=${this._newDpt}
            @input=${(e: InputEvent) =>
              (this._newDpt = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._add();
            }}
          />
          <button class="primary" @click=${this._add}>+ Hinzufuegen</button>
        </div>
        ${this._error ? html`<div class="error">${this._error}</div>` : null}

        <div class="filter-bar">
          <input
            type="search"
            placeholder="Suche (GA / Label / DPT)…"
            .value=${this._filter}
            @input=${(e: InputEvent) =>
              (this._filter = (e.target as HTMLInputElement).value)}
          />
          <span class="muted">${items.length} sichtbar</span>
        </div>

        ${this._loading
          ? html`<p class="muted">lade…</p>`
          : items.length === 0
            ? html`<p class="empty">
                Keine Eintraege.${" "}${this._items.length === 0
                  ? html`Lege oben den ersten Eintrag an oder importiere eine ETS-CSV.`
                  : null}
              </p>`
            : html`
                <table>
                  <thead>
                    <tr>
                      <th>GA</th>
                      <th>Label</th>
                      <th>DPT</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((it) =>
                      this._editingAddr === it.address
                        ? html`
                            <tr class="editing">
                              <td><code>${it.address}</code></td>
                              <td>
                                <input
                                  .value=${this._editLabel}
                                  @input=${(e: InputEvent) =>
                                    (this._editLabel = (e.target as HTMLInputElement).value)}
                                />
                              </td>
                              <td>
                                <input
                                  class="narrow"
                                  .value=${this._editDpt}
                                  @input=${(e: InputEvent) =>
                                    (this._editDpt = (e.target as HTMLInputElement).value)}
                                />
                              </td>
                              <td class="actions">
                                <button
                                  class="primary"
                                  @click=${() => void this._saveEdit(it.address)}
                                >
                                  Speichern
                                </button>
                                <button @click=${this._cancelEdit}>Abbrechen</button>
                              </td>
                            </tr>
                          `
                        : html`
                            <tr>
                              <td><code>${it.address}</code></td>
                              <td>${it.label}</td>
                              <td>${it.dpt ?? html`<span class="muted">—</span>`}</td>
                              <td class="actions">
                                <button @click=${() => this._startEdit(it)}>Edit</button>
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
    .hint {
      margin: 4px 0 0 0;
      font-size: 0.9em;
      color: var(--secondary-text-color, #666);
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
    input[type="search"] {
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
    button.danger:hover {
      background: rgba(219, 68, 55, 0.08);
    }
    .filter-bar {
      display: flex;
      gap: 8px;
      align-items: center;
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
    td.actions {
      text-align: right;
      white-space: nowrap;
    }
    td.actions button + button {
      margin-left: 4px;
    }
    code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: 0.9em;
    }
    .editing {
      background: rgba(3, 169, 244, 0.05);
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
  `;
}
