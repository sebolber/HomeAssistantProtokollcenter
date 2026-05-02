import { describe, it, expect } from "vitest";
import "../src/components/severity-filter.js";
import type { SeverityFilter } from "../src/components/severity-filter.js";

describe("severity-filter", () => {
  it("rendert vier Chips fuer error/warning/info/debug", async () => {
    const el = document.createElement("severity-filter") as SeverityFilter;
    el.selected = ["error"];
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = el.shadowRoot!.querySelectorAll("button");
    expect(buttons.length).toBe(4);
    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels).toEqual(["error", "warning", "info", "debug"]);
    document.body.removeChild(el);
  });

  it("Iter 61 / U9: aktive Chips haben class 'active' + aria-pressed=true, inaktive nicht", async () => {
    const el = document.createElement("severity-filter") as SeverityFilter;
    el.selected = ["error", "warning"]; // info + debug inaktiv
    document.body.appendChild(el);
    await el.updateComplete;
    const buttons = Array.from(el.shadowRoot!.querySelectorAll("button"));
    const [errorBtn, warningBtn, infoBtn, debugBtn] = buttons as HTMLButtonElement[];

    expect(errorBtn.classList.contains("active")).toBe(true);
    expect(errorBtn.getAttribute("aria-pressed")).toBe("true");
    expect(warningBtn.classList.contains("active")).toBe(true);
    expect(warningBtn.getAttribute("aria-pressed")).toBe("true");
    expect(infoBtn.classList.contains("active")).toBe(false);
    expect(infoBtn.getAttribute("aria-pressed")).toBe("false");
    expect(debugBtn.classList.contains("active")).toBe(false);
    expect(debugBtn.getAttribute("aria-pressed")).toBe("false");
    document.body.removeChild(el);
  });

  it("emittiert change-Event mit toggelter Severity", async () => {
    const el = document.createElement("severity-filter") as SeverityFilter;
    el.selected = ["error"];
    document.body.appendChild(el);
    await el.updateComplete;

    let detail: { severities: string[] } | undefined;
    el.addEventListener("change", (e) => {
      detail = (e as CustomEvent).detail;
    });

    const warningBtn = el.shadowRoot!.querySelectorAll("button")[1] as HTMLButtonElement;
    warningBtn.click();
    expect(detail).toBeDefined();
    expect(detail!.severities).toEqual(["error", "warning"]);
    document.body.removeChild(el);
  });
});
