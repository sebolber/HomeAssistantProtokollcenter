// Iter I (knx-detail-panes): Trend-Compare im Source-Detail.
// Wenn detail.trend gesetzt ist, rendert das Source-Detail-Pane einen
// Block mit count_now / count_prev / delta_pct.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsSourceDetailDto,
  KnxStatsSourceTrendDeltaDto,
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

const TREND_NORMAL: KnxStatsSourceTrendDeltaDto = {
  count_now: 500,
  count_prev: 400,
  delta_abs: 100,
  delta_pct: 25.0,
};

const SOURCE_DETAIL: KnxStatsSourceDetailDto = {
  dev_source: "1.1.42",
  total_count: 500,
  ga_count: 1,
  share_pct: 50.0,
  last_seen: "2026-05-02T15:30:00Z",
  silent_minutes: 12.5,
  silent_alarm: false,
  repeat_ratio_pct: 0.4,
  gas: [
    {
      ga: "5/2/14",
      label: "Wetter Lux",
      dpt: "9.004",
      count: 500,
      rate_per_min: 142.3,
      recommended_rate: 2.0,
      ratio: 71.15,
      severity: "yellow",
      acknowledged: false,
      last_seen: "2026-05-02T15:30:00Z",
    },
  ],
  trend: TREND_NORMAL,
};

interface MockApi extends ApiClient {
  sourceDetailCalls: Array<{ devSource: string }>;
}

function makeApi(detail: KnxStatsSourceDetailDto = SOURCE_DETAIL): MockApi {
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
    return { ...detail, dev_source: devSource };
  });
  return api as MockApi;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
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

async function loadAndSettle(el: PrivateView, devSource: string): Promise<void> {
  await el._loadSourceDetail(devSource);
  for (let i = 0; i < 4; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe("stats-knx-view source-detail trend (Iter I)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("rendert Trend-Block mit count_now / count_prev / delta_pct", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");

    const block = el.shadowRoot!.querySelector(".source-detail-trend");
    expect(block).not.toBeNull();
    const text = block!.textContent ?? "";
    expect(text).toContain("500");
    expect(text).toContain("400");
    // delta_pct = +25,0 % (de-DE)
    expect(text).toMatch(/\+25,0\s*%/);
  });

  it("rendert keinen Trend-Block, wenn detail.trend null/undefined ist", async () => {
    const api = makeApi({ ...SOURCE_DETAIL, trend: null });
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    expect(el.shadowRoot!.querySelector(".source-detail-trend")).toBeNull();
  });

  it("rendert 'neu' wenn delta_pct null ist (Vorperiode 0)", async () => {
    const api = makeApi({
      ...SOURCE_DETAIL,
      trend: {
        count_now: 100,
        count_prev: 0,
        delta_abs: 100,
        delta_pct: null,
      },
    });
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    const block = el.shadowRoot!.querySelector(".source-detail-trend");
    expect(block).not.toBeNull();
    expect(block!.textContent ?? "").toMatch(/neu/i);
  });

  it("Severity-Klasse passt auf den Delta-Wert (>100 % => warning/danger)", async () => {
    const api = makeApi({
      ...SOURCE_DETAIL,
      trend: {
        count_now: 1500,
        count_prev: 100,
        delta_abs: 1400,
        delta_pct: 1400.0,
      },
    });
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    const block = el.shadowRoot!.querySelector(".source-detail-trend");
    expect(block).not.toBeNull();
    // Eine Severity-Variante muss am Block haengen.
    const cls = block!.className;
    expect(cls).toMatch(/source-detail-trend--(yellow|orange|red)/);
  });
});
