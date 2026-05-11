// Stats-Sub-Tab "KNX-Bus-Analyse".
// Iter 7: Skelett (erledigt).
// Iter 8: Filter-Bar (Periode, Top-N, Min-Rate, Acknowledged-Toggle) + KPIs.
// Iter 9: Top-Tabelle + Detail-Pane (folgt).
// Iter 10: Timeline-Sparkline (folgt).

import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { customElement } from "../utils/custom-element.js";
import { property, state } from "lit/decorators.js";
import type {
  ApiClient,
  KnxStatsAlarmDto,
  KnxStatsAlarmsDto,
  KnxStatsBurstsDto,
  KnxStatsBusHealthDto,
  KnxStatsBusloadDto,
  KnxStatsFilters,
  KnxStatsGaDetailDto,
  KnxStatsHealthScoreDto,
  KnxStatsLongTermDto,
  KnxStatsOrphansDto,
  KnxStatsSensitiveLogDto,
  KnxStatsSilenceDto,
  KnxDeviceDto,
  KnxDevicePutBody,
  KnxStatsSourceDetailDto,
  KnxStatsSourceRecommendationDto,
  KnxStatsSourceGaSummaryDto,
  KnxStatsSourcePersistedFindingDto,
  KnxStatsSummaryDto,
  KnxStatsHeatmapDto,
  KnxStatsTimelineDto,
  KnxStatsTopRowDto,
  KnxStatsTrendDto,
} from "../api-client.js";
import { tokens, cards, pills, buttons } from "../styles/tokens.js";
import {
  renderRecommendationConfidencePill,
  renderRecommendationCycle,
  renderRecommendationModePill,
  renderRecommendationSeverityPill,
  renderRecommendationSourcePill,
} from "./recommendation-pills.js";
import "./knx-timeline-chart.js";
import "./knx-value-sparkline.js";

const STORAGE_KEY = "messagehub.knx-stats.filters";

// Bug-Fix (2026-05-03): minRate-Default von 1.0 auf 0.0 gesenkt — der
// Top-N-Selektor wirkte fuer User mit typischen HA-Anlagen (wenige GAs
// > 1 Tel/Min) optisch wirkungslos. Migrations-Marker schuetzt
// Bestandsuser, die NACH dieser Aenderung explizit 1.0 setzen, vor
// erneuter Migration.
const DEFAULTS_VERSION_KEY = "messagehub.knx-stats.filters.defaults-version";
const DEFAULTS_VERSION_CURRENT = "v3";
const LEGACY_MIN_RATE_DEFAULT = 1.0;
// Iter detail-topn: vorher waren alle topN-Defaults 25 — fuer Detail-
// Bereiche (Source-Detail-GA-Liste, Findings) zu viel auf einen Blick.
// Migration setzt nur Stored-Werte, die exakt 25 (= alter Default) sind,
// auf 10 zurueck. User mit explizitem Wert (50/100/200) bleiben unangetastet.
const LEGACY_TOP_N_DEFAULT = 25;

// Iter aiohttp-error-ZU9UA: ETS-Platzhalter-Label-Erkennung — gleiche
// Regex wie in knx-addresses-view.ts (Iter 53). Reale ETS-Projekte
// enthalten oft Hunderte Trenner-GAs ("-----", "----- -----", leer)
// als Strukturhilfe. In "Verwaiste GAs" sind die reines Rauschen.
const PLACEHOLDER_LABEL_RE = /^[\s\-_=]*$/;

function isOrphanPlaceholder(address: string, label: string | null | undefined): boolean {
  const l = (label ?? "").trim();
  if (l === "") return true;
  if (PLACEHOLDER_LABEL_RE.test(l)) return true;
  // Falls extract_group_address_entry den Label-Fallback auf die
  // Address gesetzt hat (Backend-Default bei leerem Name).
  if (l === address) return true;
  return false;
}

// Iter 86 / CR-3: Trend-Severity-Schwellen als benannte Konstanten
// statt Magic Numbers im Funktions-Body.
const TREND_DELTA_PCT_GREEN_MAX = 25;
const TREND_DELTA_PCT_YELLOW_MAX = 100;
const TREND_DELTA_PCT_ORANGE_MAX = 300;

// Periode-Presets in Tagen.
// Iter 22: Raw-Telegramm-Tabelle hat 48h Retention.
// Iter 39: > 48h sind Long-Term-Perioden — die UI wechselt in den
// degradierten Modus (Counter-Tabelle: nur Counts, keine Werte/Source).
const PERIOD_PRESETS: ReadonlyArray<{ id: string; label: string; days: number }> = [
  { id: "1h", label: "1 Std", days: 1 / 24 },
  { id: "6h", label: "6 Std", days: 0.25 },
  { id: "24h", label: "24 Std", days: 1 },
  { id: "48h", label: "48 Std", days: 2 },
  { id: "7d", label: "7 Tage", days: 7 },
  { id: "30d", label: "30 Tage", days: 30 },
  { id: "365d", label: "365 Tage", days: 365 },
];

// Periode-IDs, die Long-Term-Modus aktivieren (Counter-Tabelle statt Raw).
const LONG_TERM_PERIOD_IDS: ReadonlySet<string> = new Set(["7d", "30d", "365d"]);

// Iter E5: Label-Mapping fuer den API-Error-Banner. Ausgelagert, damit
// neue Endpoints nicht im Inline-Object verstreut werden — aktuell
// DE-only, das Mapping kann spaeter per i18n-Pipeline (analog
// findings-i18n.generated.ts) lokalisiert werden. Unbekannte Keys
// fallen auf den Raw-Schluessel zurueck (defensiv, kein silent fail).
const KNX_ENDPOINT_LABELS: Readonly<Record<string, string>> = {
  "health-score": "Bus-Health-Score",
  busload: "Buslast-KPI",
  "long-term": "Long-Term-Sicht",
  bursts: "Burst-Detector",
  "sensitive-log": "Sicherheits-Audit",
  orphans: "Verwaiste GAs",
  alarms: "Alarme",
  trend: "Trend-Vergleich",
  heatmap: "Aktivitäts-Heatmap",
};

export function labelForKnxEndpoint(key: string): string {
  return KNX_ENDPOINT_LABELS[key] ?? key;
}

const TOP_N_OPTIONS = [10, 25, 50, 100, 200] as const;
// Iter topn-4: Heatmap nutzt eine eigene, kuerzere Optionsliste.
// CSS-Grid-Lesbarkeit limitiert die Anzahl Zeilen — 30 ist
// praktisches Maximum auf normalen Desktops, daheim gibt's selten
// > 30 dauer-aktive GAs gleichzeitig.
const HEATMAP_TOP_N_OPTIONS = [10, 15, 20, 25, 30] as const;
// Iter 45 (N6) / Iter aiohttp-error-ZU9UA: pro Tabelle ein Top-N
// im localStorage. Default 25 fuer alle — passt auf einen Bildschirm
// und vermeidet den scroll-heavy 50/100-Default. User kann pro Card
// hochdrehen, wo er mehr braucht.

interface UiFilters {
  periodId: string; // einer der PERIOD_PRESETS.id oder "custom"
  topN: number; // "Top-Sender (Gruppenadressen)"
  topNDevices: number; // "Top-Geraete (Source-Adressen)"
  topNAudit: number; // "Sicherheits-Audit" Telegramme
  topNBursts: number; // "Telegrammfluten (Bursts)"
  topNLongTerm: number; // "Long-Term-Sicht" Top-GAs
  topNTrend: number; // "Trend gegenueber Vorperiode" Up/Down
  topNOrphansMissing: number; // "Verwaiste GAs" — im Projekt, nie gesehen
  topNOrphansExtra: number; // "Verwaiste GAs" — geloggt, nicht im Projekt
  topNSilence: number; // "Stille-Alarme"
  topNBusHealth: number; // "Bus-Gesundheit (Wiederholrate)"
  topNHeatmap: number; // "Aktivitaets-Heatmap" (max 30, CSS-Grid)
  topNSiblings: number; // Detail-Pane "Andere GAs des Geraets"
  topNSourceDetailGas: number; // Source-Detail "GAs dieses Geraets"
  topNSourceDetailFindings: number; // Source-Detail "Findings dieses Geraets"
  topNGaFindings: number; // GA-Detail "Erkannte Muster"
  minRate: number;
  includeAck: boolean;
}

// Iter detail-topn: alle topN-Defaults 25 → 10 gesenkt. Detail-Bereiche
// (Source-Detail-GA-Liste, Findings) waren bei 25 mit zu viel Inhalt
// vollgepackt; im Hauptbereich kann der User pro Card hochdrehen, wenn
// er mehr braucht. Heatmap bleibt 10 (war auch vorher Default).
const DEFAULT_FILTERS: UiFilters = {
  periodId: "24h",
  topN: 10,
  topNDevices: 10,
  topNAudit: 10,
  topNBursts: 10,
  topNLongTerm: 10,
  topNTrend: 10,
  topNOrphansMissing: 10,
  topNOrphansExtra: 10,
  topNSilence: 10,
  topNBusHealth: 10,
  topNHeatmap: 10,
  topNSiblings: 10,
  topNSourceDetailGas: 10,
  topNSourceDetailFindings: 10,
  topNGaFindings: 10,
  minRate: 0.0,
  includeAck: true,
};

const TOP_N_KEYS_TO_MIGRATE: ReadonlyArray<keyof UiFilters> = [
  "topN",
  "topNDevices",
  "topNAudit",
  "topNBursts",
  "topNLongTerm",
  "topNTrend",
  "topNOrphansMissing",
  "topNOrphansExtra",
  "topNSilence",
  "topNBusHealth",
  "topNSiblings",
];

function loadFilters(): UiFilters {
  let stored: Partial<UiFilters> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw) as Partial<UiFilters>;
    }
  } catch {
    // ignore
  }
  const merged: UiFilters = stored
    ? { ...DEFAULT_FILTERS, ...stored }
    : { ...DEFAULT_FILTERS };
  return migrateFilterDefaults(merged, stored);
}

// Bug-Fix (2026-05-03): einmalige Migration alter localStorage-Eintraege
// auf neuen minRate-Default 0.0. Heuristik: nur User mit dem alten
// Default-Wert 1.0 (= "nie angefasst") werden migriert. Wer explizit
// einen anderen Wert gesetzt hat (auch 1.5 oder 2.0), behaelt seine
// Einstellung. Versions-Flag verhindert Doppel-Migration und schuetzt
// User, die NACH der Migration bewusst 1.0 setzen.
//
// Iter detail-topn (v3): zusaetzlich alle topN-Werte, die exakt dem
// alten Default 25 entsprechen, auf neuen Default 10 zuruecksetzen.
// Selbe Heuristik wie bei minRate — nur "nie angefasste" Werte
// werden migriert, explizite User-Werte (50/100/200) bleiben erhalten.
function migrateFilterDefaults(
  merged: UiFilters,
  stored: Partial<UiFilters> | null,
): UiFilters {
  let alreadyMigrated = false;
  try {
    alreadyMigrated = localStorage.getItem(DEFAULTS_VERSION_KEY)
      === DEFAULTS_VERSION_CURRENT;
  } catch {
    // ignore
  }
  if (alreadyMigrated) {
    return merged;
  }
  // Migration nur, wenn der gespeicherte Wert exakt der alte Default ist.
  // Frische User (stored === null) brauchen keine Wert-Migration, wir
  // setzen aber trotzdem den Marker, damit ein spaeterer Save mit User-
  // Wert 1.0 / 25 nicht spaeter erneut migriert wird.
  let migrated = merged;
  let dirty = false;
  if (stored !== null && stored.minRate === LEGACY_MIN_RATE_DEFAULT) {
    migrated = { ...migrated, minRate: DEFAULT_FILTERS.minRate };
    dirty = true;
  }
  if (stored !== null) {
    const patch: Partial<UiFilters> = {};
    for (const key of TOP_N_KEYS_TO_MIGRATE) {
      if (stored[key] === LEGACY_TOP_N_DEFAULT) {
        (patch as Record<string, number>)[key] = DEFAULT_FILTERS[key] as number;
      }
    }
    if (Object.keys(patch).length > 0) {
      migrated = { ...migrated, ...patch };
      dirty = true;
    }
  }
  if (dirty) {
    saveFilters(migrated);
  }
  try {
    localStorage.setItem(DEFAULTS_VERSION_KEY, DEFAULTS_VERSION_CURRENT);
  } catch {
    // ignore
  }
  return migrated;
}

function saveFilters(f: UiFilters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  } catch {
    // ignore
  }
}

function periodToIso(periodId: string): { from: string; to: string } {
  const preset = PERIOD_PRESETS.find((p) => p.id === periodId) ?? PERIOD_PRESETS[2];
  const to = new Date();
  const from = new Date(to.getTime() - preset.days * 86_400_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

// Iter 39: Im Long-Term-Modus muessen Raw-Endpoints (top, summary, busload,
// timeline, bus-health, silence) auf die letzten 48h gekappt werden — sie
// lesen aus knx_raw_telegrams (max 48h Retention) und wuerden bei groesseren
// Perioden 400-Bad-Request liefern.
const RAW_LIVE_WINDOW_HOURS = 48;
function rawLiveWindow(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - RAW_LIVE_WINDOW_HOURS * 3600 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

// Iter 59 / B2: 4-stufige Ampel-Klassifizierung (gruen/gelb/orange/rot)
// auf mh-pill-Varianten mappen. Vorher griff green->neutral (grau) und
// yellow->info (blau) — entwertete die Ampel-Optik. Pure helper,
// modul-level export fuer Tests.
export function severityPillClass(
  sev: "green" | "yellow" | "orange" | "red"
): string {
  switch (sev) {
    case "red":
      return "mh-pill--error";
    case "orange":
      return "mh-pill--warning";
    case "yellow":
      return "mh-pill--caution";
    case "green":
      return "mh-pill--success";
  }
}

// Iter 60 / U5: Sortierbare Top-Sender-Tabelle. Pure helper, damit ohne
// Mount testbar. Severity-Sort nutzt Schweregrad-Rang (rot > orange >
// gelb > gruen).
export type TopSenderSortKey =
  | "ga"
  | "label"
  | "rate_per_min"
  | "recommended_rate"
  | "severity";

const _SEVERITY_RANK: Record<"green" | "yellow" | "orange" | "red", number> = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3,
};

interface SortableTopSenderRow {
  ga: string;
  label?: string | null;
  rate_per_min: number;
  recommended_rate: number;
  severity: "green" | "yellow" | "orange" | "red";
}

export function sortTopSender<T extends SortableTopSenderRow>(
  rows: T[],
  key: TopSenderSortKey,
  dir: "asc" | "desc"
): T[] {
  const sorted = [...rows].sort((a, b) => {
    let cmp: number;
    switch (key) {
      case "ga":
        cmp = a.ga.localeCompare(b.ga);
        break;
      case "label": {
        // Leere Labels ans Ende, egal ob asc/desc — sind nicht sinnvoll
        // sortierbar und stoeren bei Suche.
        const aEmpty = !a.label;
        const bEmpty = !b.label;
        if (aEmpty && bEmpty) cmp = 0;
        else if (aEmpty) return 1;
        else if (bEmpty) return -1;
        else cmp = (a.label as string).localeCompare(b.label as string);
        break;
      }
      case "rate_per_min":
        cmp = a.rate_per_min - b.rate_per_min;
        break;
      case "recommended_rate":
        cmp = a.recommended_rate - b.recommended_rate;
        break;
      case "severity":
        cmp = _SEVERITY_RANK[a.severity] - _SEVERITY_RANK[b.severity];
        break;
    }
    return dir === "desc" ? -cmp : cmp;
  });
  return sorted;
}

@customElement("stats-knx-view")
export class StatsKnxView extends LitElement {
  @property({ attribute: false }) api?: ApiClient;

  @state() private _filters: UiFilters = loadFilters();
  @state() private _summary: KnxStatsSummaryDto | null = null;
  @state() private _busHealth: KnxStatsBusHealthDto | null = null;
  @state() private _busload: KnxStatsBusloadDto | null = null;
  @state() private _health: KnxStatsHealthScoreDto | null = null;
  @state() private _longTerm: KnxStatsLongTermDto | null = null;
  @state() private _bursts: KnxStatsBurstsDto | null = null;
  @state() private _sensitiveLog: KnxStatsSensitiveLogDto | null = null;
  // Iter 67 / WR-I: Trend-Vergleich aktuelle Periode vs. Vorperiode.
  @state() private _trend: KnxStatsTrendDto | null = null;
  // Iter 91 / WR-G: Heatmap-Daten (Top-N GAs x Bucket-Zeitachse).
  @state() private _heatmap: KnxStatsHeatmapDto | null = null;
  // Iter 49 (N1): Bus-Analyse-Toggle. true = Listener nimmt Telegramme
  // weiter auf; false = ressourcen-sparend, aber keine neuen Daten.
  @state() private _busAnalysisEnabled: boolean = true;
  @state() private _busAnalysisLoaded: boolean = false;
  // Iter 57: Sortierung der Top-Geraete-Tabelle. Default: count desc
  // (haeufigster Sender oben).
  @state() private _devicesSortKey: "dev_source" | "ga_count" | "count" = "count";
  @state() private _devicesSortDir: "asc" | "desc" = "desc";
  // Iter 60 / U5: Sortierung Top-Sender-Tabelle. Default: nach
  // Tel/Min desc (= heutige Reihenfolge vom Backend).
  @state() private _topSortKey: TopSenderSortKey = "rate_per_min";
  @state() private _topSortDir: "asc" | "desc" = "desc";
  // Iter 61 / U3 + Iter aiohttp-error-ZU9UA: Verwaiste-GAs-Card mit
  // Suche; Anzahl-Begrenzung jetzt ueber inline-topn (UiFilters.
  // topNOrphansMissing / topNOrphansExtra), persistent im localStorage
  // wie alle anderen Top-N-Filter. ETS-Platzhalter (Label nur Striche
  // / leer / == Address) sind per Default ausgeblendet — bei 3000+ GAs
  // sind die ein massiver Noise-Anteil.
  @state() private _orphansMissingFilter = "";
  @state() private _orphansExtraFilter = "";
  @state() private _orphansHidePlaceholders = true;
  // Iter 51: Sichtbarkeit fuer einzeln gefailte Endpunkte. Vorher hat
  // .catch(() => null) Fehler stillschweigend geschluckt — und der User
  // sah leere Cards, ohne zu wissen warum. Jetzt: Banner mit Liste der
  // gefailten Endpoints + Hinweise zu typischen Ursachen.
  @state() private _apiErrors: Map<string, string> = new Map();
  @state() private _apiErrorsDismissed: boolean = false;
  @state() private _silence: KnxStatsSilenceDto | null = null;
  @state() private _orphans: KnxStatsOrphansDto | null = null;
  @state() private _alarms: KnxStatsAlarmsDto | null = null;
  @state() private _top: KnxStatsTopRowDto[] = [];
  @state() private _topBySource: Array<{
    dev_source: string;
    count: number;
    ga_count: number;
    manufacturer?: string;
    device_name?: string;
  }> = [];
  @state() private _timeline: KnxStatsTimelineDto | null = null;
  @state() private _selectedGa: string | null = null;
  @state() private _detail: KnxStatsGaDetailDto | null = null;
  @state() private _detailLoading = false;
  // Iter D.2 (knx-detail-panes): Source-Detail-Drawer. Wird in Iter
  // E (Top-Geraete-Klick), F (Stille-Alarm-Klick) befuellt; GA-Klick
  // im Source-Detail wechselt auf das GA-Detail-Pane (kein zweites
  // Modal — Architektur-Entscheid aus knx_detail_panes_konzept.md).
  @state() private _selectedSource: string | null = null;
  @state() private _sourceDetail: KnxStatsSourceDetailDto | null = null;
  @state() private _sourceDetailLoading = false;
  // Iter L1.4: Recommendation-Card (Sende-Modus + DPT-Empfehlung).
  // Lazy-Load: triggert erst beim Aufklappen, nicht beim Drawer-Open.
  @state() private _recommendation: KnxStatsSourceRecommendationDto | null = null;
  @state() private _recommendationLoading = false;
  @state() private _recommendationError = "";
  @state() private _recommendationExpanded = false;
  // Iter L2.4: Inline-Editor fuer Geraete-Profil.
  @state() private _device: KnxDeviceDto | null = null;
  @state() private _deviceEditing = false;
  @state() private _deviceSaving = false;
  @state() private _deviceError = "";
  @state() private _deviceDraft: KnxDevicePutBody = {};
  @state() private _loading = false;
  @state() private _error = "";
  @state() private _toast = "";
  // Iter D4: Request-Token gegen parallele _load()-Calls. Bei Filter-
  // Wechsel kann der User schneller klicken als die Server-Antworten
  // zurueckkommen — ohne Schutz wird das langsamere Resultat nach dem
  // schnelleren in den State gehoben (Flicker / inkonsistente Daten).
  // Vor jedem _load() inkrementieren wir den Token; spaetere Calls
  // ueberschreiben nur, wenn ihr Token noch der aktuelle ist.
  private _loadToken = 0;

  override async firstUpdated(): Promise<void> {
    await Promise.all([this._loadBusAnalysisState(), this._load()]);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Iter aiohttp-error-ZU9UA / P1: Escape schliesst das Detail-Drawer.
    // window-Level statt document-Level, damit der Listener immer feuert,
    // auch wenn Fokus woanders im Shadow-DOM liegt. CLAUDE.md: position-
    // fixed-Popovers + Backdrop, kein document.click-Pattern.
    window.addEventListener("keydown", this._onWindowKeyDown);
  }

  override disconnectedCallback(): void {
    window.removeEventListener("keydown", this._onWindowKeyDown);
    super.disconnectedCallback();
  }

  private readonly _onWindowKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== "Escape") return;
    if (this._detail !== null || this._detailLoading) {
      this._closeDetail();
      return;
    }
    if (this._sourceDetail !== null || this._sourceDetailLoading) {
      this._closeSourceDetail();
    }
  };

  private _closeDetail(): void {
    this._selectedGa = null;
    this._detail = null;
    this._detailLoading = false;
  }

  // Iter D.2 (knx-detail-panes): pendant zu _closeDetail fuer das
  // Source-Detail-Pane.
  private _closeSourceDetail(): void {
    this._selectedSource = null;
    this._sourceDetail = null;
    this._sourceDetailLoading = false;
    // Iter L1.4: Recommendation-State mit-resetten, sonst leakt der
    // Stand des vorherigen Geraets in das naechst-geoeffnete Drawer.
    this._recommendation = null;
    this._recommendationLoading = false;
    this._recommendationError = "";
    this._recommendationExpanded = false;
    // Iter L2.4: Geraete-Profil-State auch reset.
    this._device = null;
    this._deviceEditing = false;
    this._deviceSaving = false;
    this._deviceError = "";
    this._deviceDraft = {};
  }

  private async _loadBusAnalysisState(): Promise<void> {
    if (!this.api) return;
    try {
      const result = await this.api.getKnxBusAnalysisState();
      this._busAnalysisEnabled = result.enabled;
    } catch {
      // API nicht erreichbar -> Default true belassen, kein Banner
    } finally {
      this._busAnalysisLoaded = true;
    }
  }

  // Iter 51: zeigt einen warnenden Banner ueber gefailte Endpunkte +
  // Hinweise zu typischen Ursachen. Banner ist dismissable (per Klick),
  // aber kommt beim naechsten _load() wieder, falls die Endpoints noch
  // immer failen. So bleibt der User nicht im Dunkeln, kann aber kurz
  // wegklicken um die anderen Cards sauber zu sehen.
  private _renderApiErrorBanner(): TemplateResult {
    const failed = Array.from(this._apiErrors.keys()).sort((a, b) =>
      a.localeCompare(b),
    );
    // Iter E5: Labels per i18n-Hook — fuer jetzt nur DE/EN-Inline,
    // kuenftig kann _labelForEndpoint aus translations/ zogen werden
    // (gleiche Pipeline wie findings-i18n.generated.ts).
    const labeled = failed
      .map((k) => labelForKnxEndpoint(k))
      .join(", ");
    return html`
      <div class="api-error-banner" role="alert">
        <div class="api-error-banner__head">
          <strong>Folgende Statistik-Bereiche sind nicht erreichbar:</strong>
          <button
            class="api-error-banner__dismiss"
            @click=${() => (this._apiErrorsDismissed = true)}
            title="Banner schliessen"
            aria-label="Banner schliessen"
          >×</button>
        </div>
        <p class="api-error-banner__list">${labeled}</p>
        <details class="api-error-banner__details">
          <summary>Moegliche Ursachen + Diagnose</summary>
          <ul>
            <li>HACS-Update wurde noch nicht installiert (Backend kennt die neuen Endpunkte nicht).</li>
            <li>Home-Assistant wurde nach dem Update nicht neu gestartet.</li>
            <li>Browser-Cache haelt das alte Bundle vor — harter Reload (Strg+Shift+R) probieren.</li>
            <li>Der HA-User hat keine Admin-Rechte (alle KNX-Stats-Endpoints sind Admin-only).</li>
          </ul>
          <p class="muted small">Original-Fehlermeldungen:</p>
          <ul class="api-error-banner__raw">
            ${Array.from(this._apiErrors.entries()).map(
              ([k, msg]) => html`<li><code>${k}</code>: ${msg}</li>`
            )}
          </ul>
        </details>
      </div>
    `;
  }

  private async _toggleBusAnalysis(): Promise<void> {
    if (!this.api) return;
    const nextValue = !this._busAnalysisEnabled;
    if (
      !nextValue &&
      !window.confirm(
        "Bus-Analyse deaktivieren?\n\n" +
          "Solange aus, schreibt das Plugin keine neuen Telegramme mehr in " +
          "die Raw- oder Counter-Tabelle. Bestehende Daten bleiben sichtbar, " +
          "altern aber nach 48 h (Raw) bzw. 365 Tagen (Counter)."
      )
    ) {
      return;
    }
    try {
      const result = await this.api.setKnxBusAnalysisState(nextValue);
      this._busAnalysisEnabled = result.enabled;
    } catch (err) {
      window.alert(`Fehler: ${(err as Error).message}`);
    }
  }

  private _apiFilters(): KnxStatsFilters {
    const { from, to } = periodToIso(this._filters.periodId);
    return {
      from,
      to,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck,
    };
  }

  private _isLongTermMode(): boolean {
    return LONG_TERM_PERIOD_IDS.has(this._filters.periodId);
  }

  // Im Long-Term-Modus laufen die Raw-Endpunkte auf die letzten 48h —
  // alles dahinter liegt in der Counter-Tabelle und wird ueber den
  // Long-Term-Endpoint geliefert.
  private _liveFiltersForRaw(): KnxStatsFilters {
    if (!this._isLongTermMode()) return this._apiFilters();
    const { from, to } = rawLiveWindow();
    return {
      from,
      to,
      limit: this._filters.topN,
      minRate: this._filters.minRate,
      includeAcknowledged: this._filters.includeAck,
    };
  }

  private async _load(): Promise<void> {
    if (!this.api) return;
    // Iter D4: Token-basierter Race-Schutz. Wenn der User die Filter
    // schnell wechselt, gewinnt der LETZTE Aufruf — frueher konnte ein
    // langsam zurueckkommendes Resultat den State eines spaeteren
    // Aufrufs ueberschreiben. Token wird nur beim Schreiben verglichen,
    // damit wir auch bei Timeout-Fehlern sauber abbrechen.
    const requestToken = ++this._loadToken;
    this._loading = true;
    this._error = "";
    // Iter 51: Fehler-Map pro Load zuruecksetzen — sonst wuerden
    // dauerhafte Errors angezeigt selbst nachdem das Backend wieder lebt.
    const errors = new Map<string, string>();
    const captureError = <T>(name: string, p: Promise<T>): Promise<T | null> =>
      p.catch((err) => {
        errors.set(name, (err as Error).message);
        return null;
      });
    try {
      const longTermMode = this._isLongTermMode();
      const fLongTerm = this._apiFilters();
      const fRaw = this._liveFiltersForRaw();
      // Geraete-Tabelle nutzt separate Top-N-Einstellung (Iter 45).
      const fRawDevices: KnxStatsFilters = { ...fRaw, limit: this._filters.topNDevices };
      const [
        summary,
        top,
        topBySource,
        busHealth,
        silence,
        orphans,
        alarms,
        busload,
        health,
        longTerm,
        bursts,
        sensitiveLog,
        trend,
        heatmap,
      ] = await Promise.all([
        this.api.getKnxStatsSummary(fRaw),
        this.api.getKnxStatsTop(fRaw),
        this.api.getKnxStatsTopBySource(fRawDevices),
        // Iter topn-3: topNBusHealth durchreichen — Backend liest jetzt
        // limit aus der Query (Default 20, Max 500). Vorher hardcoded 20.
        this.api.getKnxStatsBusHealth({
          ...fRaw,
          limit: this._filters.topNBusHealth,
        }),
        this.api.getKnxStatsSilence({
          ...fRaw,
          maxSilenceMinutes: this._suggestSilenceMinutes(),
        }),
        captureError("orphans", this.api.getKnxStatsOrphans(fRaw)),
        captureError("alarms", this.api.getKnxStatsAlarms(fRaw)),
        captureError(
          "busload",
          this.api.getKnxStatsBusload(fRaw, this._suggestBusloadBucketSeconds())
        ),
        captureError("health-score", this.api.getKnxStatsHealthScore(fRaw)),
        longTermMode
          ? captureError(
              "long-term",
              this.api.getKnxStatsLongTerm({
                ...fLongTerm,
                limit: this._filters.topNLongTerm,
              }),
            )
          : Promise.resolve(null),
        // Iter topn-2: jeder Card-spezifische Call ueberschreibt das von
        // _liveFiltersForRaw geerbte Master-`limit` (= topN) mit dem
        // eigenen Top-N — sonst greift das Backend auf seine Defaults
        // zurueck und der Card-Selektor wirkt nur kosmetisch.
        captureError(
          "bursts",
          this.api.getKnxStatsBursts({
            ...fRaw,
            limit: this._filters.topNBursts,
          }),
        ),
        captureError(
          "sensitive-log",
          this.api.getKnxStatsSensitiveLog({
            ...fRaw,
            limit: this._filters.topNAudit,
          }),
        ),
        // Iter aiohttp-error-ZU9UA / Trend-Fix B+C: bei langen Perioden
        // den vollen Zeitraum (fLongTerm) statt der 48h-Live-Slice
        // (fRaw) senden — Backend liest dann aus knx_telegram_counters.
        // Iter topn-1: top_n folgt dem Card-Selektor (this._filters.topNTrend),
        // vorher hardcoded 5 → User-Auswahl > 5 ohne Effekt.
        captureError(
          "trend",
          this.api.getKnxStatsTrend(
            longTermMode ? fLongTerm : fRaw,
            this._filters.topNTrend,
          ),
        ),
        // Iter topn-4: Heatmap nutzt jetzt einen eigenen UI-Selektor
        // (default 10, max 30 wegen CSS-Grid-Lesbarkeit). Vorher
        // hardcoded 10.
        captureError(
          "heatmap",
          this.api.getKnxStatsHeatmap(
            fRaw,
            this._filters.topNHeatmap,
            this._suggestHeatmapBucketMinutes(),
          ),
        ),
      ]);
      // Iter D4: Token-Check vor jedem Schreibzugriff. Wenn der User
      // waehrend wir geladen haben einen neueren _load() angestossen
      // hat, ueberlassen wir DEM den State-Update.
      if (requestToken !== this._loadToken) {
        return;
      }
      this._summary = summary;
      this._top = top.items;
      this._topBySource = topBySource.items;
      this._busHealth = busHealth;
      this._silence = silence;
      this._orphans = orphans;
      this._alarms = alarms;
      this._busload = busload;
      this._health = health;
      this._longTerm = longTerm;
      this._bursts = bursts;
      this._sensitiveLog = sensitiveLog;
      this._trend = trend;
      this._heatmap = heatmap;
      // Iter 51: Errors-Snapshot setzen (Reassignment triggert Re-Render).
      this._apiErrors = errors;
      this._apiErrorsDismissed = false;
      // Timeline fuer Top-5 GAs (mehr Linien werden unleserlich).
      // Nutzt fRaw (kappiert auf 48h im Long-Term-Modus) — Timeline-Endpoint
      // liest aus knx_raw_telegrams.
      const topGas = top.items.slice(0, 5).map((r) => r.ga);
      if (topGas.length > 0) {
        const timelineResult = await this.api.getKnxStatsTimeline({
          ...fRaw,
          gas: topGas,
          bucketMinutes: this._suggestBucketMinutes(),
        });
        // Erneut pruefen: Timeline-Call lief async nach dem Promise.all.
        if (requestToken === this._loadToken) {
          this._timeline = timelineResult;
        }
      } else if (requestToken === this._loadToken) {
        this._timeline = null;
      }
    } catch (err) {
      if (requestToken !== this._loadToken) {
        // Veralteter Aufruf — Fehler nicht mehr darstellen.
        return;
      }
      this._error = (err as Error).message;
      this._summary = null;
      this._top = [];
      this._topBySource = [];
      this._timeline = null;
      this._busHealth = null;
      this._silence = null;
      this._orphans = null;
      this._alarms = null;
      this._busload = null;
      this._health = null;
      this._longTerm = null;
      this._bursts = null;
      this._sensitiveLog = null;
      this._trend = null;
      this._heatmap = null;
    } finally {
      // Loading-State nur zuruecksetzen, wenn wir der aktuelle Aufruf sind.
      if (requestToken === this._loadToken) {
        this._loading = false;
      }
    }
  }

  private _suggestBucketMinutes(): number {
    switch (this._filters.periodId) {
      case "1h":
        return 1;
      case "6h":
        return 5;
      case "24h":
        return 10;
      case "48h":
      default:
        return 30;
    }
  }

  // Iter aiohttp-error-ZU9UA / P1: Heatmap-Bucket je Periode. Vorher
  // immer 60 min — bei 1h-Periode resultierte das in nur 1-2 Spalten,
  // die Heatmap wirkte leer. Backend-Limit max 60 min.
  // 1h → 5 min (12 Spalten)
  // 6h → 15 min (24 Spalten)
  // 24h+ → 60 min (24-N Spalten, Default)
  private _suggestHeatmapBucketMinutes(): number {
    switch (this._filters.periodId) {
      case "1h":
        return 5;
      case "6h":
        return 15;
      case "24h":
      case "48h":
      default:
        return 60;
    }
  }

  // Iter 36 (Feature A): pro Periode passende Bucket-Groesse fuer Buslast-%
  // damit das Frontend bei laengeren Perioden nicht 17280 Buckets bekommt.
  // 1h -> 10s (ETS-Standard, 360 Punkte)
  // 6h -> 60s (360 Punkte)
  // 24h -> 5min (288 Punkte)
  // 48h -> 10min (288 Punkte)
  private _suggestBusloadBucketSeconds(): number {
    switch (this._filters.periodId) {
      case "1h":
        return 10;
      case "6h":
        return 60;
      case "24h":
        return 300;
      case "48h":
      default:
        return 600;
    }
  }

  private _suggestSilenceMinutes(): number {
    // Stille-Schwelle proportional zur Periode: kuerzere Periode → kuerzere Stille
    switch (this._filters.periodId) {
      case "1h":
        return 30;
      case "6h":
        return 120; // 2h
      case "24h":
        return 360; // 6h
      case "48h":
      default:
        return 720; // 12h
    }
  }

  private async _loadDetail(ga: string): Promise<void> {
    if (!this.api) return;
    this._detailLoading = true;
    this._detail = null;
    try {
      const f = this._apiFilters();
      this._detail = await this.api.getKnxStatsGaDetail(ga, f);
    } catch (err) {
      this._showToast(`Detail laden fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      this._detailLoading = false;
    }
  }

  // Iter D.2 (knx-detail-panes): Source-Detail laden. Schliesst ein
  // offenes GA-Detail (Toggle zwischen den beiden Drawer-Inhalten),
  // analog _loadDetail.
  private async _loadSourceDetail(devSource: string): Promise<void> {
    if (!this.api) return;
    // Wenn ein GA-Detail offen ist, schliessen wir es — der Drawer
    // zeigt entweder GA- oder Source-Sicht, nie beides gleichzeitig.
    this._closeDetail();
    this._selectedSource = devSource;
    this._sourceDetailLoading = true;
    this._sourceDetail = null;
    // Iter L1.4: Recommendation-State frisch fuer das neue Geraet.
    // Karte bleibt collapsed; Lade-Trigger erst beim Aufklappen.
    this._recommendation = null;
    this._recommendationLoading = false;
    this._recommendationError = "";
    this._recommendationExpanded = false;
    // Iter L2.4: Geraete-Profil mit-resetten.
    this._device = null;
    this._deviceEditing = false;
    this._deviceSaving = false;
    this._deviceError = "";
    this._deviceDraft = {};
    try {
      const f = this._apiFilters();
      this._sourceDetail = await this.api.getKnxStatsSourceDetail(
        devSource, f,
      );
    } catch (err) {
      this._showToast(
        `Source-Detail laden fehlgeschlagen: ${(err as Error).message}`,
      );
    } finally {
      this._sourceDetailLoading = false;
    }
  }

  // Iter L1.4: Lazy-Loader fuer die Recommendation-Card. Wird durch
  // den Aufklappen-Klick angestossen.
  private async _loadRecommendation(devSource: string): Promise<void> {
    if (!this.api) return;
    this._recommendationLoading = true;
    this._recommendationError = "";
    try {
      const f = this._apiFilters();
      this._recommendation = await this.api.getKnxStatsSourceRecommendation(
        devSource, f,
      );
    } catch (err) {
      const msg = (err as Error).message;
      // 404 = "Geraet hat keine Telegramme im Period" — kein Fehler-
      // Toast, sondern stille Card-Anzeige.
      if (msg.includes("HTTP 404")) {
        this._recommendation = null;
        this._recommendationError = "";
      } else {
        this._recommendationError = msg;
      }
    } finally {
      this._recommendationLoading = false;
    }
  }

  private _toggleRecommendation(): void {
    if (!this._selectedSource) return;
    this._recommendationExpanded = !this._recommendationExpanded;
    if (
      this._recommendationExpanded
      && this._recommendation === null
      && !this._recommendationLoading
      && this._recommendationError === ""
    ) {
      void this._loadRecommendation(this._selectedSource);
      // Geraete-Profil parallel laden (kleines, schnelles Endpoint —
      // braucht keinen eigenen Lazy-Toggle).
      void this._loadDevice(this._selectedSource);
    }
  }

  // Iter L2.4: Geraete-Profil laden + Inline-Edit.
  private async _loadDevice(devSource: string): Promise<void> {
    if (!this.api) return;
    try {
      this._device = await this.api.getKnxDevice(devSource);
    } catch (err) {
      this._device = null;
      this._deviceError = (err as Error).message;
    }
  }

  private _startEditDevice(): void {
    this._deviceEditing = true;
    this._deviceError = "";
    this._deviceDraft = {
      manufacturer: this._device?.manufacturer ?? "",
      model: this._device?.model ?? "",
      notes: this._device?.notes ?? "",
    };
  }

  private _cancelEditDevice(): void {
    this._deviceEditing = false;
    this._deviceError = "";
    this._deviceDraft = {};
  }

  private async _saveDevice(): Promise<void> {
    if (!this.api || !this._selectedSource) return;
    this._deviceSaving = true;
    this._deviceError = "";
    try {
      this._device = await this.api.putKnxDevice(
        this._selectedSource,
        this._deviceDraft,
      );
      this._deviceEditing = false;
      this._deviceDraft = {};
      // Recommendation neu laden, weil Layer-2-Override ggf. greift
      this._recommendation = null;
      if (this._recommendationExpanded) {
        void this._loadRecommendation(this._selectedSource);
      }
    } catch (err) {
      this._deviceError = (err as Error).message;
    } finally {
      this._deviceSaving = false;
    }
  }

  private _onDeviceDraftChange(
    field: keyof KnxDevicePutBody,
    value: string,
  ): void {
    this._deviceDraft = { ...this._deviceDraft, [field]: value };
  }

  private async _onSelectGa(ga: string): Promise<void> {
    if (this._selectedGa === ga) {
      this._closeDetail();
      return;
    }
    this._selectedGa = ga;
    // Iter aiohttp-error-ZU9UA / P1: Detail-Pane ist jetzt ein
    // Side-Drawer (fixed-position, rechts). Kein scrollIntoView mehr —
    // der Drawer ist immer sichtbar, sobald _detail / _detailLoading
    // gesetzt ist.
    await this._loadDetail(ga);
  }

  private async _ackGa(ga: string): Promise<void> {
    if (!this.api) return;
    const note = window.prompt(
      `Notiz für ${ga} (optional, leer = keine Notiz):`,
      ""
    );
    if (note === null) return; // Abbrechen
    try {
      await this.api.acknowledgeKnxGa(ga, { note: note || undefined });
      this._showToast(`${ga} als bekannt markiert`);
      await this._load();
    } catch (err) {
      this._showToast(`Fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  private async _unackGa(ga: string): Promise<void> {
    if (!this.api) return;
    try {
      await this.api.unacknowledgeKnxGa(ga);
      this._showToast(`${ga}: Acknowledge entfernt`);
      await this._load();
    } catch (err) {
      this._showToast(`Fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  private _toastTimer?: number;
  private _showToast(text: string): void {
    this._toast = text;
    if (this._toastTimer) window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = ""), 2800);
  }

  private _onPeriod(periodId: string): void {
    this._filters = { ...this._filters, periodId };
    saveFilters(this._filters);
    void this._load();
  }

  private _onTopN(topN: number): void {
    this._filters = { ...this._filters, topN };
    saveFilters(this._filters);
    void this._load();
  }

  private _onTopNDevices(topNDevices: number): void {
    this._filters = { ...this._filters, topNDevices };
    saveFilters(this._filters);
    void this._load();
  }

  // Iter aiohttp-error-ZU9UA: Anzahl-Filter pro Card. Ein gemeinsamer
  // Setter-Helfer waere DRYer, aber jeder Filter hat einen eigenen
  // Schluessel — dafuer pro Card eine 4-Zeilen-Methode, klar lesbar.
  // Diese Setter loesen kein _load() aus, weil die Daten fuer kleinere
  // Tabellen schon im Speicher liegen — wir slicen nur anders.
  private _onTopNAudit(topNAudit: number): void {
    this._filters = { ...this._filters, topNAudit };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _onTopNBursts(topNBursts: number): void {
    this._filters = { ...this._filters, topNBursts };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _onTopNLongTerm(topNLongTerm: number): void {
    this._filters = { ...this._filters, topNLongTerm };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _onTopNTrend(topNTrend: number): void {
    this._filters = { ...this._filters, topNTrend };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _onTopNOrphansMissing(topNOrphansMissing: number): void {
    this._filters = { ...this._filters, topNOrphansMissing };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _onTopNOrphansExtra(topNOrphansExtra: number): void {
    this._filters = { ...this._filters, topNOrphansExtra };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _onTopNSilence(topNSilence: number): void {
    this._filters = { ...this._filters, topNSilence };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _onTopNBusHealth(topNBusHealth: number): void {
    this._filters = { ...this._filters, topNBusHealth };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  // Iter topn-4: Heatmap-Selektor muss `_load()` ausloesen, weil das
  // Backend die Top-N-GAs serverseitig auswaehlt (gas[], matrix[][]
  // im Response sind direkt CSS-Grid-Material, kein clientseitiges
  // Slicing moeglich).
  private _onTopNHeatmap(topNHeatmap: number): void {
    this._filters = { ...this._filters, topNHeatmap };
    saveFilters(this._filters);
    void this._load();
  }

  private _onTopNSiblings(topNSiblings: number): void {
    this._filters = { ...this._filters, topNSiblings };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  // Iter detail-topn: Source-Detail-Pane bekommt eigene TopN-Selektoren
  // fuer GA-Liste und Findings-Liste. Vorher wurden beide ohne Limit
  // gerendert, was bei groesseren Geraeten (>20 GAs / >10 Findings)
  // den Detail-Drawer endlos scrollen liess.
  private _onTopNSourceDetailGas(topNSourceDetailGas: number): void {
    this._filters = { ...this._filters, topNSourceDetailGas };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _onTopNSourceDetailFindings(topNSourceDetailFindings: number): void {
    this._filters = { ...this._filters, topNSourceDetailFindings };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _onTopNGaFindings(topNGaFindings: number): void {
    this._filters = { ...this._filters, topNGaFindings };
    saveFilters(this._filters);
    this.requestUpdate();
  }

  private _renderInlineTopN(
    current: number,
    onChange: (n: number) => void,
    options: ReadonlyArray<number> = TOP_N_OPTIONS,
  ): TemplateResult {
    // Iter 60 / U6: Label "zeige" davor, mehr Padding pro Button.
    // Macht den Selektor sichtbarer und eindeutiger interpretierbar.
    // Iter topn-4: optionale eigene Optionsliste (z. B. Heatmap mit
    // max 30 wegen CSS-Grid-Lesbarkeit).
    return html`
      <span class="inline-topn-wrap">
        <span class="inline-topn-label">zeige</span>
        <span class="inline-topn" role="group" aria-label="Anzahl Einträge">
          ${options.map(
            (n) => html`<button
              class=${`inline-topn__btn ${current === n ? "active" : ""}`}
              @click=${() => onChange(n)}
            >
              ${n}
            </button>`
          )}
        </span>
      </span>
    `;
  }

  private _onMinRate(value: number): void {
    this._filters = { ...this._filters, minRate: Math.max(0, value) };
    saveFilters(this._filters);
    void this._load();
  }

  private _onAckToggle(): void {
    this._filters = { ...this._filters, includeAck: !this._filters.includeAck };
    saveFilters(this._filters);
    void this._load();
  }

  private _renderFilterBar(): TemplateResult {
    return html`
      <div class="filters" role="toolbar" aria-label="KNX-Stats-Filter">
        <div class="filter-group">
          <span class="filter-label">Zeitraum</span>
          <div class="seg">
            ${PERIOD_PRESETS.map(
              (p) => html`<button
                class=${`seg-btn ${this._filters.periodId === p.id ? "active" : ""}`}
                @click=${() => this._onPeriod(p.id)}
              >
                ${p.label}
              </button>`
            )}
          </div>
        </div>

        <label class="filter-group">
          <span class="filter-label">Min. Tel/Min</span>
          <input
            type="number"
            min="0"
            step="0.5"
            class="mh-input narrow"
            .value=${String(this._filters.minRate)}
            @change=${(e: Event) =>
              this._onMinRate(Number.parseFloat((e.target as HTMLInputElement).value) || 0)}
          />
        </label>

        <label class="filter-group toggle">
          <input
            type="checkbox"
            ?checked=${!this._filters.includeAck}
            @change=${this._onAckToggle}
          />
          <span>Bekannte ausblenden</span>
        </label>

        <label class="filter-group toggle">
          <input
            type="checkbox"
            ?checked=${this._busAnalysisEnabled}
            ?disabled=${!this._busAnalysisLoaded}
            @change=${() => void this._toggleBusAnalysis()}
          />
          <span title="Schaltet die bus-weite Erfassung der Telegramme">Bus-Analyse aktiv</span>
        </label>

        <button
          class="mh-btn mh-btn--primary filter-refresh-btn"
          @click=${() => void this._load()}
          ?disabled=${this._loading}
          title="Alle Cards neu vom Backend laden"
        >
          <span class=${this._loading ? "filter-refresh-btn__spin" : ""} aria-hidden="true">↻</span>
          ${this._loading ? "lade…" : "Aktualisieren"}
        </button>
      </div>
    `;
  }

  private _renderKpis(): TemplateResult {
    const s = this._summary;
    if (s === null) {
      return html`<p class="muted">Keine Daten verfuegbar.</p>`;
    }
    const counts = s.counts_by_severity;
    // Iter 36 (Feature A): Buslast bevorzugt aus dem 10s/60s/5m-Bucket-
    // Endpoint (current/max/avg). Fallback auf den Period-Avg im Summary.
    const bl = this._busload;
    const refPct = bl !== null ? bl.summary.max_pct : s.estimated_busload_pct;
    const busloadClass =
      refPct >= 30
        ? "danger"
        : refPct >= 20
          ? "warning"
          : refPct >= 10
            ? "elevated"
            : "ok";
    const fmtPct = (p: number) =>
      p.toLocaleString("de-DE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    return html`
      <div class="kpis">
        <div class="kpi">
          <span class="kpi-label">Telegramme</span>
          <span class="kpi-value">${s.total_telegrams.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">im Zeitraum</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Aktive GAs</span>
          <span class="kpi-value">${s.active_gas.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">im Protokoll</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Aktive Geräte</span>
          <span class="kpi-value">${s.active_devices.toLocaleString("de-DE")}</span>
          <span class="kpi-hint">Source-Adressen</span>
        </div>
        <div class=${`kpi busload busload--${busloadClass}`}>
          <span class="kpi-label">Buslast</span>
          ${bl === null
            ? html`<span class="kpi-value">${fmtPct(s.estimated_busload_pct)} %</span>
                <span class="kpi-hint">Ø über Zeitraum</span>`
            : html`<span class="kpi-value">${fmtPct(bl.summary.max_pct)} %</span>
                <span class="kpi-hint">
                  jetzt ${fmtPct(bl.summary.current_pct)} % · Ø ${fmtPct(bl.summary.avg_pct)} %
                  · Bucket ${this._formatBucket(bl.bucket_seconds)}
                </span>`}
          <!-- Iter 60 / U7: 0–100 %-Verlaufs-Bar statt nur Schwellen-
               Sprung. Hintergrund mit linear-gradient gruen→gelb→orange→
               rot, Marker an Position min(refPct, 100). -->
          <div
            class="busload-bar"
            role="meter"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow=${refPct.toFixed(1)}
            title=${`Buslast ${fmtPct(refPct)} % auf Skala 0–100`}
          >
            <div
              class="busload-bar__marker"
              style=${`left: ${Math.min(100, Math.max(0, refPct)).toFixed(1)}%;`}
            ></div>
          </div>
        </div>
      </div>
      <div class="severity-counts">
        ${(["red", "orange", "yellow", "green"] as const).map(
          (sev) => html`<span class=${`mh-pill ${severityPillClass(sev)}`}>
            <span class="mh-pill__dot"></span>
            ${this._severityLabel(sev)}: ${counts[sev] ?? 0}
          </span>`
        )}
      </div>
    `;
  }

  private _renderHealthScore(): TemplateResult {
    const h = this._health!;
    return html`
      <section class=${`mh-card health-score health-score--${h.severity}`}>
        <header class="card-head">
          <h3>Bus-Health-Score</h3>
          <span class="muted small">aggregiert aus 4 KPIs · letzte ${this._filters.periodId}</span>
        </header>
        <div class="health-score__body">
          <div class="health-score__big">
            <span class="health-score__value">${h.score}</span>
            <span class="health-score__unit">/ 100</span>
            <span class="health-score__label">${this._healthLabel(h.severity)}</span>
          </div>
          <div class="health-score__components">
            ${(["repeat", "busload", "silence", "alarms"] as const).map(
              (key) => {
                const value = h.components[key];
                const sev = this._componentSeverity(value);
                // Iter B3: ``repeat``-KPI ist Approximation, weil xknx
                // das echte Repeat-Bit nicht zuverlaessig liefert. UI
                // markiert den KPI mit einem Stern + Tooltip-Hinweis.
                const isApprox = key === "repeat" && h.repeat_approximate === true;
                const baseLabel = this._componentLabel(key);
                const labelText = isApprox ? `${baseLabel} *` : baseLabel;
                const titleText = isApprox
                  ? `${baseLabel}: ${value}/100 (${this._healthLabel(sev)}) — Approximation: xknx liefert das Repeat-Bit nicht zuverlaessig (BL-D blocked)`
                  : `${baseLabel}: ${value}/100 (${this._healthLabel(sev)})`;
                return html`<div
                  class=${`health-score__badge health-score__badge--${sev}`}
                  title=${titleText}
                  data-test="health-component"
                  data-key=${key}
                  data-approximate=${isApprox ? "true" : "false"}
                >
                  <span class="health-score__badge-label">${labelText}</span>
                  <span class="health-score__badge-value">${value}</span>
                </div>`;
              }
            )}
          </div>
          ${h.findings.length > 0
            ? html`<ul class="health-score__findings">
                ${h.findings.map(
                  (f) => html`<li class=${`health-finding health-finding--${f.severity}`}>
                    <span class="health-finding__dot"></span>
                    <span>${f.message}</span>
                  </li>`
                )}
              </ul>`
            : html`<p class="muted small">Alle Indikatoren im gruenen Bereich.</p>`}
        </div>
      </section>
    `;
  }

  private _healthLabel(severity: "green" | "yellow" | "orange" | "red"): string {
    switch (severity) {
      case "green":
        return "gesund";
      case "yellow":
        return "leicht erhöht";
      case "orange":
        return "auffällig";
      case "red":
        return "kritisch";
    }
  }

  private _componentLabel(key: "repeat" | "busload" | "silence" | "alarms"): string {
    switch (key) {
      case "repeat":
        return "Wiederholungen";
      case "busload":
        return "Buslast-Spitze";
      case "silence":
        return "stumme Geräte";
      case "alarms":
        return "offene Alarme";
    }
  }

  /**
   * Iter aiohttp-error-ZU9UA / P2: Component-Score → Ampel-Severity.
   * Vorher zeigten alle 4 Komponenten gruene Balken, auch wenn der
   * Wert nur 21 war — das hat den Health-Score-Wert (76 / "leicht
   * erhoeht") inkonsistent wirken lassen. Jetzt eigene Severity pro
   * Komponente.
   *   ≥ 80 → green   "gesund"
   *   ≥ 60 → yellow  "leicht erhoeht"
   *   ≥ 40 → orange  "auffaellig"
   *   <  40 → red    "kritisch"
   */
  private _componentSeverity(score: number): "green" | "yellow" | "orange" | "red" {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    if (score >= 40) return "orange";
    return "red";
  }

  // Iter 42: Sicherheits-Audit-Card ---------------------------------------

  private _renderSensitiveLog(): TemplateResult {
    const log = this._sensitiveLog!;
    const fmtTs = (ts: string) => this._formatTs(ts);
    const limit = this._filters.topNAudit;
    const telegramsShown = log.telegrams.slice(0, limit);
    return html`
      <section class="mh-card sensitive">
        <header class="card-head">
          <h3>Sicherheits-Audit</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(this._filters.topNAudit, (n) => this._onTopNAudit(n))}
            <span class="muted small">
              ${log.addresses.length} markierte GAs · ${log.telegrams.length} Telegramme im Zeitraum
            </span>
          </div>
        </header>
        <div class="sensitive__addresses">
          <h4>Sensitive GAs</h4>
          <ul class="sensitive__addr-list">
            ${log.addresses.map(
              (a) => html`<li>
                <code>${a.ga}</code>
                ${a.label ? html`<span class="muted small">${a.label}</span>` : nothing}
                ${a.dpt ? html`<span class="mh-pill mh-pill--neutral">${a.dpt}</span>` : nothing}
              </li>`
            )}
          </ul>
        </div>
        <div class="sensitive__telegrams">
          <h4>Letzte Telegramme</h4>
          ${log.telegrams.length === 0
            ? html`<p class="muted small">Keine Aktivitaet im Zeitraum.</p>`
            : html`<div class="table-wrap">
                <table class="sensitive__table">
                  <thead>
                    <tr>
                      <th>Zeit</th>
                      <th>GA</th>
                      <th>Gerät</th>
                      <th>Wert</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${telegramsShown.map(
                      (t) => html`<tr>
                        <td class="bursts__ts">${fmtTs(t.ts)}</td>
                        <td>
                          <code>${t.ga}</code>
                          ${t.label ? html`<span class="muted small">${t.label}</span>` : nothing}
                        </td>
                        <td><code>${t.dev_source}</code></td>
                        <td><code>${t.value ?? "—"}</code></td>
                      </tr>`
                    )}
                  </tbody>
                </table>
              </div>
              ${log.telegrams.length > limit
                ? html`<p class="muted small">… und ${log.telegrams.length - limit} weitere</p>`
                : nothing}`}
        </div>
      </section>
    `;
  }

  // Iter 41: Burst-Detector-Card -----------------------------------------

  private _renderBursts(): TemplateResult {
    const b = this._bursts!;
    const fmtNum = (n: number) => n.toLocaleString("de-DE");
    const fmtPct = (n: number) =>
      n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const limit = this._filters.topNBursts;
    const burstsShown = b.bursts.slice(0, limit);
    return html`
      <section class="mh-card bursts">
        <header class="card-head">
          <h3>Telegrammfluten (Bursts)</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(this._filters.topNBursts, (n) => this._onTopNBursts(n))}
            <span class="muted small">
              ${b.bursts.length} Spitzen über ${fmtPct(b.threshold_pct)} % Buslast
              (${b.window_seconds}s-Fenster)
            </span>
          </div>
        </header>
        <div class="bursts__intro">
          <p class="muted small">
            Kurze Spitzen, die im Period-Avg untergehen — typisch für
            Sturm-Automatik, gleichzeitige Rolladen-Befehle oder Szene-Trigger.
            Spalte „GAs" zeigt die Anzahl unterschiedlicher Gruppenadressen,
            „Geräte" die Anzahl unterschiedlicher Source-Adressen.
          </p>
        </div>
        <div class="table-wrap">
          <table class="bursts__table">
            <thead>
              <tr>
                <th>Zeit</th>
                <th class="num">Tel</th>
                <th class="num">Buslast</th>
                <th class="num">GAs</th>
                <th class="num">Geräte</th>
              </tr>
            </thead>
            <tbody>
              ${burstsShown.map(
                (burst) => html`<tr>
                  <td class="bursts__ts">${this._formatTs(burst.bucket)}</td>
                  <td class="num">${fmtNum(burst.telegrams)}</td>
                  <td class="num bursts__pct">${fmtPct(burst.busload_pct)} %</td>
                  <td class="num">${burst.ga_count}</td>
                  <td class="num">${burst.source_count}</td>
                </tr>`
              )}
            </tbody>
          </table>
        </div>
        ${b.bursts.length > limit
          ? html`<p class="muted small">… und ${b.bursts.length - limit} weitere</p>`
          : nothing}
      </section>
    `;
  }

  // Iter 39: Long-Term-Modus-Hinweis + Counter-Karte ----------------------

  private _renderLongTermBanner(): TemplateResult {
    return html`
      <div class="long-term-banner">
        <span class="long-term-banner__icon">⏳</span>
        <div>
          <strong>Long-Term-Modus aktiv</strong>
          <p class="muted small">
            Periode über 48 Std — die Counter-Tabelle liefert Telegramm-Counts pro
            Stunde/Tag, aber keine Source-Adressen, keine Werte und keine Repeats.
            Live-KPIs darunter zeigen die letzten 48 Std aus den Roh-Telegrammen.
          </p>
        </div>
      </div>
    `;
  }

  private _renderLongTerm(): TemplateResult {
    const lt = this._longTerm!;
    const maxCount = Math.max(1, ...lt.series.map((b) => b.count));
    const fmtNum = (n: number) => n.toLocaleString("de-DE");
    const limit = this._filters.topNLongTerm;
    return html`
      <section class="mh-card long-term">
        <header class="card-head">
          <h3>Long-Term-Sicht</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(this._filters.topNLongTerm, (n) =>
              this._onTopNLongTerm(n)
            )}
            <span class="muted small">
              ${fmtNum(lt.total)} Telegramme · ${lt.bucket === "day" ? "Tages-Buckets" : "Stunden-Buckets"}
            </span>
          </div>
        </header>
        <div class="long-term__body">
          <div class="long-term__chart">
            ${lt.series.length === 0
              ? html`<p class="muted">Keine Daten in der Counter-Tabelle.</p>`
              : html`<div class="long-term__bars">
                  ${lt.series.map(
                    (b) => html`<div
                      class="long-term__bar"
                      style=${`height: ${(b.count / maxCount) * 100}%`}
                      title="${b.bucket} — ${fmtNum(b.count)}"
                    ></div>`
                  )}
                </div>`}
          </div>
          <div class="long-term__top">
            <h4>Top-GAs in der Periode</h4>
            ${lt.top_gas.length === 0
              ? html`<p class="muted small">Keine GAs aktiv.</p>`
              : html`<ol class="long-term__top-list">
                  ${lt.top_gas.slice(0, limit).map(
                    (g) => html`<li>
                      <code>${g.ga}</code>
                      ${g.label ? html`<span class="muted small">${g.label}</span>` : nothing}
                      <span class="long-term__top-count">${fmtNum(g.count)}</span>
                    </li>`
                  )}
                </ol>`}
          </div>
        </div>
      </section>
    `;
  }

  private _formatBucket(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  }

  private _severityLabel(sev: "green" | "yellow" | "orange" | "red"): string {
    switch (sev) {
      case "green":
        return "OK";
      case "yellow":
        return "leicht erhöht";
      case "orange":
        return "auffällig";
      case "red":
        return "kritisch";
    }
  }

  // Iter 07-Refactor: render() hatte CC=32 (Sonar-Limit 15) durch
  // ~20 Conditional-Sections (`X !== null && X.foo.length > 0 ? this._renderX() : nothing`).
  // Aufgeteilt in vier thematische Render-Helfer plus einen
  // Bus-Analysis-Banner-Helfer. CC verteilt sich damit auf mehrere
  // Methoden, jede unter 15.
  private _renderBusAnalysisOffBanner(): TemplateResult | typeof nothing {
    if (!(this._busAnalysisLoaded && !this._busAnalysisEnabled)) return nothing;
    return html`<div class="bus-analysis-banner">
      <strong>Bus-Analyse ist aus.</strong>
      Es werden keine neuen Telegramme erfasst — bestehende Daten bleiben
      sichtbar, altern aber raus (Raw 48 h, Counter 365 Tage). Toggle in der
      Filter-Leiste oben rechts schaltet sie wieder ein.
    </div>`;
  }

  private _renderTopBanners(): TemplateResult {
    const apiBanner =
      this._apiErrors.size > 0 && !this._apiErrorsDismissed
        ? this._renderApiErrorBanner()
        : nothing;
    const errBanner = this._error ? html`<div class="error">${this._error}</div>` : nothing;
    const alarmBanner =
      this._alarms !== null && this._alarms.triggered_count > 0
        ? this._renderAlarmBanner()
        : nothing;
    const longTermBanner = this._isLongTermMode() ? this._renderLongTermBanner() : nothing;
    return html`
      ${apiBanner}
      ${this._renderBusAnalysisOffBanner()}
      ${errBanner}
      ${alarmBanner}
      ${longTermBanner}
    `;
  }

  private _renderTopSenderSection(): TemplateResult {
    return html`<section class="mh-card">
      <header class="card-head">
        <h3>Top-Sender (Gruppenadressen)</h3>
        <div class="card-head__meta">
          ${this._renderInlineTopN(this._filters.topN, (n) => this._onTopN(n))}
          <span class="muted small">
            Welche GA sendet am häufigsten? · ${this._top.length} sichtbar
          </span>
        </div>
      </header>
      ${this._renderTopTable()}
    </section>`;
  }

  private _renderTopDevicesSection(): TemplateResult | typeof nothing {
    if (this._topBySource.length === 0) return nothing;
    return html`<section class="mh-card">
      <header class="card-head">
        <h3>Top-Geräte (Source-Adressen)</h3>
        <div class="card-head__meta">
          ${this._renderInlineTopN(this._filters.topNDevices, (n) => this._onTopNDevices(n))}
          <span class="muted small">
            Welches physische Gerät erzeugt am meisten Last?
          </span>
        </div>
      </header>
      ${this._renderTopBySource()}
    </section>`;
  }

  private _hasDetailToShow(): boolean {
    return (
      this._detail !== null ||
      this._detailLoading ||
      this._sourceDetail !== null ||
      this._sourceDetailLoading
    );
  }

  private _renderVisualSections(): TemplateResult {
    const timeline =
      this._timeline !== null && this._timeline.items.length > 0
        ? html`<section class="mh-card">
            <header class="card-head">
              <h3>Tagesverlauf (Top-5, ${this._timeline.bucket_minutes}-Min-Buckets)</h3>
            </header>
            <knx-timeline-chart
              .items=${this._timeline.items}
              .width=${800}
              .height=${140}
            ></knx-timeline-chart>
          </section>`
        : nothing;
    const heatmap =
      this._heatmap !== null && this._heatmap.gas.length > 0
        ? this._renderHeatmap()
        : nothing;
    const trend =
      this._trend !== null &&
      (this._trend.total_now > 0 || this._trend.total_prev > 0)
        ? this._renderTrend()
        : nothing;
    return html`${timeline}${heatmap}${trend}`;
  }

  private _renderAnomalySections(): TemplateResult {
    const bursts =
      this._bursts !== null && this._bursts.bursts.length > 0
        ? this._renderBursts()
        : nothing;
    const silence =
      this._silence !== null && this._silence.alarm_count > 0
        ? this._renderSilenceAlarms()
        : nothing;
    const busHealth =
      this._busHealth !== null && this._busHealth.summary.total > 0
        ? this._renderBusHealth()
        : nothing;
    return html`${bursts}${silence}${busHealth}`;
  }

  private _hasOrphansToShow(): boolean {
    return (
      this._orphans !== null &&
      (this._orphans.missing_in_log.length > 0 || this._orphans.extra_in_log.length > 0)
    );
  }

  private _renderAuditSections(): TemplateResult {
    const sensitive =
      this._sensitiveLog !== null && this._sensitiveLog.addresses.length > 0
        ? this._renderSensitiveLog()
        : nothing;
    const orphans = this._hasOrphansToShow() ? this._renderOrphans() : nothing;
    return html`${sensitive}${orphans}`;
  }

  private _renderOverview(): TemplateResult {
    return html`<section class="mh-card kpi-card">
      <header class="card-head">
        <h3>
          ${this._isLongTermMode() ? "Live-Snapshot (letzte 48 Std)" : "Uebersicht"}
        </h3>
        <span class="muted small">letzte ${this._filters.periodId}</span>
      </header>
      ${this._loading && this._summary === null
        ? html`<p class="muted">lade…</p>`
        : this._renderKpis()}
    </section>`;
  }

  override render(): TemplateResult {
    return html`
      <div class="root">
        <div class="info-banner">
          <strong>Bus-weite Auswertung:</strong>
          alle Telegramme aus dem Gruppenmonitor werden 48 h vorgehalten —
          unabhaengig davon, ob die GA in der Whitelist (Einstellungen →
          KNX-Adressen) als „Loggen aktiv" markiert ist. Whitelisted GAs
          landen zusaetzlich im Logbuch (Tab „Nachrichten").
        </div>
        ${this._renderFilterBar()}
        ${this._renderTopBanners()}

        <!--
          Iter aiohttp-error-ZU9UA: Reihenfolge nach mentalem User-Modell:
          1. At-a-glance: Übersicht-KPIs + Health-Score
          2. Haupttabellen: Top-Sender / Top-Geräte (+ Detail-Pane direkt darunter)
          3. Visuelle Auswertungen: Tagesverlauf, Heatmap, Trend
          4. Anomalie-Cards: Bursts, Stille-Alarme, Bus-Gesundheit
          5. Audit / Diagnose-Listen: Sicherheits-Audit, Verwaiste GAs
          6. Long-Term-Sicht (cond.) ans Ende
        -->

        ${this._renderOverview()}
        ${this._health !== null ? this._renderHealthScore() : nothing}
        ${this._renderTopSenderSection()}
        ${this._renderTopDevicesSection()}
        ${this._hasDetailToShow() ? this._renderDetailPane() : nothing}
        ${this._renderVisualSections()}
        ${this._renderAnomalySections()}
        ${this._renderAuditSections()}
        ${this._longTerm !== null ? this._renderLongTerm() : nothing}
        ${this._toast ? html`<div class="toast">${this._toast}</div>` : nothing}
      </div>
    `;
  }

  private _renderTopTable(): TemplateResult {
    if (this._loading && this._top.length === 0) {
      return html`<p class="muted">lade…</p>`;
    }
    if (this._top.length === 0) {
      return html`<p class="muted">Keine Telegramme in diesem Zeitraum.</p>`;
    }
    // Iter 60 / U5: Sortierte Kopie. Backend liefert per rate_per_min
    // desc, der User soll aber nach allen anderen Spalten sortieren
    // koennen. Pure Funktion — kein Backend-Roundtrip pro Klick.
    const sortKey = this._topSortKey;
    const sortDir = this._topSortDir;
    const sorted = sortTopSender(this._top, sortKey, sortDir);
    // Iter D8: Wenn der User nach severity / GA / Label sortiert,
    // kann ein "rotes" GA ausserhalb der Top-N (per Tel/Min) liegen
    // und damit unsichtbar sein. Hinweis nur, wenn nicht-Default-Sort.
    const isNonDefaultSort = sortKey !== "rate_per_min" || sortDir !== "desc";
    const sortHint = isNonDefaultSort
      ? html`<p
          class="muted small"
          data-test="sort-hint"
          title="Top-N wird vom Backend nach Tel/Min ausgewaehlt — die Sortierung wirkt nur auf diese Auswahl, nicht auf alle GAs."
        >
          ⓘ Sortierung wirkt nur auf die Top-${this._filters.topN} nach
          Tel/Min — andere GAs sind nicht in der Liste.
        </p>`
      : null;
    return html`
      ${sortHint}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("ga")}
                title="Nach Gruppenadresse sortieren"
              >
                GA${this._sortArrow(sortKey, "ga", sortDir)}
              </th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("label")}
                title="Nach Label sortieren"
              >
                Label${this._sortArrow(sortKey, "label", sortDir)}
              </th>
              <th>DPT</th>
              <th
                class="num sortable"
                @click=${() => this._toggleTopSort("rate_per_min")}
                title="Nach Telegrammen/Min sortieren"
              >
                Tel/Min${this._sortArrow(sortKey, "rate_per_min", sortDir)}
              </th>
              <th
                class="num sortable"
                @click=${() => this._toggleTopSort("recommended_rate")}
                title="Nach Soll-Rate sortieren"
              >
                Soll${this._sortArrow(sortKey, "recommended_rate", sortDir)}
              </th>
              <th
                class="sortable"
                @click=${() => this._toggleTopSort("severity")}
                title="Nach Schweregrad sortieren"
              >
                Status${this._sortArrow(sortKey, "severity", sortDir)}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(
              (row, idx) => html`<tr
                class=${`row-${row.severity} ${row.acknowledged ? "ack" : ""} ${
                  this._selectedGa === row.ga ? "selected" : ""
                }`}
                @click=${() => void this._onSelectGa(row.ga)}
              >
                <td class="num muted">${idx + 1}</td>
                <td><code class="ga">${row.ga}</code></td>
                <td class="label-cell" title=${row.label ?? ""}>
                  ${row.label ?? html`<span class="muted">—</span>`}
                </td>
                <td>
                  ${row.dpt
                    ? html`<code
                        class=${`dpt ${row.dpt_inferred ? "dpt--inferred" : ""}`}
                        title=${row.dpt_inferred
                          ? "DPT geraten aus Werten (im ETS-Projekt nicht gepflegt)"
                          : ""}
                        >${row.dpt}${row.dpt_inferred
                          ? html`<span class="dpt__hint" aria-hidden="true">?</span>`
                          : nothing}</code
                      >`
                    : html`<span class="muted">—</span>`}
                </td>
                <td class="num strong">${row.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td class="num muted">${row.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                <td>${this._renderTopRowStatus(row)}</td>
                <td class="actions">
                  ${row.acknowledged
                    ? html`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          void this._unackGa(row.ga);
                        }}
                      >
                        ✗ Ack entfernen
                      </button>`
                    : html`<button
                        class="mh-btn mh-btn--sm mh-btn--ghost"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          void this._ackGa(row.ga);
                        }}
                      >
                        ✓ Bekannt
                      </button>`}
                </td>
              </tr>`
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  // Iter aiohttp-error-ZU9UA / P1: Detail-Pane als Side-Drawer.
  // Vorher inline am Tabellenende (User musste runterscrollen, Tabelle
  // war beim Lesen weg). Jetzt: position: fixed rechts, Backdrop links,
  // Tabelle bleibt sichtbar — User kann zwischen Detail und Tabelle
  // springen. Schliessen via X / Backdrop-Klick / Escape.
  private _renderDetailPane(): TemplateResult {
    // Iter D.2 (knx-detail-panes): zwei Inhalte teilen sich den Drawer
    // — entweder GA-Detail oder Source-Detail. GA-Detail hat Vorrang,
    // wenn beide gesetzt sind (defensive — passiert nicht, weil
    // _loadSourceDetail vorher _closeDetail() ruft).
    const showGa = this._detail !== null || this._detailLoading;
    const close = (): void =>
      showGa ? this._closeDetail() : this._closeSourceDetail();
    return html`
      <div
        class="detail-backdrop"
        @click=${close}
        aria-hidden="true"
      ></div>
      <aside
        class="mh-card detail-pane"
        role="dialog"
        aria-modal="true"
        aria-label=${this._detailPaneAriaLabel()}
      >
        <header class="card-head detail-head">
          ${this._renderDetailHead()}
          <button
            class="mh-btn mh-btn--sm mh-btn--ghost detail-close"
            title="Schliessen (Escape)"
            aria-label="Detail schliessen"
            @click=${close}
          >
            ✕ Schliessen
          </button>
        </header>
        <div class="detail-body">${this._renderDetailInner()}</div>
      </aside>
    `;
  }

  private _detailPaneAriaLabel(): string {
    if (this._detail !== null) {
      return `Detail ${this._detail.ga} — ${this._detail.label ?? ""}`;
    }
    if (this._sourceDetail !== null) {
      return `Geraete-Detail ${this._sourceDetail.dev_source}`;
    }
    return "Detail laedt";
  }

  private _renderDetailHead(): TemplateResult {
    if (this._detail !== null) {
      return html`<div class="detail-head-text">
        <h3>${this._detail.ga} — ${this._detail.label ?? "Detail"}</h3>
        <span class="muted small">
          Gerät:
          <code>${this._detail.dev_source || "?"}</code>
          ${this._detail.dpt
            ? html` • DPT <code>${this._detail.dpt}</code>`
            : nothing}
        </span>
      </div>`;
    }
    if (this._sourceDetail !== null) {
      const sd = this._sourceDetail;
      // Iter D.2: Refresh-Aktion ermoeglicht User, die Source-Detail-
      // Werte nach einer Aenderung ohne Drawer-Schliessen neu zu laden.
      // Ankerpunkt fuer _loadSourceDetail im Class-Body (waere sonst
      // bis Iter E ohne Class-internen Caller).
      const reload = (): void => {
        if (this._selectedSource !== null) {
          void this._loadSourceDetail(this._selectedSource);
        }
      };
      return html`<div class="detail-head-text">
        <h3>
          Gerät <code>${sd.dev_source}</code>
          <button
            class="mh-btn mh-btn--sm mh-btn--ghost source-detail-reload"
            title="Geraete-Detail neu laden"
            aria-label="Geraete-Detail neu laden"
            @click=${reload}
          >
            ⟳
          </button>
        </h3>
        <span class="muted small">
          ${sd.total_count.toLocaleString("de-DE")} Telegramme ·
          ${sd.ga_count} GAs
        </span>
      </div>`;
    }
    return html`<div class="detail-head-text"><h3>Detail</h3></div>`;
  }

  private _renderDetailInner(): TemplateResult {
    if (this._detail !== null) {
      return this._renderDetailBody(this._detail);
    }
    if (this._detailLoading) {
      return html`<p class="muted">lade Details…</p>`;
    }
    if (this._sourceDetail !== null) {
      return this._renderSourceDetailBody(this._sourceDetail);
    }
    if (this._sourceDetailLoading) {
      return html`<p class="muted">lade Geräte-Details…</p>`;
    }
    return html``;
  }

  private _renderDetailBody(d: KnxStatsGaDetailDto): TemplateResult {
    const rec = d.recommendation;
    return html`

        <div class="detail-stats">
          <div class="detail-stat">
            <span class="muted small">Ist-Rate</span>
            <strong>${d.rate_per_min.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Tel/Min</strong>
          </div>
          <div class="detail-stat">
            <span class="muted small">Soll-Rate</span>
            <strong>${d.recommended_rate.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Tel/Min</strong>
          </div>
          <div class="detail-stat">
            <span class="muted small">Verhaeltnis</span>
            <strong>${
              Number.isFinite(rec.ratio)
                ? rec.ratio.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "x"
                : "∞"
            }</strong>
          </div>
          ${rec.estimated_reduction_pct !== null
            ? html`<div class="detail-stat">
                <span class="muted small">Geschaetzte Reduktion</span>
                <strong>−${rec.estimated_reduction_pct.toLocaleString(
                  "de-DE",
                  { maximumFractionDigits: 0 }
                )} %</strong>
              </div>`
            : nothing}
        </div>

        <div class=${`recommendation rec-${rec.severity}`}>
          <strong>Empfehlung:</strong>
          <p>${rec.text}</p>
        </div>

        ${d.findings.length > 0
          ? this._renderGaDetailFindings(d.findings)
          : nothing}

        ${d.value_history.length >= 2
          ? html`<div class="value-history">
              <strong>Wertverlauf:</strong>
              <knx-value-sparkline
                .points=${d.value_history}
                .width=${800}
                .height=${100}
              ></knx-value-sparkline>
            </div>`
          : nothing}

        ${d.device || d.manufacturer_hints
          ? this._renderDeviceInfo(d)
          : nothing}

        ${d.sibling_gas.length > 0
          ? this._renderSiblingGas(d)
          : nothing}

        ${this._renderHaKnxLinks(d)}
    `;
  }

  // Iter detail-topn: GA-Detail-Findings ("Erkannte Muster") jetzt mit
  // TopN-Selektor (Default 10) + "und N weitere"-Hinweis. Vorher wurde
  // die Liste komplett gerendert — bei findingsreichen GAs (DPT-Mismatch
  // mit vielen unterschiedlichen Mustern) war der Detail-Drawer
  // entsprechend lang.
  private _renderGaDetailFindings(
    findings: ReadonlyArray<KnxStatsGaDetailDto["findings"][number]>,
  ): TemplateResult {
    const limit = this._filters.topNGaFindings;
    const shown = findings.slice(0, limit);
    const remaining = findings.length - shown.length;
    return html`<div class="findings">
      <div class="source-detail-section-head">
        <strong>Erkannte Muster (${findings.length}):</strong>
        ${this._renderInlineTopN(limit, (n) =>
          this._onTopNGaFindings(n),
        )}
      </div>
      <ul>
        ${shown.map(
          (f) => html`<li class=${`finding-${f.severity}`}>
            <span class=${`mh-pill ${this._severityPillClass(f.severity)}`}>
              ${f.kind}
            </span>
            <span>${f.text}</span>
          </li>`,
        )}
      </ul>
      ${remaining > 0
        ? html`<p class="muted small">… und ${remaining} weitere</p>`
        : nothing}
    </div>`;
  }

  /**
   * Iter 64 / WR-P: Direktlinks aus dem Detail-Pane.
   * Iter 68 / WR-F: + Werteverlauf-Export-Links (CSV/JSON).
   *
   * Tab-Wechsel innerhalb messagehub (z. B. zu Settings → KNX-Adressen
   * mit GA-Filter vorbefüllt) wuerde Top-Level-State-Sharing brauchen
   * — bewusst NICHT hier verdrahtet, weil das mehr Refactor-Aufwand
   * waere als der Mehrwert. User kann den GA-Code copy-pasten.
   */
  private _renderHaKnxLinks(d: KnxStatsGaDetailDto): TemplateResult {
    const forumUrl = `https://knx-user-forum.de/forum/search?searchword=${encodeURIComponent(
      d.ga,
    )}`;
    // Iter 68: from/to aus aktuellen Filtern uebernehmen, damit der
    // Export denselben Zeitraum wie das Detail-Pane abdeckt. KnxStatsFilters
    // kann from/to undefined enthalten (Vorwaert-Kompatibilitaet) — wir
    // kappen leere Strings ab, der Endpoint nutzt dann den Default.
    // F-011: URL-Bauer ueber typisierten ApiClient.knxStatsGaExportUrl,
    // damit GA-Adressen mit Slashes korrekt encoded werden.
    const f = this._apiFilters();
    const range = { from: f.from, to: f.to };
    const csvUrl = this.api?.knxStatsGaExportUrl(d.ga, "csv", range) ?? "";
    const jsonUrl = this.api?.knxStatsGaExportUrl(d.ga, "json", range) ?? "";
    return html`
      <div class="ha-links">
        <strong>Schnell-Aktionen:</strong>
        <ul class="ha-links__list">
          <li>
            <a
              href="/config/integrations/integration/knx"
              target="_top"
              title="HA-Integration KNX-Konfig öffnen"
              >HA-KNX-Konfig öffnen ↗</a
            >
          </li>
          <li>
            <a
              href=${forumUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="KNX-User-Forum nach GA-Code durchsuchen"
              >Im KNX-User-Forum suchen ↗</a
            >
          </li>
          <li>
            <a
              href=${csvUrl}
              download
              title="Werteverlauf als CSV-Datei herunterladen (max 50.000 Samples)"
              >⤓ CSV-Export</a
            >
          </li>
          <li>
            <a
              href=${jsonUrl}
              download
              title="Werteverlauf als JSON-Datei herunterladen (max 50.000 Samples)"
              >⤓ JSON-Export</a
            >
          </li>
        </ul>
      </div>
    `;
  }

  private _renderDeviceInfo(
    d: Pick<KnxStatsGaDetailDto, "device" | "manufacturer_hints">,
  ): TemplateResult {
    const dev = d.device;
    const hints = d.manufacturer_hints;
    return html`
      <div class="device-info">
        ${dev
          ? html`<strong>
              Gerät: ${dev.manufacturer || "?"}
              ${dev.name ? html` — ${dev.name}` : nothing}
              ${dev.product
                ? html`<span class="muted small">(${dev.product})</span>`
                : nothing}
            </strong>`
          : html`<strong>Hersteller-Hinweise</strong>`}
        ${hints && hints.tips.length > 0
          ? html`<ul class="hints">
              ${hints.tips.map((t) => html`<li>${t}</li>`)}
            </ul>`
          : nothing}
        ${hints?.doc_url
          ? html`<p class="muted small">
              Hersteller-Doku:
              <a href=${hints.doc_url} target="_blank" rel="noopener noreferrer">
                ${hints.doc_url}
              </a>
            </p>`
          : nothing}
      </div>
    `;
  }

  // ===================================================================
  // Iter D.2 (knx-detail-panes): Source-Detail-Body.
  // ===================================================================
  //
  // Aufbau analog zum GA-Detail-Body (siehe `_renderDetailBody`):
  // - KPI-Reihe (Total / GAs / Bus-Anteil / Wiederhol-Quote)
  // - Stille-Status (prominent wenn silent_alarm)
  // - GA-Liste sortiert nach count desc, jede Zeile klickbar -> oeffnet
  //   GA-Detail (kein zweites Modal, Architektur-Entscheid aus
  //   knx_detail_panes_konzept.md)
  // - Geraete-Info (device + manufacturer_hints) wie im GA-Detail
  //
  // Zukuenftige Erweiterungen: Findings-Liste (Iter H), Trend-Compare
  // (Iter I) als zusaetzliche Sektionen.
  private _renderSourceDetailBody(
    d: KnxStatsSourceDetailDto,
  ): TemplateResult {
    return html`
      <div class="source-detail-kpis">
        ${this._renderSourceDetailKpi(
          "Telegramme gesamt",
          d.total_count.toLocaleString("de-DE"),
        )}
        ${this._renderSourceDetailKpi(
          "Aktive GAs",
          String(d.ga_count),
        )}
        ${this._renderSourceDetailKpi(
          "Bus-Anteil",
          `${d.share_pct.toLocaleString("de-DE", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })} %`,
        )}
        ${this._renderSourceDetailKpi(
          "Wiederhol-Quote",
          `${d.repeat_ratio_pct.toLocaleString("de-DE", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })} %`,
        )}
      </div>

      ${this._renderSourceDetailSilent(d)}

      ${this._renderSourceDetailTrend(d)}

      ${this._renderSourceDetailGas(d)}

      ${this._renderSourceDetailFindings(d)}

      ${this._renderRecommendationCard()}

      ${d.device || d.manufacturer_hints
        ? this._renderDeviceInfo({
            device: d.device,
            manufacturer_hints: d.manufacturer_hints,
          })
        : nothing}
    `;
  }

  // Iter L1.4: Recommendation-Card. Default: collapsed; aufklappen
  // triggert API-Call + Anzeige. Headline (Mode-Pill + Empfehlung)
  // ist immer sichtbar, sobald der API-Call fertig ist.
  private _renderRecommendationCard(): TemplateResult {
    if (this._selectedSource === null) return html``;
    return html`
      <section class="mh-card recommendation-card">
        <header class="card-head recommendation-card__head">
          <button
            type="button"
            class="recommendation-card__toggle"
            @click=${() => this._toggleRecommendation()}
            aria-expanded=${this._recommendationExpanded ? "true" : "false"}
          >
            <span class="recommendation-card__caret">
              ${this._recommendationExpanded ? "▾" : "▸"}
            </span>
            <h3>Sende-Modus &amp; Empfehlung</h3>
          </button>
          ${this._renderRecommendationHeadline()}
        </header>
        ${this._recommendationExpanded
          ? this._renderRecommendationBody()
          : nothing}
      </section>
    `;
  }

  private _renderRecommendationHeadline(): TemplateResult {
    if (this._recommendationLoading) {
      return html`<span class="muted small">Lade Empfehlung...</span>`;
    }
    if (this._recommendationError !== "") {
      return html`<span class="mh-pill mh-pill--error">Fehler</span>`;
    }
    const reco = this._recommendation;
    if (reco === null) {
      return html`<span class="muted small">Klicken zum Laden</span>`;
    }
    const modePill = this._renderRecommendationModePill(reco.headline_mode);
    const confPill = this._renderRecommendationConfidencePill(reco.confidence);
    return html`<span class="recommendation-card__pills">${modePill} ${confPill}</span>`;
  }

  // Iter R6: Pill-Render in pure ``recommendation-pills`` ausgelagert.
  // Diese Wrapper bleiben als private Methoden erhalten, weil Subviews
  // (Headline, GA-Tabelle) die gleichen Aufrufstellen nutzen — der
  // Bezug zur ``KnxStatsSourceRecommendationDto``-Typisierung bleibt
  // hier zentral.
  private _renderRecommendationModePill(
    mode: KnxStatsSourceRecommendationDto["headline_mode"],
  ): TemplateResult {
    return renderRecommendationModePill(mode);
  }

  private _renderRecommendationConfidencePill(
    confidence: KnxStatsSourceRecommendationDto["confidence"],
  ): TemplateResult {
    return renderRecommendationConfidencePill(confidence);
  }

  private _renderRecommendationBody(): TemplateResult {
    if (this._recommendationLoading) {
      return html`<p class="muted">Berechne Empfehlung — kann ein paar Sekunden dauern...</p>`;
    }
    if (this._recommendationError !== "") {
      return html`<div class="recommendation-card__error">
        <p class="mh-error">${this._recommendationError}</p>
        <button
          type="button"
          class="mh-button"
          @click=${() => {
            if (this._selectedSource) {
              void this._loadRecommendation(this._selectedSource);
            }
          }}
        >
          Erneut versuchen
        </button>
      </div>`;
    }
    const reco = this._recommendation;
    if (reco === null) {
      return html`<p class="muted">
        Geraet hat im aktuellen Zeitraum keine Telegramme — keine
        Empfehlung verfuegbar.
      </p>`;
    }
    return html`
      <p class="recommendation-card__headline">${reco.headline_recommendation}</p>
      ${reco.reasoning.length > 0
        ? html`<details class="recommendation-card__reasoning">
            <summary>Begründung (${reco.reasoning.length})</summary>
            <ul>
              ${reco.reasoning.map(
                (entry) => html`<li>${entry}</li>`,
              )}
            </ul>
          </details>`
        : nothing}
      ${this._renderDeviceProfileEditor()}
      ${this._renderRecommendationGaTable(reco)}
      <p class="muted small recommendation-card__footer">
        Berechnet am ${reco.generated_at} fuer Geraet
        <code>${reco.dev_source}</code>.
      </p>
    `;
  }

  // Iter L2.4 / L2.5: Geraete-Profil-Anzeige.
  // ETS-Discovery liefert Hersteller + Modell automatisch — Anzeige
  // ohne User-Pflegeaufwand. `knx_devices`-Eintrag (User-Override)
  // hat Vorrang, wenn gepflegt.
  private _renderDeviceProfileEditor(): TemplateResult {
    const dev = this._device;
    if (this._deviceEditing) {
      return this._renderDeviceProfileForm();
    }
    const userMfr = dev?.manufacturer ?? null;
    const userModel = dev?.model ?? null;
    const ets = dev?.ets ?? null;
    const hasUserOverride = !!(userMfr || userModel);
    const hasEts = !!(ets?.manufacturer || ets?.model);
    let primaryLine: TemplateResult;
    if (hasUserOverride) {
      primaryLine = html`<span>
        ${userMfr ?? "—"}${userModel ? html` / ${userModel}` : nothing}
        <span class="muted small">(User-Override)</span>
      </span>`;
    } else if (hasEts) {
      primaryLine = html`<span>
        ${ets!.manufacturer ?? "—"}${ets!.model
          ? html` / ${ets!.model}`
          : nothing}
        <span class="muted small">(aus ETS-Projekt)</span>
      </span>`;
    } else {
      primaryLine = html`<span class="muted">
        kein Geraete-Profil verfuegbar (weder ETS noch Override)
      </span>`;
    }
    return html`
      <div class="recommendation-card__device-profile">
        <strong>Geraet:</strong>
        ${primaryLine}
        ${dev?.notes
          ? html`<span class="muted small">"${dev.notes}"</span>`
          : nothing}
        <button
          type="button"
          class="mh-button mh-button--ghost"
          @click=${() => this._startEditDevice()}
        >
          ${hasUserOverride ? "Override bearbeiten" : "Override anlegen"}
        </button>
      </div>
    `;
  }

  private _renderDeviceProfileForm(): TemplateResult {
    return html`
      <div class="recommendation-card__device-form">
        <label>
          <span class="muted small">Hersteller</span>
          <input
            type="text"
            .value=${this._deviceDraft.manufacturer ?? ""}
            ?disabled=${this._deviceSaving}
            @input=${(e: InputEvent) =>
              this._onDeviceDraftChange(
                "manufacturer",
                (e.target as HTMLInputElement).value,
              )}
          />
        </label>
        <label>
          <span class="muted small">Modell</span>
          <input
            type="text"
            .value=${this._deviceDraft.model ?? ""}
            ?disabled=${this._deviceSaving}
            @input=${(e: InputEvent) =>
              this._onDeviceDraftChange(
                "model",
                (e.target as HTMLInputElement).value,
              )}
          />
        </label>
        <label>
          <span class="muted small">Notiz (optional)</span>
          <input
            type="text"
            .value=${this._deviceDraft.notes ?? ""}
            ?disabled=${this._deviceSaving}
            @input=${(e: InputEvent) =>
              this._onDeviceDraftChange(
                "notes",
                (e.target as HTMLInputElement).value,
              )}
          />
        </label>
        ${this._deviceError
          ? html`<p class="mh-error">${this._deviceError}</p>`
          : nothing}
        <div class="recommendation-card__device-form-actions">
          <button
            type="button"
            class="mh-button"
            ?disabled=${this._deviceSaving}
            @click=${() => void this._saveDevice()}
          >
            ${this._deviceSaving ? "Speichere..." : "Speichern"}
          </button>
          <button
            type="button"
            class="mh-button mh-button--ghost"
            ?disabled=${this._deviceSaving}
            @click=${() => this._cancelEditDevice()}
          >
            Abbrechen
          </button>
        </div>
      </div>
    `;
  }

  private _renderRecommendationGaTable(
    reco: KnxStatsSourceRecommendationDto,
  ): TemplateResult {
    if (reco.ga_recommendations.length === 0) {
      return html``;
    }
    return html`
      <table class="recommendation-card__table">
        <thead>
          <tr>
            <th>GA</th>
            <th>DPT</th>
            <th>aktuell</th>
            <th>empfohlen</th>
            <th>Sendezyklus</th>
            <th>Hysterese</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          ${reco.ga_recommendations.map(
            (ga) => html`<tr
              class=${`recommendation-card__row recommendation-card__row--${ga.severity}`}
              title=${ga.rationale ?? ""}
            >
              <td><code>${ga.ga}</code> ${ga.label ? html`<span class="muted small">${ga.label}</span>` : nothing}</td>
              <td>${ga.dpt ?? "—"}</td>
              <td>${this._renderRecommendationModePill(ga.observed.mode)}</td>
              <td>${ga.recommended_mode === null
                ? html`<span class="muted">—</span>`
                : html`${this._renderRecommendationModePill(ga.recommended_mode)}
                  ${this._renderRecommendationSourcePill(ga.source ?? null)}`}</td>
              <td class="recommendation-cycle">
                ${this._renderRecommendationCycle(ga)}
              </td>
              <td>${ga.recommended_hysteresis ?? "—"}</td>
              <td>${this._renderRecommendationSeverityPill(ga.severity)}</td>
            </tr>`,
          )}
        </tbody>
      </table>
    `;
  }

  // Iter UX-5: Sendezyklus-Spalte mit klarer, modus-abhaengiger
  // Beschriftung. Vorher stand nur "(5–30 Min)" hinter dem Modus-Pill —
  // ohne Kontext, was die Zahl bedeutet (Heartbeat? Maximalrate?
  // Periode?).
  private _renderRecommendationCycle(
    ga: KnxStatsSourceRecommendationDto["ga_recommendations"][number],
  ): TemplateResult {
    return renderRecommendationCycle(ga);
  }

  private _renderRecommendationSourcePill(
    source:
      | KnxStatsSourceRecommendationDto["ga_recommendations"][number]["source"]
      | null,
  ): TemplateResult {
    return renderRecommendationSourcePill(source ?? null);
  }

  private _renderRecommendationSeverityPill(
    sev: KnxStatsSourceRecommendationDto["ga_recommendations"][number]["severity"],
  ): TemplateResult {
    return renderRecommendationSeverityPill(sev);
  }

  // Iter I (knx-detail-panes): Trend-Compare-Block. Severity-Klassi-
  // fikation analog zur globalen Trend-Card (`_classifyTrendSeverity`).
  // Bei kurzen Perioden liefert der Backend trend=null — kein Render.
  private _renderSourceDetailTrend(
    d: KnxStatsSourceDetailDto,
  ): TemplateResult {
    const trend = d.trend ?? null;
    if (trend === null) {
      return html``;
    }
    const severity = this._classifySourceTrendSeverity(trend.delta_pct);
    const formattedDelta =
      trend.delta_pct === null
        ? "neu"
        : `${trend.delta_pct > 0 ? "+" : ""}${trend.delta_pct.toLocaleString(
            "de-DE",
            { minimumFractionDigits: 1, maximumFractionDigits: 1 },
          )} %`;
    return html`<div
      class=${`source-detail-trend source-detail-trend--${severity}`}
    >
      <strong>Trend gegenüber Vorperiode:</strong>
      <span class="muted small">
        jetzt ${trend.count_now.toLocaleString("de-DE")} ·
        zuvor ${trend.count_prev.toLocaleString("de-DE")} ·
        <strong>${formattedDelta}</strong>
      </span>
    </div>`;
  }

  // Iter I: Ampel-Schwellen wie globale Trend-Card. delta_pct=null
  // => yellow ("neu" bei leerer Vorperiode). 1h/6h-Sonderbehandlung
  // entfaellt — Backend liefert bei kurzen Perioden trend=null.
  private _classifySourceTrendSeverity(deltaPct: number | null): string {
    if (deltaPct === null) return "yellow";
    const abs = Math.abs(deltaPct);
    if (abs < TREND_DELTA_PCT_GREEN_MAX) return "green";
    if (abs < TREND_DELTA_PCT_YELLOW_MAX) return "yellow";
    if (abs < TREND_DELTA_PCT_ORANGE_MAX) return "orange";
    return "red";
  }

  // Iter H (knx-detail-panes): Findings dieses Geraets. Klick auf
  // Code-Link setzt window.location.hash auf
  // "#findings?source=<dev_source>" — messagehub-panel.ts liest den
  // Hash beim Tab-Switch und aktiviert den Findings-Tab mit
  // vorbefuelltem Source-Filter.
  private _renderSourceDetailFindings(
    d: KnxStatsSourceDetailDto,
  ): TemplateResult {
    const findings = d.findings ?? [];
    if (findings.length === 0) {
      return html``;
    }
    // Iter detail-topn: TopN-Selektor (Default 10) + "und N weitere"-Hinweis.
    const limit = this._filters.topNSourceDetailFindings;
    const shown = findings.slice(0, limit);
    const remaining = findings.length - shown.length;
    return html`<div class="source-detail-findings">
      <div class="source-detail-section-head">
        <strong>Findings dieses Geräts (${findings.length}):</strong>
        ${this._renderInlineTopN(limit, (n) =>
          this._onTopNSourceDetailFindings(n),
        )}
      </div>
      <ul class="source-detail-findings__list">
        ${shown.map((f) => this._renderSourceDetailFinding(f, d.dev_source))}
      </ul>
      ${remaining > 0
        ? html`<p class="muted small">… und ${remaining} weitere</p>`
        : nothing}
    </div>`;
  }

  private _renderSourceDetailFinding(
    f: KnxStatsSourcePersistedFindingDto,
    devSource: string,
  ): TemplateResult {
    return html`<li class=${`source-detail-finding finding-${f.severity}`}>
      <span class=${`mh-pill ${this._findingPillClass(f.severity)}`}>
        ${f.severity}
      </span>
      <a
        href="#findings?source=${encodeURIComponent(devSource)}"
        class="source-detail-finding__link"
        @click=${(ev: Event) => this._onSourceDetailFindingClick(ev, devSource)}
        title="Findings-Tab oeffnen, gefiltert auf diese Source"
      >
        <code>${f.code}</code>
      </a>
      <span class="source-detail-finding__title">
        ${f.title || f.description || ""}
      </span>
      <span class="muted small source-detail-finding__count">
        ${f.occurrence_count}×
      </span>
    </li>`;
  }

  private _findingPillClass(
    severity: KnxStatsSourcePersistedFindingDto["severity"],
  ): string {
    switch (severity) {
      case "error":
        return "mh-pill--error";
      case "warning":
        return "mh-pill--warning";
      case "info":
        return "mh-pill--info";
      case "debug":
      default:
        return "mh-pill--neutral";
    }
  }

  // Iter H: Klick auf einen Finding-Code-Link. window.location.hash
  // setzen reicht — der Findings-Tab des messagehub-panels reagiert
  // auf den hashchange. Default-Anchor-Verhalten verhindern wir
  // bewusst NICHT, weil das Setzen des Hash bereits den hashchange
  // feuert und der Browser sonst kein Routing macht.
  private _onSourceDetailFindingClick(
    ev: Event,
    devSource: string,
  ): void {
    ev.preventDefault();
    window.location.hash = `findings?source=${encodeURIComponent(devSource)}`;
  }

  private _renderSourceDetailKpi(
    label: string,
    value: string,
  ): TemplateResult {
    return html`<div class="source-detail-kpi">
      <span class="muted small">${label}</span>
      <strong>${value}</strong>
    </div>`;
  }

  private _renderSourceDetailSilent(
    d: KnxStatsSourceDetailDto,
  ): TemplateResult {
    if (d.silent_alarm) {
      const minutes = d.silent_minutes ?? 0;
      return html`<div
        class="source-detail-silent-alarm"
        role="status"
        aria-live="polite"
      >
        <strong>⚠ Gerät ist stumm</strong>
        <p class="muted small">
          Letzter Trafik vor ${this._formatSilence(minutes)} —
          ueberschreitet die konfigurierte Stille-Schwelle.
        </p>
      </div>`;
    }
    if (d.silent_minutes !== null) {
      return html`<p class="source-detail-silent muted small">
        Letzter Trafik vor ${this._formatSilence(d.silent_minutes)}.
      </p>`;
    }
    return html``;
  }

  private _renderSourceDetailGas(
    d: KnxStatsSourceDetailDto,
  ): TemplateResult {
    if (d.gas.length === 0) {
      return html`<p class="muted small">Keine GAs in diesem Zeitraum.</p>`;
    }
    // Iter detail-topn: TopN-Selektor (Default 10) + "und N weitere"-
    // Hinweis, identische UX wie Sibling-GAs und Haupttabellen.
    const limit = this._filters.topNSourceDetailGas;
    const shown = d.gas.slice(0, limit);
    const remaining = d.gas.length - shown.length;
    return html`<div class="source-detail-ga-list">
      <div class="source-detail-section-head">
        <strong>GAs dieses Geräts (${d.ga_count}):</strong>
        ${this._renderInlineTopN(limit, (n) =>
          this._onTopNSourceDetailGas(n),
        )}
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>GA</th>
              <th>Label</th>
              <th>DPT</th>
              <th class="num">Tel/Min</th>
              <th class="num">Soll</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${shown.map((g) => this._renderSourceDetailGaRow(g))}
          </tbody>
        </table>
      </div>
      ${remaining > 0
        ? html`<p class="muted small">… und ${remaining} weitere</p>`
        : nothing}
    </div>`;
  }

  private _renderSourceDetailGaRow(
    g: KnxStatsSourceGaSummaryDto,
  ): TemplateResult {
    const pillClass = g.acknowledged
      ? "mh-pill--neutral"
      : this._severityPillClass(g.severity);
    const pillLabel = g.acknowledged
      ? "✓ Bekannt"
      : this._severityLabel(g.severity);
    return html`<tr
      class=${`source-ga-row row-${g.severity} ${
        g.acknowledged ? "ack" : ""
      }`}
      @click=${() => void this._onSelectGa(g.ga)}
      title="GA-Detail oeffnen"
    >
      <td><code class="ga">${g.ga}</code></td>
      <td>${g.label ?? html`<span class="muted">—</span>`}</td>
      <td>
        ${g.dpt
          ? html`<code class="dpt">${g.dpt}</code>`
          : html`<span class="muted">—</span>`}
      </td>
      <td class="num strong">
        ${g.rate_per_min.toLocaleString("de-DE", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
      </td>
      <td class="num muted">
        ${g.recommended_rate.toLocaleString("de-DE", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
      </td>
      <td>
        <span class=${`mh-pill ${pillClass}`}>${pillLabel}</span>
      </td>
    </tr>`;
  }

  private _renderSiblingGas(d: KnxStatsGaDetailDto): TemplateResult {
    // Iter aiohttp-error-ZU9UA / UX-P3.3: Inline-TopN-Filter, persistent
    // im localStorage. Vorher harte slice(0, 10) — bei Geraeten mit
    // viel Trafic (Wetterstation, Heizungsregler) waren wertvolle
    // Sibling-GAs unterhalb der 10er-Grenze nicht direkt sichtbar.
    const limit = this._filters.topNSiblings;
    return html`
      <div class="siblings">
        <div class="siblings__head">
          <strong>Andere GAs des Geräts <code>${d.dev_source}</code>:</strong>
          ${this._renderInlineTopN(this._filters.topNSiblings, (n) =>
            this._onTopNSiblings(n)
          )}
        </div>
        <ul>
          ${d.sibling_gas.slice(0, limit).map(
            (s) => html`<li
              class="sibling-row"
              @click=${() => void this._onSelectGa(s.ga)}
              title="Detail-Pane für ${s.ga} öffnen"
            >
              <code class="ga">${s.ga}</code>
              <span class="muted">${s.label ?? "—"}</span>
              <span class="num">
                ${s.rate_per_min.toLocaleString("de-DE", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })} Tel/Min
              </span>
              <span class="num muted">${s.count}</span>
            </li>`
          )}
        </ul>
        ${d.sibling_gas.length > limit
          ? html`<p class="muted small">
              … und ${d.sibling_gas.length - limit} weitere
            </p>`
          : nothing}
      </div>
    `;
  }

  // Iter 57: Sortier-Klick toggelt Richtung bei gleichem Key, sonst
  // wechselt auf den neuen Key mit desc als Default (haeufigste Werte
  // oben — typisch fuer "Top-N"-Tabellen).
  private _toggleDevicesSort(
    key: "dev_source" | "ga_count" | "count"
  ): void {
    if (this._devicesSortKey === key) {
      this._devicesSortDir = this._devicesSortDir === "desc" ? "asc" : "desc";
    } else {
      this._devicesSortKey = key;
      this._devicesSortDir = key === "dev_source" ? "asc" : "desc";
    }
  }

  // Iter 60 / U5: Sort-Toggle Top-Sender. Default-Direction asc fuer
  // String-Spalten (ga, label), desc fuer numerische und severity (red
  // top zeigt Probleme zuerst).
  private _toggleTopSort(key: TopSenderSortKey): void {
    if (this._topSortKey === key) {
      this._topSortDir = this._topSortDir === "desc" ? "asc" : "desc";
    } else {
      this._topSortKey = key;
      this._topSortDir = key === "ga" || key === "label" ? "asc" : "desc";
    }
  }

  private _sortArrow(
    activeKey: string,
    columnKey: string,
    dir: "asc" | "desc"
  ): TemplateResult | typeof nothing {
    if (activeKey !== columnKey) return nothing;
    return html`<span class="sort-arrow" aria-hidden="true">${dir === "desc" ? "▼" : "▲"}</span>`;
  }

  private _renderTopBySource(): TemplateResult {
    // Iter 45 (N6): Slice nutzt jetzt topNDevices statt fester 25.
    // Iter 57: vor dem Slice noch sortieren — Backend liefert per
    // count desc, aber der User soll Telegramme/GAs/Source frei waehlen.
    const limit = this._filters.topNDevices;
    const sortKey = this._devicesSortKey;
    const sortDir = this._devicesSortDir;
    const sorted = [...this._topBySource].sort((a, b) => {
      let cmp: number;
      if (sortKey === "dev_source") {
        cmp = a.dev_source.localeCompare(b.dev_source);
      } else {
        cmp = (a[sortKey] || 0) - (b[sortKey] || 0);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return html`
      <div class="table-wrap">
        <table data-test="top-devices-table">
          <thead>
            <tr>
              <th>#</th>
              <th
                class="sortable"
                @click=${() => this._toggleDevicesSort("dev_source")}
                title="Nach Source-Adresse sortieren"
              >
                Gerät (Source)${this._sortArrow(sortKey, "dev_source", sortDir)}
              </th>
              <th>Hersteller / Modell</th>
              <th
                class="num sortable"
                @click=${() => this._toggleDevicesSort("ga_count")}
                title="Nach GA-Anzahl sortieren"
              >
                GAs${this._sortArrow(sortKey, "ga_count", sortDir)}
              </th>
              <th
                class="num sortable"
                @click=${() => this._toggleDevicesSort("count")}
                title="Nach Telegramm-Anzahl sortieren"
              >
                Telegramme${this._sortArrow(sortKey, "count", sortDir)}
              </th>
              <th class="num">Anteil</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${sorted.slice(0, limit).map((row, idx) => {
              const total = this._summary?.total_telegrams ?? 0;
              const pct = total > 0 ? (row.count / total) * 100 : 0;
              const manufacturer = row.manufacturer ?? "";
              const deviceName = row.device_name ?? "";
              const fullDeviceText = manufacturer && deviceName
                ? `${manufacturer} — ${deviceName}`
                : manufacturer || deviceName;
              // Iter E (knx-detail-panes): TR-Klick oeffnet Source-
              // Detail-Pane. Selection-Highlight via _selectedSource.
              // Bulk-Ack-Button stoppt die Propagation (siehe unten).
              const isSelected = this._selectedSource === row.dev_source;
              return html`<tr
                class=${`top-device-row ${isSelected ? "selected" : ""}`}
                @click=${() => void this._loadSourceDetail(row.dev_source)}
                title="Geraete-Detail oeffnen"
              >
                <td class="num muted">${idx + 1}</td>
                <td><code class="ga">${row.dev_source}</code></td>
                <td class="device-cell">
                  ${fullDeviceText
                    ? html`<span
                        class="muted small device-cell__text"
                        title=${fullDeviceText}
                        >${fullDeviceText}</span
                      >`
                    : html`<span class="muted small">—</span>`}
                </td>
                <td class="num">${row.ga_count}</td>
                <td class="num strong">${row.count.toLocaleString("de-DE")}</td>
                <td class="num muted">
                  ${pct.toLocaleString("de-DE", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })} %
                </td>
                <td class="actions">
                  <button
                    class="mh-btn mh-btn--sm mh-btn--ghost"
                    title="Alle GAs dieses Geräts als bekannt markieren"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      void this._ackBulk(row.dev_source);
                    }}
                  >
                    ✓ Alle ${row.ga_count} bekannt
                  </button>
                </td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  private async _ackBulk(devSource: string): Promise<void> {
    if (!this.api) return;
    if (
      !window.confirm(
        `Alle GAs des Geräts ${devSource} als bekannt markieren?`
      )
    ) {
      return;
    }
    const note = window.prompt(
      `Notiz für Bulk-Ack ${devSource} (optional):`,
      "akzeptiert nach Prüfung"
    );
    if (note === null) return;
    try {
      const { from, to } = periodToIso(this._filters.periodId);
      const result = await this.api.acknowledgeKnxBulk(devSource, {
        note: note || undefined,
        from,
        to,
      });
      this._showToast(
        `${devSource}: ${result.count} GAs als bekannt markiert`
      );
      await this._load();
    } catch (err) {
      this._showToast(`Bulk-Ack fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  private _renderAlarmBanner(): TemplateResult {
    const a = this._alarms!;
    const triggered = a.alarms.filter((x) => x.triggered);
    return html`
      <section class="alarm-banner">
        <strong>⚠ ${triggered.length} Alarm(e) aktiv</strong>
        <ul>
          ${triggered.map(
            (alarm) => html`<li>
              <span class="alarm-rule">${alarm.rule}</span>
              <span class="alarm-msg">${alarm.message}</span>
              ${this._renderAlarmDetails(alarm)}
            </li>`
          )}
        </ul>
      </section>
    `;
  }

  // Iter UX-1.0: silence_alarm bekommt aufklappbare Geraete-Liste mit
  // Hersteller + Name + GAs (zum Aufklappen pro Geraet).
  private _renderAlarmDetails(alarm: KnxStatsAlarmDto): TemplateResult {
    if (alarm.rule !== "silence_alarm") return html``;
    const devices = alarm.details?.devices ?? [];
    if (devices.length === 0) return html``;
    return html`
      <details class="alarm-details">
        <summary>Betroffene Geräte (${devices.length})</summary>
        <ul class="alarm-details__devices">
          ${devices.map((dev) => {
            const fullDeviceText =
              dev.manufacturer && dev.device_name
                ? `${dev.manufacturer} — ${dev.device_name}`
                : dev.manufacturer || dev.device_name || "";
            return html`<li class="alarm-device">
              <details class="alarm-device__inner">
                <summary>
                  <code class="ga">${dev.dev_source}</code>
                  ${fullDeviceText
                    ? html`<span class="muted small">${fullDeviceText}</span>`
                    : nothing}
                  <span class="muted small">
                    · stumm seit ${this._formatSilence(dev.silent_minutes)}
                    · ${dev.ga_count} GA${dev.ga_count === 1 ? "" : "s"}
                  </span>
                </summary>
                ${dev.gas.length > 0
                  ? html`<table class="alarm-device__gas">
                      <thead>
                        <tr>
                          <th>GA</th>
                          <th>Bezeichnung</th>
                          <th>DPT</th>
                          <th class="num">Telegramme</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${dev.gas.map(
                          (g) => html`<tr>
                            <td><code>${g.ga}</code></td>
                            <td>${g.label ?? "—"}</td>
                            <td>${g.dpt ?? "—"}</td>
                            <td class="num">${g.count}</td>
                          </tr>`,
                        )}
                      </tbody>
                    </table>`
                  : html`<p class="muted small">
                      Keine GA-Telegramme im Auswertezeitraum.
                    </p>`}
              </details>
            </li>`;
          })}
        </ul>
      </details>
    `;
  }

  // Iter 61 / U3: Filter-Helper case-insensitive auf address/label/dpt.
  private _matchesOrphanFilter(
    text: string,
    fields: Array<string | null | undefined>,
  ): boolean {
    if (text === "") return true;
    const needle = text.toLowerCase();
    return fields.some(
      (f) => typeof f === "string" && f.toLowerCase().includes(needle),
    );
  }

  /**
   * Iter 67 / WR-I: Trend-Vergleich aktuelle Periode vs. Vorperiode.
   * Eine Card mit Total-Delta + Top-3 Anstiege + Top-3 Abnahmen.
   * Vorperiode hat dieselbe Laenge unmittelbar davor.
   */
  private _renderTrend(): TemplateResult {
    const t = this._trend!;
    const totalDelta =
      t.total_delta_pct !== null
        ? `${t.total_delta_pct > 0 ? "+" : ""}${t.total_delta_pct.toLocaleString(
            "de-DE",
            { minimumFractionDigits: 1, maximumFractionDigits: 1 },
          )} %`
        : "neu";
    const fmtRowPct = (row: { delta_pct: number | null; delta_abs: number }): string => {
      if (row.delta_pct === null) {
        return row.delta_abs > 0 ? "neu" : "verstummt";
      }
      const sign = row.delta_pct > 0 ? "+" : "";
      return `${sign}${row.delta_pct.toLocaleString("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })} %`;
    };
    const totalSeverity = this._classifyTrendSeverity(t.total_delta_pct);
    const limit = this._filters.topNTrend;
    const isShort = this._isShortTrendPeriod();
    // Iter aiohttp-error-ZU9UA / Trend-Fix A: Bei langen Perioden
    // (≥ 48h) ist die Vorperiode komplett ausserhalb der 48h-Raw-
    // Retention, total_prev ist immer 0 — der Vergleich waere
    // irrefuehrend. Wir zeigen statt leerer Listen einen klaren
    // Hinweis. Iter 2 (Backend) wird das durch Counter-Tabellen-
    // Lookup ersetzen, sobald implementiert.
    const isLongRetentionGap =
      this._isLongRetentionGapPeriod() && t.total_prev === 0;
    return html`
      <section class=${`mh-card trend trend--${totalSeverity}`}>
        <header class="card-head">
          <h3>Trend gegenüber Vorperiode</h3>
          <div class="card-head__meta">
            ${isLongRetentionGap
              ? nothing
              : this._renderInlineTopN(this._filters.topNTrend, (n) =>
                  this._onTopNTrend(n)
                )}
            <span class="muted small">
              Aktuell ${t.total_now.toLocaleString("de-DE")} Telegramme ·
              zuvor ${t.total_prev.toLocaleString("de-DE")} ·
              <strong>${totalDelta}</strong>
            </span>
          </div>
        </header>
        ${isLongRetentionGap
          ? html`<p class="trend-retention-hint muted small">
              Vergleich nicht verfuegbar — keine Telegramme im
              Vorperioden-Zeitraum vorhanden. Bei einer frischen
              Installation laeuft der Counter erst voll, wenn genug
              Zeit verstrichen ist. Bei kurzen Perioden 1 Std / 6 Std
              probieren.
            </p>`
          : isShort
            ? html`<p class="trend-short-hint muted small">
                Hinweis: Bei kurzen Perioden vergleicht sich z. B. 04–05 Uhr mit
                03–04 Uhr — Tag/Nacht-Übergaenge und Automation-Trigger lassen
                die %-Werte oft 4-stellig wirken. Fuer aussagekraeftige Trends
                mind. 24 Std waehlen.
              </p>`
            : nothing}
        ${isLongRetentionGap
          ? nothing
          : html`<div class="trend-grid">
          <div class="trend-col">
            <strong>Größte Anstiege</strong>
            ${t.top_increase.length === 0
              ? html`<p class="muted small">Keine signifikanten Anstiege.</p>`
              : html`<ul class="trend-list trend-list--up">
                  ${t.top_increase.slice(0, limit).map(
                    (row) => html`<li
                      class=${`trend-row ${
                        this._selectedGa === row.ga ? "selected" : ""
                      }`}
                      @click=${() => void this._onSelectGa(row.ga)}
                      title="GA-Detail oeffnen"
                    >
                      <code class="ga">${row.ga}</code>
                      <span class="trend-label muted"
                        >${row.label ?? "—"}</span
                      >
                      <span class="trend-delta trend-delta--up"
                        >+${row.delta_abs.toLocaleString("de-DE")} ·
                        ${fmtRowPct(row)}</span
                      >
                    </li>`,
                  )}
                </ul>`}
          </div>
          <div class="trend-col">
            <strong>Größte Rückgänge</strong>
            ${t.top_decrease.length === 0
              ? html`<p class="muted small">Keine signifikanten Rückgänge.</p>`
              : html`<ul class="trend-list trend-list--down">
                  ${t.top_decrease.slice(0, limit).map(
                    (row) => html`<li
                      class=${`trend-row ${
                        this._selectedGa === row.ga ? "selected" : ""
                      }`}
                      @click=${() => void this._onSelectGa(row.ga)}
                      title="GA-Detail oeffnen"
                    >
                      <code class="ga">${row.ga}</code>
                      <span class="trend-label muted"
                        >${row.label ?? "—"}</span
                      >
                      <span class="trend-delta trend-delta--down"
                        >${row.delta_abs.toLocaleString("de-DE")} ·
                        ${fmtRowPct(row)}</span
                      >
                    </li>`,
                  )}
                </ul>`}
          </div>
        </div>`}
      </section>
    `;
  }

  /**
   * Iter 67: Ampel-Schwellen fuer den Total-Trend. Konservativ:
   * |delta| < 25 % = green (normales Atmen), 25-100 % = yellow,
   * 100-300 % = orange, > 300 % = red.
   *
   * Iter aiohttp-error-ZU9UA / P1: bei kurzen Perioden (1h/6h) wird die
   * Severity auf "green" gedeckelt. Ein 1h-vs-1h-Vergleich erwischt
   * regelmaessig Tag/Nacht-Uebergaenge oder Automation-Trigger und
   * produziert haeufig 4-stellige %-Spruenge — der rote Alarm-Look
   * verschreckt den User unnoetig. Stattdessen zeigt die Trend-Card
   * einen erklaerenden Hinweis (siehe `_renderTrend`).
   */
  private _classifyTrendSeverity(deltaPct: number | null): string {
    if (this._isShortTrendPeriod()) return "green";
    if (deltaPct === null) return "yellow"; // erste Daten oder neu
    const abs = Math.abs(deltaPct);
    if (abs < TREND_DELTA_PCT_GREEN_MAX) return "green";
    if (abs < TREND_DELTA_PCT_YELLOW_MAX) return "yellow";
    if (abs < TREND_DELTA_PCT_ORANGE_MAX) return "orange";
    return "red";
  }

  private _isShortTrendPeriod(): boolean {
    return this._filters.periodId === "1h" || this._filters.periodId === "6h";
  }

  /**
   * Iter aiohttp-error-ZU9UA / Trend-Fix A + UX-P3.6: Perioden, bei
   * denen ein leeres total_prev "keine Vergleichsdaten" bedeutet
   * (statt eines echten Trends).
   *
   * Vor Iter 6 (Backend Trend-Counter): nur Raw-Source, also alles >=
   * 48h leer wenn Vorperiode ausserhalb 48h-Retention.
   *
   * Nach Iter 6: 24h+ liest aus Counter (365d-Retention). Wenn die
   * Counter-Tabelle aber bei langer Periode noch leer ist (frische
   * Installation, gerade erst eingeschaltet), zeigen wir trotzdem den
   * "kein Vergleich verfuegbar"-Hinweis statt einer leeren Card.
   *
   * 1h/6h sind ausgenommen — die brauchen Raw und sind in Retention.
   */
  private _isLongRetentionGapPeriod(): boolean {
    return ["24h", "48h", "7d", "30d", "365d"].includes(
      this._filters.periodId,
    );
  }

  /**
   * Iter 91 / WR-G: GA-Heatmap als CSS-Grid. Zeilen = Top-N GAs,
   * Spalten = Zeit-Buckets, Zellen = Telegramm-Counts mit Color-Intensity
   * relativ zum Maximum. SVG-frei (CSS-Grid + color-mix).
   */
  private _renderHeatmap(): TemplateResult {
    const h = this._heatmap!;
    if (h.gas.length === 0 || h.buckets.length === 0) return html``;
    const maxCount = h.matrix
      .flat()
      .reduce((mx, v) => (v > mx ? v : mx), 1);
    const formatBucketLabel = (iso: string): string => {
      // Backend liefert "YYYY-MM-DDTHH:MM:SS"; nur HH:MM zeigen.
      const t = iso.slice(11, 16);
      return t || iso;
    };
    return html`
      <section class="mh-card heatmap-card">
        <header class="card-head">
          <h3>Aktivitäts-Heatmap</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(
              this._filters.topNHeatmap,
              (n) => this._onTopNHeatmap(n),
              HEATMAP_TOP_N_OPTIONS,
            )}
            <span class="muted small">
              Top-${h.gas.length} GAs × ${h.buckets.length} ${
                h.bucket_minutes
              }-Min-Buckets · Maximum ${maxCount} Telegramme/Bucket
            </span>
          </div>
        </header>
        <div class="heatmap-grid"
          style=${`--heatmap-cols: ${h.buckets.length};`}
        >
          <div class="heatmap-row heatmap-row--header">
            <div class="heatmap-cell heatmap-label"></div>
            ${h.buckets.map(
              (b) => html`<div
                class="heatmap-cell heatmap-cell--bucket"
                title=${b}
              >
                ${formatBucketLabel(b)}
              </div>`,
            )}
          </div>
          ${h.gas.map(
            (gaMeta, rowIdx) => html`<div class="heatmap-row">
              <div class="heatmap-cell heatmap-label" title=${gaMeta.label || ""}>
                <code>${gaMeta.ga}</code>
                <span class="muted small">${gaMeta.label ?? ""}</span>
              </div>
              ${h.matrix[rowIdx].map((count) => {
                const intensity = count === 0 ? 0 : Math.round((count / maxCount) * 100);
                return html`<div
                  class="heatmap-cell heatmap-cell--data"
                  style=${`background: color-mix(in srgb, var(--mh-warning) ${intensity}%, transparent);`}
                  title=${`${count} Telegramme`}
                >
                  ${count > 0 ? count : ""}
                </div>`;
              })}
            </div>`,
          )}
        </div>
        <p class="muted small heatmap-legend">
          Intensität proportional zum Maximum (${maxCount}). Klick auf
          GA-Code öffnet Detail-Pane.
        </p>
      </section>
    `;
  }

  private _renderOrphans(): TemplateResult {
    const o = this._orphans!;
    const placeholderFilter = <T extends { address: string }>(
      arr: T[],
      labelOf: (item: T) => string | null | undefined,
    ): T[] =>
      this._orphansHidePlaceholders
        ? arr.filter((it) => !isOrphanPlaceholder(it.address, labelOf(it)))
        : arr;
    const missingNonPlaceholder = placeholderFilter(o.missing_in_log, (m) => m.name);
    const extraNonPlaceholder = placeholderFilter(o.extra_in_log, (e) => e.label);
    const missingFiltered = missingNonPlaceholder.filter((m) =>
      this._matchesOrphanFilter(this._orphansMissingFilter, [m.address, m.name, m.dpt]),
    );
    const extraFiltered = extraNonPlaceholder.filter((e) =>
      this._matchesOrphanFilter(this._orphansExtraFilter, [e.address, e.label]),
    );
    const missingLimit = this._filters.topNOrphansMissing;
    const extraLimit = this._filters.topNOrphansExtra;
    const missingShown = missingFiltered.slice(0, missingLimit);
    const extraShown = extraFiltered.slice(0, extraLimit);
    const missingPlaceholderCount = o.missing_in_log.length - missingNonPlaceholder.length;
    const extraPlaceholderCount = o.extra_in_log.length - extraNonPlaceholder.length;
    return html`
      <section class="mh-card">
        <header class="card-head">
          <h3>Verwaiste GAs (Projekt vs Realität)</h3>
          <div class="card-head__meta">
            <label class="orphans-placeholder-toggle" title="ETS-Platzhalter ohne Label (z. B. '-----') ausblenden">
              <input
                type="checkbox"
                .checked=${this._orphansHidePlaceholders}
                @change=${(e: Event) => {
                  this._orphansHidePlaceholders = (e.target as HTMLInputElement).checked;
                }}
              />
              <span>Platzhalter ausblenden${
                this._orphansHidePlaceholders &&
                missingPlaceholderCount + extraPlaceholderCount > 0
                  ? html` <span class="muted small">(${
                      missingPlaceholderCount + extraPlaceholderCount
                    })</span>`
                  : nothing
              }</span>
            </label>
            <span class="muted small">
              Projekt: ${o.project_total} • geloggt: ${o.log_total}
            </span>
          </div>
        </header>
        <div class="orphans-grid">
          ${o.missing_in_log.length > 0
            ? html`<div>
                <div class="orphans-col-head">
                  <strong
                    >Im Projekt, nie gesehen (${missingFiltered.length}${
                      this._orphansMissingFilter ? ` von ${o.missing_in_log.length}` : ""
                    })</strong
                  >
                  ${this._renderInlineTopN(
                    this._filters.topNOrphansMissing,
                    (n) => this._onTopNOrphansMissing(n)
                  )}
                </div>
                <input
                  class="mh-input orphans-search"
                  type="search"
                  placeholder="Filter nach GA / Label / DPT…"
                  .value=${this._orphansMissingFilter}
                  @input=${(e: Event) => {
                    this._orphansMissingFilter = (e.target as HTMLInputElement).value;
                  }}
                />
                <ul class="orphans-list muted-list">
                  ${missingShown.map(
                    (m) => html`<li>
                      <code>${m.address}</code>
                      <span>${m.name || "—"}</span>
                      ${m.dpt
                        ? html`<code class="dpt">${m.dpt}</code>`
                        : nothing}
                    </li>`
                  )}
                </ul>
                ${missingFiltered.length > missingLimit
                  ? html`<p class="muted small">
                      … und ${missingFiltered.length - missingLimit} weitere
                    </p>`
                  : nothing}
              </div>`
            : nothing}
          ${o.extra_in_log.length > 0
            ? html`<div>
                <div class="orphans-col-head">
                  <strong
                    >Geloggt, nicht im Projekt (${extraFiltered.length}${
                      this._orphansExtraFilter ? ` von ${o.extra_in_log.length}` : ""
                    })</strong
                  >
                  ${this._renderInlineTopN(
                    this._filters.topNOrphansExtra,
                    (n) => this._onTopNOrphansExtra(n)
                  )}
                </div>
                <input
                  class="mh-input orphans-search"
                  type="search"
                  placeholder="Filter nach GA / Label…"
                  .value=${this._orphansExtraFilter}
                  @input=${(e: Event) => {
                    this._orphansExtraFilter = (e.target as HTMLInputElement).value;
                  }}
                />
                <ul class="orphans-list extra-list">
                  ${extraShown.map(
                    (e) => html`<li>
                      <code>${e.address}</code>
                      <span>${e.label ?? "—"}</span>
                      <span class="muted num">${e.count}</span>
                    </li>`
                  )}
                </ul>
                ${extraFiltered.length > extraLimit
                  ? html`<p class="muted small">
                      … und ${extraFiltered.length - extraLimit} weitere
                    </p>`
                  : nothing}
              </div>`
            : nothing}
        </div>
      </section>
    `;
  }

  private _renderSilenceAlarms(): TemplateResult {
    const s = this._silence!;
    const alarms = s.items.filter((i) => i.alarm);
    if (alarms.length === 0) return html``;
    const limit = this._filters.topNSilence;
    // Iter UX-1.0: Tabellen-Layout analog zur Top-Geraete-Tabelle —
    // gleiche Spalten-Reihenfolge (Source, Hersteller/Modell, GAs)
    // plus Stille-spezifische Spalten (silent_minutes, last_seen).
    return html`
      <section class="mh-card silence-card">
        <header class="card-head">
          <h3>Stille-Alarme (${s.alarm_count})</h3>
          <div class="card-head__meta">
            ${this._renderInlineTopN(this._filters.topNSilence, (n) => this._onTopNSilence(n))}
            <span class="muted small">
              Schwelle: &gt; ${s.max_silence_minutes} Min ohne Telegramm
            </span>
          </div>
        </header>
        <div class="table-wrap">
          <table data-test="silence-alarms-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Gerät (Source)</th>
                <th>Hersteller / Modell</th>
                <th class="num">GAs</th>
                <th class="num">Stumm seit</th>
                <th>Letzter Trafik</th>
              </tr>
            </thead>
            <tbody>
              ${alarms.slice(0, limit).map((a, idx) => {
                const fullDeviceText =
                  a.manufacturer && a.device_name
                    ? `${a.manufacturer} — ${a.device_name}`
                    : a.manufacturer || a.device_name || "";
                const isSelected = this._selectedSource === a.dev_source;
                return html`<tr
                  class=${`silence-row ${isSelected ? "selected" : ""}`}
                  @click=${() => void this._loadSourceDetail(a.dev_source)}
                  title="Geraete-Detail oeffnen"
                >
                  <td class="num muted">${idx + 1}</td>
                  <td><code class="ga">${a.dev_source}</code></td>
                  <td class="device-cell">
                    ${fullDeviceText
                      ? html`<span
                          class="muted small device-cell__text"
                          title=${fullDeviceText}
                          >${fullDeviceText}</span
                        >`
                      : html`<span class="muted small">—</span>`}
                  </td>
                  <td class="num">${a.ga_count ?? 0}</td>
                  <td class="num strong">
                    ${this._formatSilence(a.silent_minutes)}
                  </td>
                  <td class="muted small">${this._formatTs(a.last_seen)}</td>
                </tr>`;
              })}
            </tbody>
          </table>
        </div>
        ${alarms.length > limit
          ? html`<p class="muted small">
              … und ${alarms.length - limit} weitere
            </p>`
          : nothing}
      </section>
    `;
  }

  private _formatSilence(minutes: number): string {
    if (minutes >= 1440) return `${Math.floor(minutes / 1440)} Tagen`;
    if (minutes >= 60) return `${Math.floor(minutes / 60)} Std`;
    return `${Math.round(minutes)} Min`;
  }

  private _formatTs(iso: string): string {
    try {
      return new Date(iso).toLocaleString("de-DE");
    } catch {
      return iso;
    }
  }

  private _renderBusHealth(): TemplateResult {
    const h = this._busHealth!;
    const ratio = h.summary.ratio_pct;
    const cls =
      ratio >= 1.0
        ? "danger"
        : ratio >= 0.5
          ? "warning"
          : ratio > 0
            ? "elevated"
            : "ok";
    const limit = this._filters.topNBusHealth;
    return html`
      <section class="mh-card">
        <header class="card-head">
          <h3>Bus-Gesundheit (Wiederholrate)</h3>
          <div class="card-head__meta">
            ${h.per_ga.length > 0
              ? this._renderInlineTopN(
                  this._filters.topNBusHealth,
                  (n) => this._onTopNBusHealth(n)
                )
              : nothing}
            <span class="muted small">
              xknx-Repeated-Flag — hoher Wert deutet auf Verkabelung/EMV
            </span>
          </div>
        </header>
        <div class="kpis">
          <div class=${`kpi busload busload--${cls}`}>
            <span class="kpi-label">Wiederhol-Quote</span>
            <span class="kpi-value">${ratio.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} %</span>
            <span class="kpi-hint">
              ${h.summary.repeated.toLocaleString("de-DE")} von
              ${h.summary.total.toLocaleString("de-DE")} Telegrammen
            </span>
          </div>
          <div class="kpi">
            <span class="kpi-label">Schwelle gesund</span>
            <span class="kpi-value">&lt; 0,5 %</span>
            <span class="kpi-hint">Empfehlung KNX-Praxis</span>
          </div>
        </div>
        ${h.per_ga.length > 0
          ? html`<div class="bus-health-list">
              <strong>Top-GAs mit Wiederholungen:</strong>
              <ul>
                ${h.per_ga.slice(0, limit).map(
                  (g) => html`<li>
                    <code>${g.ga}</code>
                    <span class="muted">${g.label ?? "—"}</span>
                    <span class="num">${g.repeated} / ${g.total}</span>
                    <span class="num">${g.ratio_pct.toLocaleString("de-DE", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })} %</span>
                  </li>`
                )}
              </ul>
              ${h.per_ga.length > limit
                ? html`<p class="muted small">
                    … und ${h.per_ga.length - limit} weitere
                  </p>`
                : nothing}
            </div>`
          : nothing}
      </section>
    `;
  }

  private _severityPillClass(
    sev: "green" | "yellow" | "orange" | "red"
  ): string {
    return severityPillClass(sev);
  }

  /**
   * Iter aiohttp-error-ZU9UA / P2: konsolidierte Status-Spalte fuer
   * Top-Sender. Vorher 3 separate Pills uebereinander (Severity, ⚠
   * auffaellig, ✓ bekannt) — wirkten wie 3 Spalten und konnten sich
   * widersprechen ("OK" + "⚠ auffaellig"). Jetzt EIN Pill, der die
   * effektive Severity zeigt:
   *   - acknowledged ueberschreibt alles → "✓ Bekannt"
   *   - has_findings + green → escaliert auf yellow ("auffaellig")
   *     mit Findings-Icon
   *   - sonst Severity-Label wie gehabt
   */
  private _renderTopRowStatus(row: KnxStatsTopRowDto): TemplateResult {
    if (row.acknowledged) {
      return html`<span class="mh-pill mh-pill--neutral ack-pill" title="acknowledged">
        ✓ Bekannt
      </span>`;
    }
    const baseSev = row.severity;
    const escalated = row.has_findings && baseSev === "green" ? "yellow" : baseSev;
    const label = row.has_findings && baseSev === "green"
      ? "auffällig"
      : this._severityLabel(escalated);
    return html`<span
      class=${`mh-pill ${this._severityPillClass(escalated)}`}
      title=${row.has_findings
        ? "Anti-Pattern erkannt — Detail-Pane zeigt mehr (Konstant-Wert-Spam, Read-Burst, Heartbeat)"
        : ""}
    >
      <span class="mh-pill__dot"></span>
      ${row.has_findings ? html`<span aria-hidden="true">⚠</span> ` : nothing}
      ${label}
    </span>`;
  }

  static override styles = [
    tokens,
    cards,
    pills,
    buttons,
    css`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
        background: var(--mh-bg);
      }
      .root {
        max-width: 1024px;
        margin: 0 auto;
        padding: var(--mh-space-5);
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-4);
      }
      .filters {
        /* Iter aiohttp-error-ZU9UA: sticky beim Scrollen — User soll
           Periode/Filter aendern koennen, ohne hochscrollen zu muessen.
           z-index ueber dem Card-Stack, opaque background, damit der
           Inhalt darunter durchscrollt. */
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-4);
        align-items: flex-end;
        padding: var(--mh-space-3);
        background: var(--mh-surface);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      }
      /* Iter aiohttp-error-ZU9UA / P2: Refresh-Button visuell
         hervorheben — vorher wirkte er trotz mh-btn--primary grau,
         weil HA-Themes manchmal --primary-color ueberschreiben.
         Eigene Klasse mit garantiertem Farbkontrast + Schatten. */
      .filter-refresh-btn {
        font-weight: var(--mh-weight-semibold, 600);
        padding: 8px 16px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        background: var(--mh-accent, var(--primary-color, #03a9f4));
        color: var(--mh-accent-fg, var(--text-primary-color, #fff));
      }
      .filter-refresh-btn:hover:not(:disabled) {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        transform: translateY(-1px);
      }
      .filter-refresh-btn:disabled {
        /* Wenn lade-aktiv: weniger Opacity-Drop als Default-Disabled,
           damit der Spinner-Glyph noch lesbar bleibt. */
        opacity: 0.7;
      }
      .filter-refresh-btn__spin {
        display: inline-block;
        animation: mh-spin 800ms linear infinite;
      }
      @keyframes mh-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .filter-refresh-btn__spin {
          animation: none;
        }
      }

      /* Iter aiohttp-error-ZU9UA / UX-P3.4: Mobile-Responsive
         Filter-Bar. Default ist Zeile mit flex-wrap; auf < 640px
         legen sich die Filter-Groups untereinander, die Periode-Pills
         duerfen umbrechen und der Aktualisieren-Knopf wird full-width. */
      @media (max-width: 640px) {
        .filters {
          flex-direction: column;
          align-items: stretch;
          gap: var(--mh-space-3);
        }
        .filter-group {
          width: 100%;
        }
        .filter-group.toggle {
          width: auto;
        }
        .filters .seg {
          flex-wrap: wrap;
        }
        .filter-refresh-btn {
          width: 100%;
          justify-content: center;
        }
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .filter-group.toggle {
        flex-direction: row;
        align-items: center;
        gap: 6px;
      }
      .filter-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        /* Iter 57: Sentence-Case statt CAPS-Lock */
        letter-spacing: 0.02em;
        font-weight: var(--mh-weight-semibold);
      }
      .seg {
        display: inline-flex;
        gap: 1px;
        background: var(--mh-surface-2);
        padding: 2px;
        border-radius: var(--mh-radius-sm);
      }
      .seg-btn {
        appearance: none;
        background: transparent;
        border: 0;
        padding: 4px 10px;
        font: inherit;
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        cursor: pointer;
        border-radius: var(--mh-radius-sm);
      }
      .seg-btn:hover {
        color: var(--mh-fg);
      }
      .seg-btn.active {
        background: var(--mh-surface);
        color: var(--mh-fg);
        font-weight: var(--mh-weight-semibold);
        box-shadow: var(--mh-shadow-1);
      }
      .mh-input.narrow {
        max-width: 100px;
        padding: 5px 10px;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        font: inherit;
        font-size: var(--mh-text-sm);
        background: var(--mh-surface);
        color: var(--mh-fg);
      }
      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--mh-space-3);
        margin-bottom: var(--mh-space-3);
        flex-wrap: wrap;
      }
      /* Iter 45 (N6): Inline-Top-N-Selektor in Card-Headern */
      .card-head__meta {
        display: flex;
        align-items: center;
        gap: var(--mh-space-3);
        flex-wrap: wrap;
      }
      .inline-topn-wrap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .inline-topn-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        text-transform: lowercase;
        letter-spacing: 0.02em;
      }
      .inline-topn {
        display: inline-flex;
        gap: 0;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        overflow: hidden;
      }
      .inline-topn__btn {
        background: transparent;
        border: 0;
        padding: 4px 10px;
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        cursor: pointer;
        font-variant-numeric: tabular-nums;
      }
      .inline-topn__btn:hover {
        background: var(--mh-bg-hover, rgba(0, 0, 0, 0.04));
      }
      .inline-topn__btn.active {
        /* Iter detail-topn: vorher griff diese Regel auf undefinierte
           Tokens, deren Default-color "white" auf hellen HA-Themes
           weisse Schrift auf weissem Hintergrund erzeugte. Jetzt die
           definierten Accent-Tokens (siehe styles/tokens.ts), identisch
           zu .mh-btn--primary. */
        background: var(--mh-accent);
        color: var(--mh-accent-fg);
        font-weight: var(--mh-weight-semibold);
      }
      h3 {
        margin: 0;
        font-size: var(--mh-text-md);
        font-weight: var(--mh-weight-semibold);
      }
      .small {
        font-size: var(--mh-text-xs);
      }
      .muted {
        color: var(--mh-fg-muted);
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--mh-space-3);
      }
      .kpi {
        background: var(--mh-bg);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-md);
        padding: var(--mh-space-4);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .kpi-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
        /* Iter 57: Sentence-Case statt CAPS-Lock */
        letter-spacing: 0.02em;
        font-weight: var(--mh-weight-semibold);
      }
      .kpi-value {
        font-size: var(--mh-text-2xl);
        font-weight: var(--mh-weight-bold);
        color: var(--mh-fg);
        line-height: 1.1;
        margin: 4px 0;
        font-variant-numeric: tabular-nums;
      }
      .kpi-hint {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .busload--ok {
        border-left: 3px solid var(--mh-success);
      }
      .busload--elevated {
        /* Iter 60: gelb statt info-blau, konsistent mit Ampel-Mapping. */
        border-left: 3px solid var(--mh-caution);
      }
      .busload--warning {
        border-left: 3px solid var(--mh-warning);
      }
      .busload--danger {
        border-left: 3px solid var(--mh-error);
      }
      /* Iter 60 / U7: 0–100 %-Verlaufs-Bar unter dem Buslast-KPI-Wert.
         Gradient zeigt Skala (gruen → gelb → orange → rot), Marker
         visualisiert aktuellen Wert ohne Schwellen-Sprung. */
      .busload-bar {
        position: relative;
        height: 4px;
        margin-top: 6px;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--mh-success) 0%,
          var(--mh-caution) 33%,
          var(--mh-warning) 66%,
          var(--mh-error) 100%
        );
        opacity: 0.5;
      }
      .busload-bar__marker {
        position: absolute;
        top: -2px;
        bottom: -2px;
        width: 2px;
        background: var(--mh-fg);
        border-radius: 1px;
        transform: translateX(-1px);
      }
      /* Iter 37 (Feature K): Bus-Health-Score-Card */
      .health-score {
        border-left: 4px solid var(--mh-divider);
      }
      .health-score--green {
        border-left-color: var(--mh-success);
      }
      .health-score--yellow {
        /* Iter 60: gelb statt info-blau, konsistent mit B2-Mapping. */
        border-left-color: var(--mh-caution);
      }
      .health-score--orange {
        border-left-color: var(--mh-warning);
      }
      .health-score--red {
        border-left-color: var(--mh-error);
      }
      .health-score__body {
        display: grid;
        grid-template-columns: minmax(140px, 200px) 1fr;
        gap: var(--mh-space-4);
        align-items: start;
      }
      @media (max-width: 640px) {
        .health-score__body {
          grid-template-columns: 1fr;
        }
      }
      .health-score__big {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .health-score__value {
        font-size: 3rem;
        font-weight: var(--mh-weight-bold);
        line-height: 1;
        color: var(--mh-fg);
        font-variant-numeric: tabular-nums;
      }
      .health-score__unit {
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
      }
      .health-score__label {
        margin-top: var(--mh-space-2);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .health-score--green .health-score__label {
        color: var(--mh-success);
      }
      .health-score--yellow .health-score__label {
        color: var(--mh-caution);
      }
      .health-score--orange .health-score__label {
        color: var(--mh-warning);
      }
      .health-score--red .health-score__label {
        color: var(--mh-error);
      }
      /* Iter aiohttp-error-ZU9UA / P2: Component-Badges statt Balken.
         Vorher: 4 Reihen mit Label + Bar + Wert, alle Balken immer
         gruen (irrefuehrend bei niedrigen Werten). Jetzt Chips mit
         eigener Severity-Faerbung. */
      .health-score__components {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
      }
      .health-score__badge {
        display: inline-flex;
        flex-direction: column;
        gap: 2px;
        padding: var(--mh-space-2) var(--mh-space-3);
        border-radius: var(--mh-radius-md);
        border: 1px solid var(--mh-divider);
        background: var(--mh-surface);
        min-width: 110px;
        font-size: var(--mh-text-sm);
      }
      .health-score__badge-label {
        font-size: var(--mh-text-xs);
        color: var(--mh-fg-muted);
      }
      .health-score__badge-value {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        font-size: var(--mh-text-md);
        color: var(--mh-fg);
      }
      .health-score__badge--green {
        border-color: color-mix(in srgb, var(--mh-success) 40%, transparent);
        background: color-mix(in srgb, var(--mh-success) 10%, var(--mh-surface));
      }
      .health-score__badge--yellow {
        border-color: color-mix(in srgb, var(--mh-caution, var(--mh-warning)) 40%, transparent);
        background: color-mix(in srgb, var(--mh-caution, var(--mh-warning)) 10%, var(--mh-surface));
      }
      .health-score__badge--orange {
        border-color: color-mix(in srgb, var(--mh-warning) 40%, transparent);
        background: color-mix(in srgb, var(--mh-warning) 12%, var(--mh-surface));
      }
      .health-score__badge--red {
        border-color: color-mix(in srgb, var(--mh-error) 50%, transparent);
        background: color-mix(in srgb, var(--mh-error) 12%, var(--mh-surface));
      }
      .health-score__findings {
        grid-column: 1 / -1;
        list-style: none;
        margin: var(--mh-space-3) 0 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .health-finding {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg);
      }
      .health-finding__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--mh-info);
      }
      .health-finding--warn .health-finding__dot {
        background: var(--mh-warning);
      }
      .health-finding--critical .health-finding__dot {
        background: var(--mh-error);
      }
      /* Iter 51: API-Error-Banner — gefailte Endpoints + Diagnose */
      .api-error-banner {
        padding: var(--mh-space-3) var(--mh-space-4);
        background: var(--mh-warning-soft, rgba(255, 165, 0, 0.12));
        border-left: 3px solid var(--mh-warning);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
        margin-bottom: var(--mh-space-3);
      }
      .api-error-banner__head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--mh-space-3);
      }
      .api-error-banner__dismiss {
        background: transparent;
        border: 0;
        font-size: 1.4em;
        line-height: 1;
        color: var(--mh-fg-muted);
        cursor: pointer;
        padding: 0 4px;
      }
      .api-error-banner__dismiss:hover {
        color: var(--mh-fg);
      }
      .api-error-banner__list {
        margin: var(--mh-space-2) 0 0 0;
        font-weight: var(--mh-weight-semibold);
      }
      .api-error-banner__details {
        margin-top: var(--mh-space-2);
      }
      .api-error-banner__details summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
      }
      .api-error-banner__details ul {
        margin: var(--mh-space-2) 0;
        padding-left: var(--mh-space-4);
      }
      .api-error-banner__raw code {
        font-family: var(--mh-font-mono, monospace);
      }
      /* Iter 49 (N1): Bus-Analyse-Toggle-Banner, sichtbar wenn aus */
      .bus-analysis-banner {
        padding: var(--mh-space-3) var(--mh-space-4);
        background: var(--mh-warning-soft, rgba(255, 165, 0, 0.12));
        border-left: 3px solid var(--mh-warning);
        border-radius: var(--mh-radius-md);
        font-size: var(--mh-text-sm);
        margin-bottom: var(--mh-space-3);
      }
      .bus-analysis-banner strong {
        margin-right: var(--mh-space-2);
      }
      /* Iter 39: Long-Term-Modus */
      .long-term-banner {
        display: flex;
        align-items: flex-start;
        gap: var(--mh-space-3);
        padding: var(--mh-space-3) var(--mh-space-4);
        background: var(--mh-info-soft, rgba(0, 120, 255, 0.08));
        border-left: 3px solid var(--mh-info);
        border-radius: var(--mh-radius-md);
      }
      .long-term-banner__icon {
        font-size: 1.5em;
        line-height: 1;
      }
      .long-term__body {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--mh-space-4);
      }
      @media (max-width: 768px) {
        .long-term__body {
          grid-template-columns: 1fr;
        }
      }
      .long-term__chart {
        min-height: 120px;
      }
      .long-term__bars {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 120px;
        padding: var(--mh-space-2) 0;
      }
      .long-term__bar {
        flex: 1;
        min-height: 2px;
        background: var(--mh-info);
        border-radius: 2px 2px 0 0;
        transition: opacity 0.2s ease;
      }
      .long-term__bar:hover {
        opacity: 0.7;
      }
      .long-term__top h4 {
        margin: 0 0 var(--mh-space-2) 0;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .long-term__top-list {
        margin: 0;
        padding-left: var(--mh-space-4);
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: var(--mh-text-sm);
      }
      .long-term__top-list li {
        display: flex;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .long-term__top-list code {
        font-family: var(--mh-font-mono, monospace);
      }
      .long-term__top-count {
        margin-left: auto;
        font-variant-numeric: tabular-nums;
        color: var(--mh-fg-muted);
      }
      /* Iter 41: Burst-Detector-Card */
      .bursts__intro {
        margin-bottom: var(--mh-space-2);
      }
      .bursts__table {
        width: 100%;
        border-collapse: collapse;
      }
      .bursts__table th,
      .bursts__table td {
        padding: var(--mh-space-1) var(--mh-space-2);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-sm);
      }
      .bursts__table th {
        text-align: left;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
      }
      .bursts__table .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .bursts__ts {
        font-family: var(--mh-font-mono, monospace);
        white-space: nowrap;
      }
      .bursts__pct {
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-warning);
      }
      /* Iter 42: Sensitive-Log-Card */
      .sensitive {
        border-left: 4px solid var(--mh-error);
      }
      .sensitive h4 {
        margin: var(--mh-space-3) 0 var(--mh-space-2) 0;
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .sensitive__addr-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
      }
      .sensitive__addr-list li {
        display: inline-flex;
        align-items: center;
        gap: var(--mh-space-1);
        padding: var(--mh-space-1) var(--mh-space-2);
        background: var(--mh-bg-subtle, rgba(0, 0, 0, 0.04));
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }
      .sensitive__table {
        width: 100%;
        border-collapse: collapse;
      }
      .sensitive__table th,
      .sensitive__table td {
        padding: var(--mh-space-1) var(--mh-space-2);
        border-bottom: 1px solid var(--mh-divider);
        font-size: var(--mh-text-sm);
        text-align: left;
      }
      .sensitive__table th {
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
      }
      .severity-counts {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-2);
        margin-top: var(--mh-space-3);
      }
      .error {
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-error-soft);
        border-left: 3px solid var(--mh-error);
        color: var(--mh-error);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }
      .info-banner {
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-surface);
        border-left: 3px solid var(--mh-info);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        color: var(--mh-fg-muted);
        line-height: 1.5;
      }
      .info-banner strong {
        color: var(--mh-fg);
      }

      /* Top-Tabelle */
      .table-wrap {
        overflow-x: auto;
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        background: var(--mh-bg);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mh-text-sm);
      }
      th,
      td {
        padding: 8px var(--mh-space-3);
        border-bottom: 1px solid var(--mh-divider);
        text-align: left;
        vertical-align: middle;
      }
      tr:last-child td {
        border-bottom: 0;
      }
      th {
        background: var(--mh-surface);
        font-size: var(--mh-text-xs);
        /* Iter 57: Sentence-Case statt uppercase — liest sich ruhiger
         * und harmoniert besser mit dem deutschen Label-Set. */
        letter-spacing: 0.02em;
        color: var(--mh-fg-muted);
        font-weight: var(--mh-weight-semibold);
        position: sticky;
        top: 0;
      }
      /* Iter 57: sortierbare Header — visueller Hint via Cursor + Sort-Pfeil */
      th.sortable {
        cursor: pointer;
        user-select: none;
      }
      th.sortable:hover {
        color: var(--mh-fg);
      }
      th.sortable .sort-arrow {
        margin-left: 4px;
        opacity: 0.6;
      }
      tbody tr {
        cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      tbody tr:hover {
        background: var(--mh-surface-2);
      }
      tbody tr.selected {
        background: var(--mh-accent-soft);
      }
      tbody tr.ack td {
        opacity: 0.6;
      }
      .num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .strong {
        font-weight: var(--mh-weight-semibold);
      }
      code.ga {
        font-family: var(--ha-font-family-code, ui-monospace, SFMono-Regular, monospace);
        font-size: var(--mh-text-sm);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-fg);
      }
      /* Iter 62 / WR-T: Geraten-DPT visuell als gepunktet markieren,
         damit User auf einen Blick sieht "das ist nicht aus ETS". */
      code.dpt--inferred {
        font-style: italic;
        opacity: 0.85;
        border-bottom: 1px dotted var(--mh-fg-muted);
      }
      .dpt__hint {
        margin-left: 2px;
        font-size: 0.85em;
        color: var(--mh-fg-muted);
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
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      /* Iter 91 / WR-G: GA-Heatmap als CSS-Grid. */
      .heatmap-grid {
        display: grid;
        grid-template-columns: minmax(180px, auto) repeat(var(--heatmap-cols, 24), 1fr);
        gap: 1px;
        background: var(--mh-divider);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm);
        overflow: hidden;
        font-size: var(--mh-text-xs);
        margin-top: var(--mh-space-2);
      }
      .heatmap-row {
        display: contents;
      }
      .heatmap-cell {
        background: var(--mh-surface);
        padding: 2px 4px;
        text-align: center;
        min-height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-variant-numeric: tabular-nums;
      }
      .heatmap-cell--bucket {
        color: var(--mh-fg-muted);
        font-size: 10px;
        background: var(--mh-surface-2);
      }
      .heatmap-label {
        background: var(--mh-surface-2);
        text-align: left;
        padding: 4px 8px;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 2px;
        overflow: hidden;
      }
      .heatmap-label code {
        font-weight: var(--mh-weight-semibold);
      }
      .heatmap-label .small {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
      .heatmap-cell--data {
        font-size: 10px;
      }
      .heatmap-legend {
        margin-top: var(--mh-space-2);
      }
      /* Iter L1.4 — Recommendation-Card */
      .recommendation-card__head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mh-space-2);
      }
      .recommendation-card__toggle {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--mh-space-1);
        color: var(--mh-fg-default);
        font: inherit;
      }
      .recommendation-card__toggle h3 {
        margin: 0;
      }
      .recommendation-card__caret {
        font-size: 0.9em;
        line-height: 1;
        color: var(--mh-fg-muted);
      }
      .recommendation-card__pills {
        margin-left: auto;
        display: inline-flex;
        gap: var(--mh-space-1);
      }
      .recommendation-card__headline {
        margin: var(--mh-space-2) 0;
        font-weight: var(--mh-weight-semibold);
      }
      .recommendation-card__reasoning {
        margin: var(--mh-space-2) 0;
      }
      .recommendation-card__reasoning summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
      }
      .recommendation-card__reasoning ul {
        margin: var(--mh-space-1) 0 0 0;
        padding-left: var(--mh-space-4);
      }
      .recommendation-card__table {
        width: 100%;
        border-collapse: collapse;
        margin-top: var(--mh-space-2);
        font-size: var(--mh-text-sm);
      }
      .recommendation-card__table th,
      .recommendation-card__table td {
        text-align: left;
        padding: var(--mh-space-1) var(--mh-space-2);
        border-bottom: 1px solid var(--mh-divider);
        vertical-align: top;
      }
      .recommendation-card__row--deviation {
        background: var(--mh-error-soft);
      }
      .recommendation-card__row--warn {
        background: var(--mh-caution-soft);
      }
      /* Iter UX-5 — Sendezyklus-Spalte: Zahl gross, Beschreibung
         klein darunter. */
      .recommendation-cycle {
        white-space: nowrap;
      }
      .recommendation-cycle strong {
        display: block;
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
      }
      .recommendation-cycle .muted {
        white-space: normal;
      }
      /* Iter UX-6 — Source-Pill in der Empfohlen-Spalte */
      .recommendation-source-pill {
        margin-left: var(--mh-space-1);
        font-size: var(--mh-text-xs);
      }
      .recommendation-card__error {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
        align-items: flex-start;
      }
      .recommendation-card__footer {
        margin-top: var(--mh-space-3);
      }
      /* Iter L2.4 — Geraete-Profil-Editor */
      .recommendation-card__device-profile {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mh-space-2);
        margin: var(--mh-space-2) 0;
        padding: var(--mh-space-2);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm, 4px);
      }
      .recommendation-card__device-form {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
        margin: var(--mh-space-2) 0;
        padding: var(--mh-space-2);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm, 4px);
      }
      .recommendation-card__device-form label {
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
      }
      .recommendation-card__device-form input {
        padding: var(--mh-space-1) var(--mh-space-2);
        border: 1px solid var(--mh-divider);
        border-radius: var(--mh-radius-sm, 4px);
        background: var(--mh-surface-2);
        color: var(--mh-fg-default);
      }
      .recommendation-card__device-form-actions {
        display: flex;
        gap: var(--mh-space-2);
      }
      /* Iter 67 / WR-I: Trend-Card. Color-Border je nach Total-Severity. */
      .trend {
        border-left: 3px solid var(--mh-divider);
      }
      .trend--green {
        border-left-color: var(--mh-success);
      }
      .trend--yellow {
        border-left-color: var(--mh-caution);
      }
      .trend--orange {
        border-left-color: var(--mh-warning);
      }
      .trend--red {
        border-left-color: var(--mh-error);
      }
      /* Iter aiohttp-error-ZU9UA / P1 + Trend-Fix A: Hinweistexte in
         der Trend-Card. -short-hint bei kurzen Perioden (1h/6h),
         -retention-hint bei langen Perioden (48h+) wo Vorperiode
         ausserhalb der Raw-Retention liegt. */
      .trend-short-hint,
      .trend-retention-hint {
        margin: var(--mh-space-2) 0 var(--mh-space-3) 0;
        padding: var(--mh-space-2) var(--mh-space-3);
        background: var(--mh-surface-soft, var(--mh-surface));
        border-left: 3px solid var(--mh-info, var(--mh-divider));
        border-radius: var(--mh-radius-sm);
      }
      .trend-retention-hint {
        border-left-color: var(--mh-warning, var(--mh-divider));
      }
      .trend-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--mh-space-4);
      }
      .trend-col strong {
        display: block;
        margin-bottom: var(--mh-space-2);
      }
      .trend-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .trend-list li {
        display: grid;
        grid-template-columns: minmax(70px, auto) 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .trend-list--up li {
        background: var(--mh-warning-soft);
      }
      .trend-list--down li {
        background: var(--mh-success-soft);
      }
      .trend-delta {
        font-weight: var(--mh-weight-semibold);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .trend-delta--up {
        color: var(--mh-warning);
      }
      .trend-delta--down {
        color: var(--mh-success);
      }
      .trend-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      /* Iter G (knx-detail-panes): klickbare Trend-Zeile.
         GA-Klick wechselt zum GA-Detail-Pane (Trend zeigt GAs, nicht
         Sources — siehe knx_detail_panes_konzept.md). */
      .trend-list .trend-row {
        cursor: pointer;
      }
      .trend-list .trend-row:hover {
        filter: brightness(1.05);
      }
      .trend-list .trend-row.selected {
        box-shadow: inset 3px 0 0 var(--mh-primary);
      }
      /* Iter 64 / WR-P: Detail-Pane Schnell-Aktionen mit HA-Konfig +
         Forum-Link. Anchors als kompakte Liste, kein Button-Stil. */
      .ha-links {
        margin-top: var(--mh-space-3);
        padding-top: var(--mh-space-3);
        border-top: 1px solid var(--mh-divider);
      }
      .ha-links__list {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-3);
      }
      .ha-links__list a {
        color: var(--mh-accent);
        text-decoration: none;
        font-size: var(--mh-text-sm);
      }
      .ha-links__list a:hover {
        text-decoration: underline;
      }
      /* Iter 63 / U13: Auffaelligkeit-Badge in Top-Sender-Status-Spalte.
         Caution-Style (gelb), klein und neben der Severity-Pille. */
      .finding-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: var(--mh-radius-pill);
        background: var(--mh-caution-soft);
        color: var(--mh-caution);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        cursor: help;
      }
      /* Iter 60 / U4: Acknowledge-Status als dezente Pille mit
         success-soft-Hintergrund. Vorher reiner muted Text — heute klar
         als positiver Status erkennbar, ohne aufdringlich zu sein. */
      .ack-pill {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: var(--mh-radius-pill);
        background: var(--mh-success-soft);
        color: var(--mh-success);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }
      td.actions {
        text-align: right;
        white-space: nowrap;
      }

      /* Iter aiohttp-error-ZU9UA / P1: Detail-Pane als Side-Drawer.
         Vorher inline am Tabellenende. Backdrop dimmt den restlichen
         Inhalt subtil (rgba 0,0,0,0.25), Drawer-Card slidet von rechts. */
      .detail-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        z-index: 100;
        animation: mh-detail-backdrop-in 160ms ease-out;
      }
      .detail-pane {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: clamp(360px, 42vw, 640px);
        z-index: 101;
        margin: 0;
        border-radius: 0;
        border: none;
        border-left: 1px solid var(--mh-divider);
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: mh-detail-drawer-in 200ms ease-out;
      }
      .detail-head {
        flex: 0 0 auto;
        position: sticky;
        top: 0;
        background: var(--mh-surface);
        border-bottom: 1px solid var(--mh-divider);
        padding: var(--mh-space-3);
        z-index: 1;
      }
      .detail-body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: var(--mh-space-3);
      }
      .detail-close {
        flex-shrink: 0;
      }
      @media (max-width: 720px) {
        .detail-pane {
          width: 100vw;
        }
      }
      @keyframes mh-detail-backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mh-detail-drawer-in {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .detail-backdrop,
        .detail-pane {
          animation: none;
        }
      }
      .detail-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--mh-space-3);
        margin-bottom: var(--mh-space-3);
      }
      .detail-stat {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .detail-stat strong {
        font-size: var(--mh-text-md);
        color: var(--mh-fg);
        font-variant-numeric: tabular-nums;
      }
      .recommendation {
        padding: var(--mh-space-3);
        border-left: 3px solid var(--mh-divider);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
      }
      .recommendation p {
        margin: 4px 0 0 0;
        line-height: 1.5;
      }
      .rec-red {
        border-left-color: var(--mh-error);
      }
      .rec-orange {
        border-left-color: var(--mh-warning);
      }
      .rec-yellow {
        border-left-color: var(--mh-info);
      }
      .rec-green {
        border-left-color: var(--mh-success);
      }

      .findings {
        margin-top: var(--mh-space-3);
      }
      .findings ul {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-2);
      }
      .findings li {
        display: flex;
        align-items: flex-start;
        gap: var(--mh-space-2);
        padding: var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
      }

      /* Detail-Pane: Sibling-GAs (Iter 30) */
      .detail-head-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .detail-head-text code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        background: var(--mh-surface-2);
        padding: 1px 6px;
        border-radius: var(--mh-radius-sm);
        color: var(--mh-fg);
      }
      .siblings {
        margin-top: var(--mh-space-3);
      }
      /* Iter aiohttp-error-ZU9UA / UX-P3.3: Header mit Titel links,
         TopN-Selektor rechts. Wrappt bei schmalen Drawer-Breiten. */
      .siblings__head,
      /* Iter detail-topn: gleiche Layout-Logik fuer Source-Detail-
         GA-Tabelle, Source-Detail-Findings und GA-Detail-Findings. */
      .source-detail-section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mh-space-2);
        flex-wrap: wrap;
        margin-bottom: var(--mh-space-2);
      }
      .siblings ul {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .sibling-row {
        display: grid;
        grid-template-columns: 80px 1fr auto auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
        cursor: pointer;
        transition: background var(--mh-transition-fast);
      }
      .sibling-row:hover {
        background: var(--mh-accent-soft);
      }
      .sibling-row code.ga {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Hersteller-Info (Iter 34) */
      .device-info {
        margin-top: var(--mh-space-3);
        padding: var(--mh-space-3);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
      }
      .device-info ul.hints {
        list-style: disc;
        margin: var(--mh-space-2) 0 0 var(--mh-space-4);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: var(--mh-text-sm);
      }
      .device-info a {
        color: var(--mh-accent);
        text-decoration: none;
      }
      .device-info a:hover {
        text-decoration: underline;
      }
      .device-cell {
        max-width: 240px;
      }
      /* Iter 60 / U11: Tooltip-fähig durch title-Attr auf dem inneren
         span. Truncation via inline-block + overflow:hidden, weil td
         direkt overflow:hidden nicht zuverlässig trimmt. */
      .device-cell__text {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }

      /* Alarm-Banner */
      .alarm-banner {
        padding: var(--mh-space-3);
        background: var(--mh-error-soft);
        border-left: 4px solid var(--mh-error);
        border-radius: var(--mh-radius-sm);
      }
      .alarm-banner strong {
        color: var(--mh-error);
        display: block;
        margin-bottom: var(--mh-space-2);
      }
      .alarm-banner ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .alarm-banner li {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: var(--mh-space-2);
        font-size: var(--mh-text-sm);
      }
      .alarm-rule {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
        color: var(--mh-error);
      }
      /* Iter UX-1.0 — Aufklappbare Geraete-Details fuer silence_alarm */
      .alarm-details {
        grid-column: 1 / -1;
        margin-top: var(--mh-space-1);
        width: 100%;
      }
      .alarm-details summary {
        cursor: pointer;
        color: var(--mh-fg-muted);
        font-size: var(--mh-text-xs);
      }
      .alarm-details__devices {
        list-style: none;
        margin: var(--mh-space-2) 0 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mh-space-1);
        width: 100%;
      }
      .alarm-device {
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm, 4px);
        padding: var(--mh-space-1) var(--mh-space-2);
        width: 100%;
        box-sizing: border-box;
      }
      .alarm-device__inner {
        width: 100%;
      }
      .alarm-device__inner > summary {
        display: flex;
        align-items: center;
        gap: var(--mh-space-1);
        flex-wrap: wrap;
      }
      /* Iter UX-3 — Tabelle stretcht ueber die volle Card-Breite.
         Vorher schrumpfte <table> auf shrink-to-fit, weil weder
         alarm-device noch der innere <details>-Block eine explizite
         width hatten. Jetzt: alle Container 100% + table-layout fixed
         mit auto-Spalten + box-sizing border-box, damit das Padding
         nicht aus dem Banner austritt. */
      .alarm-device__gas {
        width: 100%;
        margin-top: var(--mh-space-2);
        border-collapse: collapse;
        font-size: var(--mh-text-xs);
        table-layout: auto;
      }
      .alarm-device__gas th,
      .alarm-device__gas td {
        text-align: left;
        padding: var(--mh-space-1);
        border-bottom: 1px solid var(--mh-divider);
      }
      .alarm-device__gas td.num,
      .alarm-device__gas th.num {
        text-align: right;
      }

      /* Orphans-Card */
      .orphans-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--mh-space-4);
      }
      /* Iter 61 / U3 + Iter aiohttp-error-ZU9UA: Such-Input + Inline-
         TopN im Spalten-Header. Pager wurde durch inline-topn ersetzt. */
      .orphans-col-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mh-space-2);
        flex-wrap: wrap;
      }
      .orphans-search {
        margin: var(--mh-space-2) 0;
        width: 100%;
        max-width: 320px;
      }
      .orphans-placeholder-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        user-select: none;
      }
      .orphans-placeholder-toggle input {
        cursor: pointer;
      }
      .orphans-list {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .orphans-list li {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .orphans-list.muted-list li {
        background: var(--mh-surface-2);
      }
      .orphans-list.extra-list li {
        background: color-mix(in srgb, var(--mh-warning) 8%, transparent);
      }
      .orphans-list code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Silence-Card */
      .silence-card {
        border-left: 3px solid var(--mh-error);
      }
      .silence-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .silence-list li {
        display: grid;
        grid-template-columns: 80px 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-error-soft);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .silence-list code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }
      /* Iter F (knx-detail-panes): klickbare Stille-Alarm-Zeile.
         Hover etwas verstaerkt, Selection-Highlight wie .top-device-row. */
      .silence-list .silence-row {
        cursor: pointer;
      }
      .silence-list .silence-row:hover {
        filter: brightness(1.05);
      }
      .silence-list .silence-row.selected {
        box-shadow: inset 3px 0 0 var(--mh-primary);
      }

      /* Bus-Health-Liste */
      .bus-health-list {
        margin-top: var(--mh-space-3);
      }
      .bus-health-list ul {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .bus-health-list li {
        display: grid;
        grid-template-columns: 80px 1fr auto auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .bus-health-list li code {
        font-family: var(--ha-font-family-code, ui-monospace, monospace);
        font-size: var(--mh-text-xs);
        font-weight: var(--mh-weight-semibold);
      }

      /* Iter D.2 (knx-detail-panes): Source-Detail-Pane.
         KPI-Reihe analog detail-stats, Stille-Alarm prominent rot,
         GA-Liste klickbar mit Cursor-Pointer. */
      .source-detail-kpis {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mh-space-4);
        margin-bottom: var(--mh-space-3);
      }
      .source-detail-kpi {
        display: flex;
        flex-direction: column;
        min-width: 100px;
      }
      .source-detail-kpi strong {
        font-size: var(--mh-text-md);
      }
      .source-detail-silent-alarm {
        margin: var(--mh-space-2) 0 var(--mh-space-3) 0;
        padding: var(--mh-space-3);
        background: var(--mh-error-soft);
        border-left: 4px solid var(--mh-error);
        border-radius: var(--mh-radius-sm);
      }
      .source-detail-silent-alarm strong {
        color: var(--mh-error);
        display: block;
        margin-bottom: var(--mh-space-1);
      }
      .source-detail-silent {
        margin: var(--mh-space-2) 0;
      }
      .source-detail-ga-list {
        margin: var(--mh-space-3) 0;
      }
      .source-detail-ga-list table {
        margin-top: var(--mh-space-2);
      }
      .source-ga-row {
        cursor: pointer;
      }
      .source-ga-row:hover {
        background: var(--mh-bg-hover, rgba(0, 0, 0, 0.04));
      }

      /* Iter I (knx-detail-panes): Trend-Block im Source-Detail.
         Severity-Variante als Border-Left, analog zur Stille-Card. */
      .source-detail-trend {
        margin: var(--mh-space-3) 0;
        padding: var(--mh-space-2) var(--mh-space-3);
        border-radius: var(--mh-radius-sm);
        background: var(--mh-surface-2);
        border-left: 3px solid var(--mh-fg-muted);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .source-detail-trend--green {
        border-left-color: var(--mh-success);
      }
      .source-detail-trend--yellow {
        border-left-color: var(--mh-caution);
      }
      .source-detail-trend--orange {
        border-left-color: var(--mh-warning);
      }
      .source-detail-trend--red {
        border-left-color: var(--mh-error);
      }

      /* Iter H (knx-detail-panes): Findings-Liste im Source-Detail. */
      .source-detail-findings {
        margin: var(--mh-space-3) 0;
      }
      .source-detail-findings__list {
        list-style: none;
        padding: 0;
        margin: var(--mh-space-2) 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .source-detail-finding {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        gap: var(--mh-space-2);
        padding: 4px var(--mh-space-2);
        background: var(--mh-surface-2);
        border-radius: var(--mh-radius-sm);
        font-size: var(--mh-text-sm);
        align-items: center;
      }
      .source-detail-finding__link {
        color: var(--mh-accent);
        text-decoration: none;
      }
      .source-detail-finding__link:hover {
        text-decoration: underline;
      }
      .source-detail-finding__title {
        color: var(--mh-fg-muted);
      }
      .source-detail-finding__count {
        font-variant-numeric: tabular-nums;
      }

      /* Iter E (knx-detail-panes): klickbare Top-Geraete-Zeile.
         Selection-Highlight nutzt selben Stil wie die GA-Top-Sender-
         Tabelle (.row-... .selected) — Konsistenz beim Source-Detail-
         Wechsel zwischen den beiden Drawer-Inhalten. */
      .top-device-row {
        cursor: pointer;
      }
      .top-device-row:hover {
        background: var(--mh-bg-hover, rgba(0, 0, 0, 0.04));
      }
      .top-device-row.selected {
        background: color-mix(in srgb, var(--mh-primary) 12%, transparent);
        box-shadow: inset 3px 0 0 var(--mh-primary);
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
    `,
  ];
}
