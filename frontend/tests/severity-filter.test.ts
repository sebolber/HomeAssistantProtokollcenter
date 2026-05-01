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
