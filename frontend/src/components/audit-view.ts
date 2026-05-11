// Iter 44 + UI-Polish: Audit-Log mit semantischen Action-Pills,
// expandierbaren Details und Volltextsuche.

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type { ApiClient } from "../api-client.js";
import { tokens, buttons, forms, pills } from "../styles/tokens.js";
import { formatRelative, formatAbsolute } from "../utils/time.js";

interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  target_type: string;
  target_id: string | number | null;
  details: unknown;
}

export function categorizeAction(
  action: string
): "create" | "update" | "delete" | "status" | "other" {
  // Aktionen sind typischerweise snake_case wie "knx_upsert", "webhook_delete".
  // Exakter Token-Match, damit z. B. "backup" nicht als "ack" durchgeht.
  const tokens = action.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const set = new Set(tokens);
  const any = (...kws: string[]): boolean => kws.some((k) => set.has(k));
  if (any("delete", "remove", "removed", "deleted")) return "delete";
  if (any("upsert", "create", "created", "add", "added", "import", "imported"))
    return "create";
  if (any("update", "updated", "edit", "edited", "set")) return "update";
  if (any("status", "ack", "acknowledge", "toggle", "enable", "enabled", "disable", "disabled"))
    return "status";
  return "other";
}

const _SUMMARY_VALUE_MAX = 60;

// Iter 59 / B1: Audit-Detail-Summary war "{deleted_count}" — sah wie ein
// nicht ersetzter Template-String aus. Bei genau einem primitiven
// Schluessel-Wert-Paar zeigen wir jetzt "key: value", sonst die kompakte
// Key-Liste. Pure Funktion, damit unit-testbar.
export function formatDetailsSummary(details: unknown): string {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return "";
  }
  const obj = details as Record<string, unknown>;
  if (typeof obj.label === "string") return obj.label;
  if (typeof obj.name === "string") return obj.name;

  const entries = Object.entries(obj);
  if (entries.length === 1) {
    const [key, value] = entries[0];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      const rendered = String(value);
      const clipped =
        rendered.length > _SUMMARY_VALUE_MAX
          ? `${rendered.slice(0, _SUMMARY_VALUE_MAX)}…`
          : rendered;
      return `${key}: ${clipped}`;
    }
    // Object/Array als Wert: Schluessel als Hint, Detail-Expand zeigt mehr.
    return `{${key}}`;
  }
  const keys = entries.slice(0, 3).map(([k]) => k).join(", ");
  return `{${keys}${entries.length > 3 ? ", …" : ""}}`;
}

@customElement("audit-view")
export class AuditView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _items: AuditEntry[] = [];
  @state() private _loading = false;
  @state() private _filter = "";
  @state() private _expanded = new Set<number>();
  @state() private _now = new Date();
  private _tickerId?: number;

  override connectedCallback(): void {
    super.connectedCallback();
    this._tickerId = window.setInterval(() => (this._now = new Date()), 30_000);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._tickerId) window.clearInterval(this._tickerId);
  }

  override async firstUpdated(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    this._loading = true;
    try {
      const raw = (await this.api.listAudit(200)) as unknown as AuditEntry[];
      this._items = raw;
    } finally {
      this._loading = false;
    }
  }

  // Iter 44 (N5): Audit-Log loeschen mit Confirm-Dialog. Nach dem
  // Clear bleibt genau 1 neuer Eintrag uebrig (audit_clear), den der
  // Backend selbst geschrieben hat — wir laden danach neu.
  private async _clearAll(): Promise<void> {
    if (!this.api) return;
    if (
      !window.confirm(
        "Wirklich ALLE Audit-Einträge löschen?\n\n" +
          "Diese Aktion kann nicht rückgängig gemacht werden. " +
          "Ein neuer Eintrag 'audit_clear' wird vom Backend angelegt, " +
          "damit der Lösch-Vorgang in den verbleibenden Logs " +
          "nachvollziehbar bleibt."
      )
    ) {
      return;
    }
    this._loading = true;
    try {
      const result = await this.api.clearAuditLog();
      await this._load();
      window.alert(`${result.deleted} Einträge gelöscht.`);
    } catch (err) {
      window.alert(`Fehler: ${(err as Error).message}`);
    } finally {
      this._loading = false;
    }
  }

  private _toggle(idx: number): void {
    const next = new Set(this._expanded);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    this._expanded = next;
  }

  private _filtered(): AuditEntry[] {
    const f = this._filter.trim().toLowerCase();
    if (!f) return this._items;
    return this._items.filter((it) => {
      const target = `${it.target_type ?? ""}${it.target_id ?? ""}`.toLowerCase();
      const detailStr = it.details ? JSON.stringify(it.details).toLowerCase() : "";
      return (
        (it.actor ?? "").toLowerCase().includes(f) ||
        (it.action ?? "").toLowerCase().includes(f) ||
        target.includes(f) ||
        detailStr.includes(f)
      );
    });
  }

  private _renderActionPill(action: string): TemplateResult {
    const cat = categorizeAction(action);
    return html`<span class=${`action-pill action-${cat}`} title=${action}>${action}</span>`;
  }

  private _renderDetails(details: unknown): TemplateResult {
    if (!details) return html`<span class="muted">—</span>`;
    if (typeof details === "object") {
      const entries = Object.entries(details as Record<string, unknown>);
      if (entries.length === 0) return html`<span class="muted">—</span>`;
      return html`
        <dl class="kv">
          ${entries.map(
            ([k, v]) => html`
              <dt>${k}</dt>
              <dd>${typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
            `
          )}
        </dl>
      `;
    }
    return html`<code>${String(details)}</code>`;
  }

  private _renderDetailsSummary(details: unknown): TemplateResult {
    const summary = formatDetailsSummary(details);
    if (summary === "") return html`<span class="muted">—</span>`;
    // Label/Name (key-loses Wort) ohne muted, alles andere muted.
    const isLabel =
      typeof details === "object" &&
      details !== null &&
      ((details as Record<string, unknown>).label !== undefined ||
        (details as Record<string, unknown>).name !== undefined);
    return html`<span class=${`summary ${isLabel ? "" : "muted"}`}
      >${summary}</span
    >`;
  }

  private _renderEmpty(): TemplateResult {
    const emptyText =
      this._items.length === 0
        ? "Noch keine Audit-Einträge."
        : "Keine Treffer für aktuelle Suche.";
    return html`<div class="empty">${emptyText}</div>`;
  }

  private _renderTable(items: AuditEntry[]): TemplateResult {
    return html`
      <div class="table">
        <div class="table-head">
          <span>Zeit</span>
          <span>Wer</span>
          <span>Aktion</span>
          <span>Ziel</span>
          <span>Details</span>
        </div>
        ${items.map((item, idx) => {
          const expanded = this._expanded.has(idx);
          const ts = String(item.timestamp);
          return html`
            <div class=${`table-row ${expanded ? "expanded" : ""}`}>
              <button
                class="row-toggle"
                @click=${() => this._toggle(idx)}
                aria-expanded=${expanded}
                aria-label=${expanded ? "Details verbergen" : "Details anzeigen"}
              >
                <span class="ts" title=${formatAbsolute(ts, this._now)}>
                  ${formatRelative(ts, this._now)}
                </span>
                <span class="actor">${item.actor}</span>
                <span>${this._renderActionPill(item.action)}</span>
                <span class="target">
                  <code class="target-type">${item.target_type}</code>
                  ${item.target_id !== null && item.target_id !== undefined
                    ? html`<code class="target-id">#${item.target_id}</code>`
                    : nothing}
                </span>
                <span class="details-inline">
                  ${this._renderDetailsSummary(item.details)}
                  <span class="chevron" aria-hidden="true">${expanded ? "▾" : "▸"}</span>
                </span>
              </button>
              ${expanded
                ? html`<div class="details-panel">
                    ${this._renderDetails(item.details)}
                  </div>`
                : nothing}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderBody(items: AuditEntry[]): TemplateResult {
    if (this._loading) return html`<p class="status">lade…</p>`;
    if (items.length === 0) return this._renderEmpty();
    return this._renderTable(items);
  }

  override render(): TemplateResult {
    const items = this._filtered();
    return html`
      <div class="root">
        <header class="page-head">
          <div>
            <h2>Audit-Log</h2>
            <p class="hint">
              Letzte 200 administrativen Aktionen: Löschen, Status-Änderungen,
              Webhook-CRUD. Einträge sind unveränderlich.
            </p>
          </div>
          <div class="head-actions">
            <button class="mh-btn" @click=${() => void this._load()}>
              ↻ Aktualisieren
            </button>
            <button
              class="mh-btn mh-btn--danger"
              ?disabled=${this._items.length === 0 || this._loading}
              @click=${() => void this._clearAll()}
              title="Alle Audit-Einträge löschen"
            >
              Alle löschen
            </button>
          </div>
        </header>

        <div class="filter-bar">
          <input
            type="search"
            class="mh-input"
            placeholder="Suche in Akteur, Aktion, Ziel oder Details…"
            .value=${this._filter}
            @input=${(e: InputEvent) => (this._filter = (e.target as HTMLInputElement).value)}
          />
          <span class="muted small"
            >${items.length} ${items.length === 1 ? "Eintrag" : "Einträge"}</span
          >
        </div>

        ${this._renderBody(items)}
      </div>
    `;
  }

  static override styles = [
    tokens,
    buttons,
    forms,
    pills,
    css`
      :host {
        display: block;
        overflow-y: auto;
        height: 100%;
        background: var(--mh-bg);
      }
      .root {
        max-width: 1100px;
        margin: 0 auto;
        padding: var(--mh-space-5);
      }
      .page-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--mh-space-4);
        margin-bottom: var(--mh-space-3);
      }
      .head-actions {
        display: flex;
        gap: var(--mh-space-2);
        flex-shrink: 0;
      }
      h2 {
        margin: 0;
        font-size: var(--mh-text-xl);
        font-weight: var(--mh-weight-semibold);
        letter-spacing: -0.01em;
      }
      .hint {
        margin: 4px 0 0 0;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .filter-bar {
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        margin-bottom: var(--mh-space-3);
        flex-wrap: wrap;
      }
      .filter-bar .mh-input {
        flex: 1;
        min-width: 240px;
        max-width: 480px;
      }

      .table {
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        overflow: hidden;
        box-shadow: var(--mh-shadow-1);
      }
      .table-head {
        display: grid;
        grid-template-columns: 130px 130px 160px 1fr 1.2fr;
        gap: var(--mh-space-3);
        padding: 10px var(--mh-space-4);
        background: var(--mh-bg);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--mh-fg-muted);
        position: sticky;
        top: 0;
      }
      .table-row {
        border-bottom: 1px solid var(--mh-divider);
      }
      .table-row:last-child {
        border-bottom: 0;
      }
      .row-toggle {
        all: unset;
        display: grid;
        grid-template-columns: 130px 130px 160px 1fr 1.2fr;
        gap: var(--mh-space-3);
        padding: 10px var(--mh-space-4);
        align-items: center;
        cursor: pointer;
        width: 100%;
        box-sizing: border-box;
        transition: background var(--mh-transition-fast);
      }
      .row-toggle:hover {
        background: var(--mh-surface-2);
      }
      .row-toggle:focus-visible {
        outline: var(--mh-focus-ring);
        outline-offset: -2px;
      }
      .table-row.expanded .row-toggle {
        background: var(--mh-surface-2);
      }
      .ts {
        font-variant-numeric: tabular-nums;
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        white-space: nowrap;
      }
      .actor {
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-medium);
      }
      .target {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
        font-size: var(--mh-text-sm);
      }
      .target-type,
      .target-id {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
        color: var(--mh-fg);
      }
      .target-id {
        color: var(--mh-fg-muted);
      }
      .details-inline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
        overflow: hidden;
      }
      .summary {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .chevron {
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-xs);
        flex-shrink: 0;
      }

      /* Action-Pills (semantisch) */
      .action-pill {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: var(--mh-radius-pill);
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        letter-spacing: 0.02em;
      }
      .action-create {
        background: var(--mh-success-soft);
        color: var(--mh-success);
      }
      .action-update {
        background: var(--mh-info-soft);
        color: var(--mh-info);
      }
      .action-delete {
        background: var(--mh-error-soft);
        color: var(--mh-error);
      }
      .action-status {
        background: var(--mh-warning-soft);
        color: var(--mh-warning);
      }
      .action-other {
        background: var(--mh-surface-2);
        color: var(--mh-fg-muted);
      }

      .details-panel {
        padding: var(--mh-space-3) var(--mh-space-4) var(--mh-space-4);
        background: var(--mh-bg);
        border-top: 1px dashed var(--mh-divider);
      }
      dl.kv {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 6px var(--mh-space-3);
        margin: 0;
        font-size: var(--mh-text-sm);
      }
      dl.kv dt {
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-medium);
      }
      dl.kv dd {
        margin: 0;
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-xs);
        color: var(--mh-fg);
        word-break: break-word;
      }

      .empty,
      .status {
        padding: var(--mh-space-6);
        text-align: center;
        color: var(--mh-fg-muted);
        background: var(--mh-surface);
        border: 1px dashed var(--mh-divider);
        border-radius: var(--mh-radius-md);
      }

      .muted {
        color: var(--mh-fg-muted);
      }
      .small {
        font-size: var(--mh-text-xs);
      }

      @media (max-width: 720px) {
        .table-head,
        .row-toggle {
          grid-template-columns: 100px 100px 1fr;
        }
        .table-head > :nth-child(4),
        .table-head > :nth-child(5),
        .row-toggle > :nth-child(4),
        .row-toggle > :nth-child(5) {
          display: none;
        }
        dl.kv {
          grid-template-columns: 1fr;
        }
        dl.kv dd {
          margin-bottom: 4px;
        }
      }
    `,
  ];
}
