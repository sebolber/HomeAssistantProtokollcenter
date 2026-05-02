import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type { ApiClient, KnxStatsSummaryDto } from "../src/api-client.js";

const SUMMARY: KnxStatsSummaryDto = {
  from: "2026-04-25T00:00:00Z",
  to: "2026-05-02T00:00:00Z",
  total_telegrams: 184213,
  active_gas: 312,
  active_devices: 22,
  estimated_busload_pct: 6.4,
  counts_by_severity: { green: 274, yellow: 23, orange: 11, red: 4 },
};

function makeApi(spy?: { calls: KnxStatsSummaryDto[] }): ApiClient {
  return {
    getKnxStatsSummary: vi.fn(async () => {
      if (spy) spy.calls.push(SUMMARY);
      return SUMMARY;
    }),
    getKnxStatsTop: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      items: [],
      total: 0,
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
  } as unknown as ApiClient;
}

async function mount(): Promise<HTMLElement> {
  const el = document.createElement("stats-knx-view") as HTMLElement & {
    api?: ApiClient;
    updateComplete: Promise<unknown>;
  };
  el.api = makeApi();
  document.body.appendChild(el);
  // Mehrfach await, weil _load() innerhalb firstUpdated async ist und
  // erst die zweite Render-Runde die KPIs einsetzt.
  for (let i = 0; i < 5; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
  return el;
}

describe("stats-knx-view filter bar", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("zeigt vier Periode-Presets, vier Top-N-Optionen und Bekannte-Toggle", async () => {
    const el = await mount();
    const periods = el.shadowRoot!.querySelectorAll(".filter-group:nth-child(1) .seg-btn");
    expect(periods.length).toBe(4);
    const topN = el.shadowRoot!.querySelectorAll(".filter-group:nth-child(2) .seg-btn");
    expect(topN.length).toBe(4);
    const ackToggle = el.shadowRoot!.querySelector("input[type=checkbox]");
    expect(ackToggle).not.toBeNull();
  });

  it("rendert KPI-Karten aus dem Summary-Result", async () => {
    const el = await mount();
    const kpis = el.shadowRoot!.querySelectorAll(".kpi");
    expect(kpis.length).toBe(4);
    const text = el.shadowRoot!.textContent ?? "";
    expect(text).toContain("184.213");
    expect(text).toContain("312");
    expect(text).toContain("22");
    expect(text).toContain("6,4");
  });

  it("rendert Severity-Counts (rot/orange/gelb/gruen)", async () => {
    const el = await mount();
    const counts = el.shadowRoot!.querySelectorAll(".severity-counts .mh-pill");
    expect(counts.length).toBe(4);
    const text = el.shadowRoot!.querySelector(".severity-counts")!.textContent ?? "";
    expect(text).toContain("4");
    expect(text).toContain("11");
    expect(text).toContain("23");
    expect(text).toContain("274");
  });

  it("default-Periode ist 7d (laut Konzept)", async () => {
    const el = await mount();
    const active = el.shadowRoot!.querySelector(".filter-group:nth-child(1) .seg-btn.active");
    expect(active!.textContent?.trim()).toBe("7 Tage");
  });

  it("persistiert Filter beim Wechsel der Periode", async () => {
    const el = await mount();
    const buttons = el.shadowRoot!.querySelectorAll(".filter-group:nth-child(1) .seg-btn");
    (buttons[0] as HTMLButtonElement).click(); // 1h
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const persisted = JSON.parse(localStorage.getItem("messagehub.knx-stats.filters") ?? "{}");
    expect(persisted.periodId).toBe("1h");
  });

  it("liest persistierte Filter beim Mount wieder ein", async () => {
    localStorage.setItem(
      "messagehub.knx-stats.filters",
      JSON.stringify({ periodId: "30d", topN: 100, minRate: 5, includeAck: false })
    );
    const el = await mount();
    const active = el.shadowRoot!.querySelector(".filter-group:nth-child(1) .seg-btn.active");
    expect(active!.textContent?.trim()).toBe("30 Tage");
  });
});
