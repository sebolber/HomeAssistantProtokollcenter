// Bug-Fix (2026-05-03): Default minRate von 1.0 auf 0.0 senken.
//
// Problem: Der "Min. Tel/Min"-Filter mit Default 1.0 hat den Top-N-
// Selektor in einer typischen HA-KNX-Anlage praktisch wirkungslos
// gemacht — nur sehr wenige GAs senden > 1 Telegramm/Min, also kamen
// trotz limit=100 nur ein paar Eintraege zurueck.
//
// Loesung: Default 0.0 (Filter "alles zeigen"), User aktiviert die
// Schwelle bewusst, wenn er nur "auffaellige" sehen will. Bestand-
// localStorage mit altem Default 1.0 wird beim ersten Mount auf 0.0
// migriert (Versions-Flag verhindert Doppel-Migration und schuetzt
// User, die nach der Migration explizit 1.0 wollten).

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-knx-view.js";
import type { ApiClient, KnxStatsSummaryDto } from "../src/api-client.js";

const SUMMARY: KnxStatsSummaryDto = {
  from: "2026-04-25T00:00:00Z",
  to: "2026-05-02T00:00:00Z",
  total_telegrams: 1000,
  active_gas: 5,
  active_devices: 3,
  estimated_busload_pct: 1.0,
  counts_by_severity: { green: 3, yellow: 1, orange: 0, red: 1 },
};

function makeApi(): ApiClient {
  return {
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
  } as unknown as ApiClient;
}

const FILTERS_KEY = "messagehub.knx-stats.filters";
const MIGRATION_KEY = "messagehub.knx-stats.filters.defaults-version";

async function mount(): Promise<HTMLElement> {
  const el = document.createElement("stats-knx-view") as HTMLElement & {
    api?: ApiClient;
    updateComplete: Promise<unknown>;
  };
  el.api = makeApi();
  document.body.appendChild(el);
  for (let i = 0; i < 5; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
  return el;
}

function readMinRateFromInput(el: HTMLElement): number {
  const inputs = el.shadowRoot!.querySelectorAll(
    "input[type='number']",
  ) as NodeListOf<HTMLInputElement>;
  // Min. Tel/Min ist das einzige <input type="number"> in der Filterbar.
  const minRateInput = Array.from(inputs).find(
    (i) => i.parentElement?.querySelector(".filter-label")?.textContent
      ?.includes("Min. Tel/Min"),
  );
  expect(minRateInput).toBeDefined();
  return parseFloat(minRateInput!.value);
}

describe("stats-knx-view minRate default + localStorage migration", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem(FILTERS_KEY);
      localStorage.removeItem(MIGRATION_KEY);
    } catch {
      // ignore
    }
  });

  it("frischer User ohne localStorage hat minRate=0.0", async () => {
    const el = await mount();
    expect(readMinRateFromInput(el)).toBe(0);
    // Migration-Marker wird trotzdem gesetzt — sonst wuerde ein
    // spaeterer Save mit User-Wert 1.0 beim naechsten Mount migriert.
    expect(localStorage.getItem(MIGRATION_KEY)).toBe("v3");
  });

  it("Bestandsuser mit altem Default 1.0 ohne Marker wird auf 0.0 migriert", async () => {
    // Simuliere Bestandsuser: kompletter alter DEFAULT_FILTERS-Block
    // im Storage, kein Migration-Marker.
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({
        periodId: "24h",
        topN: 25,
        topNDevices: 25,
        topNAudit: 25,
        topNBursts: 25,
        topNLongTerm: 25,
        topNTrend: 25,
        topNOrphansMissing: 25,
        topNOrphansExtra: 25,
        topNSilence: 25,
        topNBusHealth: 25,
        topNSiblings: 25,
        minRate: 1.0,
        includeAck: true,
      }),
    );
    expect(localStorage.getItem(MIGRATION_KEY)).toBeNull();

    const el = await mount();
    expect(readMinRateFromInput(el)).toBe(0);
    expect(localStorage.getItem(MIGRATION_KEY)).toBe("v3");
    // Persistierter Filter-Block hat jetzt minRate=0 (damit naechster
    // Mount stabil bleibt).
    const stored = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? "{}");
    expect(stored.minRate).toBe(0);
  });

  it("Bestandsuser mit custom minRate=1.5 behaelt seinen Wert", async () => {
    // 1.5 != alter Default 1.0 -> bewusster User-Wert, NICHT migrieren.
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({ minRate: 1.5, periodId: "24h" }),
    );

    const el = await mount();
    expect(readMinRateFromInput(el)).toBe(1.5);
    // Marker trotzdem setzen, damit kein 2. Migration-Run passiert.
    expect(localStorage.getItem(MIGRATION_KEY)).toBe("v3");
  });

  it("Migration ist idempotent: nach v3-Marker bleibt minRate=1.0 erhalten", async () => {
    // Iter detail-topn: Marker auf "v3" gehoben (TopN-Default-Senkung).
    // User hat NACH der aktuellen Migration explizit auf 1.0 gestellt.
    localStorage.setItem(MIGRATION_KEY, "v3");
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({ minRate: 1.0, periodId: "24h" }),
    );

    const el = await mount();
    // Marker ist gesetzt -> Migration ueberspringt -> 1.0 bleibt.
    expect(readMinRateFromInput(el)).toBe(1.0);
  });
});
