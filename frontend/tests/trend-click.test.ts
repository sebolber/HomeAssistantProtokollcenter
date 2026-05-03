// Iter G (knx-detail-panes): Trend-Liste Click-Handler.
// Klick auf eine LI in trend-list--up oder trend-list--down ruft
// _loadDetail(row.ga) und oeffnet das GA-Detail-Pane (NICHT Source —
// Trend-Zeilen referenzieren GAs).

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsGaDetailDto,
  KnxStatsSummaryDto,
} from "../src/api-client.js";

const SUMMARY: KnxStatsSummaryDto = {
  from: "2026-04-25T00:00:00Z",
  to: "2026-05-02T00:00:00Z",
  total_telegrams: 1000,
  active_gas: 5,
  active_devices: 3,
  estimated_busload_pct: 1.0,
  counts_by_severity: { green: 3, yellow: 1, orange: 0, red: 1 },
};

const DETAIL_5_2_14: KnxStatsGaDetailDto = {
  ga: "5/2/14",
  dpt: "9.004",
  label: "Wetter Lux",
  dev_source: "1.1.220",
  count: 600,
  rate_per_min: 142.3,
  recommended_rate: 2.0,
  recommendation: {
    severity: "red",
    text: "Helligkeit (Lux): empfohlen Hysterese >= 50 Lux, Sendezyklus >= 5 Min.",
    action_required: true,
    ratio: 71.15,
    estimated_reduction_pct: 98.6,
  },
  findings: [],
  sibling_gas: [],
  value_history: [],
};

interface MockApi extends ApiClient {
  detailCalls: Array<{ ga: string }>;
  sourceDetailCalls: Array<{ devSource: string }>;
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
      top_increase: [
        {
          ga: "5/2/14",
          label: "Wetter Lux",
          dpt: "9.004",
          count_now: 600,
          count_prev: 100,
          delta_abs: 500,
          delta_pct: 500,
        },
      ],
      top_decrease: [
        {
          ga: "1/2/3",
          label: "Wohnzimmer Licht",
          dpt: "1.001",
          count_now: 50,
          count_prev: 100,
          delta_abs: -50,
          delta_pct: -50,
        },
      ],
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
    detailCalls: [],
    sourceDetailCalls: [],
  };
  api.getKnxStatsGaDetail = vi.fn(async (ga: string) => {
    api.detailCalls!.push({ ga });
    return { ...DETAIL_5_2_14, ga };
  });
  api.getKnxStatsSourceDetail = vi.fn(async (devSource: string) => {
    api.sourceDetailCalls!.push({ devSource });
    throw new Error("trend should never call source detail");
  });
  return api as MockApi;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
  _detail: KnxStatsGaDetailDto | null;
  _sourceDetail: unknown;
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

async function settleUpdates(el: PrivateView): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

// Default-Periode "24h" -> kein isShortTrendPeriod, also wird die Trend-
// Card normal gerendert. Die default-PeriodId wird in beforeEach durch
// localStorage-Reset garantiert ("24h" ist DEFAULT_FILTERS.periodId).

describe("stats-knx-view trend-list click (Iter G)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("test_trend_row_click_loads_ga_detail (top_increase)", async () => {
    const api = makeApi();
    const el = await mount(api);

    const upList = el.shadowRoot!.querySelector(".trend-list--up");
    expect(upList).not.toBeNull();
    const firstUp = upList!.querySelector("li") as HTMLElement;
    expect(firstUp).not.toBeNull();
    firstUp.click();
    await settleUpdates(el);

    // GA-Detail (NICHT Source-Detail!) ist offen.
    expect(el._detail).not.toBeNull();
    expect(el._detail!.ga).toBe("5/2/14");
    expect(api.detailCalls).toHaveLength(1);
    expect(api.detailCalls[0].ga).toBe("5/2/14");
    expect(api.sourceDetailCalls).toHaveLength(0);
  });

  it("Trend-Decrease-Klick laedt ebenfalls GA-Detail", async () => {
    const api = makeApi();
    const el = await mount(api);

    const downList = el.shadowRoot!.querySelector(".trend-list--down");
    expect(downList).not.toBeNull();
    const firstDown = downList!.querySelector("li") as HTMLElement;
    firstDown.click();
    await settleUpdates(el);

    expect(el._detail).not.toBeNull();
    expect(el._detail!.ga).toBe("1/2/3");
    expect(api.detailCalls).toHaveLength(1);
    expect(api.detailCalls[0].ga).toBe("1/2/3");
  });

  it("Trend-Zeilen sind als klickbar markiert (Cursor-Pointer-Klasse)", async () => {
    const api = makeApi();
    const el = await mount(api);
    const upRow = el.shadowRoot!.querySelector(
      ".trend-list--up li",
    ) as HTMLElement;
    expect(upRow).not.toBeNull();
    expect(upRow.className).toContain("trend-row");
  });
});
