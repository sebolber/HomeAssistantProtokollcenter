// Iter topn-1 / Phase 8: Trend-Card respektiert _filters.topNTrend.
// Bug: stats-knx-view rief getKnxStatsTrend(filters, 5) hardcoded auf,
// obwohl die UI einen TopN-Selektor pro Card hat (topNTrend, default 25).
// Effekt: User stellt 10/25/50 ein -> bekommt trotzdem nur 5 Backend-
// Eintraege. Slice im Render half nicht, weil das API-Limit kleiner war.
//
// Test-Strategie: mock-API zaehlt die Aufrufe und liefert top_increase
// passend zur Anzahl. Der erste Mount mit topNTrend=10 muss
// (a) getKnxStatsTrend mit topN=10 aufrufen und (b) 10 Up-Zeilen rendern.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsSummaryDto,
  KnxStatsTrendRowDto,
} from "../src/api-client.js";

const FILTERS_KEY = "messagehub.knx-stats.filters";

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
    ga: `0/${i}/1`,
    label: `Up GA ${i}`,
    dpt: "1.001",
    count_now: 200 - i,
    count_prev: 50,
    delta_abs: 150 - i,
    delta_pct: 300 - i,
  }));
}

function makeApi(increaseCount: number): ApiClient {
  const api: Partial<ApiClient> = {
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
      total_now: 1000,
      total_prev: 800,
      total_delta_abs: 200,
      total_delta_pct: 25.0,
      top_increase: makeIncreaseRows(increaseCount),
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
  };
  return api as ApiClient;
}

async function mount(api: ApiClient): Promise<HTMLElement> {
  const el = document.createElement("stats-knx-view") as HTMLElement & {
    api?: ApiClient;
    updateComplete: Promise<unknown>;
  };
  el.api = api;
  document.body.appendChild(el);
  for (let i = 0; i < 6; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
  return el;
}

describe("stats-knx-view Trend-Card respektiert topNTrend (Iter topn-1)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem(FILTERS_KEY);
    } catch {
      // ignore
    }
    // Hash-State zwischen Tests aufpassen — F-010-Routing setzt Hashes.
    window.history.replaceState(null, "", "/");
  });

  it("ruft getKnxStatsTrend mit topN aus _filters.topNTrend (statt hardcoded 5)", async () => {
    // Vorab: User hat den Trend-Card-TopN-Selektor auf 10 gestellt.
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({ periodId: "24h", topNTrend: 10 }),
    );
    const api = makeApi(10);
    await mount(api);

    expect(api.getKnxStatsTrend).toHaveBeenCalled();
    const call = (api.getKnxStatsTrend as ReturnType<typeof vi.fn>).mock
      .calls[0];
    // Signatur: getKnxStatsTrend(filters, topN). Zweites Argument ist topN.
    expect(call[1]).toBe(10);
  });

  it("rendert topNTrend Trend-Up-Zeilen (10 statt der alten 5)", async () => {
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({ periodId: "24h", topNTrend: 10 }),
    );
    const api = makeApi(10);
    const el = await mount(api);

    const upRows = el.shadowRoot!.querySelectorAll(".trend-list--up li");
    expect(upRows.length).toBe(10);
  });
});
