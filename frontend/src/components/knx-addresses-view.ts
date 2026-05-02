// Iter 48 (UI-Variante, erweitert): KNX-Adressen mit Logging-Whitelist.
// Pro GA: an/aus, Severity (auto fuer Boolean: True->severity_on_true,
// False->severity_on_false). Nur GAs mit log_enabled=1 landen aus dem
// Bus-Eventbus im Protokoll.

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type { ApiClient, KnxAddressDto } from "../api-client.js";
import { tokens, buttons, forms, pills } from "../styles/tokens.js";

const GA_PATTERN = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/;
const SEVERITY_OPTIONS = ["debug", "info", "warning", "error"] as const;
const LOG_SEVERITY_OPTIONS = [...SEVERITY_OPTIONS, "auto"] as const;

// Iter 53: Default-Filter "nur aktive". Bei 3000+ GAs sieht der User
// sonst zuerst tausende inaktive Eintraege und muss scrollen, um
// seine 45 aktiven zu finden. Wahl wird in localStorage persistiert.
const STORAGE_KEY_ONLY_ENABLED = "messagehub.knx-addresses.only-enabled";

function loadOnlyEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ONLY_ENABLED);
    if (raw === null) return true; // Default beim ersten Aufruf
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

// Iter 53: ETS-Platzhalter-Eintraege (Label nur aus Strichen oder leer)
// als Noise filtern. Beispiele aus realen Projekten: "----------",
// "----", "----- ----- -----". Auch nuetzlich gegen versehentlich
// importierte Trenner-GAs.
const PLACEHOLDER_LABEL_RE = /^[\s\-_=]*$/;

// Iter 55: Pagination — bei 3593 GAs ist das DOM mit allen Rows traege.
// 200 Rows pro Page reichen visuell, "Mehr laden" haengt an.
const PAGE_SIZE = 200;

@customElement("knx-addresses-view")
export class KnxAddressesView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: KnxAddressDto[] = [];
  @state() private _loading = false;
  @state() private _filter = "";
  @state() private _onlyEnabled = loadOnlyEnabled();
  // Iter 53: Toggle, ob ETS-Platzhalter-GAs (Label nur Striche/leer)
  // angezeigt werden. Default: aus, weil sie meist Noise sind.
  @state() private _hidePlaceholders = true;
  // Iter 55: Wie viele der gefilterten Rows aktuell gerendert werden.
  // Wird auf PAGE_SIZE zurueckgesetzt, wenn sich Filter aendern.
  @state() private _displayedCount = PAGE_SIZE;
  // Iter 56b: Multi-Select fuer Bulk-Edit. Adressen-Strings statt
  // Indizes, damit die Auswahl beim Filter-Wechsel stabil bleibt.
  @state() private _selected: Set<string> = new Set();
  @state() private _bulkSeverityValue: string = "warning";
  @state() private _bulkActionRunning = false;
  @state() private _newAddr = "";
  @state() private _newLabel = "";
  @state() private _newDpt = "";
  @state() private _sevPopoverFor: string | null = null;
  @state() private _sevPopoverPos: { top: number; left: number } | null = null;
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

  // Iter 47 (N4): Smart-Sync statt Wipe-and-Replace.
  // Schritt 1: Backend rechnet den Plan (apply=false) — keine Mutation.
  // Schritt 2: User bekommt eine Zusammenfassung (add/update/delete/keep).
  // Schritt 3: Bei Bestaetigung wird der Plan angewendet (apply=true).
  // Bei "update" wird die User-Config zurueckgesetzt, bei "delete" wird
  // die Zeile entfernt — das wird im Confirm-Dialog explizit erklaert.
  private async _syncFromProject(): Promise<void> {
    if (!this.api || this._discovery.length === 0) return;
    let preview: Awaited<ReturnType<typeof this.api.syncKnxProject>>;
    try {
      preview = await this.api.syncKnxProject(this._discovery, false);
    } catch (err) {
      this._showToast((err as Error).message);
      return;
    }
    const counts = preview.counts as {
      add: number;
      update: number;
      delete: number;
      keep: number;
    };
    if (counts.add === 0 && counts.update === 0 && counts.delete === 0) {
      this._showToast("Projekt ist bereits synchron — nichts zu tun");
      return;
    }
    const summary =
      `Abgleich mit ETS-Projekt anwenden?\n\n` +
      `${counts.add} neue Eintraege anlegen\n` +
      `${counts.update} Eintraege aktualisieren ` +
      `(label/dpt geaendert -> Logging-Konfig wird zurueckgesetzt)\n` +
      `${counts.delete} Eintraege loeschen ` +
      `(in ETS nicht mehr vorhanden -> Lauschen wird beendet)\n` +
      `${counts.keep} unveraenderte Eintraege bleiben bestehen.`;
    if (!window.confirm(summary)) {
      return;
    }
    try {
      const applied = await this.api.syncKnxProject(this._discovery, true);
      const r = applied.counts as {
        added: number;
        updated: number;
        deleted: number;
      };
      this._showToast(
        `Synchronisiert: +${r.added} angelegt, ${r.updated} aktualisiert, ${r.deleted} geloescht`
      );
    } catch (err) {
      this._showToast(`Fehler beim Anwenden: ${(err as Error).message}`);
    }
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
        // Iter 44 (N2): Default-Severity Warning fuer neue Eintraege.
        log_severity: "warning",
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
    // Iter 54 (N2): beim Aktivieren explizit auf "warning" wechseln,
    // falls die GA noch den Legacy-Default "info" haelt. Wer eine
    // andere Severity bewusst gewaehlt hat (warning/error/auto/debug),
    // behaelt seine Wahl. Wer nur "info" stehen hat, hat sie meist
    // nie aktiv gewaehlt — dann gilt die User-Erwartung "wenn ich
    // aktiviere, ist Default Warning" auch hier.
    let nextSeverity = item.log_severity;
    if (target && (nextSeverity === "info" || !nextSeverity)) {
      nextSeverity = "warning";
    }
    try {
      await this.api.upsertKnxAddress({
        ...item,
        log_enabled: target,
        log_severity: nextSeverity,
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
    if (!window.confirm(`KNX-Adresse ${addr} löschen?`)) return;
    try {
      await this.api.deleteKnxAddress(addr);
      this._showToast(`${addr} gelöscht`);
      await this._load();
    } catch (err) {
      this._showToast((err as Error).message);
    }
  }

  private _closeSevPopover(): void {
    this._sevPopoverFor = null;
    this._sevPopoverPos = null;
  }

  private _onSeverityTrigger(e: Event, item: KnxAddressDto): void {
    e.stopPropagation();
    e.preventDefault();
    if (this._sevPopoverFor === item.address) {
      this._closeSevPopover();
      return;
    }
    const trigger = e.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    const POPOVER_HEIGHT_HINT = 220;
    const placeBelow = rect.bottom + POPOVER_HEIGHT_HINT < window.innerHeight;
    this._sevPopoverPos = {
      top: placeBelow ? rect.bottom + 4 : rect.top - POPOVER_HEIGHT_HINT - 4,
      left: rect.left,
    };
    this._sevPopoverFor = item.address;
  }

  private async _onSeverityPick(
    e: Event,
    item: KnxAddressDto,
    severity: "debug" | "info" | "warning" | "error" | "auto"
  ): Promise<void> {
    e.stopPropagation();
    this._closeSevPopover();
    if (severity === item.log_severity) return;
    if (!this.api) return;
    // "auto" benoetigt T/F-Severities — Default-Mapping setzen falls leer
    const patch: Partial<KnxAddressDto> & Pick<KnxAddressDto, "address"> = {
      address: item.address,
      log_severity: severity,
    };
    if (severity === "auto") {
      patch.severity_on_true = item.severity_on_true ?? "warning";
      patch.severity_on_false = item.severity_on_false ?? "info";
    }
    // Optimistic update
    const previous = item.log_severity;
    this._items = this._items.map((it) =>
      it.address === item.address
        ? {
            ...it,
            log_severity: severity,
            severity_on_true: patch.severity_on_true ?? it.severity_on_true,
            severity_on_false: patch.severity_on_false ?? it.severity_on_false,
          }
        : it
    );
    try {
      await this.api.upsertKnxAddress({ ...item, ...patch });
      this._showToast(`${item.address}: Severity ${previous} → ${severity}`);
    } catch (err) {
      // Rollback
      this._items = this._items.map((it) =>
        it.address === item.address ? { ...it, log_severity: previous } : it
      );
      this._showToast(`Fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  private _renderSevPopover(): TemplateResult | typeof nothing {
    if (this._sevPopoverFor === null || this._sevPopoverPos === null) return nothing;
    const item = this._items.find((it) => it.address === this._sevPopoverFor);
    if (!item) return nothing;
    const current = item.log_severity;
    return html`
      <div class="sev-backdrop" @click=${() => this._closeSevPopover()}></div>
      <div
        class="sev-popover"
        role="menu"
        style=${`top: ${this._sevPopoverPos.top}px; left: ${this._sevPopoverPos.left}px`}
        @click=${(e: Event) => e.stopPropagation()}
      >
        ${LOG_SEVERITY_OPTIONS.map(
          (opt) => html`<button
            role="menuitemradio"
            aria-checked=${opt === current}
            class=${`sev-option ${opt === current ? "active" : ""}`}
            @click=${(e: Event) => void this._onSeverityPick(e, item, opt)}
          >
            <span
              class=${`mh-pill mh-pill--${opt === "auto" ? "neutral" : opt}`}
            >${opt}</span>
            ${opt === current
              ? html`<span class="sev-check" aria-hidden="true">✓</span>`
              : nothing}
          </button>`
        )}
      </div>
    `;
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

  // Iter 56b: Bulk-Toolbar erscheint, sobald >=1 GA ausgewaehlt ist.
  // Drei Aktionen: Loggen an, Loggen aus, Severity setzen. Auswahl
  // wird nach Erfolg geleert; bei Fehlern bleibt sie damit der User
  // nochmal probieren kann.
  private _renderBulkToolbar(): TemplateResult {
    const count = this._selected.size;
    return html`
      <div class="bulk-toolbar" role="toolbar" aria-label="Bulk-Aktionen">
        <span class="bulk-toolbar__count">${count} ausgewaehlt</span>
        <button
          class="mh-btn mh-btn--sm"
          ?disabled=${this._bulkActionRunning}
          @click=${() => void this._bulkApply({ log_enabled: true })}
          title=${`${count} GAs zum Logging aktivieren`}
        >
          Loggen aktivieren
        </button>
        <button
          class="mh-btn mh-btn--sm"
          ?disabled=${this._bulkActionRunning}
          @click=${() => void this._bulkApply({ log_enabled: false })}
          title=${`${count} GAs vom Logging entfernen`}
        >
          Loggen deaktivieren
        </button>
        <label class="bulk-toolbar__sev">
          <span>Severity:</span>
          <select
            .value=${this._bulkSeverityValue}
            @change=${(e: Event) =>
              (this._bulkSeverityValue = (e.target as HTMLSelectElement).value)}
          >
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
            <option value="auto">auto (Bool-Mapping)</option>
          </select>
          <button
            class="mh-btn mh-btn--sm"
            ?disabled=${this._bulkActionRunning}
            @click=${() =>
              void this._bulkApply({ log_severity: this._bulkSeverityValue })}
          >
            Setzen
          </button>
        </label>
        <button
          class="mh-btn mh-btn--sm mh-btn--ghost"
          @click=${() => this._clearSelection()}
        >
          Auswahl aufheben
        </button>
      </div>
    `;
  }

  // Iter 56b: Multi-Select-Helfer. Auswahl wird bewusst NICHT beim
  // Filter-Wechsel zurueckgesetzt — wer "warm" 50 GAs ausgewaehlt hat
  // und dann sucht, kann die Auswahl behalten.
  private _toggleSelect(address: string): void {
    const next = new Set(this._selected);
    if (next.has(address)) next.delete(address);
    else next.add(address);
    this._selected = next;
  }

  private _toggleSelectAllVisible(visibleAddresses: string[]): void {
    const allSelected = visibleAddresses.every((a) => this._selected.has(a));
    const next = new Set(this._selected);
    if (allSelected) {
      for (const a of visibleAddresses) next.delete(a);
    } else {
      for (const a of visibleAddresses) next.add(a);
    }
    this._selected = next;
  }

  private _clearSelection(): void {
    this._selected = new Set();
  }

  private async _bulkApply(patch: {
    log_enabled?: boolean;
    log_severity?: string;
  }): Promise<void> {
    if (!this.api || this._selected.size === 0) return;
    if (this._bulkActionRunning) return;
    const addrs = Array.from(this._selected);
    this._bulkActionRunning = true;
    try {
      const result = await this.api.bulkPatchKnxAddresses(addrs, patch);
      this._showToast(
        `${result.updated} von ${result.address_count} GAs aktualisiert`
      );
      this._clearSelection();
      await this._load();
    } catch (err) {
      this._showToast(`Bulk-Edit fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      this._bulkActionRunning = false;
    }
  }

  private _filtered(): KnxAddressDto[] {
    let items = this._items;
    if (this._onlyEnabled) items = items.filter((i) => Boolean(i.log_enabled));
    if (this._hidePlaceholders) {
      // Iter 53: ETS-Platzhalter raus, ausser sie sind log_enabled
      // (User hat sie bewusst aktiv geschaltet — dann nicht filtern).
      items = items.filter(
        (i) => Boolean(i.log_enabled) || !PLACEHOLDER_LABEL_RE.test(i.label || "")
      );
    }
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
                    <code>auto</code> nutzt für Boolean-DPTs (1.x) die
                    Severity-Map unten — z. B. für Stör-Bits, die bei
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
            <button class="mh-btn" @click=${() => (this._editing = null)}>Abbrechen</button>
            <button class="mh-btn mh-btn--primary" @click=${() => void this._saveEdit()}>
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
    // Iter 55: Pagination — wir filtern alle Items, schneiden auf
    // _displayedCount fuer das Render-Slicing. So bleibt das DOM bei
    // 3593 GAs handhabbar (typisch nur 200 Rows im DOM).
    const allFiltered = this._filtered();
    const items = allFiltered.slice(0, this._displayedCount);
    const hasMore = allFiltered.length > items.length;
    const enabledCount = this._items.filter((i) => i.log_enabled).length;
    return html`
      <section>
        <header class="head">
          <div>
            <h2>KNX-Gruppenadressen</h2>
            <p class="hint">
              ${this._items.length} Adressen,
              <strong>${enabledCount} im Protokoll aktiv</strong>. Voraussetzung
              für die Bus-Erfassung: HA-KNX-Integration mit IP-Tunneling/Routing
              ist eingerichtet — sie feuert das Event <code>knx_event</code>, das
              wir gegen diese Whitelist matchen. Nicht-aktivierte GAs werden
              ignoriert.
            </p>
          </div>
          <div class="header-actions">
            ${this._discovery.length > 0
              ? html`<button
                  class="mh-btn"
                  title=${`Intelligenter Abgleich: ${this._discovery.length} GAs aus ETS — neue anlegen, geaenderte aktualisieren, fehlende loeschen, unveraenderte unangetastet`}
                  @click=${() => void this._syncFromProject()}
                >
                  Mit ETS-Projekt synchronisieren
                </button>`
              : null}
            <label class="mh-btn csv-upload">
              <input type="file" accept=".csv,text/csv" @change=${this._onCsvFile} />
              <span>📂 ETS-CSV importieren</span>
            </label>
          </div>
        </header>

        <div class="add-form">
          <input
            type="text"
            class="mh-input"
            list="knx-discovery-list"
            placeholder="${this._discovery.length > 0
              ? `GA aus Projekt wählen (${this._discovery.length} verfügbar)`
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
            class="mh-input"
            placeholder="Label (z. B. Störung Heizung Pumpe)"
            .value=${this._newLabel}
            @input=${(e: InputEvent) =>
              (this._newLabel = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._add();
            }}
          />
          <input
            type="text"
            class="mh-input narrow"
            placeholder="DPT (z. B. 1.001)"
            .value=${this._newDpt}
            @input=${(e: InputEvent) =>
              (this._newDpt = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._add();
            }}
          />
          <button class="mh-btn mh-btn--primary" @click=${this._add}>+ Hinzufügen</button>
        </div>
        ${this._discovery.length > 0
          ? html`<p class="hint">
              💡 Tipp: Beim Tippen in das GA-Feld erscheinen Vorschläge aus dem
              ETS-Projekt — Label und DPT werden dann automatisch vorbefüllt.
            </p>`
          : null}
        ${this._renderDiscoveryStatus()}
        ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

        <div class="filter-bar">
          <input
            type="search"
            class="mh-input"
            placeholder="Suche (GA / Label / DPT)…"
            .value=${this._filter}
            @input=${(e: InputEvent) => {
              this._filter = (e.target as HTMLInputElement).value;
              this._displayedCount = PAGE_SIZE;
            }}
          />
          <label class="toggle">
            <input
              type="checkbox"
              .checked=${this._onlyEnabled}
              @change=${(e: Event) => {
                this._onlyEnabled = (e.target as HTMLInputElement).checked;
                this._displayedCount = PAGE_SIZE;
                try {
                  localStorage.setItem(
                    STORAGE_KEY_ONLY_ENABLED,
                    this._onlyEnabled ? "1" : "0"
                  );
                } catch {
                  // localStorage nicht verfuegbar -> Wahl nur fuer diese Session
                }
              }}
            />
            <span>nur aktive</span>
          </label>
          <label class="toggle" title="ETS-Platzhalter ohne Label (z. B. '-----') ausblenden">
            <input
              type="checkbox"
              .checked=${this._hidePlaceholders}
              @change=${(e: Event) => {
                this._hidePlaceholders = (e.target as HTMLInputElement).checked;
                this._displayedCount = PAGE_SIZE;
              }}
            />
            <span>Platzhalter ausblenden</span>
          </label>
          <span class="muted">
            ${items.length} sichtbar${hasMore
              ? html` von ${allFiltered.length}`
              : nothing}
          </span>
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
                          <strong>Loggen-Switch</strong> einer Adresse umlegen
                          — oder im Edit-Dialog „Im Protokoll erfassen"
                          anhaken und speichern.
                        </p>
                        <p class="muted small">
                          Falls du gerade aktiviert hast und es trotzdem nicht
                          erscheint: <strong>Browser-Cache leeren</strong>
                          (Cmd+Shift+R) — sonst liegt evtl. der alte Bundle
                          mit dem API-Bug vom 2026-05-01 vor 21:14 vor.
                        </p>`
                    : html`<p>
                        Keine Treffer für aktuelle Filter
                        (${this._items.length} Adressen total,
                        ${enabledCount} davon aktiv).
                      </p>`}
              </div>`
            : html`
                ${this._selected.size > 0 ? this._renderBulkToolbar() : nothing}
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th class="col-select">
                          <input
                            type="checkbox"
                            aria-label="Alle sichtbaren auswaehlen"
                            .checked=${items.length > 0 &&
                            items.every((it) => this._selected.has(it.address))}
                            @change=${() =>
                              this._toggleSelectAllVisible(
                                items.map((it) => it.address)
                              )}
                          />
                        </th>
                        <th>GA</th>
                        <th>Label</th>
                        <th>DPT</th>
                        <th>Severity</th>
                        <th class="col-toggle">Loggen</th>
                        <th class="col-actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${items.map(
                        (it) => html`
                          <tr class=${it.log_enabled ? "enabled" : ""}>
                            <td class="col-select">
                              <input
                                type="checkbox"
                                aria-label=${`${it.address} auswaehlen`}
                                .checked=${this._selected.has(it.address)}
                                @change=${() => this._toggleSelect(it.address)}
                              />
                            </td>
                            <td><code class="ga">${it.address}</code></td>
                            <td class="label-cell">${it.label}</td>
                            <td>
                              ${it.dpt
                                ? html`<code class="dpt">${it.dpt}</code>`
                                : html`<span class="muted">—</span>`}
                            </td>
                            <td>
                              ${it.log_enabled
                                ? html`<button
                                    class=${`mh-pill mh-pill--${
                                      it.log_severity === "auto" ? "neutral" : it.log_severity
                                    } sev-trigger`}
                                    title="Severity ändern"
                                    aria-haspopup="menu"
                                    aria-expanded=${this._sevPopoverFor === it.address}
                                    @click=${(e: Event) => this._onSeverityTrigger(e, it)}
                                  >
                                    <span class="mh-pill__dot"></span>
                                    ${it.log_severity}${it.log_severity === "auto"
                                      ? html` <small class="auto-detail"
                                          >T:${it.severity_on_true ?? "warning"}
                                          / F:${it.severity_on_false ?? "info"}</small
                                        >`
                                      : nothing}
                                    <span class="sev-caret" aria-hidden="true">▾</span>
                                  </button>`
                                : html`<span class="muted">—</span>`}
                            </td>
                            <td class="col-toggle">
                              <label class="switch" title=${it.log_enabled
                                ? "Loggen deaktivieren"
                                : "Loggen aktivieren"}>
                                <input
                                  type="checkbox"
                                  .checked=${it.log_enabled}
                                  @change=${() => void this._toggleLog(it)}
                                  aria-label=${it.log_enabled
                                    ? "Loggen deaktivieren"
                                    : "Loggen aktivieren"}
                                />
                                <span class="slider"></span>
                              </label>
                            </td>
                            <td class="col-actions">
                              <button
                                class="icon-btn"
                                title="Bearbeiten"
                                aria-label="Bearbeiten"
                                @click=${() => (this._editing = it)}
                              >
                                <span aria-hidden="true">✎</span>
                              </button>
                              <button
                                class="icon-btn danger"
                                title="Löschen"
                                aria-label="Löschen"
                                @click=${() => void this._delete(it.address)}
                              >
                                <span aria-hidden="true">🗑</span>
                              </button>
                            </td>
                          </tr>
                        `
                      )}
                    </tbody>
                  </table>
                  ${hasMore
                    ? html`<div class="load-more">
                        <button
                          class="mh-btn"
                          @click=${() =>
                            (this._displayedCount = Math.min(
                              this._displayedCount + PAGE_SIZE,
                              allFiltered.length
                            ))}
                        >
                          Mehr laden (${allFiltered.length - items.length} weitere)
                        </button>
                        <button
                          class="mh-btn mh-btn--ghost"
                          @click=${() =>
                            (this._displayedCount = allFiltered.length)}
                        >
                          Alle ${allFiltered.length} zeigen
                        </button>
                      </div>`
                    : nothing}
                </div>
              `}

        ${this._renderEditor()}
        ${this._renderSevPopover()}
        ${this._toast ? html`<div class="toast">${this._toast}</div>` : nothing}
      </section>
    `;
  }

  static override styles = [
    tokens,
    buttons,
    forms,
    pills,
    css`
      section {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
      }
      .head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: var(--mh-space-4);
        flex-wrap: wrap;
      }
      h2 {
        margin: 0;
        font-size: var(--mh-text-xl);
        font-weight: var(--mh-weight-semibold);
        letter-spacing: -0.01em;
      }
      h3 {
        margin: 0 0 var(--mh-space-2) 0;
      }
      .hint {
        margin: 4px 0 0 0;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        line-height: 1.5;
      }
      .header-actions {
        display: flex;
        gap: var(--mh-space-2);
        align-items: center;
        flex-wrap: wrap;
      }
      .csv-upload {
        cursor: pointer;
      }
      .csv-upload input[type="file"] {
        display: none;
      }
      .discovery-status {
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-warning-soft);
        border-left: 3px solid var(--mh-warning);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
        line-height: 1.5;
      }

      /* Add-Form */
      .add-form {
        display: grid;
        grid-template-columns: 140px 1fr 130px auto;
        gap: var(--mh-space-2);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-3);
      }
      @media (max-width: 720px) {
        .add-form {
          grid-template-columns: 1fr 1fr;
        }
      }
      .narrow {
        max-width: 130px;
      }

      /* Filter-Bar */
      .filter-bar {
        display: flex;
        gap: var(--mh-space-3);
        align-items: center;
        flex-wrap: wrap;
      }
      .filter-bar .mh-input {
        flex: 1;
        min-width: 200px;
        max-width: 320px;
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: var(--mh-space-1);
        font-size: var(--mh-text-sm);
        cursor: pointer;
        color: var(--mh-fg-muted);
      }
      .muted {
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }

      /* Tabelle */
      .table-wrap {
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        overflow: hidden;
        box-shadow: var(--mh-shadow-1);
      }
      /* Iter 56b: Bulk-Toolbar + Select-Spalte */
      .bulk-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mh-space-2);
        padding: var(--mh-space-2) var(--mh-space-3);
        margin-bottom: var(--mh-space-2);
        background: var(--mh-info-soft, rgba(0, 120, 255, 0.08));
        border: 1px solid var(--mh-info);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
      }
      .bulk-toolbar__count {
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-info);
      }
      .bulk-toolbar__sev {
        display: inline-flex;
        align-items: center;
        gap: var(--mh-space-1);
      }
      .bulk-toolbar__sev select {
        padding: 4px 6px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        background: var(--mh-bg);
        font-size: var(--mh-text-sm);
      }
      .col-select {
        width: 32px;
        text-align: center;
      }
      /* Iter 55: Load-more Footer fuer paginierte Liste */
      .load-more {
        display: flex;
        justify-content: center;
        gap: var(--mh-space-2);
        padding: var(--mh-space-3);
        border-top: 1px solid var(--mh-divider);
        background: var(--mh-bg);
      }
      .mh-btn--ghost {
        background: transparent;
        color: var(--mh-fg-muted);
      }
      .mh-btn--ghost:hover {
        color: var(--mh-fg);
        background: var(--mh-bg-hover, rgba(0, 0, 0, 0.04));
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 8px var(--mh-space-3);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-sm);
      }
      tr:last-child td {
        border-bottom: 0;
      }
      th {
        background: var(--mh-bg);
        font-size: var(--mh-text-xs);
        /* Iter 57: Sentence-Case statt CAPS-Lock — leserlicher */
        letter-spacing: 0.02em;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
        position: sticky;
        top: 0;
        z-index: 1;
      }
      tr {
        transition: background var(--mh-transition-fast);
      }
      tbody tr:hover {
        background: var(--mh-surface-2);
      }
      tr.enabled {
        background: color-mix(in srgb, var(--mh-success) 4%, transparent);
      }
      .col-toggle {
        text-align: center;
        width: 60px;
      }
      .col-actions {
        text-align: right;
        white-space: nowrap;
        width: 80px;
      }
      .col-actions button + button {
        margin-left: 4px;
      }
      code.ga {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg);
      }
      code.dpt {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        background: var(--mh-surface-2);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
      }
      .label-cell {
        max-width: 360px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .auto-detail {
        font-size: 0.78em;
        font-weight: var(--mh-weight-regular);
        opacity: 0.75;
        margin-left: 4px;
      }

      /* Switch */
      .switch {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 20px;
        cursor: pointer;
      }
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .slider {
        position: absolute;
        inset: 0;
        background: var(--mh-divider);
        border-radius: var(--mh-radius-pill);
        transition: background var(--mh-transition-fast);
      }
      .slider::before {
        content: "";
        position: absolute;
        height: 14px;
        width: 14px;
        left: 3px;
        top: 3px;
        background: white;
        border-radius: 50%;
        transition: transform var(--mh-transition-fast);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
      .switch input:checked + .slider {
        background: var(--mh-success);
      }
      .switch input:checked + .slider::before {
        transform: translateX(16px);
      }
      .switch input:focus-visible + .slider {
        outline: var(--mh-focus-ring);
        outline-offset: 2px;
      }

      /* Icon-Buttons */
      .icon-btn {
        appearance: none;
        background: transparent;
        border: 1px solid transparent;
        width: 28px;
        height: 28px;
        border-radius: var(--mh-radius-sm);
        cursor: pointer;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background var(--mh-transition-fast), color var(--mh-transition-fast);
      }
      .icon-btn:hover {
        background: var(--mh-surface-2);
        color: var(--mh-fg);
      }
      .icon-btn.danger:hover {
        background: var(--mh-error-soft);
        color: var(--mh-error);
      }
      .icon-btn:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: 2px;
      }

      /* Empty / Error */
      .empty {
        padding: var(--mh-space-5);
        text-align: center;
        color: var(--mh-fg-muted);
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
        line-height: 1.5;
      }
      .error {
        color: var(--mh-error);
        font-size: var(--mh-text-sm);
        padding: 6px var(--mh-space-2);
        background: var(--mh-error-soft);
        border-left: 3px solid var(--mh-error);
        border-radius: 2px;
      }

      /* Toast */
      .toast {
        position: fixed;
        bottom: var(--mh-space-5);
        right: var(--mh-space-5);
        background: var(--mh-fg);
        color: var(--mh-bg);
        padding: var(--mh-space-3) var(--mh-space-4);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        font-size: var(--mh-text-sm);
        z-index: 100;
      }

      /* Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 60;
      }
      .modal {
        background: var(--mh-surface);
        border-radius: var(--mh-radius-lg);
        padding: var(--mh-space-5);
        width: min(560px, 92vw);
        max-height: 90vh;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
        box-shadow: var(--mh-shadow-3);
      }
      .modal label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .modal label > span {
        font-weight: var(--mh-weight-medium);
        color: var(--mh-fg);
      }
      .modal label.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 6px;
      }
      .modal input[type="text"],
      .modal select {
        padding: 8px 12px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        font: inherit;
        font-size: var(--mh-text-sm);
        background: var(--mh-surface);
        color: var(--mh-fg);
      }
      .modal input[type="text"]:focus-visible,
      .modal select:focus-visible {
        outline: none;
        border-color: var(--mh-accent);
        box-shadow: 0 0 0 3px var(--mh-accent-soft);
      }
      .modal small {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .modal small code {
        background: var(--mh-surface-2);
        padding: 1px 4px;
        border-radius: 3px;
      }
      .row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--mh-space-3);
      }
      @media (max-width: 600px) {
        .row-2 {
          grid-template-columns: 1fr;
        }
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--mh-space-2);
        margin-top: var(--mh-space-2);
      }
      .modal-actions .mh-btn {
        font-size: var(--mh-text-sm);
      }

      /* Severity-Inline-Popover (Pille als klickbarer Trigger) */
      button.sev-trigger {
        appearance: none;
        cursor: pointer;
        font: inherit;
        border: 0;
        gap: 4px;
        transition: filter var(--mh-transition-fast), box-shadow var(--mh-transition-fast);
      }
      button.sev-trigger:hover {
        filter: brightness(0.95);
        box-shadow: 0 0 0 2px var(--mh-divider);
      }
      button.sev-trigger:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: 2px;
      }
      .sev-caret {
        font-size: 0.7em;
        opacity: 0.65;
        margin-left: 2px;
      }
      .sev-backdrop {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: transparent;
      }
      .sev-popover {
        position: fixed;
        z-index: 70;
        min-width: 200px;
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: var(--mh-shadow-3);
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        animation: sev-pop-in 120ms ease-out;
      }
      @keyframes sev-pop-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      button.sev-option {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 6px 8px;
        border-radius: var(--mh-radius-sm);
        cursor: pointer;
        font: inherit;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-2);
      }
      button.sev-option:hover {
        background: var(--mh-surface-2);
      }
      button.sev-option.active {
        background: var(--mh-surface-2);
      }
      button.sev-option:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: -2px;
      }
      .sev-check {
        color: var(--mh-success);
        font-weight: var(--mh-weight-bold);
      }
    `,
  ];
}
