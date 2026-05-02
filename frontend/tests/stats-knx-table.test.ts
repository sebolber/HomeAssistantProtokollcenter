import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsGaDetailDto,
  KnxStatsSummaryDto,
  KnxStatsTopRowDto,
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

const TOP_ROWS: KnxStatsTopRowDto[] = [
  {
    ga: "5/2/14",
    dpt: "9.004",
    label: "Wetter Lux",
    dev_source: "1.1.220",
    count: 600,
    rate_per_min: 142.3,
    recommended_rate: 2.0,
    ratio: 71.15,
    severity: "red",
    acknowledged: false,
  },
  {
    ga: "1/2/3",
    dpt: "1.001",
    label: "Wohnzimmer Licht",
    dev_source: "1.1.5",
    count: 50,
    rate_per_min: 0.5,
    recommended_rate: 1.0,
    ratio: 0.5,
    severity: "green",
    acknowledged: true,
  },
];

const DETAIL: KnxStatsGaDetailDto = {
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
  findings: [
    {
      kind: "constant_value",
      severity: "orange",
      text: "Sensor sendet konstant 0",
    },
  ],
  sibling_gas: [
    { ga: "5/2/15", label: "Wetter Wind", count: 50, rate_per_min: 0.8 },
  ],
  value_history: [
    { ts: "2026-05-02T16:00:00Z", value: 850 },
    { ts: "2026-05-02T16:01:00Z", value: 870 },
  ],
};

interface MockApi extends ApiClient {
  ackCall: { ga?: string; note?: string };
  unackCall: { ga?: string };
}

function makeApi(): MockApi {
  const api: Partial<MockApi> = {
    getKnxStatsSummary: vi.fn(async () => SUMMARY),
    getKnxStatsTop: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      items: TOP_ROWS,
      total: TOP_ROWS.length,
    })),
    getKnxStatsTopBySource: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      items: [
        { dev_source: "1.1.220", count: 600, ga_count: 1 },
        { dev_source: "1.1.5", count: 50, ga_count: 1 },
      ],
      total: 2,
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
    getKnxStatsGaDetail: vi.fn(async (ga: string) => {
      if (ga !== "5/2/14") throw new Error("not found");
      return DETAIL;
    }),
    acknowledgeKnxGa: vi.fn(async (ga: string, p?: { note?: string }) => {
      api.ackCall = { ga, note: p?.note };
    }),
    unacknowledgeKnxGa: vi.fn(async (ga: string) => {
      api.unackCall = { ga };
    }),
    ackCall: {},
    unackCall: {},
  };
  return api as MockApi;
}

async function mount(api: MockApi): Promise<HTMLElement> {
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

describe("stats-knx-view top table + detail pane", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("rendert eine Tabellen-Zeile pro Top-Row", async () => {
    const api = makeApi();
    const el = await mount(api);
    // Top-Sender ist die erste Tabelle (Top-Geraete kommt danach, Iter 32)
    const firstTable = el.shadowRoot!.querySelector(".table-wrap table");
    const rows = firstTable!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
    const text = el.shadowRoot!.textContent ?? "";
    expect(text).toContain("5/2/14");
    expect(text).toContain("Wetter Lux");
    expect(text).toContain("9.004");
    expect(text).toContain("142,3");
  });

  it("markiert acknowledged Zeilen mit '✓ bekannt'-Badge", async () => {
    const api = makeApi();
    const el = await mount(api);
    const ackPill = el.shadowRoot!.querySelector(".ack-pill");
    expect(ackPill).not.toBeNull();
    expect(ackPill!.textContent).toContain("bekannt");
  });

  it("oeffnet Detail-Pane bei Klick auf Zeile", async () => {
    const api = makeApi();
    const el = await mount(api);
    const firstRow = el.shadowRoot!.querySelector("tbody tr") as HTMLElement;
    firstRow.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const detail = el.shadowRoot!.querySelector(".detail-pane");
    expect(detail).not.toBeNull();
    const detailText = detail!.textContent ?? "";
    expect(detailText).toContain("Helligkeit");
    expect(detailText).toContain("constant_value");
  });

  it("schliesst Detail-Pane bei zweitem Click auf gleiche Zeile", async () => {
    const api = makeApi();
    const el = await mount(api);
    const firstRow = el.shadowRoot!.querySelector("tbody tr") as HTMLElement;
    firstRow.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    firstRow.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(el.shadowRoot!.querySelector(".detail-pane")).toBeNull();
  });

  it("ruft acknowledgeKnxGa beim Klick auf Bekannt-Button", async () => {
    const api = makeApi();
    // window.prompt mocken
    vi.stubGlobal("prompt", () => "manuell bestaetigt");
    const el = await mount(api);
    const ackBtn = el.shadowRoot!.querySelector(
      "tbody tr:not(.ack) td.actions button"
    ) as HTMLButtonElement;
    expect(ackBtn).not.toBeNull();
    ackBtn.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    expect(api.ackCall.ga).toBe("5/2/14");
    expect(api.ackCall.note).toBe("manuell bestaetigt");
    vi.unstubAllGlobals();
  });

  it("ruft unacknowledgeKnxGa beim Klick auf Ack-entfernen", async () => {
    const api = makeApi();
    const el = await mount(api);
    const unackBtn = el.shadowRoot!.querySelector(
      "tbody tr.ack td.actions button"
    ) as HTMLButtonElement;
    expect(unackBtn).not.toBeNull();
    unackBtn.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    expect(api.unackCall.ga).toBe("1/2/3");
  });
});
