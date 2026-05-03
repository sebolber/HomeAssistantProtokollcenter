// Iter D.2 (knx-detail-panes): Source-Detail-Render-Body in
// stats-knx-view. Diese Tests stellen sicher, dass das Source-Detail-
// Pane (Header + KPI-Reihe + Stille-Status + GA-Liste mit Severity-
// Pills + Geraete-Info) korrekt gerendert wird, sobald `_sourceDetail`-
// State befuellt ist. Echte User-Klicks folgen in Iter E/F/G.
//
// Caller-Pflicht: `_loadSourceDetail` wird hier ueber Test-Direkt-
// Aufrufe getestet (private-State-Cast). Top-Level-Click-Handler in
// Iter E/F/G.

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
  dev_source: "1.1.42",
  total_count: 750,
  ga_count: 3,
  share_pct: 75.0,
  last_seen: "2026-05-02T15:30:00Z",
  silent_minutes: 12.5,
  silent_alarm: false,
  repeat_ratio_pct: 0.4,
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
    {
      ga: "5/2/15",
      label: "Wetter Wind",
      dpt: "9.005",
      count: 100,
      rate_per_min: 1.0,
      recommended_rate: 2.0,
      ratio: 0.5,
      severity: "green",
      acknowledged: false,
      last_seen: "2026-05-02T15:25:00Z",
    },
    {
      ga: "5/2/16",
      label: null,
      dpt: null,
      count: 50,
      rate_per_min: 0.5,
      recommended_rate: 1.0,
      ratio: 0.5,
      severity: "yellow",
      acknowledged: true,
      last_seen: "2026-05-02T14:00:00Z",
    },
  ],
  from: "2026-05-01T15:30:00Z",
  to: "2026-05-02T15:30:00Z",
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
    return SOURCE_DETAIL;
  });
  // F-011: Helper-Stub fuer GA-Detail-Pane.
  api.knxStatsGaExportUrl = vi.fn(
    (ga: string, format: string) =>
      `/api/messagehub/knx-stats/ga/${encodeURIComponent(ga)}/export?format=${format}`
  );
  return api as MockApi;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
  _sourceDetail: KnxStatsSourceDetailDto | null;
  _selectedSource: string | null;
  _loadSourceDetail(devSource: string): Promise<void>;
  _closeSourceDetail(): void;
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

async function setSourceDetailViaLoader(
  el: PrivateView,
  devSource: string,
): Promise<void> {
  await el._loadSourceDetail(devSource);
  for (let i = 0; i < 4; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe("stats-knx-view source-detail render (Iter D.2)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("rendert Source-Detail-Pane mit dev_source, total_count und ga_count im Header", async () => {
    const api = makeApi();
    const el = await mount(api);
    await setSourceDetailViaLoader(el, "1.1.42");

    const drawer = el.shadowRoot!.querySelector(".detail-pane");
    expect(drawer).not.toBeNull();
    const text = drawer!.textContent ?? "";
    // Header-Text muss dev_source, total_count und ga_count enthalten.
    expect(text).toContain("1.1.42");
    expect(text).toContain("750");
    expect(text).toContain("3 GAs");
  });

  it("rendert KPI-Reihe (Total, GAs, Bus-Anteil, Wiederhol-Quote)", async () => {
    const api = makeApi();
    const el = await mount(api);
    await setSourceDetailViaLoader(el, "1.1.42");

    const kpis = el.shadowRoot!.querySelectorAll(".source-detail-kpi");
    // Vier KPIs: total, ga_count, share_pct, repeat_ratio_pct.
    expect(kpis.length).toBe(4);
    const drawerText = el.shadowRoot!.querySelector(".detail-pane")!
      .textContent ?? "";
    // Bus-Anteil: 75.0 % (de-DE: "75,0")
    expect(drawerText).toMatch(/75,0\s*%/);
    // Wiederhol-Quote: 0.4 % (de-DE: "0,4")
    expect(drawerText).toMatch(/0,4\s*%/);
  });

  it("rendert Stille-Status prominent wenn silent_alarm true ist", async () => {
    const api = makeApi();
    api.getKnxStatsSourceDetail = vi.fn(async () => ({
      ...SOURCE_DETAIL,
      silent_minutes: 1500,
      silent_alarm: true,
    }));
    const el = await mount(api);
    await setSourceDetailViaLoader(el, "1.1.42");

    const alarmEl = el.shadowRoot!.querySelector(".source-detail-silent-alarm");
    expect(alarmEl).not.toBeNull();
    // Stille-Block enthaelt das Wort "stumm" / "Stille" und die Minuten.
    expect(alarmEl!.textContent ?? "").toMatch(/stumm|Stille/i);
  });

  it("rendert die GA-Liste mit Severity-Pills, Klick laedt GA-Detail", async () => {
    const api = makeApi();
    api.getKnxStatsGaDetail = vi.fn(async (ga: string) => ({
      ga,
      dpt: "9.004",
      label: "Wetter Lux",
      dev_source: "1.1.42",
      count: 600,
      rate_per_min: 142.3,
      recommended_rate: 2.0,
      recommendation: {
        severity: "red" as const,
        text: "Sensor zu schnell",
        action_required: true,
        ratio: 71.15,
        estimated_reduction_pct: 98.6,
      },
      findings: [],
      sibling_gas: [],
      value_history: [],
    }));
    const el = await mount(api);
    await setSourceDetailViaLoader(el, "1.1.42");

    const list = el.shadowRoot!.querySelector(".source-detail-ga-list");
    expect(list).not.toBeNull();
    const rows = list!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
    // Mindestens eine Severity-Pill pro Zeile (rot/gruen/gelb).
    const pills = list!.querySelectorAll(".mh-pill");
    expect(pills.length).toBeGreaterThanOrEqual(3);
    // Klick auf erste GA-Zeile oeffnet GA-Detail (bewusster Architektur-
    // Entscheid: kein zweites Modal, GA-Klick wechselt zum GA-Detail).
    (rows[0] as HTMLElement).click();
    for (let i = 0; i < 4; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const text = el.shadowRoot!.textContent ?? "";
    expect(text).toContain("Sensor zu schnell");
  });

  it("schliesst Source-Detail-Pane via _closeSourceDetail", async () => {
    const api = makeApi();
    const el = await mount(api);
    await setSourceDetailViaLoader(el, "1.1.42");
    expect(el.shadowRoot!.querySelector(".detail-pane")).not.toBeNull();

    el._closeSourceDetail();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".detail-pane")).toBeNull();
    expect(el._sourceDetail).toBeNull();
    expect(el._selectedSource).toBeNull();
  });
});
