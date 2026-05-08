// Iter D4: _load()-Race-Schutz im stats-knx-view.
// Wenn der User schnell Filter wechselt, sollen langsame Antworten
// keinen frueheren State ueberschreiben.

import { describe, expect, it } from "vitest";
import "../src/components/stats-knx-view.js";
import type { LitElement } from "lit";

interface ViewLike extends LitElement {
  api?: unknown;
  _filters: { topN: number };
  _summary: unknown;
  _loading: boolean;
  _loadToken: number;
  _load: () => Promise<void>;
  _busAnalysisLoaded: boolean;
}

function delayed<T>(value: T, ms: number): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

describe("stats-knx-view: _load() race-protection (Iter D4)", () => {
  it("aelterer Aufruf ueberschreibt _summary nicht, wenn ein neuerer schon lief", async () => {
    const view = document.createElement("stats-knx-view") as ViewLike;
    document.body.appendChild(view);
    view._busAnalysisLoaded = true;

    let summarySeq = 0;

    const stubApi: Record<string, unknown> = {
      getKnxBusAnalysisState: async () => ({ enabled: true }),
      getKnxStatsSummary: async (): Promise<unknown> => {
        summarySeq += 1;
        const myValue = summarySeq;
        // Erste Antwort: lange Verzoegerung. Zweite: kurz.
        if (myValue === 1) {
          return delayed({ total_telegrams: 1, active_gas: 1, active_devices: 1 }, 80);
        }
        return delayed({ total_telegrams: 2, active_gas: 2, active_devices: 2 }, 5);
      },
      getKnxStatsTop: async () => ({
        from: "", to: "", items: [], total: 0,
      }),
      getKnxStatsTopBySource: async () => ({
        from: "", to: "", items: [], total: 0,
      }),
      getKnxStatsBusHealth: async () => ({
        from: "", to: "",
        summary: { total: 0, repeated: 0, ratio_pct: 0 },
        per_ga: [],
      }),
      getKnxStatsSilence: async () => ({ from: "", to: "", items: [] }),
      getKnxStatsOrphans: async () => ({ project_only: [], runtime_only: [] }),
      getKnxStatsAlarms: async () => ({ from: "", to: "", items: [] }),
      getKnxStatsBusload: async () => ({ buckets: [], from: "", to: "" }),
      getKnxStatsHealthScore: async () => null,
      getKnxStatsLongTerm: async () => null,
      getKnxStatsBursts: async () => ({ items: [], from: "", to: "" }),
      getKnxStatsSensitiveLog: async () => null,
      getKnxStatsTrend: async () => null,
      getKnxStatsHeatmap: async () => null,
      getKnxStatsTimeline: async () => ({ from: "", to: "", buckets: [] }),
    };
    view.api = stubApi;
    await view.updateComplete;

    // Zwei _load()-Calls hintereinander; Call 1 ist langsamer.
    const p1 = view._load();
    const p2 = view._load();
    await Promise.all([p1, p2]);

    // Summary muss vom zweiten (schnelleren) Call kommen.
    const summary = view._summary as { total_telegrams: number };
    expect(summary.total_telegrams).toBe(2);
    document.body.removeChild(view);
  });
});
