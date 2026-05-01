import { describe, it, expect } from "vitest";
import { formatRelative, formatAbsolute } from "../src/utils/time.js";

describe("formatRelative", () => {
  const now = new Date("2026-05-01T20:10:00Z");

  it("liefert 'gerade eben' fuer Zeitpunkte unter 5 Sekunden", () => {
    expect(formatRelative("2026-05-01T20:09:58Z", now)).toBe("gerade eben");
    expect(formatRelative("2026-05-01T20:10:01Z", now)).toBe("gerade eben");
  });

  it("formatiert Sekunden / Minuten / Stunden in Vergangenheit", () => {
    expect(formatRelative("2026-05-01T20:09:30Z", now)).toContain("Sekunden");
    expect(formatRelative("2026-05-01T20:07:00Z", now)).toContain("Minuten");
    expect(formatRelative("2026-05-01T18:10:00Z", now)).toContain("Stunden");
  });

  it("formatiert Tage und 'gestern'", () => {
    expect(formatRelative("2026-04-30T20:10:00Z", now)).toBe("gestern");
    expect(formatRelative("2026-04-25T20:10:00Z", now)).toContain("Tagen");
  });

  it("liefert '—' fuer ungueltige Datumsstrings", () => {
    expect(formatRelative("nope", now)).toBe("—");
  });
});

describe("formatAbsolute", () => {
  const now = new Date("2026-05-01T20:10:00Z");

  it("zeigt nur Uhrzeit fuer Eintraege am gleichen Tag", () => {
    const out = formatAbsolute("2026-05-01T20:08:00Z", now);
    expect(out).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("zeigt Datum + Uhrzeit fuer alte Eintraege", () => {
    const out = formatAbsolute("2026-04-25T18:00:00Z", now);
    expect(out).toMatch(/^\d{2}\.\d{2}\. \d{2}:\d{2}:\d{2}$/);
  });
});
