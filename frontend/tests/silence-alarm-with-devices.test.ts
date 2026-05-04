// Iter UX-1.0/UX-1.1: Stille-Liste zeigt Geraete-Spalten (Source +
// Hersteller/Modell + GAs analog Top-Geraete-Tabelle) und der Alarm-
// Banner rendert pro silence_alarm aufklappbare Geraete-Details.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsAlarmsDto,
  KnxStatsSilenceDto,
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

const SILENCE: KnxStatsSilenceDto = {
  from: SUMMARY.from,
  to: SUMMARY.to,
  max_silence_minutes: 1440,
  alarm_count: 1,
  items: [
    {
      dev_source: "1.1.220",
      last_seen: "2026-04-30T08:00:00Z",
      total: 12,
      silent_minutes: 2880,
      alarm: true,
      manufacturer: "hoermann",
      device_name: "Garagentor",
      ga_count: 2,
      gas: [
        { ga: "1/2/3", label: "Tor Klima Temp", dpt: "9.001", count: 6 },
        { ga: "1/2/4", label: "Tor Klima Lux", dpt: "9.004", count: 6 },
      ],
    },
  ],
};

const ALARMS: KnxStatsAlarmsDto = {
  from: SUMMARY.from,
  to: SUMMARY.to,
  triggered_count: 1,
  alarms: [
    {
      rule: "silence_alarm",
      triggered: true,
      actual: 1,
      threshold: 1,
      unit: "Geraet(e)",
      message:
        "1 Geraet(e) haben laenger als 1440 Min nicht gesendet.",
      details: {
        devices: [
          {
            dev_source: "1.1.220",
            manufacturer: "hoermann",
            device_name: "Garagentor",
            silent_minutes: 2880,
            last_seen: "2026-04-30T08:00:00Z",
            ga_count: 2,
            gas: [
              { ga: "1/2/3", label: "Tor Klima Temp", dpt: "9.001", count: 6 },
              { ga: "1/2/4", label: "Tor Klima Lux", dpt: "9.004", count: 6 },
            ],
          },
        ],
      },
    },
  ],
};

function makeApi(
  silence: KnxStatsSilenceDto = SILENCE,
  alarms: KnxStatsAlarmsDto = ALARMS,
): ApiClient {
  const api: Partial<ApiClient> = {
    getKnxStatsSummary: vi.fn(async () => SUMMARY),
    getKnxStatsTop: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, items: [], total: 0,
    })),
    getKnxStatsTopBySource: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, items: [], total: 0,
    })),
    getKnxStatsTimeline: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, bucket_minutes: 60, items: [],
    })),
    getKnxStatsBusHealth: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      summary: { total: 0, repeated: 0, ratio_pct: 0 }, per_ga: [],
    })),
    getKnxStatsSilence: vi.fn(async () => silence),
    getKnxStatsOrphans: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      missing_in_log: [], extra_in_log: [],
      project_total: 0, log_total: 0, discovery_status: "ok",
    })),
    getKnxStatsAlarms: vi.fn(async () => alarms),
    getKnxStatsBusload: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, bucket_seconds: 10,
      summary: { current_pct: 0, max_pct: 0, avg_pct: 0,
        total_telegrams: 0, buckets: 0 }, series: [],
    })),
    getKnxStatsHealthScore: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, score: 100,
      severity: "green" as const,
      components: { repeat: 100, busload: 100, silence: 100, alarms: 100 },
      findings: [],
    })),
    getKnxStatsLongTerm: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      bucket: "hour" as const, total: 0, top_gas: [], series: [],
    })),
    getKnxStatsBursts: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      window_seconds: 5, threshold_pct: 30.0, bursts: [],
    })),
    getKnxStatsSensitiveLog: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, addresses: [], telegrams: [],
    })),
    getKnxStatsTrend: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      prev_from: SUMMARY.from, prev_to: SUMMARY.from,
      period_minutes: 60, total_now: 0, total_prev: 0,
      total_delta_abs: 0, total_delta_pct: null,
      top_increase: [], top_decrease: [],
    })),
    getKnxStatsHeatmap: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, bucket_minutes: 60,
      gas: [], buckets: [], matrix: [],
    })),
    getKnxBusAnalysisState: vi.fn(async () => ({ enabled: true })),
    setKnxBusAnalysisState: vi.fn(async (enabled: boolean) => ({
      ok: true, enabled,
    })),
  };
  return api as ApiClient;
}

interface PrivateView extends HTMLElement {
  api?: ApiClient;
  updateComplete: Promise<unknown>;
}

async function mount(api: ApiClient): Promise<PrivateView> {
  const el = document.createElement("stats-knx-view") as PrivateView;
  el.api = api;
  document.body.appendChild(el);
  for (let i = 0; i < 6; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
  return el;
}

describe("Stille-Alarme-Liste mit Geraete-Spalten (Iter UX-1.1)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("Tabelle zeigt Source, Hersteller/Modell, GA-Anzahl", async () => {
    const el = await mount(makeApi());
    const table = el.shadowRoot!.querySelector(
      'table[data-test="silence-alarms-table"]',
    );
    expect(table).not.toBeNull();
    const rows = table!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);
    const cells = rows[0].querySelectorAll("td");
    // Spalten: #, Source, Hersteller, GAs, Stumm seit, last_seen
    expect(cells.length).toBe(6);
    expect(cells[1].textContent).toContain("1.1.220");
    expect(cells[2].textContent).toContain("hoermann");
    expect(cells[2].textContent).toContain("Garagentor");
    expect(cells[3].textContent?.trim()).toBe("2");
  });

  it("Klick auf Zeile markiert Zeile als selected (Source-Detail-Pane)", async () => {
    const el = await mount(makeApi());
    const row = el.shadowRoot!.querySelector(
      ".silence-card tbody tr",
    ) as HTMLElement;
    expect(row).not.toBeNull();
    row.click();
    for (let i = 0; i < 6; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const selected = el.shadowRoot!.querySelector(
      ".silence-card tbody tr.selected",
    );
    expect(selected).not.toBeNull();
  });
});

describe("Alarm-Banner mit silence_alarm-Details (Iter UX-1.1)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("Banner zeigt Aufklapp-<details> mit Geraeten", async () => {
    const el = await mount(makeApi());
    const banner = el.shadowRoot!.querySelector(".alarm-banner");
    expect(banner).not.toBeNull();
    const details = banner!.querySelector(".alarm-details");
    expect(details).not.toBeNull();
    const summary = details!.querySelector("summary");
    expect(summary?.textContent ?? "").toContain("Betroffene Geräte");
    expect(summary?.textContent ?? "").toContain("(1)");
  });

  it("Geraet-Eintrag zeigt Source + Hersteller/Modell + GA-Anzahl", async () => {
    const el = await mount(makeApi());
    const dev = el.shadowRoot!.querySelector(".alarm-device");
    expect(dev).not.toBeNull();
    const summary = dev!.querySelector("summary");
    const text = summary?.textContent ?? "";
    expect(text).toContain("1.1.220");
    expect(text).toContain("hoermann");
    expect(text).toContain("Garagentor");
    expect(text).toContain("2 GAs");
  });

  it("GA-Tabelle pro Geraet listet ga + label + dpt + count", async () => {
    const el = await mount(makeApi());
    const gaRows = el.shadowRoot!.querySelectorAll(
      ".alarm-device__gas tbody tr",
    );
    expect(gaRows.length).toBe(2);
    const firstRow = gaRows[0].textContent ?? "";
    expect(firstRow).toContain("1/2/3");
    expect(firstRow).toContain("Tor Klima Temp");
    expect(firstRow).toContain("9.001");
  });

  it("Alarm ohne details.devices rendert kein Aufklapp-Block", async () => {
    const apiNoDetails = makeApi(SILENCE, {
      ...ALARMS,
      alarms: [
        {
          rule: "silence_alarm",
          triggered: true,
          actual: 1,
          threshold: 1,
          unit: "Geraet(e)",
          message: "test",
          details: { devices: [] },
        },
      ],
    });
    const el = await mount(apiNoDetails);
    const details = el.shadowRoot!.querySelector(".alarm-details");
    expect(details).toBeNull();
  });

  it("Andere Regel (kein silence_alarm) bekommt keine Details", async () => {
    const api = makeApi(SILENCE, {
      ...ALARMS,
      alarms: [
        {
          rule: "bus_load_above",
          triggered: true,
          actual: 50,
          threshold: 25,
          unit: "%",
          message: "Buslast hoch",
        },
      ],
    });
    const el = await mount(api);
    const banner = el.shadowRoot!.querySelector(".alarm-banner");
    expect(banner).not.toBeNull();
    const details = banner!.querySelector(".alarm-details");
    expect(details).toBeNull();
  });
});
