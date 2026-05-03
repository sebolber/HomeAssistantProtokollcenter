// Iter topn-1 (Sprint A / Phase 8): Trend-Card respektiert den UI-
// Top-N-Selektor. Vorher hardcoded `5` im Backend-Call, jetzt
// this._filters.topNTrend — sodass eine Auswahl von z. B. 10 auch
// 10 Trend-Increase-Eintraege liefert.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsSummaryDto,
  KnxStatsTrendDto,
  KnxStatsTrendRowDto,
} from "../src/api-client.js";

const STORAGE_KEY = "messagehub.knx-stats.filters";
const DEFAULTS_VERSION_KEY = "messagehub.knx-stats.filters.defaults-version";

const SUMMARY: KnxStatsSummaryDto = {
  from: "2026-04-25T00:00:00Z",
  to: "2026-05-02T00:00:00Z",
  total_telegrams: 1000,
  active_gas: 5,
  active_devices: 3,
  estimated_busload_pct: 1.0,
  counts_by_severity: { green: 3, yellow: 1, orange: 0, red: 1 },
};

function makeIncreaseRows(n: number): KnxStatsTrendRowDto[] {
  return Array.from({ length: n }, (_, i) => ({
    ga: `5/0/${i + 1}`,
    label: `GA ${i + 1}`,
    dpt: "9.004",
    count_now: 100 + i,
    count_prev: 10,
    delta_abs: 90 + i,
    delta_pct: 900 + i,
  }));
}

interface MockApi extends ApiClient {
  trendCalls: Array<{ topN?: number }>;
}

function makeApi(topIncrease: KnxStatsTrendRowDto[]): MockApi {
  // Backend respektiert top_n und liefert maximal top_n Eintraege —
  // wir simulieren das hier, damit der Test eine Regression auch dann
  // faengt, wenn nur die Render-Slice falsch waere.
  const buildTrend = (topN: number): KnxStatsTrendDto => ({
    from: SUMMARY.from,
    to: SUMMARY.to,
    prev_from: SUMMARY.from,
    prev_to: SUMMARY.from,
    period_minutes: 60,
    total_now: 1000,
    total_prev: 800,
    total_delta_abs: 200,
    total_delta_pct: 25.0,
    top_increase: topIncrease.slice(0, topN),
    top_decrease: [],
  });
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
    knxStatsGaExportUrl: vi.fn(
      (ga: string, format: string) =>
        `/api/messagehub/knx-stats/ga/${encodeURIComponent(ga)}/export?format=${format}`,
    ),
    trendCalls: [],
  };
  api.getKnxStatsTrend = vi.fn(async (_filters: unknown, topN?: number) => {
    api.trendCalls!.push({ topN });
    return buildTrend(topN ?? 5);
  });
  return api as MockApi;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
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

describe("stats-knx-view trend-card topNTrend (Iter topn-1)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
    try {
      // Filter mit topNTrend=10 explizit setzen; Migrations-Marker
      // setzen, damit migrateFilterDefaults nicht eingreift.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          periodId: "24h",
          topN: 25,
          topNDevices: 25,
          topNAudit: 25,
          topNBursts: 25,
          topNLongTerm: 25,
          topNTrend: 10,
          topNOrphansMissing: 25,
          topNOrphansExtra: 25,
          topNSilence: 25,
          topNBusHealth: 25,
          topNSiblings: 25,
          minRate: 0.0,
          includeAck: true,
        }),
      );
      localStorage.setItem(DEFAULTS_VERSION_KEY, "v2");
    } catch {
      // ignore
    }
  });

  it("getKnxStatsTrend wird mit topNTrend (10) statt hardcoded 5 aufgerufen", async () => {
    const api = makeApi(makeIncreaseRows(10));
    await mount(api);

    expect(api.trendCalls.length).toBeGreaterThanOrEqual(1);
    // Alle Trend-Calls (initial-Load + ggf. Re-Load) muessen den Card-
    // Selektor-Wert benutzen, NICHT den alten hardcoded `5`.
    for (const call of api.trendCalls) {
      expect(call.topN).toBe(10);
    }
  });

  it("Trend-Increase-Liste rendert 10 Eintraege wenn topNTrend=10", async () => {
    const api = makeApi(makeIncreaseRows(10));
    const el = await mount(api);

    const upRows = el.shadowRoot!.querySelectorAll(
      ".trend-list--up li.trend-row",
    );
    expect(upRows.length).toBe(10);
  });
});
