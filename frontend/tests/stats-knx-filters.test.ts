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
    getKnxStatsTopBySource: vi.fn(async () => ({
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
        current_pct: 6.4,
        max_pct: 12.5,
        avg_pct: 6.4,
        total_telegrams: SUMMARY.total_telegrams,
        buckets: 360,
      },
      series: [],
    })),
    getKnxStatsHealthScore: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      score: 87,
      severity: "yellow" as const,
      components: { repeat: 80, busload: 75, silence: 100, alarms: 100 },
      findings: [
        {
          severity: "warn" as const,
          code: "high-repeat-rate",
          message: "Wiederhol-Quote 2,00 % (Empfehlung <0,50 %)",
        },
      ],
    })),
    getKnxStatsLongTerm: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      bucket: "day" as const,
      total: 1_234_567,
      top_gas: [
        { ga: "1/2/3", label: "Tor Garage", dpt: "1.001", count: 800_000 },
        { ga: "5/2/14", label: null, dpt: null, count: 200_000 },
      ],
      series: [
        { bucket: "2026-04-25T00:00:00", count: 100_000 },
        { bucket: "2026-04-26T00:00:00", count: 200_000 },
        { bucket: "2026-04-27T00:00:00", count: 150_000 },
      ],
    })),
    getKnxStatsBursts: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      window_seconds: 5,
      threshold_pct: 30.0,
      bursts: [
        {
          bucket: "2026-05-02T08:30:00",
          telegrams: 90,
          busload_pct: 37.5,
          ga_count: 8,
          source_count: 4,
        },
      ],
    })),
    getKnxStatsSensitiveLog: vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      addresses: [
        { ga: "1/0/1", label: "Tuerschloss Eingang", dpt: "1.001" },
        { ga: "1/0/2", label: "Alarmanlage", dpt: "1.001" },
      ],
      telegrams: [
        {
          ts: "2026-05-02T08:15:00",
          ga: "1/0/1",
          dev_source: "1.1.50",
          value: "1",
          telegramtype: "GroupValueWrite",
          label: "Tuerschloss Eingang",
          dpt: "1.001",
        },
      ],
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
    getKnxBusAnalysisState: vi.fn(async () => ({ enabled: true })),
    setKnxBusAnalysisState: vi.fn(async (enabled: boolean) => ({
      ok: true,
      enabled,
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

  it("zeigt sieben Periode-Presets, Inline-Top-N pro Card und Bekannte-Toggle", async () => {
    // Iter 39: 4 Live-Perioden (1h/6h/24h/48h) + 3 Long-Term (7d/30d/365d)
    // Iter 45: Top-N ist nicht mehr in der Filter-Bar — pro Card-Header
    // ein Inline-Selektor mit jeweils 4 Optionen.
    const el = await mount();
    const periods = el.shadowRoot!.querySelectorAll(".filter-group:nth-child(1) .seg-btn");
    expect(periods.length).toBe(7);
    const ackToggle = el.shadowRoot!.querySelector("input[type=checkbox]");
    expect(ackToggle).not.toBeNull();
  });

  it("Iter 45: Inline-Top-N im Header der Top-Sender-Card", async () => {
    const el = await mount();
    const inlineTopns = el.shadowRoot!.querySelectorAll(".inline-topn");
    // Mind. eine fuer Top-Sender (Top-Geraete-Card erscheint nur, wenn
    // topBySource Items hat — Mock liefert leeres Array)
    expect(inlineTopns.length).toBeGreaterThanOrEqual(1);
    const buttons = inlineTopns[0].querySelectorAll(".inline-topn__btn");
    expect(buttons.length).toBe(4); // 10 / 25 / 50 / 100
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

  it("Iter 51: API-Error-Banner zeigt gefailte Endpunkte", async () => {
    // Erzwinge Fehler bei zwei optionalen Endpoints und mounte dann.
    document.body.innerHTML = "";
    const el = document.createElement("stats-knx-view") as HTMLElement & {
      api?: ApiClient;
      updateComplete: Promise<unknown>;
    };
    const baseApi = makeApi();
    const failingApi = {
      ...baseApi,
      getKnxStatsHealthScore: vi.fn(async () => {
        throw new Error("HTTP 500: backend not reloaded");
      }),
      getKnxStatsBusload: vi.fn(async () => {
        throw new Error("HTTP 404: endpoint missing");
      }),
    } as unknown as ApiClient;
    el.api = failingApi;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const banner = el.shadowRoot!.querySelector(".api-error-banner");
    expect(banner).not.toBeNull();
    const text = banner!.textContent ?? "";
    // Beide Labels muessen drinstehen
    expect(text).toContain("Bus-Health-Score");
    expect(text).toContain("Buslast-KPI");
    // Diagnose-Hinweise sind expandierbar
    expect(banner!.querySelector(".api-error-banner__details")).not.toBeNull();
  });

  it("Iter 49: Bus-Analyse-Toggle in der Filter-Bar", async () => {
    const el = await mount();
    // Toggle ist die zweite Checkbox (1. = "Bekannte ausblenden",
    // 2. = "Bus-Analyse aktiv")
    const checkboxes = el.shadowRoot!.querySelectorAll("input[type=checkbox]");
    expect(checkboxes.length).toBe(2);
    const busToggle = checkboxes[1] as HTMLInputElement;
    expect(busToggle.checked).toBe(true);
    // Banner ist NICHT sichtbar wenn enabled=true
    const banner = el.shadowRoot!.querySelector(".bus-analysis-banner");
    expect(banner).toBeNull();
  });

  it("Iter 42: Sicherheits-Audit-Card listet GAs + Telegramme", async () => {
    const el = await mount();
    const card = el.shadowRoot!.querySelector(".sensitive");
    expect(card).not.toBeNull();
    const addrItems = card!.querySelectorAll(".sensitive__addr-list li");
    expect(addrItems.length).toBe(2);
    const text = card!.textContent ?? "";
    expect(text).toContain("Tuerschloss Eingang");
    expect(text).toContain("Alarmanlage");
    // Telegramm-Tabelle enthaelt 1 Eintrag
    const tBodyRows = card!.querySelectorAll(".sensitive__table tbody tr");
    expect(tBodyRows.length).toBe(1);
  });

  it("Iter 41: Bursts-Card erscheint wenn Spitzen vorhanden sind", async () => {
    const el = await mount();
    const card = el.shadowRoot!.querySelector(".bursts");
    expect(card).not.toBeNull();
    const rows = card!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);
    const text = card!.textContent ?? "";
    expect(text).toContain("90"); // telegrams
    expect(text).toContain("37,5"); // busload_pct
  });

  it("Iter 37: Health-Score-Card zeigt Score + Findings", async () => {
    const el = await mount();
    const card = el.shadowRoot!.querySelector(".health-score");
    expect(card).not.toBeNull();
    expect(card!.classList.contains("health-score--yellow")).toBe(true);
    const value = card!.querySelector(".health-score__value");
    expect(value!.textContent?.trim()).toBe("87");
    // Komponenten-Bars sind alle 4 sichtbar
    const components = card!.querySelectorAll(".health-score__component");
    expect(components.length).toBe(4);
    // Finding mit Wiederhol-Quote ist enthalten
    const findings = card!.querySelectorAll(".health-finding");
    expect(findings.length).toBe(1);
    expect(findings[0].textContent).toContain("Wiederhol-Quote");
  });

  it("Iter 36: Busload-KPI zeigt max + jetzt + Avg + Bucket-Groesse", async () => {
    const el = await mount();
    const busloadKpi = el.shadowRoot!.querySelector(".kpi.busload");
    expect(busloadKpi).not.toBeNull();
    const text = busloadKpi!.textContent ?? "";
    // max_pct 12.5 wird als Hauptwert angezeigt
    expect(text).toContain("12,5");
    // current_pct 6.4 erscheint im Hint mit "jetzt"
    expect(text).toContain("jetzt");
    expect(text).toContain("6,4");
    // Bucket 10s
    expect(text).toMatch(/10s|10 s/);
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

  it("Iter 39: 7d-Periode aktiviert Long-Term-Banner + Counter-Card", async () => {
    localStorage.setItem(
      "messagehub.knx-stats.filters",
      JSON.stringify({ periodId: "7d", topN: 50, minRate: 0, includeAck: true })
    );
    const el = await mount();
    // Banner sichtbar
    const banner = el.shadowRoot!.querySelector(".long-term-banner");
    expect(banner).not.toBeNull();
    // Long-Term-Card mit Bars + Top-Liste
    const card = el.shadowRoot!.querySelector(".long-term");
    expect(card).not.toBeNull();
    const bars = card!.querySelectorAll(".long-term__bar");
    expect(bars.length).toBe(3);
    const topList = card!.querySelector(".long-term__top-list");
    expect(topList).not.toBeNull();
    expect(topList!.querySelectorAll("li").length).toBe(2);
    // Live-Snapshot-Header sichtbar
    const text = el.shadowRoot!.textContent ?? "";
    expect(text).toContain("Live-Snapshot");
  });

  it("default-Periode ist 24 Std (Iter 26: max 48h Raw-Retention)", async () => {
    const el = await mount();
    const active = el.shadowRoot!.querySelector(".filter-group:nth-child(1) .seg-btn.active");
    expect(active!.textContent?.trim()).toBe("24 Std");
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
      JSON.stringify({ periodId: "48h", topN: 100, minRate: 5, includeAck: false })
    );
    const el = await mount();
    const active = el.shadowRoot!.querySelector(".filter-group:nth-child(1) .seg-btn.active");
    expect(active!.textContent?.trim()).toBe("48 Std");
  });
});
