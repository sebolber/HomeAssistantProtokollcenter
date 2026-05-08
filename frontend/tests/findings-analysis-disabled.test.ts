// Iter A3: i18n-Eintrag fuer ANALYSIS_DISABLED muss in DE + EN
// vorhanden sein, damit der Findings-Tab einen klaren Hinweis rendert.

import { describe, expect, it } from "vitest";
import {
  getFindingDescription,
  getFindingTitle,
} from "../src/utils/findings-i18n.js";

describe("ANALYSIS_DISABLED finding i18n", () => {
  it("returns a German title for the disabled toggle", () => {
    const title = getFindingTitle("ANALYSIS_DISABLED", "de");
    expect(title).not.toBe("");
    expect(title.toLowerCase()).toContain("bus-analyse");
    expect(title.toLowerCase()).toContain("deaktiviert");
  });

  it("returns an English title for the disabled toggle", () => {
    const title = getFindingTitle("ANALYSIS_DISABLED", "en");
    expect(title).not.toBe("");
    expect(title.toLowerCase()).toContain("bus analysis");
    expect(title.toLowerCase()).toContain("disabled");
  });

  it("German description guides the user to re-enable", () => {
    const desc = getFindingDescription("ANALYSIS_DISABLED", "de", {});
    expect(desc).toContain("Toggle");
    expect(desc.toLowerCase()).toMatch(/aktiviere|aktivier/);
  });

  it("English description guides the user to re-enable", () => {
    const desc = getFindingDescription("ANALYSIS_DISABLED", "en", {});
    expect(desc.toLowerCase()).toContain("toggle");
    expect(desc.toLowerCase()).toMatch(/enable|resume/);
  });
});
