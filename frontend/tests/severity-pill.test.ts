// Iter 59 / B2: severityPillClass mappte green->neutral (grau) und
// yellow->info (blau). Erwartet ist 4-stufige Ampel
// gruen/gelb/orange/rot — siehe stats-knx-view.ts.

import { describe, it, expect } from "vitest";
import { severityPillClass } from "../src/components/stats-knx-view.js";

describe("severityPillClass (B2)", () => {
  it("mappt green auf success (gruen)", () => {
    expect(severityPillClass("green")).toBe("mh-pill--success");
  });

  it("mappt yellow auf caution (gelb) statt info (blau)", () => {
    expect(severityPillClass("yellow")).toBe("mh-pill--caution");
  });

  it("mappt orange auf warning", () => {
    expect(severityPillClass("orange")).toBe("mh-pill--warning");
  });

  it("mappt red auf error", () => {
    expect(severityPillClass("red")).toBe("mh-pill--error");
  });
});
