// Iter 59 / B1: Audit-Detail-Summary zeigte bei einzelnem Schluessel nur
// "{deleted_count}" — wirkt im UI wie ein nicht ersetzter Template-String.
// Die pure Helper-Funktion soll den Wert mit anzeigen, sobald genau ein
// primitiver Schluessel-Wert da ist.

import { describe, it, expect } from "vitest";
import { formatDetailsSummary } from "../src/components/audit-view.js";

describe("formatDetailsSummary (B1)", () => {
  it("liefert leerer String fuer null/undefined/non-object", () => {
    expect(formatDetailsSummary(null)).toBe("");
    expect(formatDetailsSummary(undefined)).toBe("");
    expect(formatDetailsSummary(42 as unknown)).toBe("");
    expect(formatDetailsSummary("foo" as unknown)).toBe("");
  });

  it("nutzt label-Feld als Summary, falls vorhanden", () => {
    expect(formatDetailsSummary({ label: "Wohnzimmer Licht" })).toBe(
      "Wohnzimmer Licht",
    );
  });

  it("nutzt name-Feld als Fallback wenn label fehlt", () => {
    expect(formatDetailsSummary({ name: "Pi-hole" })).toBe("Pi-hole");
  });

  it("zeigt bei genau einem primitiven Key den Wert mit (B1-Fix)", () => {
    // Vorher: "{deleted_count}" — wirkt wie nicht ersetztes Template.
    // Jetzt: "deleted_count: 23" — klar als ausgewerteter Wert lesbar.
    expect(formatDetailsSummary({ deleted_count: 23 })).toBe(
      "deleted_count: 23",
    );
    expect(formatDetailsSummary({ status: "resolved" })).toBe(
      "status: resolved",
    );
    expect(formatDetailsSummary({ enabled: true })).toBe("enabled: true");
  });

  it("kuerzt sehr lange primitive Werte auf maximal 60 Zeichen", () => {
    const longText = "x".repeat(120);
    const result = formatDetailsSummary({ note: longText });
    expect(result.startsWith("note: ")).toBe(true);
    expect(result.length).toBeLessThanOrEqual("note: ".length + 60 + 1);
    expect(result.endsWith("…")).toBe(true);
  });

  it("zeigt fuer komplexe Einzelwerte (Object/Array) nur Key-Liste", () => {
    expect(formatDetailsSummary({ patch: { a: 1, b: 2 } })).toBe("{patch}");
    expect(formatDetailsSummary({ items: [1, 2, 3] })).toBe("{items}");
  });

  it("zeigt bei mehreren Keys eine kompakte Key-Liste (max 3)", () => {
    expect(formatDetailsSummary({ a: 1, b: 2 })).toBe("{a, b}");
    expect(formatDetailsSummary({ a: 1, b: 2, c: 3 })).toBe("{a, b, c}");
    expect(formatDetailsSummary({ a: 1, b: 2, c: 3, d: 4 })).toBe(
      "{a, b, c, …}",
    );
  });
});
