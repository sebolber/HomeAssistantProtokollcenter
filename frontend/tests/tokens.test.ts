import { describe, it, expect } from "vitest";
import { tokens, buttons, forms, cards, pills } from "../src/styles/tokens.js";

describe("design-tokens", () => {
  it("definiert ein zentrales Spacing-System auf 4-px-Grid", () => {
    const css = tokens.cssText;
    expect(css).toContain("--mh-space-1: 4px");
    expect(css).toContain("--mh-space-2: 8px");
    expect(css).toContain("--mh-space-4: 16px");
    expect(css).toContain("--mh-space-6: 32px");
  });

  it("definiert Radius-Skala inkl. Pille", () => {
    const css = tokens.cssText;
    expect(css).toContain("--mh-radius-sm");
    expect(css).toContain("--mh-radius-md");
    expect(css).toContain("--mh-radius-lg");
    expect(css).toContain("--mh-radius-pill: 999px");
  });

  it("setzt Severity-Farben relativ zu HA-Theme-Vars", () => {
    const css = tokens.cssText;
    expect(css).toContain("--mh-error: var(--error-color");
    expect(css).toContain("--mh-warning: var(--warning-color");
    expect(css).toContain("--mh-info: var(--info-color");
    expect(css).toContain("--mh-success: var(--success-color");
  });

  it("hat eine Severity-Soft-Variante fuer dezente Hintergruende", () => {
    const css = tokens.cssText;
    expect(css).toContain("--mh-error-soft");
    expect(css).toContain("--mh-warning-soft");
    expect(css).toContain("--mh-info-soft");
    expect(css).toContain("--mh-debug-soft");
  });

  it("liefert wiederverwendbare mh-btn-Klasse mit Primary-/Danger-Modifikatoren", () => {
    const css = buttons.cssText;
    expect(css).toContain(".mh-btn");
    expect(css).toContain(".mh-btn--primary");
    expect(css).toContain(".mh-btn--danger");
    expect(css).toContain(".mh-btn--ghost");
    expect(css).toContain(".mh-btn--icon");
  });

  it("liefert Form-Styles mit Fokus-Ring", () => {
    const css = forms.cssText;
    expect(css).toContain(".mh-input");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("box-shadow");
  });

  it("liefert Card-Styles mit Header-Slot", () => {
    const css = cards.cssText;
    expect(css).toContain(".mh-card");
    expect(css).toContain(".mh-card__header");
    expect(css).toContain(".mh-card__title");
  });

  it("liefert Severity-Pille fuer alle vier Schweregrade", () => {
    const css = pills.cssText;
    expect(css).toContain(".mh-pill");
    expect(css).toContain(".mh-pill--error");
    expect(css).toContain(".mh-pill--warning");
    expect(css).toContain(".mh-pill--info");
    expect(css).toContain(".mh-pill--debug");
    expect(css).toContain(".mh-pill__dot");
  });
});
