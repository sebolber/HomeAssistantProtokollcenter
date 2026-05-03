// Iter E (knx-detail-panes): Top-Geraete Click-Handler.
// Klick auf eine TR-Zeile in der Top-Geraete-Tabelle ruft
// _loadSourceDetail(row.dev_source) und oeffnet das Source-Detail-Pane.

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
  dev_source: "1.1.220",
  total_count: 600,
  ga_count: 1,
  share_pct: 60.0,
  last_seen: "2026-05-02T15:30:00Z",
  silent_minutes: 5.0,
  silent_alarm: false,
  repeat_ratio_pct: 0.2,
  gas: [
    {
      ga: "5/2/14",
      label: "Wetter Lux",
      dpt: "9.004",
      count: 600,
      rate_per_min: 142.3,
      recommended_rate: 2.0,
      ratio: 71.15,
      severity: "red",
      acknowledged: false,
      last_seen: "2026-05-02T15:30:00Z",
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
      items: [
        { dev_source: "1.1.220", count: 600, ga_count: 1, manufacturer: "MDT" },
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

describe("stats-knx-view top-devices click (Iter E)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("test_top_devices_row_click_loads_source_detail", async () => {
    const api = makeApi();
    const el = await mount(api);

    // Top-Geraete ist die zweite Tabelle (erste ist Top-Sender, ist
    // hier leer => keine Header-Tabelle gerendert).
    const tables = el.shadowRoot!.querySelectorAll(".table-wrap table");
    // top-devices-table ist die einzige Tabelle, weil top leer ist.
    expect(tables.length).toBeGreaterThan(0);
    const topDevicesTable = el.shadowRoot!.querySelector(
      "[data-test='top-devices-table']",
    );
    expect(topDevicesTable).not.toBeNull();
    const firstRow = topDevicesTable!.querySelector(
      "tbody tr",
    ) as HTMLElement;
    expect(firstRow).not.toBeNull();
    firstRow.click();
    await settleUpdates(el);

    // Source-Detail-Pane ist sichtbar.
    const drawer = el.shadowRoot!.querySelector(".detail-pane");
    expect(drawer).not.toBeNull();
    expect(drawer!.textContent).toContain("1.1.220");
    // _sourceDetail befuellt.
    expect(el._sourceDetail).not.toBeNull();
    expect(el._sourceDetail!.dev_source).toBe("1.1.220");
    // API wurde mit der korrekten Source aufgerufen.
    expect(api.sourceDetailCalls).toHaveLength(1);
    expect(api.sourceDetailCalls[0].devSource).toBe("1.1.220");
  });

  it("Selection-Highlight markiert die geklickte Top-Geraete-Zeile", async () => {
    const api = makeApi();
    const el = await mount(api);

    const topDevicesTable = el.shadowRoot!.querySelector(
      "[data-test='top-devices-table']",
    );
    const rows = topDevicesTable!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
    (rows[0] as HTMLElement).click();
    await settleUpdates(el);

    // Erste Zeile hat 'selected' (Source 1.1.220 — count desc, also
    // erste Zeile per Default-Sort).
    const updatedRows = el.shadowRoot!
      .querySelector("[data-test='top-devices-table']")!
      .querySelectorAll("tbody tr");
    expect(updatedRows[0].className).toContain("selected");
    expect(updatedRows[1].className).not.toContain("selected");
  });

  it("Klick auf Bulk-Ack-Button oeffnet kein Source-Detail (stopPropagation)", async () => {
    const api = makeApi();
    vi.stubGlobal("confirm", () => true);
    vi.stubGlobal("prompt", () => "akzeptiert");
    api.acknowledgeKnxBulk = vi.fn(async () => ({
      ok: true,
      dev_source: "1.1.220",
      count: 1,
      gas: ["5/2/14"],
    }));
    const el = await mount(api);

    const topDevicesTable = el.shadowRoot!.querySelector(
      "[data-test='top-devices-table']",
    );
    const ackBtn = topDevicesTable!.querySelector(
      "tbody tr td.actions button",
    ) as HTMLButtonElement;
    expect(ackBtn).not.toBeNull();
    ackBtn.click();
    await settleUpdates(el);

    // Source-Detail darf NICHT geoeffnet sein, weil stopPropagation greift.
    expect(el._sourceDetail).toBeNull();
    expect(api.sourceDetailCalls).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});
