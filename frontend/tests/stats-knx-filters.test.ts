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

  it("Iter aiohttp-error-ZU9UA: Inline-Top-N hat 5 Optionen (10/25/50/100/200)", async () => {
    const el = await mount();
    const inlineTopns = el.shadowRoot!.querySelectorAll(".inline-topn");
    // Mind. eine fuer Top-Sender (weitere Cards je nach Daten).
    expect(inlineTopns.length).toBeGreaterThanOrEqual(1);
    const buttons = inlineTopns[0].querySelectorAll(".inline-topn__btn");
    expect(buttons.length).toBe(5); // 10 / 25 / 50 / 100 / 200
    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels).toEqual(["10", "25", "50", "100", "200"]);
  });

  it("Iter aiohttp-error-ZU9UA: Default-Top-N fuer alle Cards ist 25", async () => {
    const el = await mount();
    // Top-Sender-Card hat default topN=25 → Button "25" ist aktiv.
    const inlineTopns = el.shadowRoot!.querySelectorAll(".inline-topn");
    expect(inlineTopns.length).toBeGreaterThanOrEqual(1);
    for (const wrap of Array.from(inlineTopns)) {
      const active = wrap.querySelector(".inline-topn__btn.active");
      expect(active?.textContent?.trim()).toBe("25");
    }
  });

  it("Iter aiohttp-error-ZU9UA: Übersicht-KPIs stehen vor Top-Sender, Verwaiste GAs steht danach", async () => {
    // User-Beschwerde: Reihenfolge entsprach nicht der Erwartung.
    // Übersicht ist At-a-glance — gehoert direkt unter den Filter,
    // dann Health-Score, dann Top-Sender. Verwaiste GAs (3000+ Eintraege)
    // gehoert ans Ende, nicht in die Mitte.
    document.body.innerHTML = "";
    const el = document.createElement("stats-knx-view") as HTMLElement & {
      api?: ApiClient;
      updateComplete: Promise<unknown>;
    };
    const baseApi = makeApi();
    const api = {
      ...baseApi,
      getKnxStatsOrphans: vi.fn(async () => ({
        from: SUMMARY.from,
        to: SUMMARY.to,
        missing_in_log: [{ address: "1/0/1", name: "Heizung", dpt: "1.005" }],
        extra_in_log: [],
        project_total: 1,
        log_total: 0,
        discovery_status: "ok",
      })),
    } as unknown as ApiClient;
    el.api = api;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const headings = Array.from(
      el.shadowRoot!.querySelectorAll("h3")
    ).map((h) => h.textContent?.trim() ?? "");
    const idx = (needle: string): number =>
      headings.findIndex((h) => h.includes(needle));
    const uebersicht = idx("Uebersicht");
    const topSender = idx("Top-Sender");
    const orphans = idx("Verwaiste GAs");
    expect(uebersicht).toBeGreaterThanOrEqual(0);
    expect(topSender).toBeGreaterThan(uebersicht);
    expect(orphans).toBeGreaterThan(topSender);
  });

  it("Iter aiohttp-error-ZU9UA: Verwaiste GAs blendet ETS-Platzhalter per Default aus", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("stats-knx-view") as HTMLElement & {
      api?: ApiClient;
      updateComplete: Promise<unknown>;
    };
    const baseApi = makeApi();
    const api = {
      ...baseApi,
      getKnxStatsOrphans: vi.fn(async () => ({
        from: SUMMARY.from,
        to: SUMMARY.to,
        missing_in_log: [
          { address: "0/1/99", name: "-----", dpt: null }, // Platzhalter
          { address: "0/1/154", name: "  ---  ", dpt: null }, // Platzhalter
          { address: "0/1/200", name: "0/1/200", dpt: null }, // Address-as-Label = Platzhalter
          { address: "1/0/1", name: "Heizung Wohnzimmer", dpt: "1.005" }, // echt
        ],
        extra_in_log: [
          { address: "9/9/9", label: "", count: 5 }, // Platzhalter
          { address: "9/9/8", label: "echtes Label", count: 12 }, // echt
        ],
        project_total: 4,
        log_total: 2,
        discovery_status: "ok",
      })),
    } as unknown as ApiClient;
    el.api = api;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const orphansCard = Array.from(
      el.shadowRoot!.querySelectorAll(".mh-card")
    ).find((c) => c.textContent?.includes("Verwaiste GAs"));
    expect(orphansCard).toBeDefined();
    const allText = orphansCard!.textContent ?? "";
    // Echter Eintrag muss da sein:
    expect(allText).toContain("Heizung Wohnzimmer");
    expect(allText).toContain("echtes Label");
    // Platzhalter dürfen NICHT sichtbar sein:
    expect(allText).not.toContain("0/1/99");
    expect(allText).not.toContain("0/1/154");
    expect(allText).not.toContain("0/1/200");
    expect(allText).not.toContain("9/9/9");
    // Toggle existiert und ist standardmaessig aktiviert:
    const toggle = orphansCard!.querySelector(
      ".orphans-placeholder-toggle input"
    ) as HTMLInputElement | null;
    expect(toggle).not.toBeNull();
    expect(toggle!.checked).toBe(true);
  });

  it("Iter aiohttp-error-ZU9UA: Verwaiste GAs zeigt Platzhalter wenn Toggle aus", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("stats-knx-view") as HTMLElement & {
      api?: ApiClient;
      updateComplete: Promise<unknown>;
    };
    const baseApi = makeApi();
    const api = {
      ...baseApi,
      getKnxStatsOrphans: vi.fn(async () => ({
        from: SUMMARY.from,
        to: SUMMARY.to,
        missing_in_log: [
          { address: "0/1/99", name: "-----", dpt: null },
        ],
        extra_in_log: [],
        project_total: 1,
        log_total: 0,
        discovery_status: "ok",
      })),
    } as unknown as ApiClient;
    el.api = api;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const orphansCard = Array.from(
      el.shadowRoot!.querySelectorAll(".mh-card")
    ).find((c) => c.textContent?.includes("Verwaiste GAs"));
    const toggle = orphansCard!.querySelector(
      ".orphans-placeholder-toggle input"
    ) as HTMLInputElement;
    toggle.checked = false;
    toggle.dispatchEvent(new Event("change"));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const text = orphansCard!.textContent ?? "";
    expect(text).toContain("0/1/99");
  });

  it("Iter aiohttp-error-ZU9UA: Verwaiste GAs hat eigenen Inline-Top-N pro Spalte", async () => {
    // Mit Mock-Daten in beiden Orphans-Spalten.
    document.body.innerHTML = "";
    const el = document.createElement("stats-knx-view") as HTMLElement & {
      api?: ApiClient;
      updateComplete: Promise<unknown>;
    };
    const baseApi = makeApi();
    const apiWithOrphans = {
      ...baseApi,
      getKnxStatsOrphans: vi.fn(async () => ({
        from: SUMMARY.from,
        to: SUMMARY.to,
        missing_in_log: [
          { address: "1/0/1", name: "Heizung", dpt: "1.005" },
          { address: "1/0/2", name: "Licht", dpt: "1.001" },
        ],
        extra_in_log: [
          { address: "9/9/9", label: "unbekannt", count: 42 },
        ],
        project_total: 2,
        log_total: 1,
        discovery_status: "ok",
      })),
    } as unknown as ApiClient;
    el.api = apiWithOrphans;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    // In der Verwaisten-Card MUSS pro Spalte ein inline-topn vorhanden sein.
    const orphansCard = Array.from(
      el.shadowRoot!.querySelectorAll(".mh-card")
    ).find((c) => c.textContent?.includes("Verwaiste GAs"));
    expect(orphansCard).toBeDefined();
    const colInlines = orphansCard!.querySelectorAll(".orphans-col-head .inline-topn");
    expect(colInlines.length).toBe(2);
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

  it("Iter aiohttp-error-ZU9UA: Aktualisieren-Button hat sichtbare Primary-Klasse + Spinner-Animation bei Loading", async () => {
    const el = await mount();
    const btn = el.shadowRoot!.querySelector(".filter-refresh-btn") as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("mh-btn--primary")).toBe(true);
    expect(btn!.textContent?.trim()).toContain("Aktualisieren");
    // Spinner-Klasse ist im Initial-State (loading=false) NICHT da.
    expect(btn!.querySelector(".filter-refresh-btn__spin")).toBeNull();
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
    // Iter aiohttp-error-ZU9UA / P2: Komponenten als Badges (4 Stueck).
    const components = card!.querySelectorAll(".health-score__badge");
    expect(components.length).toBe(4);
    // Severity ist pro Badge eigen — Mock liefert repeat=80 (green),
    // busload=75 (yellow), silence=100 (green), alarms=100 (green).
    expect(card!.querySelectorAll(".health-score__badge--green").length).toBe(3);
    expect(card!.querySelectorAll(".health-score__badge--yellow").length).toBe(1);
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

  it("Iter aiohttp-error-ZU9UA: Trend-Card bei 1h-Periode hat green-Severity + Hinweis", async () => {
    localStorage.setItem(
      "messagehub.knx-stats.filters",
      JSON.stringify({ periodId: "1h", topN: 25, minRate: 1, includeAck: true }),
    );
    const trendSpy = vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      prev_from: SUMMARY.from,
      prev_to: SUMMARY.from,
      period_minutes: 60,
      total_now: 3675,
      total_prev: 259,
      total_delta_abs: 3416,
      // Riesiger %-Sprung — bei kurzen Perioden trotzdem nicht rot.
      total_delta_pct: 1318.9,
      top_increase: [{ ga: "1/0/1", label: "x", delta_abs: 100, delta_pct: 200 }],
      top_decrease: [],
    }));
    const api = { ...makeApi(), getKnxStatsTrend: trendSpy } as unknown as ApiClient;
    const el = document.createElement("stats-knx-view") as HTMLElement & {
      api?: ApiClient;
      updateComplete: Promise<unknown>;
    };
    el.api = api;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const trendCard = el.shadowRoot!.querySelector(".trend") as HTMLElement | null;
    expect(trendCard).not.toBeNull();
    // Severity ist green (kein roter / oranger Border) trotz +1318 %
    expect(trendCard!.classList.contains("trend--green")).toBe(true);
    expect(trendCard!.classList.contains("trend--red")).toBe(false);
    expect(trendCard!.classList.contains("trend--orange")).toBe(false);
    // Hinweistext steht in der Card
    const hint = trendCard!.querySelector(".trend-short-hint");
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain("kurze");
  });

  it("Iter aiohttp-error-ZU9UA / Trend-Fix A: bei 48h+ und total_prev=0 zeigt Retention-Hinweis statt leerer Lists", async () => {
    localStorage.setItem(
      "messagehub.knx-stats.filters",
      JSON.stringify({ periodId: "48h", topN: 25, minRate: 1, includeAck: true }),
    );
    const trendSpy = vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      prev_from: SUMMARY.from,
      prev_to: SUMMARY.from,
      period_minutes: 2880,
      total_now: 50000,
      total_prev: 0, // ausserhalb der 48h-Retention
      total_delta_abs: 50000,
      total_delta_pct: null,
      top_increase: [],
      top_decrease: [],
    }));
    const api = { ...makeApi(), getKnxStatsTrend: trendSpy } as unknown as ApiClient;
    const el = document.createElement("stats-knx-view") as HTMLElement & {
      api?: ApiClient;
      updateComplete: Promise<unknown>;
    };
    el.api = api;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const trendCard = el.shadowRoot!.querySelector(".trend") as HTMLElement | null;
    expect(trendCard).not.toBeNull();
    // Retention-Hinweis ist sichtbar
    const hint = trendCard!.querySelector(".trend-retention-hint");
    expect(hint).not.toBeNull();
    // Iter aiohttp-error-ZU9UA / UX-P3.6: Hint-Wording wurde
    // generischer (Counter-Tabelle als Datenquelle, 24h+ inkludiert).
    expect(hint!.textContent).toContain("Vergleich nicht verfuegbar");
    expect(hint!.textContent).toContain("Vorperioden-Zeitraum");
    // Lists und Top-N-Selektor sind versteckt
    expect(trendCard!.querySelector(".trend-grid")).toBeNull();
    expect(trendCard!.querySelector(".inline-topn")).toBeNull();
  });

  it("Iter aiohttp-error-ZU9UA / Trend-Fix A: bei 48h MIT prev-Daten zeigt KEIN Retention-Hinweis", async () => {
    // Falls Backend (Iter 2) sich aendert und doch Daten liefert,
    // soll der Hinweis nicht erscheinen.
    localStorage.setItem(
      "messagehub.knx-stats.filters",
      JSON.stringify({ periodId: "48h", topN: 25, minRate: 1, includeAck: true }),
    );
    const trendSpy = vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      prev_from: SUMMARY.from,
      prev_to: SUMMARY.from,
      period_minutes: 2880,
      total_now: 50000,
      total_prev: 45000,
      total_delta_abs: 5000,
      total_delta_pct: 11.1,
      top_increase: [],
      top_decrease: [],
    }));
    const api = { ...makeApi(), getKnxStatsTrend: trendSpy } as unknown as ApiClient;
    const el = document.createElement("stats-knx-view") as HTMLElement & {
      api?: ApiClient;
      updateComplete: Promise<unknown>;
    };
    el.api = api;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const trendCard = el.shadowRoot!.querySelector(".trend");
    expect(trendCard).not.toBeNull();
    expect(trendCard!.querySelector(".trend-retention-hint")).toBeNull();
    expect(trendCard!.querySelector(".trend-grid")).not.toBeNull();
  });

  it("Iter aiohttp-error-ZU9UA: Trend-Card bei 24h-Periode mit grossem Delta ist rot", async () => {
    localStorage.setItem(
      "messagehub.knx-stats.filters",
      JSON.stringify({ periodId: "24h", topN: 25, minRate: 1, includeAck: true }),
    );
    const trendSpy = vi.fn(async () => ({
      from: SUMMARY.from,
      to: SUMMARY.to,
      prev_from: SUMMARY.from,
      prev_to: SUMMARY.from,
      period_minutes: 1440,
      total_now: 100000,
      total_prev: 100,
      total_delta_abs: 99900,
      total_delta_pct: 99900, // > 300 %
      top_increase: [{ ga: "1/0/1", label: "x", delta_abs: 100, delta_pct: 200 }],
      top_decrease: [],
    }));
    const api = { ...makeApi(), getKnxStatsTrend: trendSpy } as unknown as ApiClient;
    const el = document.createElement("stats-knx-view") as HTMLElement & {
      api?: ApiClient;
      updateComplete: Promise<unknown>;
    };
    el.api = api;
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) {
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 0));
    }
    const trendCard = el.shadowRoot!.querySelector(".trend") as HTMLElement | null;
    expect(trendCard).not.toBeNull();
    expect(trendCard!.classList.contains("trend--red")).toBe(true);
    // Kein Short-Period-Hinweis bei 24h
    expect(trendCard!.querySelector(".trend-short-hint")).toBeNull();
  });

  it("Iter aiohttp-error-ZU9UA: Heatmap-Bucket adaptiert sich an die Periode", async () => {
    // 1h → 5 min Buckets, 6h → 15, 24h+ → 60
    const cases: Array<{ periodId: string; expectedBucket: number }> = [
      { periodId: "1h", expectedBucket: 5 },
      { periodId: "6h", expectedBucket: 15 },
      { periodId: "24h", expectedBucket: 60 },
      { periodId: "48h", expectedBucket: 60 },
    ];
    for (const { periodId, expectedBucket } of cases) {
      document.body.innerHTML = "";
      try {
        localStorage.removeItem("messagehub.knx-stats.filters");
      } catch {
        // ignore
      }
      localStorage.setItem(
        "messagehub.knx-stats.filters",
        JSON.stringify({ periodId, topN: 25, minRate: 1, includeAck: true }),
      );
      const heatmapSpy = vi.fn(
        async (
          _filters: Record<string, unknown>,
          _topN: number,
          _bucketMinutes: number,
        ) => ({
          from: SUMMARY.from,
          to: SUMMARY.to,
          bucket_minutes: expectedBucket,
          gas: [],
          buckets: [],
          matrix: [],
        }),
      );
      const api = { ...makeApi(), getKnxStatsHeatmap: heatmapSpy } as unknown as ApiClient;
      const el = document.createElement("stats-knx-view") as HTMLElement & {
        api?: ApiClient;
        updateComplete: Promise<unknown>;
      };
      el.api = api;
      document.body.appendChild(el);
      for (let i = 0; i < 5; i++) {
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 0));
      }
      expect(heatmapSpy).toHaveBeenCalled();
      const call = heatmapSpy.mock.calls[0];
      // Signatur (filters, top_n, bucket_minutes)
      expect(call[2]).toBe(expectedBucket);
    }
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
