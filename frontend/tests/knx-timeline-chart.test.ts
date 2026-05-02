import { describe, it, expect } from "vitest";
import "../src/components/knx-timeline-chart.js";

interface ChartEl extends HTMLElement {
  items: Array<{ ga: string; bucket: string; count: number }>;
  updateComplete: Promise<unknown>;
}

async function mount(items: ChartEl["items"]): Promise<ChartEl> {
  const el = document.createElement("knx-timeline-chart") as ChartEl;
  el.items = items;
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

describe("knx-timeline-chart", () => {
  it("rendert leeren State bei keinen Items", async () => {
    const el = await mount([]);
    const text = el.shadowRoot!.textContent ?? "";
    expect(text).toContain("Keine Timeline-Daten");
    expect(el.shadowRoot!.querySelector("svg")).toBeNull();
  });

  it("rendert SVG mit polyline pro GA", async () => {
    const el = await mount([
      { ga: "1/2/3", bucket: "2026-05-02T10:00:00", count: 5 },
      { ga: "1/2/3", bucket: "2026-05-02T11:00:00", count: 8 },
      { ga: "5/2/14", bucket: "2026-05-02T10:00:00", count: 100 },
      { ga: "5/2/14", bucket: "2026-05-02T11:00:00", count: 142 },
    ]);
    const polylines = el.shadowRoot!.querySelectorAll("polyline.series");
    expect(polylines.length).toBe(2);
  });

  it("rendert Y-Achse-Labels mit max-Wert", async () => {
    const el = await mount([
      { ga: "5/2/14", bucket: "2026-05-02T10:00:00", count: 142 },
    ]);
    const text = el.shadowRoot!.textContent ?? "";
    expect(text).toContain("142");
    expect(text).toContain("0");
  });

  it("rendert Legende mit GA-Codes", async () => {
    const el = await mount([
      { ga: "1/2/3", bucket: "2026-05-02T10:00:00", count: 1 },
      { ga: "5/2/14", bucket: "2026-05-02T10:00:00", count: 2 },
    ]);
    const codes = el.shadowRoot!.querySelectorAll(".legend-item code");
    expect(codes.length).toBe(2);
    const labels = Array.from(codes).map((c) => c.textContent);
    expect(labels).toContain("1/2/3");
    expect(labels).toContain("5/2/14");
  });
});
