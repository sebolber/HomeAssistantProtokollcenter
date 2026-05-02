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

  it("rendert SVG mit polyline pro GA bei mehreren Buckets", async () => {
    const el = await mount([
      { ga: "1/2/3", bucket: "2026-05-02T10:00:00", count: 5 },
      { ga: "1/2/3", bucket: "2026-05-02T11:00:00", count: 8 },
      { ga: "5/2/14", bucket: "2026-05-02T10:00:00", count: 100 },
      { ga: "5/2/14", bucket: "2026-05-02T11:00:00", count: 142 },
    ]);
    // Iter 52: jede Serie ist jetzt ein <g class="series"> mit
    // polyline + circles drinnen.
    const groups = el.shadowRoot!.querySelectorAll("g.series");
    expect(groups.length).toBe(2);
    const polylines = el.shadowRoot!.querySelectorAll("g.series polyline");
    expect(polylines.length).toBe(2);
  });

  it("Iter 52: rendert horizontale Linie + Circle bei einem Bucket", async () => {
    // Single-Bucket-Bug: Polyline mit 1 Punkt war unsichtbar.
    // Fix rendert horizontale Linie ueber die volle Breite + Circle.
    const el = await mount([
      { ga: "0/5/201", bucket: "2026-05-02T10:00:00", count: 19 },
    ]);
    const groups = el.shadowRoot!.querySelectorAll("g.series");
    expect(groups.length).toBe(1);
    const lines = groups[0].querySelectorAll("line");
    expect(lines.length).toBe(1);
    const circles = groups[0].querySelectorAll("circle");
    expect(circles.length).toBe(1);
    // Horizontale Linie: y1 == y2
    const line = lines[0];
    expect(line.getAttribute("y1")).toBe(line.getAttribute("y2"));
    // x1 < x2 (von links nach rechts)
    expect(parseFloat(line.getAttribute("x1") || "0")).toBeLessThan(
      parseFloat(line.getAttribute("x2") || "0")
    );
  });

  it("Iter 52: rendert Circle-Marker an jedem Datenpunkt bei mehreren Buckets", async () => {
    const el = await mount([
      { ga: "1/2/3", bucket: "2026-05-02T10:00:00", count: 5 },
      { ga: "1/2/3", bucket: "2026-05-02T11:00:00", count: 8 },
      { ga: "1/2/3", bucket: "2026-05-02T12:00:00", count: 3 },
    ]);
    // 1 Serie mit 3 Buckets -> 3 Circles
    const circles = el.shadowRoot!.querySelectorAll("g.series circle");
    expect(circles.length).toBe(3);
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
