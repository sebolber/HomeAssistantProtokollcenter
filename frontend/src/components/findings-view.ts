// Iter 9 + 10 (knx-findings): Konfigurations-Check-Tab.
//
// Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.1:
// drittes Sub-Tab neben Live-Status + KNX-Bus-Analyse. Iter 9 lieferte das
// leere Geruest (Header, Filter, Empty-State); Iter 10 verdrahtet das
// Item-Rendering mit Severity-Pill, Detail-Pane und Ack-Action.

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  ApiClient,
  FindingDto,
  FindingSeverity,
  FindingsListResponse,
} from "../api-client.js";
import { buttons, cards, forms, pills, tokens } from "../styles/tokens.js";
import { customElement } from "../utils/custom-element.js";
import {
  getFindingDescription,
  getFindingHelpUrl,
  getFindingTitle,
  isProjectRelated,
} from "../utils/findings-i18n.js";
import "./severity-override-form.js";

type SeverityFilter = "" | FindingSeverity;

const SEVERITY_OPTIONS: ReadonlyArray<{ value: SeverityFilter; label: string }> =
  [
    { value: "", label: "Alle Severities" },
    { value: "error", label: "Error" },
    { value: "warning", label: "Warning" },
    { value: "info", label: "Info" },
    { value: "debug", label: "Debug" },
  ];

// Severity -> CSS-Klasse fuer mh-pill (siehe styles/tokens.ts pills).
const PILL_CLASS_FOR_SEVERITY: Readonly<Record<FindingSeverity, string>> = {
  error: "mh-pill mh-pill--error",
  warning: "mh-pill mh-pill--warning",
  info: "mh-pill mh-pill--info",
  debug: "mh-pill mh-pill--debug",
};

@customElement("findings-view")
export class FindingsView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;
  // Iter H (knx-detail-panes): vorbefuellter Source-Filter aus dem
  // Source-Detail-Pane (via stats-view + URL-Hash). null heisst "kein
  // Filter aktiv" — die Liste zeigt dann alle Findings.
  @property({ attribute: false }) sourceFilter: string | null = null;

  @state() private _items: FindingDto[] = [];
  @state() private _total = 0;
  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _severityFilter: SeverityFilter = "";
  @state() private _projectOnly = false;
  @state() private _selectedKey: string | null = null;
  @state() private _showOverrides = false;

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  override updated(changed: Map<string, unknown>): void {
    // Iter H: bei echter Aenderung der sourceFilter-Property neu laden.
    // Auf dem ersten Update ist `oldValue === undefined` (Lit-Konvention
    // fuer initial gesetzte Properties); der initiale Load haengt an
    // `firstUpdated()`, also ueberspringen wir diesen Pfad — sonst
    // wuerde listFindings doppelt feuern.
    if (changed.has("sourceFilter")) {
      const oldValue = changed.get("sourceFilter");
      if (oldValue !== undefined) {
        void this._load();
      }
    }
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    this._error = null;
    try {
      const resp: FindingsListResponse = await this.api.listFindings({
        severity: this._severityFilter || undefined,
        source: this.sourceFilter || undefined,
      });
      this._items = resp.items;
      this._total = resp.total;
    } catch (err) {
      this._error = (err as Error).message ?? "Unbekannter Fehler";
    } finally {
      this._loading = false;
    }
  }

  private _onSeverityChange(ev: Event): void {
    const target = ev.target as HTMLSelectElement;
    this._severityFilter = target.value as SeverityFilter;
    void this._load();
  }

  private _onProjectOnlyChange(ev: Event): void {
    // Iter 26: Filter "Nur Projekt-Befunde" (DPT_MISMATCH/ORPHAN_GA/
    // STALE_GA). Server liefert die volle Liste, Filter laeuft im
    // Frontend — keine zusaetzliche Round-Trip-Latenz.
    const target = ev.target as HTMLInputElement;
    this._projectOnly = target.checked;
  }

  private _filteredItems(): FindingDto[] {
    if (!this._projectOnly) return this._items;
    return this._items.filter((it) => isProjectRelated(it.code));
  }

  private _itemKey(it: FindingDto): string {
    return `${it.code}::${it.ga ?? ""}::${it.last_seen}`;
  }

  private _onSelect(it: FindingDto): void {
    const key = this._itemKey(it);
    this._selectedKey = this._selectedKey === key ? null : key;
  }

  private async _exportMarkdown(): Promise<void> {
    if (!this.api) return;
    try {
      const md = await this.api.exportFindingsMarkdown();
      // Iter 29: Clipboard. Fallback: download als Datei.
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(md);
      } else {
        const blob = new Blob([md], { type: "text/markdown" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "findings.md";
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (err) {
      this._error = (err as Error).message ?? "Export fehlgeschlagen";
    }
  }

  private async _refreshAll(): Promise<void> {
    // Iter 29a: User triggert per-GA-Runner fuer alle GAs aus dem
    // aktuellen Filter; danach neu laden, damit neue Findings sichtbar
    // werden. Bus-weite Findings (HEALTH_*/RECONNECT_STORM/ORPHAN_GA/
    // STALE_GA) laufen ueber den periodischen Job (Iter 29b), nicht
    // ueber diesen Button.
    if (!this.api) return;
    const gas = Array.from(
      new Set(
        this._items
          .map((it) => it.ga)
          .filter((ga): ga is string => typeof ga === "string" && ga.length > 0)
      )
    );
    if (gas.length === 0) {
      this._error =
        "Keine GA mit Findings im aktuellen Filter — der Per-GA-Lauf braucht eine Auswahl.";
      return;
    }
    this._loading = true;
    this._error = null;
    try {
      for (const ga of gas) {
        await this.api.refreshFindings(ga);
      }
      await this._load();
    } catch (err) {
      this._error = (err as Error).message ?? "Refresh fehlgeschlagen";
    } finally {
      this._loading = false;
    }
  }

  private async _ackSelected(): Promise<void> {
    const selected = this._currentSelection();
    if (!selected || !this.api) return;
    if (selected.ga === null) {
      this._error = "Bus-weite Findings koennen (noch) nicht akknowledged werden.";
      return;
    }
    this._loading = true;
    this._error = null;
    try {
      await this.api.acknowledgeFinding({
        ga: selected.ga,
        code: selected.code,
      });
      await this._load();
      this._selectedKey = null;
    } catch (err) {
      this._error = (err as Error).message ?? "Ack fehlgeschlagen";
    } finally {
      this._loading = false;
    }
  }

  // F-004: Ack zuruecknehmen — bisher fehlte die UI-Anbindung. ApiClient-
  // Methode unacknowledgeFinding existierte ungenutzt, kein Knopf verband
  // beides.
  private async _unackSelected(): Promise<void> {
    const selected = this._currentSelection();
    if (!selected || !this.api) return;
    if (selected.ga === null) return;
    this._loading = true;
    this._error = null;
    try {
      await this.api.unacknowledgeFinding(selected.ga, selected.code);
      await this._load();
      this._selectedKey = null;
    } catch (err) {
      this._error = (err as Error).message ?? "Unack fehlgeschlagen";
    } finally {
      this._loading = false;
    }
  }

  private _currentSelection(): FindingDto | null {
    if (this._selectedKey === null) return null;
    return this._items.find((it) => this._itemKey(it) === this._selectedKey) ?? null;
  }

  override render(): TemplateResult {
    return html`
      <section class="root">
        <header class="header" data-test="findings-header">
          <div class="header-row">
            <h2 class="mh-card__title">Konfigurations-Check</h2>
            <div class="header-actions">
              <button
                type="button"
                class="mh-btn mh-btn--primary mh-btn--sm"
                data-test="findings-refresh-btn"
                title="Per-GA-Detector-Runner manuell ausloesen (DPT_MISMATCH, VALUE_OUT_OF_RANGE, MULTI_RESPONDER, READ_NO_RESPONSE, TOGGLE_LOOP, REPEAT_APPROXIMATION, PATTERN_*)"
                ?disabled=${this._loading}
                @click=${this._refreshAll}
              >
                Aktualisieren
              </button>
              <button
                type="button"
                class="mh-btn mh-btn--ghost mh-btn--sm"
                data-test="findings-export-md"
                title="Markdown-Liste fuer ETS-Notiz in die Zwischenablage kopieren"
                @click=${this._exportMarkdown}
              >
                MD-Export
              </button>
              <button
                type="button"
                class="mh-btn mh-btn--ghost mh-btn--sm"
                data-test="findings-show-overrides"
                @click=${() => (this._showOverrides = !this._showOverrides)}
              >
                ${this._showOverrides ? "Severity-Defaults schliessen" : "Severity-Defaults"}
              </button>
            </div>
          </div>
          <p class="subtitle">
            Erkannte KNX-Konfigurations-Anomalien aus dem Telegrammverkehr.
          </p>
        </header>

        ${this._showOverrides
          ? html`<section class="overrides-pane mh-card" data-test="findings-overrides-pane">
              <h3 class="mh-card__title">Severity-Defaults pro Code</h3>
              <p class="overrides-help">
                Default-Severity ist Eigenschaft der Finding-Definition.
                Hier kannst du sie fuer deine Anlage ueberschreiben — der
                Default greift wieder, sobald du auf "— Default —" wechselst.
              </p>
              <severity-override-form .api=${this.api}></severity-override-form>
            </section>`
          : nothing}

        <div class="filters mh-card mh-card--flat" data-test="findings-filters">
          <label class="filter-label">
            Severity:
            <select
              class="mh-select"
              data-test="findings-severity-filter"
              .value=${this._severityFilter}
              @change=${this._onSeverityChange}
            >
              ${SEVERITY_OPTIONS.map(
                (opt) => html`<option value=${opt.value}>${opt.label}</option>`
              )}
            </select>
          </label>
          <label class="filter-label" data-test="findings-project-only-label">
            <input
              type="checkbox"
              data-test="findings-project-only-toggle"
              .checked=${this._projectOnly}
              @change=${this._onProjectOnlyChange}
            />
            Nur Projekt-Befunde
          </label>
          <span class="total" data-test="findings-total"
            >${this._filteredItems().length} / ${this._total} Findings</span
          >
        </div>

        <div class="body" data-test="findings-table">
          ${this._renderBody()}
        </div>

        ${this._renderDetailPane()}
      </section>
    `;
  }

  private _renderBody(): TemplateResult | typeof nothing {
    if (this._error) {
      return html`<div class="empty error" data-test="findings-error">
        Fehler: ${this._error}
      </div>`;
    }
    if (this._loading) {
      return html`<div class="empty">Wird geladen…</div>`;
    }
    const filtered = this._filteredItems();
    if (filtered.length === 0) {
      return html`<div class="empty" data-test="findings-empty">
        Keine Findings im aktuellen Filter — die Konfiguration sieht
        unauffaellig aus.
      </div>`;
    }
    return html`<ul class="items" data-test="findings-items">
      ${filtered.map((it) => this._renderItem(it))}
    </ul>`;
  }

  private _renderItem(it: FindingDto): TemplateResult {
    const key = this._itemKey(it);
    const selected = this._selectedKey === key;
    const title = getFindingTitle(it.code, this._lang()) || it.code;
    const acked = it.acknowledged === true;
    return html`
      <li
        class=${`item ${selected ? "item--selected" : ""} ${acked ? "item--acked" : ""}`}
        data-test="findings-item"
        @click=${() => this._onSelect(it)}
      >
        <span
          class=${PILL_CLASS_FOR_SEVERITY[it.severity]}
          data-test="item-severity"
        >
          ${it.severity}
        </span>
        <span class="code" data-test="item-code" title=${it.code}>${title}</span>
        <span class="ga" data-test="item-ga">${it.ga ?? "(global)"}</span>
        <span class="source" data-test="item-source"
          >${it.source ?? ""}</span
        >
        <span class="last-seen" data-test="item-last-seen"
          >${this._formatTimestamp(it.last_seen)}</span
        >
        <span class="count" data-test="item-count" title="Occurrence count"
          >×${it.occurrence_count}</span
        >
        ${acked
          ? html`<span
              class="acked-marker"
              data-test="item-acked-marker"
              title="Bereits acknowledged"
              >✓ acked</span
            >`
          : nothing}
      </li>
    `;
  }

  private _lang(): string {
    // Iter 14: Sprache via Browser. HA-Theme-Sprache wuerde via
    // hass.locale.language kommen, aber das Panel hat aktuell keinen
    // Hass-Bus-Hook fuer Locale — nehmen wir document.documentElement.lang
    // (HA setzt das im html-Tag). Fallback: navigator.language.
    if (typeof document !== "undefined" && document.documentElement.lang) {
      return document.documentElement.lang;
    }
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
    return "en";
  }

  private _renderDetailPane(): TemplateResult | typeof nothing {
    const selected = this._currentSelection();
    if (selected === null) return nothing;
    const lang = this._lang();
    const title = getFindingTitle(selected.code, lang) || selected.code;
    const description = getFindingDescription(
      selected.code,
      lang,
      selected.evidence
    );
    const helpUrl = getFindingHelpUrl(selected.code);
    return html`
      <aside class="detail mh-card" data-test="findings-detail">
        <header class="detail-header">
          <span class=${PILL_CLASS_FOR_SEVERITY[selected.severity]}>
            ${selected.severity}
          </span>
          <span class="detail-code" title=${selected.code}>${title}</span>
          <button
            class="mh-btn mh-btn--ghost mh-btn--icon"
            type="button"
            aria-label="Schliessen"
            @click=${() => (this._selectedKey = null)}
          >
            ✕
          </button>
        </header>
        ${description
          ? html`<p class="detail-description" data-test="findings-detail-description">
              ${description}
            </p>`
          : nothing}
        ${helpUrl
          ? html`<a class="detail-help" href=${helpUrl} target="_blank" rel="noopener"
              >Hilfe / Doku ↗</a
            >`
          : nothing}
        <dl class="detail-evidence">
          <dt>Code</dt>
          <dd>${selected.code}</dd>
          <dt>GA</dt>
          <dd>${selected.ga ?? "(global)"}</dd>
          <dt>Source</dt>
          <dd>${selected.source ?? "—"}</dd>
          <dt>First-Seen</dt>
          <dd>${this._formatTimestamp(selected.first_seen)}</dd>
          <dt>Last-Seen</dt>
          <dd>${this._formatTimestamp(selected.last_seen)}</dd>
          <dt>Occurrences</dt>
          <dd>${selected.occurrence_count}</dd>
          <dt>Detector</dt>
          <dd>${selected.detector_version}</dd>
          ${this._renderEvidenceEntries(selected.evidence)}
        </dl>
        <div class="detail-actions">
          ${selected.acknowledged
            ? html`<button
                class="mh-btn mh-btn--ghost"
                type="button"
                data-test="findings-unack-btn"
                ?disabled=${selected.ga === null || this._loading}
                title="Akzeptanz zurueckziehen — Finding erscheint wieder als ungesehen."
                @click=${this._unackSelected}
              >
                Ack zuruecknehmen
              </button>`
            : html`<button
                class="mh-btn mh-btn--primary"
                type="button"
                data-test="findings-ack-btn"
                ?disabled=${selected.ga === null || this._loading}
                @click=${this._ackSelected}
              >
                Ack
              </button>`}
        </div>
      </aside>
    `;
  }

  private _renderEvidenceEntries(
    evidence: Record<string, unknown>
  ): TemplateResult[] {
    return Object.entries(evidence).map(
      ([k, v]) => html`
        <dt>${k}</dt>
        <dd>${typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
      `
    );
  }

  private _formatTimestamp(iso: string): string {
    // Iter 10: kompakte Datum/Uhrzeit-Anzeige; ausfuehrlichere Formate
    // (Relative Zeit, Tooltip) kommen mit dem grossen UI-Polish in Phase 6.
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    } catch {
      return iso;
    }
  }

  static override styles = [
    tokens,
    buttons,
    forms,
    pills,
    cards,
    css`
      :host {
        display: block;
        height: 100%;
      }
      .root {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-3);
        padding: var(--mh-space-4);
        height: 100%;
        overflow: auto;
      }
      .header {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mh-space-3);
      }
      .header-actions {
        display: flex;
        gap: var(--mh-space-2);
      }
      .overrides-pane {
        margin-bottom: var(--mh-space-3);
      }
      .overrides-help {
        margin: 0 0 var(--mh-space-3);
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
      .subtitle {
        margin: 0;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-sm);
      }
      .filters {
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        flex-wrap: wrap;
      }
      .filter-label {
        display: flex;
        gap: var(--mh-space-2);
        align-items: center;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .total {
        margin-left: auto;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .body {
        flex: 1;
        min-height: 0;
      }
      .empty {
        padding: var(--mh-space-6);
        text-align: center;
        color: var(--mh-fg-muted);
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
      }
      .empty.error {
        color: var(--mh-error);
        border-color: var(--mh-error);
        background: var(--mh-error-soft);
      }
      .items {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
      }
      .item {
        display: grid;
        grid-template-columns: auto auto 1fr auto auto auto;
        align-items: center;
        gap: var(--mh-space-3);
        padding: var(--mh-space-3);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        cursor: pointer;
        transition:
          background var(--mh-transition-fast),
          border-color var(--mh-transition-fast);
      }
      .item:hover {
        background: var(--mh-surface-2);
      }
      .item--selected {
        border-color: var(--mh-accent);
        background: var(--mh-accent-soft);
      }
      .item--acked {
        opacity: 0.7;
      }
      .acked-marker {
        font-size: var(--mh-text-xs);
        color: var(--mh-success, var(--mh-fg-muted));
        font-weight: var(--mh-weight-semibold);
        padding-left: var(--mh-space-2);
      }
      .code {
        font-family: var(--code-font-family, monospace);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
      }
      .ga,
      .source {
        font-family: var(--code-font-family, monospace);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .last-seen {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        white-space: nowrap;
      }
      .count {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .detail {
        margin-top: var(--mh-space-3);
        background: var(--mh-surface);
      }
      .detail-header {
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        margin-bottom: var(--mh-space-3);
      }
      .detail-code {
        font-family: var(--code-font-family, monospace);
        font-weight: var(--mh-weight-semibold);
        flex: 1;
      }
      .detail-description {
        margin: 0 0 var(--mh-space-3);
        color: var(--mh-fg);
        line-height: 1.5;
        font-size: var(--mh-text-sm);
      }
      .detail-help {
        display: inline-block;
        margin-bottom: var(--mh-space-3);
        color: var(--mh-accent);
        font-size: var(--mh-text-sm);
        text-decoration: none;
      }
      .detail-help:hover {
        text-decoration: underline;
      }
      .detail-evidence {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: var(--mh-space-2) var(--mh-space-3);
        margin: 0 0 var(--mh-space-3);
        font-size: var(--mh-text-sm);
      }
      .detail-evidence dt {
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-medium);
      }
      .detail-evidence dd {
        margin: 0;
        font-family: var(--code-font-family, monospace);
        word-break: break-word;
      }
      .detail-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--mh-space-2);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "findings-view": FindingsView;
  }
}
