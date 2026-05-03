// Iter H (knx-detail-panes): Findings-Liste im Source-Detail-Pane.
// Render: neue Sektion "Findings dieses Geraets". Klick auf Finding-
// Code-Link setzt window.location.hash und feuert hashchange — das
// messagehub-panel.ts liest den Hash beim Tab-Switch und aktiviert
// den Findings-Tab mit vorbefuelltem Source-Filter.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsSourceDetailDto,
  KnxStatsSourcePersistedFindingDto,
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

const FINDINGS: KnxStatsSourcePersistedFindingDto[] = [
  {
    code: "RECONNECT_STORM",
    schema_version: 1,
    severity: "warning",
    ga: null,
    source: "1.1.42",
    title: "Reconnect-Storm",
    description: "Geraet reconnected mehrmals pro Minute",
    occurrence_count: 5,
    first_seen: "2026-05-02T10:00:00Z",
    last_seen: "2026-05-02T15:30:00Z",
    detector_version: "RECONNECT_STORM/v1",
  },
  {
    code: "DPT_MISMATCH",
    schema_version: 1,
    severity: "error",
    ga: "5/2/14",
    source: "1.1.42",
    title: "DPT-Konflikt",
    description: "Werte passen nicht zum DPT",
    occurrence_count: 3,
    first_seen: "2026-05-02T11:00:00Z",
    last_seen: "2026-05-02T15:00:00Z",
    detector_version: "DPT_MISMATCH/v1",
  },
];

const SOURCE_DETAIL: KnxStatsSourceDetailDto = {
  dev_source: "1.1.42",
  total_count: 750,
  ga_count: 1,
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
  ],
  findings: FINDINGS,
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
  _sourceDetail: KnxStatsSourceDetailDto | null;
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

describe("stats-knx-view source-detail findings (Iter H)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
    // Hash zuruecksetzen, damit die hashchange-Tests sauber starten.
    if (window.location.hash) {
      window.location.hash = "";
    }
  });

  it("rendert die Findings-Sektion mit allen Findings dieser Source", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");

    const section = el.shadowRoot!.querySelector(".source-detail-findings");
    expect(section).not.toBeNull();
    const items = section!.querySelectorAll(".source-detail-finding");
    expect(items.length).toBe(2);
    const text = section!.textContent ?? "";
    expect(text).toContain("RECONNECT_STORM");
    expect(text).toContain("DPT_MISMATCH");
  });

  it("rendert keine Findings-Sektion wenn die Liste leer ist", async () => {
    const api = makeApi({ ...SOURCE_DETAIL, findings: [] });
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");

    const section = el.shadowRoot!.querySelector(".source-detail-findings");
    expect(section).toBeNull();
  });

  it("Klick auf Finding-Code setzt URL-Hash mit Source-Filter", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");

    const link = el.shadowRoot!.querySelector(
      ".source-detail-finding .source-detail-finding__link",
    ) as HTMLElement;
    expect(link).not.toBeNull();
    link.click();
    await el.updateComplete;
    // Hash-Format: #findings?source=<dev_source> — messagehub-panel
    // liest das beim Tab-Switch und aktiviert den Findings-Tab.
    expect(window.location.hash).toContain("findings");
    expect(window.location.hash).toContain("source=1.1.42");
  });

  it("Findings-Liste hat eine Severity-Pill pro Eintrag", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");

    const section = el.shadowRoot!.querySelector(".source-detail-findings")!;
    const pills = section.querySelectorAll(".mh-pill");
    expect(pills.length).toBe(2);
  });
});
