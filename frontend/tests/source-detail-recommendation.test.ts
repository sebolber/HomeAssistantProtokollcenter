// Iter L1.4 (Sprint Recommendations): Recommendation-Card im Source-
// Detail-Pane. Lazy-Load beim Aufklappen, Render mit Headline-Pills,
// Reasoning-Liste, GA-Detail-Tabelle.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type {
  ApiClient,
  KnxStatsSourceDetailDto,
  KnxStatsSourceRecommendationDto,
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
  trend: null,
};

const RECOMMENDATION: KnxStatsSourceRecommendationDto = {
  dev_source: "1.1.42",
  headline_mode: "cyclic",
  headline_recommendation:
    "Aktuell cyclic (Median ~1 Min/Telegramm) — empfohlen: hybrid (1 von 1 GAs abweichend).",
  confidence: "high",
  reasoning: [
    "Layer 1 (dpt_standard) — DPT-Standard-Empfehlung je GA aus knx_dpt_recommendations.",
    "1 GA(s) zeigen klare Abweichung vom DPT-Default — siehe Detail-Tabelle.",
  ],
  generated_at: "2026-05-02T15:31:00",
  ga_recommendations: [
    {
      ga: "5/2/14",
      label: "Wetter Lux",
      dpt: "9.004",
      observed: {
        mode: "cyclic",
        confidence: "high",
        sample_count: 60,
        value_changes: 5,
        median_interval_s: 60,
        median_interval_minutes: 1.0,
        stdev_interval_s: 1.5,
      },
      recommended_mode: "hybrid",
      recommended_cycle_minutes: [5, 15],
      recommended_hysteresis: ">= 50 lux",
      severity: "warn",
      rationale:
        "Helligkeit (Lux): natuerliches Licht aendert sich kontinuierlich.",
    },
  ],
};

interface MockApi extends ApiClient {
  recommendationCalls: Array<{ devSource: string }>;
}

function makeApi(
  reco: KnxStatsSourceRecommendationDto | "throw404" | "throw500" = RECOMMENDATION,
): MockApi {
  const api: Partial<MockApi> = {
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
    getKnxStatsSilence: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, max_silence_minutes: 1440,
      items: [], alarm_count: 0,
    })),
    getKnxStatsOrphans: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to,
      missing_in_log: [], extra_in_log: [],
      project_total: 0, log_total: 0, discovery_status: "ok",
    })),
    getKnxStatsAlarms: vi.fn(async () => ({
      from: SUMMARY.from, to: SUMMARY.to, alarms: [], triggered_count: 0,
    })),
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
    recommendationCalls: [],
  };
  api.getKnxStatsSourceDetail = vi.fn(async (devSource: string) => ({
    ...SOURCE_DETAIL, dev_source: devSource,
  }));
  api.getKnxStatsSourceRecommendation = vi.fn(async (devSource: string) => {
    api.recommendationCalls!.push({ devSource });
    if (reco === "throw404") {
      throw new Error("HTTP 404: Not Found");
    }
    if (reco === "throw500") {
      throw new Error("HTTP 500: Internal Server Error");
    }
    return { ...reco, dev_source: devSource };
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

async function loadAndSettle(
  el: PrivateView, devSource: string,
): Promise<void> {
  await el._loadSourceDetail(devSource);
  for (let i = 0; i < 4; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

async function clickToggle(el: PrivateView): Promise<void> {
  const toggle = el.shadowRoot!.querySelector<HTMLButtonElement>(
    ".recommendation-card__toggle",
  );
  expect(toggle).not.toBeNull();
  toggle!.click();
  for (let i = 0; i < 6; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe("stats-knx-view recommendation-card (Iter L1.4)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
    try {
      localStorage.removeItem("messagehub.knx-stats.filters");
    } catch {
      // ignore
    }
  });

  it("Card rendert nach Source-Detail-Open im collapsed-Zustand", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");

    const card = el.shadowRoot!.querySelector(".recommendation-card");
    expect(card).not.toBeNull();
    // Collapsed → noch kein API-Call
    expect(api.recommendationCalls).toHaveLength(0);
  });

  it("Aufklappen triggert API-Call und rendert Headline + Reasoning", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);

    expect(api.recommendationCalls).toHaveLength(1);
    expect(api.recommendationCalls[0].devSource).toBe("1.1.42");

    const card = el.shadowRoot!.querySelector(".recommendation-card");
    expect(card).not.toBeNull();
    const headline = card!.querySelector(".recommendation-card__headline");
    expect(headline?.textContent ?? "").toContain("empfohlen: hybrid");
    const reasoning = card!.querySelector(".recommendation-card__reasoning");
    expect(reasoning).not.toBeNull();
  });

  it("GA-Tabelle zeigt observed/recommended/Hysterese pro GA", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);

    const rows = el.shadowRoot!.querySelectorAll(
      ".recommendation-card__row",
    );
    expect(rows.length).toBe(1);
    const html = rows[0].innerHTML;
    expect(html).toContain("5/2/14");
    expect(html).toContain("9.004");
    expect(html).toContain("50 lux");
  });

  // Iter UX-5: Sendezyklus klar lesbar.
  it("Sendezyklus-Spalte zeigt 'Heartbeat' bei hybrid-Empfehlung", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);

    const cycleCell = el.shadowRoot!.querySelector(
      ".recommendation-card__row .recommendation-cycle",
    );
    expect(cycleCell).not.toBeNull();
    const text = cycleCell!.textContent ?? "";
    expect(text).toContain("5–15 Min");
    expect(text).toContain("Heartbeat");
  });

  it("Sendezyklus-Spalte zeigt 'nur bei Aenderung' fuer on_change", async () => {
    const api = makeApi({
      ...RECOMMENDATION,
      ga_recommendations: [
        {
          ...RECOMMENDATION.ga_recommendations[0],
          recommended_mode: "on_change",
          recommended_cycle_minutes: null,
          recommended_hysteresis: null,
        },
      ],
    });
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);

    const cycleCell = el.shadowRoot!.querySelector(
      ".recommendation-card__row .recommendation-cycle",
    );
    expect(cycleCell?.textContent ?? "").toContain("nur bei Aenderung");
  });

  it("Sendezyklus-Spalte zeigt 'zyklisch' fuer cyclic-Empfehlung", async () => {
    const api = makeApi({
      ...RECOMMENDATION,
      ga_recommendations: [
        {
          ...RECOMMENDATION.ga_recommendations[0],
          recommended_mode: "cyclic",
          recommended_cycle_minutes: [10, 60],
        },
      ],
    });
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);

    const cycleCell = el.shadowRoot!.querySelector(
      ".recommendation-card__row .recommendation-cycle",
    );
    const text = cycleCell?.textContent ?? "";
    expect(text).toContain("10–60 Min");
    expect(text).toContain("zyklisch");
  });

  it("Sendezyklus zeigt einzelne Zahl bei min===max", async () => {
    const api = makeApi({
      ...RECOMMENDATION,
      ga_recommendations: [
        {
          ...RECOMMENDATION.ga_recommendations[0],
          recommended_mode: "cyclic",
          recommended_cycle_minutes: [60, 60],
        },
      ],
    });
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);

    const cycleCell = el.shadowRoot!.querySelector(
      ".recommendation-card__row .recommendation-cycle",
    );
    const text = cycleCell?.textContent ?? "";
    expect(text).toContain("60 Min");
    // KEINE Range-Notation bei min===max
    expect(text).not.toContain("60–60");
  });

  it("Zweiter Toggle-Klick kollabiert die Card ohne neuen API-Call", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);
    expect(api.recommendationCalls).toHaveLength(1);

    await clickToggle(el);
    // Body soll verschwinden (collapsed)
    const body = el.shadowRoot!.querySelector(
      ".recommendation-card__headline",
    );
    expect(body).toBeNull();
    // Kein neuer API-Call (Cache-Hit serverseitig wuerde bei reopen
    // erneut feuern, das ist der explizite Plan; collapsing alleine
    // reicht aber nicht).
    expect(api.recommendationCalls).toHaveLength(1);
  });

  it("404 vom Backend zeigt 'keine Empfehlung'-Hinweis statt Fehler", async () => {
    const api = makeApi("throw404");
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);

    // Body-Slot der Card: alle <p>-Elemente, dort steht der Hinweis-
    // Text, nicht im Headline-Slot ("Klicken zum Laden").
    const card = el.shadowRoot!.querySelector(".recommendation-card");
    expect(card).not.toBeNull();
    const paragraphs = Array.from(card!.querySelectorAll("p"));
    const text = paragraphs.map((p) => p.textContent ?? "").join(" ");
    expect(text).toContain("keine Telegramme");
    // Kein Fehler-Container — 404 ist semantisch "leer", nicht "kaputt"
    const errorBox = card!.querySelector(".recommendation-card__error");
    expect(errorBox).toBeNull();
  });

  it("Server-Fehler 500 zeigt Fehler-Box mit Retry-Knopf", async () => {
    const api = makeApi("throw500");
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);

    const errorBox = el.shadowRoot!.querySelector(
      ".recommendation-card__error",
    );
    expect(errorBox).not.toBeNull();
    const retryBtn = errorBox!.querySelector("button");
    expect(retryBtn).not.toBeNull();
    expect(retryBtn?.textContent?.trim()).toBe("Erneut versuchen");
  });

  it("Anderer Drawer resetet den Recommendation-State", async () => {
    const api = makeApi();
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);
    expect(api.recommendationCalls).toHaveLength(1);

    // Anderes Geraet oeffnen
    await loadAndSettle(el, "1.1.99");
    // Recommendation-Card sollte wieder collapsed sein
    const headline = el.shadowRoot!.querySelector(
      ".recommendation-card__headline",
    );
    expect(headline).toBeNull();
    // Aufklappen triggert neuen API-Call fuer das neue Geraet
    await clickToggle(el);
    expect(api.recommendationCalls).toHaveLength(2);
    expect(api.recommendationCalls[1].devSource).toBe("1.1.99");
  });

  it("Confidence-Pill rendert je nach Konfidenz", async () => {
    const api = makeApi({
      ...RECOMMENDATION,
      confidence: "low",
    });
    const el = await mount(api);
    await loadAndSettle(el, "1.1.42");
    await clickToggle(el);

    const pills = el.shadowRoot!.querySelectorAll(
      ".recommendation-card__pills .mh-pill",
    );
    const labels = Array.from(pills).map((p) => p.textContent?.trim());
    expect(labels).toContain("niedrige Konfidenz");
  });
});
