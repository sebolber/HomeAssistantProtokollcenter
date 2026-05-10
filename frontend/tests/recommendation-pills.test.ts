// Iter R6: Tests fuer die ausgegliederten Recommendation-Pill-Renderer.
//
// Vorher waren das 5 private Methoden in stats-knx-view.ts ohne
// dedizierte Tests — die Render-Logik wurde nur ueber den ganzen
// View-Render-Cycle gepraet. Pure-Funktionen sind isoliert testbar
// und damit deutlich robuster gegen Regressions.

import { describe, expect, it } from "vitest";
import { html, render, type TemplateResult } from "lit";
import {
  renderRecommendationConfidencePill,
  renderRecommendationCycle,
  renderRecommendationModePill,
  renderRecommendationSeverityPill,
  renderRecommendationSourcePill,
} from "../src/components/recommendation-pills.js";
import type {
  KnxRecommendationGaDto,
  KnxRecommendationMode,
} from "../src/types/knx-recommend.js";


function rendered(template: TemplateResult): HTMLElement {
  const host = document.createElement("div");
  render(template, host);
  return host;
}


function makeGa(
  overrides: Partial<KnxRecommendationGaDto> = {},
): KnxRecommendationGaDto {
  return {
    ga: "1/2/3",
    label: null,
    dpt: "9.001",
    observed: {
      mode: "cyclic",
      confidence: "high",
      sample_count: 100,
      value_changes: 50,
      median_interval_s: 60,
      median_interval_minutes: 1.0,
      stdev_interval_s: 5,
    },
    recommended_mode: null,
    recommended_cycle_minutes: null,
    recommended_hysteresis: null,
    severity: "ok",
    rationale: null,
    ...overrides,
  };
}


describe("renderRecommendationModePill", () => {
  const cases: Array<[KnxRecommendationMode, string, string]> = [
    ["cyclic", "zyklisch", "mh-pill--info"],
    ["on_change", "bei Änderung", "mh-pill--info"],
    ["hybrid", "hybrid", "mh-pill--caution"],
    ["silent", "stumm", "mh-pill--neutral"],
    ["insufficient", "zu wenig Daten", "mh-pill--neutral"],
  ];

  for (const [mode, label, variant] of cases) {
    it(`zeigt "${label}" mit Variante ${variant} fuer mode=${mode}`, () => {
      const host = rendered(renderRecommendationModePill(mode));
      const span = host.querySelector("span");
      expect(span).not.toBeNull();
      expect(span!.textContent?.trim()).toBe(label);
      expect(span!.className).toContain(variant);
      expect(span!.className).toContain("mh-pill");
    });
  }
});


describe("renderRecommendationConfidencePill", () => {
  it("low traegt caution-Variante (visuelle Warnung)", () => {
    const host = rendered(renderRecommendationConfidencePill("low"));
    const span = host.querySelector("span")!;
    expect(span.textContent?.trim()).toBe("niedrige Konfidenz");
    expect(span.className).toContain("mh-pill--caution");
  });

  it("high zeigt neutrale Pille (kein Alarm)", () => {
    const host = rendered(renderRecommendationConfidencePill("high"));
    const span = host.querySelector("span")!;
    expect(span.textContent?.trim()).toBe("hohe Konfidenz");
    expect(span.className).toContain("mh-pill--neutral");
  });
});


describe("renderRecommendationSourcePill", () => {
  it("null/undefined liefert leeres Template", () => {
    const host = rendered(renderRecommendationSourcePill(null));
    expect(host.querySelector("span")).toBeNull();
    const host2 = rendered(renderRecommendationSourcePill(undefined));
    expect(host2.querySelector("span")).toBeNull();
  });

  it("dpt_standard zeigt 'DPT' mit Layer-1-Tooltip", () => {
    const host = rendered(renderRecommendationSourcePill("dpt_standard"));
    const span = host.querySelector("span")!;
    expect(span.textContent?.trim()).toBe("DPT");
    expect(span.getAttribute("title")).toContain("Layer 1");
  });

  it("device_model zeigt 'Modell' mit Layer-2-Tooltip", () => {
    const host = rendered(renderRecommendationSourcePill("device_model"));
    const span = host.querySelector("span")!;
    expect(span.textContent?.trim()).toBe("Modell");
    expect(span.getAttribute("title")).toContain("Layer 2");
  });

  it("llm zeigt 'KI' mit caution-Variante + manuell-pruefen-Hinweis", () => {
    const host = rendered(renderRecommendationSourcePill("llm"));
    const span = host.querySelector("span")!;
    expect(span.textContent?.trim()).toBe("KI");
    expect(span.className).toContain("mh-pill--caution");
    expect(span.getAttribute("title")).toContain("manuell pruefen");
  });

  it("hat die recommendation-source-pill-Klasse fuer CSS-Targeting", () => {
    const host = rendered(renderRecommendationSourcePill("dpt_standard"));
    const span = host.querySelector("span")!;
    expect(span.className).toContain("recommendation-source-pill");
  });
});


describe("renderRecommendationSeverityPill", () => {
  it("ok hat success-Variante", () => {
    const host = rendered(renderRecommendationSeverityPill("ok"));
    const span = host.querySelector("span")!;
    expect(span.textContent?.trim()).toBe("ok");
    expect(span.className).toContain("mh-pill--success");
  });

  it("deviation hat error-Variante", () => {
    const host = rendered(renderRecommendationSeverityPill("deviation"));
    const span = host.querySelector("span")!;
    expect(span.textContent?.trim()).toBe("Abweichung");
    expect(span.className).toContain("mh-pill--error");
  });

  it("warn rendert als 'abweichend' (lower-case Hinweis)", () => {
    const host = rendered(renderRecommendationSeverityPill("warn"));
    const span = host.querySelector("span")!;
    expect(span.textContent?.trim()).toBe("abweichend");
  });
});


describe("renderRecommendationCycle", () => {
  it("recommended_mode=null -> em dash", () => {
    const ga = makeGa({ recommended_mode: null });
    const host = rendered(renderRecommendationCycle(ga));
    expect(host.textContent?.trim()).toBe("—");
  });

  it("on_change zeigt 'kein Heartbeat'-Hinweis", () => {
    const ga = makeGa({
      recommended_mode: "on_change",
      recommended_cycle_minutes: null,
    });
    const host = rendered(renderRecommendationCycle(ga));
    expect(host.textContent?.toLowerCase()).toContain("kein heartbeat");
  });

  it("cyclic mit gleichem min/max formatiert als 'X Min'", () => {
    const ga = makeGa({
      recommended_mode: "cyclic",
      recommended_cycle_minutes: [10, 10],
    });
    const host = rendered(renderRecommendationCycle(ga));
    const text = host.textContent ?? "";
    expect(text).toContain("10 Min");
    expect(text).not.toContain("10–10");
    expect(text.toLowerCase()).toContain("zyklisch");
  });

  it("cyclic mit Bereich formatiert als 'X-Y Min' (mit en-dash)", () => {
    const ga = makeGa({
      recommended_mode: "cyclic",
      recommended_cycle_minutes: [5, 15],
    });
    const host = rendered(renderRecommendationCycle(ga));
    expect(host.textContent ?? "").toContain("5–15 Min");
  });

  it("hybrid mit Cycle zeigt Heartbeat-Hinweis", () => {
    const ga = makeGa({
      recommended_mode: "hybrid",
      recommended_cycle_minutes: [10, 30],
    });
    const host = rendered(renderRecommendationCycle(ga));
    const text = (host.textContent ?? "").toLowerCase();
    expect(text).toContain("10–30 min");
    expect(text).toContain("heartbeat");
    expect(text).toContain("aenderung");
  });

  it("cyclic ohne Cycle-Korridor zeigt 'Intervall offen'-Fallback", () => {
    const ga = makeGa({
      recommended_mode: "cyclic",
      recommended_cycle_minutes: null,
    });
    const host = rendered(renderRecommendationCycle(ga));
    expect((host.textContent ?? "").toLowerCase()).toContain("intervall offen");
  });

  it("hybrid ohne Cycle-Korridor zeigt 'Heartbeat (Intervall offen)'", () => {
    const ga = makeGa({
      recommended_mode: "hybrid",
      recommended_cycle_minutes: null,
    });
    const host = rendered(renderRecommendationCycle(ga));
    const text = (host.textContent ?? "").toLowerCase();
    expect(text).toContain("heartbeat");
    expect(text).toContain("intervall offen");
  });
});


// Hilft Lit, die Helper-Imports nicht als unused zu killen — der
// Export-Anker zwingt den TS-Compiler/Bundler, `html` zu behalten.
export const _LIT_HTML_KEEPALIVE_ANCHOR = html`unused-anchor`;
