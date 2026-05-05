// Iter detail-topn (Sprint UX): Detail-Bereiche (Source-Detail, GA-Detail)
// zeigen ihre Tabellen mit Default 10 Eintraegen + Inline-TopN-Selektor
// (10 / 25 / 50 / 100 / 200) + "und N weitere"-Indikator. Vorher hatten
// einige Detail-Tabellen gar keinen Selektor (Source-Detail GA-Liste,
// Findings-Liste) und der Sibling-GA-Selektor stand auf 25. Bei white-on-
// white-Themes war der aktive Selektor-Button unleserlich, weil das CSS
// auf undefinierte Tokens (--mh-primary, --mh-on-primary) griff.
//
// Tests prufen: Default = 10, Selektor sichtbar, Truncation-Hinweis
// erscheint, CSS nutzt die korrekten (definierten) Tokens.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsGaDetailDto,
  KnxStatsSourceDetailDto,
  KnxStatsSourceGaSummaryDto,
  KnxStatsSourcePersistedFindingDto,
  KnxStatsSummaryDto,
} from "../src/api-client.js";

const STORAGE_KEY = "messagehub.knx-stats.filters";
const DEFAULTS_VERSION_KEY = "messagehub.knx-stats.filters.defaults-version";

const SUMMARY: KnxStatsSummaryDto = {
  from: "2026-04-25T00:00:00Z",
  to: "2026-05-02T00:00:00Z",
  total_telegrams: 1000,
  active_gas: 30,
  active_devices: 3,
  estimated_busload_pct: 1.0,
  counts_by_severity: { green: 25, yellow: 3, orange: 1, red: 1 },
};

function makeGa(idx: number): KnxStatsSourceGaSummaryDto {
  return {
    ga: `5/2/${idx}`,
    label: `Sensor ${idx}`,
    dpt: "9.004",
    count: 100 - idx,
    rate_per_min: 5.0 - idx * 0.1,
    recommended_rate: 2.0,
    ratio: 2.5 - idx * 0.05,
    severity: idx < 3 ? "red" : idx < 8 ? "yellow" : "green",
    acknowledged: false,
    last_seen: "2026-05-02T15:30:00Z",
  };
}

function makeFinding(idx: number): KnxStatsSourcePersistedFindingDto {
  return {
    code: `FINDING_${idx}`,
    schema_version: 1,
    severity: "warning",
    ga: null,
    source: "1.1.42",
    title: `Finding ${idx}`,
    description: `Beschreibung ${idx}`,
    occurrence_count: 5,
    first_seen: "2026-05-02T10:00:00Z",
    last_seen: "2026-05-02T15:30:00Z",
    detector_version: `FINDING_${idx}/v1`,
  };
}

function makeSourceDetail(
  gaCount: number,
  findingCount: number,
): KnxStatsSourceDetailDto {
  return {
    dev_source: "1.1.42",
    total_count: 750,
    ga_count: gaCount,
    share_pct: 75.0,
    last_seen: "2026-05-02T15:30:00Z",
    silent_minutes: 12.5,
    silent_alarm: false,
    repeat_ratio_pct: 0.4,
    gas: Array.from({ length: gaCount }, (_, i) => makeGa(i)),
    findings: Array.from({ length: findingCount }, (_, i) => makeFinding(i)),
    from: "2026-05-01T15:30:00Z",
    to: "2026-05-02T15:30:00Z",
  };
}

interface MockApi extends ApiClient {
  sourceDetailCalls: Array<{ devSource: string }>;
}

function makeApi(sourceDetail: KnxStatsSourceDetailDto): MockApi {
  const api: Partial<MockApi> = {
    getKnxStatsSummary: vi.fn(async () => SUMMARY),
    getKnxStatsTop: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      items: [],
      total: 0,
    })),
    getKnxStatsTopBySource: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      items: [],
      total: 0,
    })),
    getKnxStatsTimeline: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      bucket_minutes: 60,
      items: [],
    })),
    getKnxStatsBusHealth: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      summary: { total: 0, repeated: 0, ratio_pct: 0 },
      per_ga: [],
    })),
    getKnxStatsSilence: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      max_silence_minutes: 1440,
      items: [],
      alarm_count: 0,
    })),
    getKnxStatsOrphans: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      missing_in_log: [],
      extra_in_log: [],
      project_total: 0,
      log_total: 0,
      discovery_status: "ok",
    })),
    getKnxStatsAlarms: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      alarms: [],
      triggered_count: 0,
    })),
    getKnxStatsBusload: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      bucket_seconds: 10,
      summary: {
        current_pct: 0,
        max_pct: 0,
        avg_pct: 0,
        total_telegrams: 0,
        buckets: 0,
      },
      series: [],
    })),
    getKnxStatsHealthScore: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      score: 100,
      severity: "green" as const,
      components: { repeat: 100, busload: 100, silence: 100, alarms: 100 },
      findings: [],
    })),
    getKnxStatsLongTerm: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      bucket: "hour" as const,
      total: 0,
      top_gas: [],
      series: [],
    })),
    getKnxStatsBursts: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      window_seconds: 5,
      threshold_pct: 30.0,
      bursts: [],
    })),
    getKnxStatsSensitiveLog: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      addresses: [],
      telegrams: [],
    })),
    getKnxStatsTrend: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      prev_from: SUMMARY.from,
      prev_to: SUMMARY.from,
      period_minutes: 60,
      total_now: 0,
      total_prev: 0,
      total_delta_abs: 0,
      total_delta_pct: null,
      top_increase: [],
      top_decrease: [],
    })),
    getKnxStatsHeatmap: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      bucket_minutes: 60,
      gas: [],
      buckets: [],
      matrix: [],
    })),
    getKnxBusAnalysisState: vi.fn(async () => ({ enabled: true })),
    setKnxBusAnalysisState: vi.fn(async (enabled: boolean) => ({
      ok: true,
      enabled,
    })),
    sourceDetailCalls: [],
  };
  api.getKnxStatsSourceDetail = vi.fn(async (devSource: string) => {
    api.sourceDetailCalls!.push({ devSource });
    return sourceDetail;
  });
  api.knxStatsGaExportUrl = vi.fn(
    (ga: string, format: string) =>
      `/api/messagehub/knx-stats/ga/${encodeURIComponent(ga)}/export?format=${format}`,
  );
  return api as MockApi;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
  _sourceDetail: KnxStatsSourceDetailDto | null;
  _detail: KnxStatsGaDetailDto | null;
  _loadSourceDetail(devSource: string): Promise<void>;
}

async function mount(api: MockApi): Promise<PrivateView> {
  const el = document.createElement("stats-knx-view") as PrivateView;
  el.api = api;
  document.body.appendChild(el);
  for (let i = 0; i < 6; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
  return el;
}

async function setSourceDetail(
  el: PrivateView,
  devSource: string,
): Promise<void> {
  await el._loadSourceDetail(devSource);
  for (let i = 0; i < 4; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEFAULTS_VERSION_KEY);
  } catch {
    // ignore
  }
}

describe("Detail-Bereich Default 10 + TopN-Selektor (Iter detail-topn)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    clearStorage();
  });

  it("Source-Detail GA-Tabelle truncated bei Default 10 Eintraegen", async () => {
    const api = makeApi(makeSourceDetail(15, 0));
    const el = await mount(api);
    await setSourceDetail(el, "1.1.42");

    const list = el.shadowRoot!.querySelector(".source-detail-ga-list");
    expect(list).not.toBeNull();
    const rows = list!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(10);
  });

  it("Source-Detail GA-Tabelle zeigt TopN-Selektor mit 10/25/50/100/200", async () => {
    const api = makeApi(makeSourceDetail(15, 0));
    const el = await mount(api);
    await setSourceDetail(el, "1.1.42");

    const list = el.shadowRoot!.querySelector(".source-detail-ga-list");
    expect(list).not.toBeNull();
    const buttons = list!.querySelectorAll(".inline-topn__btn");
    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels).toEqual(["10", "25", "50", "100", "200"]);
  });

  it("Source-Detail GA-Tabelle zeigt 'und N weitere'-Hinweis bei Truncation", async () => {
    const api = makeApi(makeSourceDetail(15, 0));
    const el = await mount(api);
    await setSourceDetail(el, "1.1.42");

    const list = el.shadowRoot!.querySelector(".source-detail-ga-list");
    expect(list).not.toBeNull();
    const text = list!.textContent ?? "";
    // 15 GAs total, 10 angezeigt → 5 weitere
    expect(text).toMatch(/und\s+5\s+weitere/);
  });

  it("Source-Detail GA-Tabelle ohne Truncation zeigt KEINEN Hinweis", async () => {
    const api = makeApi(makeSourceDetail(5, 0));
    const el = await mount(api);
    await setSourceDetail(el, "1.1.42");

    const list = el.shadowRoot!.querySelector(".source-detail-ga-list");
    expect(list).not.toBeNull();
    const text = list!.textContent ?? "";
    expect(text).not.toMatch(/weitere/);
  });

  it("Source-Detail Findings-Liste truncated bei Default 10 Eintraegen", async () => {
    const api = makeApi(makeSourceDetail(1, 12));
    const el = await mount(api);
    await setSourceDetail(el, "1.1.42");

    const list = el.shadowRoot!.querySelector(".source-detail-findings");
    expect(list).not.toBeNull();
    const items = list!.querySelectorAll(".source-detail-findings__list > li");
    expect(items.length).toBe(10);
  });

  it("Source-Detail Findings-Liste zeigt TopN-Selektor", async () => {
    const api = makeApi(makeSourceDetail(1, 12));
    const el = await mount(api);
    await setSourceDetail(el, "1.1.42");

    const list = el.shadowRoot!.querySelector(".source-detail-findings");
    expect(list).not.toBeNull();
    const buttons = list!.querySelectorAll(".inline-topn__btn");
    expect(buttons.length).toBe(5);
  });

  it("Source-Detail Findings-Liste zeigt 'und N weitere'-Hinweis", async () => {
    const api = makeApi(makeSourceDetail(1, 12));
    const el = await mount(api);
    await setSourceDetail(el, "1.1.42");

    const list = el.shadowRoot!.querySelector(".source-detail-findings");
    expect(list).not.toBeNull();
    const text = list!.textContent ?? "";
    // 12 Findings, 10 angezeigt → 2 weitere
    expect(text).toMatch(/und\s+2\s+weitere/);
  });

  it("CSS-Active-Style nutzt definierte Tokens (--mh-accent), nicht das undefinierte --mh-primary", () => {
    // Regression: vorher griff `.inline-topn__btn.active` auf var(--mh-primary)
    // (background) und var(--mh-on-primary, white) (color), beide nicht in
    // tokens.ts definiert. Resultat: white-on-white auf hellen HA-Themes.
    // Fix: --mh-accent / --mh-accent-fg verwenden, die in tokens.ts mit
    // sinnvollen Fallbacks deklariert sind.
    const ctor = customElements.get("stats-knx-view") as
      | (typeof HTMLElement & { styles?: Array<{ cssText: string }> | { cssText: string } })
      | undefined;
    expect(ctor).toBeDefined();
    const stylesField = ctor!.styles;
    const stylesArray = Array.isArray(stylesField)
      ? stylesField
      : stylesField
        ? [stylesField]
        : [];
    const allCss = stylesArray.map((s) => s.cssText).join("\n");

    // Active-Regel muss auf --mh-accent bauen, nicht auf das undefinierte
    // --mh-primary. Whitespace-tolerant matchen.
    const activeRule = allCss.match(
      /\.inline-topn__btn\.active\s*\{[\s\S]*?\}/,
    )?.[0];
    expect(activeRule).toBeDefined();
    expect(activeRule).toMatch(/--mh-accent/);
    expect(activeRule).not.toMatch(/--mh-primary\b/);
    expect(activeRule).not.toMatch(/--mh-on-primary\b/);
  });
});

describe("DEFAULT_FILTERS — neue Defaults = 10 (Iter detail-topn)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    clearStorage();
  });

  it("Brand-new User starten mit topNAudit = 10 (statt vorher 25)", async () => {
    const api = makeApi(makeSourceDetail(0, 0));
    const el = await mount(api);
    // Trick: localStorage-Inhalt nach Mount inspizieren — der Filter-State
    // wird beim ersten Save persistiert. Falls noch nicht persistiert,
    // greifen wir auf den internen State zu.
    const filters = (el as unknown as { _filters: { [key: string]: number } })
      ._filters;
    expect(filters.topN).toBe(10);
    expect(filters.topNAudit).toBe(10);
    expect(filters.topNBursts).toBe(10);
    expect(filters.topNDevices).toBe(10);
    expect(filters.topNLongTerm).toBe(10);
    expect(filters.topNTrend).toBe(10);
    expect(filters.topNSilence).toBe(10);
    expect(filters.topNBusHealth).toBe(10);
    expect(filters.topNOrphansMissing).toBe(10);
    expect(filters.topNOrphansExtra).toBe(10);
    expect(filters.topNSiblings).toBe(10);
  });

  it("Bestandsuser mit altem 25er-Default werden auf 10 migriert (v3-Bump)", async () => {
    // Stored = altes Default-Set (alle 25), keine version-marker → migriert.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        periodId: "24h",
        topN: 25,
        topNDevices: 25,
        topNAudit: 25,
        topNBursts: 25,
        topNLongTerm: 25,
        topNTrend: 25,
        topNOrphansMissing: 25,
        topNOrphansExtra: 25,
        topNSilence: 25,
        topNBusHealth: 25,
        topNHeatmap: 10,
        topNSiblings: 25,
        minRate: 0.0,
        includeAck: true,
      }),
    );
    // v2-Marker setzen, damit nur die topN-Migration (v3) greift.
    localStorage.setItem(DEFAULTS_VERSION_KEY, "v2");

    const api = makeApi(makeSourceDetail(0, 0));
    const el = await mount(api);
    const filters = (el as unknown as { _filters: { [key: string]: number } })
      ._filters;
    expect(filters.topN).toBe(10);
    expect(filters.topNAudit).toBe(10);
    expect(filters.topNSiblings).toBe(10);
    // Heatmap bleibt 10 (war auch vorher 10).
    expect(filters.topNHeatmap).toBe(10);
  });

  it("User mit explizitem Wert (z. B. 50) behaelt seine Auswahl trotz v3-Bump", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        periodId: "24h",
        topN: 50, // explizit
        topNDevices: 25, // war Default → wird migriert
        topNAudit: 100, // explizit
        topNBursts: 25,
        topNLongTerm: 25,
        topNTrend: 25,
        topNOrphansMissing: 25,
        topNOrphansExtra: 25,
        topNSilence: 25,
        topNBusHealth: 25,
        topNHeatmap: 10,
        topNSiblings: 25,
        minRate: 0.0,
        includeAck: true,
      }),
    );
    localStorage.setItem(DEFAULTS_VERSION_KEY, "v2");

    const api = makeApi(makeSourceDetail(0, 0));
    const el = await mount(api);
    const filters = (el as unknown as { _filters: { [key: string]: number } })
      ._filters;
    expect(filters.topN).toBe(50);
    expect(filters.topNAudit).toBe(100);
    expect(filters.topNDevices).toBe(10); // war Default → migriert
    expect(filters.topNBursts).toBe(10);
  });
});
