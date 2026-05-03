// Iter topn-2 (Sprint A / Phase 8): Bursts-, Long-Term- und
// Sensitive-Audit-Cards respektieren ihren eigenen Top-N-Selektor.
// Vorher wurde der Backend-Call ohne `limit` ausgelost — Backend
// fiel auf seine Defaults zurueck (Bursts 50, Long-Term 50,
// Sensitive 200) und ignorierte die UI-Auswahl.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsFilters,
  KnxStatsSummaryDto,
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

interface MockApi extends ApiClient {
  burstCalls: Array<{ limit?: number }>;
  sensitiveCalls: Array<{ limit?: number }>;
  longTermCalls: Array<{ limit?: number }>;
}

function makeApi(): MockApi {
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
    getKnxStatsTrend: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      prev_from: SUMMARY.from,
      prev_to: SUMMARY.from,
      period_minutes: 60,
      total_now: 1000,
      total_prev: 800,
      total_delta_abs: 200,
      total_delta_pct: 25.0,
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
    knxStatsGaExportUrl: vi.fn(
      (ga: string, format: string) =>
        `/api/messagehub/knx-stats/ga/${encodeURIComponent(ga)}/export?format=${format}`,
    ),
    burstCalls: [],
    sensitiveCalls: [],
    longTermCalls: [],
  };
  api.getKnxStatsBursts = vi.fn(async (f: KnxStatsFilters) => {
    api.burstCalls!.push({ limit: f.limit });
    return {
      from: SUMMARY.from,
      to: SUMMARY.to,
      window_seconds: 5,
      threshold_pct: 30.0,
      bursts: [],
    };
  });
  api.getKnxStatsSensitiveLog = vi.fn(async (f: KnxStatsFilters) => {
    api.sensitiveCalls!.push({ limit: f.limit });
    return {
      from: SUMMARY.from,
      to: SUMMARY.to,
      addresses: [],
      telegrams: [],
    };
  });
  api.getKnxStatsLongTerm = vi.fn(async (f: KnxStatsFilters) => {
    api.longTermCalls!.push({ limit: f.limit });
    return {
      from: SUMMARY.from,
      to: SUMMARY.to,
      bucket: "hour" as const,
      total: 0,
      top_gas: [],
      series: [],
    };
  });
  return api as MockApi;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
}

function setStoredFilters(overrides: Record<string, unknown>): void {
  const base = {
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
    topNSiblings: 25,
    minRate: 0.0,
    includeAck: true,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...base, ...overrides }));
  localStorage.setItem(DEFAULTS_VERSION_KEY, "v2");
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

describe("stats-knx-view card-topn limits (Iter topn-2)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DEFAULTS_VERSION_KEY);
    } catch {
      // ignore
    }
  });

  it("Bursts-Card: getKnxStatsBursts wird mit topNBursts als limit aufgerufen", async () => {
    setStoredFilters({ topNBursts: 100 });
    const api = makeApi();
    await mount(api);

    expect(api.burstCalls.length).toBeGreaterThanOrEqual(1);
    for (const call of api.burstCalls) {
      expect(call.limit).toBe(100);
    }
  });

  it("Sensitive-Audit-Card: getKnxStatsSensitiveLog wird mit topNAudit als limit aufgerufen", async () => {
    setStoredFilters({ topNAudit: 50 });
    const api = makeApi();
    await mount(api);

    expect(api.sensitiveCalls.length).toBeGreaterThanOrEqual(1);
    for (const call of api.sensitiveCalls) {
      expect(call.limit).toBe(50);
    }
  });

  it("Long-Term-Card: getKnxStatsLongTerm wird mit topNLongTerm als limit aufgerufen", async () => {
    // Long-Term wird nur in Long-Term-Perioden (7d/30d/365d) aufgerufen.
    setStoredFilters({ periodId: "7d", topNLongTerm: 200 });
    const api = makeApi();
    await mount(api);

    expect(api.longTermCalls.length).toBeGreaterThanOrEqual(1);
    for (const call of api.longTermCalls) {
      expect(call.limit).toBe(200);
    }
  });
});
