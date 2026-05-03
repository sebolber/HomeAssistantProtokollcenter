// Iter F (knx-detail-panes): Stille-Alarme Click-Handler.
// Klick auf eine LI in der silence-list ruft
// _loadSourceDetail(a.dev_source) und oeffnet das Source-Detail-Pane.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsSourceDetailDto,
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

const SOURCE_DETAIL: KnxStatsSourceDetailDto = {
  dev_source: "1.1.99",
  total_count: 0,
  ga_count: 2,
  share_pct: 0,
  last_seen: "2026-04-25T08:00:00Z",
  silent_minutes: 1500,
  silent_alarm: true,
  repeat_ratio_pct: 0,
  gas: [
    {
      ga: "5/0/0",
      label: "alter Sensor",
      dpt: "9.001",
      count: 0,
      rate_per_min: 0,
      recommended_rate: 1.0,
      ratio: 0,
      severity: "green",
      acknowledged: false,
      last_seen: null,
    },
  ],
};

interface MockApi extends ApiClient {
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
      items: [
        {
          dev_source: "1.1.99",
          silent_minutes: 1500,
          last_seen: "2026-04-25T08:00:00Z",
          total: 0,
          alarm: true,
        },
        {
          dev_source: "1.1.42",
          silent_minutes: 1450,
          last_seen: "2026-04-25T08:30:00Z",
          total: 0,
          alarm: true,
        },
      ],
      alarm_count: 2,
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
    return { ...SOURCE_DETAIL, dev_source: devSource };
  });
  return api as MockApi;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
  _sourceDetail: KnxStatsSourceDetailDto | null;
  _selectedSource: string | null;
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

describe("stats-knx-view silence-click (Iter F)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("test_silence_alarm_click_loads_source_detail", async () => {
    const api = makeApi();
    const el = await mount(api);

    // Stille-Alarm-Liste ist sichtbar (alarm_count > 0).
    const silenceList = el.shadowRoot!.querySelector(".silence-list");
    expect(silenceList).not.toBeNull();
    const items = silenceList!.querySelectorAll("li");
    expect(items.length).toBe(2);

    // Klick auf erste Stille-Alarm-Zeile (1.1.99).
    (items[0] as HTMLElement).click();
    await settleUpdates(el);

    const drawer = el.shadowRoot!.querySelector(".detail-pane");
    expect(drawer).not.toBeNull();
    expect(drawer!.textContent).toContain("1.1.99");
    expect(el._sourceDetail).not.toBeNull();
    expect(el._sourceDetail!.dev_source).toBe("1.1.99");
    expect(api.sourceDetailCalls).toHaveLength(1);
    expect(api.sourceDetailCalls[0].devSource).toBe("1.1.99");
  });

  it("Stille-Alarm-Zeile hat Cursor-Pointer (klickbar erkennbar)", async () => {
    const api = makeApi();
    const el = await mount(api);
    const item = el.shadowRoot!.querySelector(
      ".silence-list li",
    ) as HTMLElement;
    expect(item).not.toBeNull();
    // Klasse silence-row signalisiert die klickbare Variante.
    expect(item.className).toContain("silence-row");
  });

  it("zweite Klick-Zeile wechselt das Source-Detail (1.1.99 -> 1.1.42)", async () => {
    const api = makeApi();
    const el = await mount(api);
    const items = el.shadowRoot!.querySelectorAll(".silence-list li");
    (items[0] as HTMLElement).click();
    await settleUpdates(el);
    expect(el._sourceDetail!.dev_source).toBe("1.1.99");

    (items[1] as HTMLElement).click();
    await settleUpdates(el);
    expect(el._sourceDetail!.dev_source).toBe("1.1.42");
    expect(api.sourceDetailCalls.map((c) => c.devSource)).toEqual([
      "1.1.99",
      "1.1.42",
    ]);
  });
});
