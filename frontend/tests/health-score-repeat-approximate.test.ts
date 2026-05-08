// Iter B3: Repeat-KPI im Health-Score wird als Approximation markiert.

import { describe, expect, it } from "vitest";
import type { LitElement } from "lit";
import "../src/components/stats-knx-view.js";
import type { KnxStatsHealthScoreDto } from "../src/api-client.js";

class MinimalApi {
  constructor(public readonly hs: KnxStatsHealthScoreDto) {}
  getKnxStatsHealthScore = async (): Promise<KnxStatsHealthScoreDto> => this.hs;
  getKnxStatsBusAnalysisState = async (): Promise<{ enabled: boolean }> => ({
    enabled: true,
  });
}

describe("Health-Score: repeat KPI approximation marker", () => {
  async function buildView(
    hs: KnxStatsHealthScoreDto,
  ): Promise<LitElement & { _health: KnxStatsHealthScoreDto; _busAnalysisLoaded: boolean }> {
    const view = document.createElement("stats-knx-view") as LitElement & {
      _health: KnxStatsHealthScoreDto;
      _busAnalysisLoaded: boolean;
      api?: MinimalApi;
    };
    document.body.appendChild(view);
    // Erste updateComplete-Phase: Component spawned ihr async _load();
    // wir warten, dass sie initialer State setzt.
    await view.updateComplete;
    // Jetzt unseren Test-State setzen (ueberschreibt was _load gemacht hat).
    view.api = new MinimalApi(hs);
    view._health = hs;
    view._busAnalysisLoaded = true;
    view.requestUpdate();
    await view.updateComplete;
    return view;
  }

  it("renders Stern hinter Wiederholungen-Label, wenn repeat_approximate=true", async () => {
    const view = await buildView({
      from: "2026-05-08T00:00:00Z",
      to: "2026-05-08T23:59:59Z",
      score: 95,
      severity: "green",
      components: { repeat: 100, busload: 100, silence: 100, alarms: 100 },
      findings: [],
      repeat_approximate: true,
    });

    const badges = view.shadowRoot?.querySelectorAll<HTMLElement>(
      '[data-test="health-component"]',
    );
    expect(badges).toBeTruthy();
    const repeat = Array.from(badges ?? []).find(
      (el) => el.dataset.key === "repeat",
    );
    expect(repeat).toBeTruthy();
    expect(repeat?.dataset.approximate).toBe("true");
    expect(repeat?.textContent ?? "").toContain("*");
    expect(repeat?.title.toLowerCase()).toContain("approximation");
    document.body.removeChild(view);
  });

  it("kein Stern, wenn repeat_approximate fehlt (Backward-Compat)", async () => {
    const view = await buildView({
      from: "2026-05-08T00:00:00Z",
      to: "2026-05-08T23:59:59Z",
      score: 95,
      severity: "green",
      components: { repeat: 100, busload: 100, silence: 100, alarms: 100 },
      findings: [],
    });

    const badges = view.shadowRoot?.querySelectorAll<HTMLElement>(
      '[data-test="health-component"]',
    );
    const repeat = Array.from(badges ?? []).find(
      (el) => el.dataset.key === "repeat",
    );
    expect(repeat?.dataset.approximate).toBe("false");
    expect(repeat?.textContent ?? "").not.toContain("*");
    document.body.removeChild(view);
  });
});
