// Iter 14 (knx-findings): i18n fuer Phase-2-Detector-Codes.
//
// Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.7:
// Detektoren liefern Code + Evidence, UI rendert lesbare Strings ueber
// translations. Hier: TypeScript-Helper, getestet fuer DE/EN.

import { describe, it, expect } from "vitest";
import {
  getFindingDescription,
  getFindingHelpUrl,
  getFindingTitle,
} from "../src/utils/findings-i18n.js";

describe("findings-i18n Iter 14: Phase 2", () => {
  it("test_finding_translation_resolves_for_dpt_mismatch_de_and_en", () => {
    // Title fuer DPT_MISMATCH in beiden Sprachen.
    const titleDe = getFindingTitle("DPT_MISMATCH", "de");
    const titleEn = getFindingTitle("DPT_MISMATCH", "en");
    expect(titleDe).not.toEqual("");
    expect(titleEn).not.toEqual("");
    // Sprachen unterscheiden sich (kein Fallback).
    expect(titleDe).not.toEqual(titleEn);
    expect(titleDe.toLowerCase()).toContain("datentyp");
    expect(titleEn.toLowerCase()).toContain("datapoint");
  });

  it("rendert Description mit Evidence-Substitution (project_dpt, inferred_dpt)", () => {
    const description = getFindingDescription(
      "DPT_MISMATCH",
      "de",
      { project_dpt: "9.001", inferred_dpt: "1.001", confidence: 0.94, samples: 52 }
    );
    expect(description).toContain("9.001");
    expect(description).toContain("1.001");
  });

  it("liefert Help-URL fuer DPT_MISMATCH", () => {
    const url = getFindingHelpUrl("DPT_MISMATCH");
    expect(url).toMatch(/^https?:\/\//);
  });

  it("rendert VALUE_OUT_OF_RANGE in DE und EN", () => {
    const titleDe = getFindingTitle("VALUE_OUT_OF_RANGE", "de");
    const titleEn = getFindingTitle("VALUE_OUT_OF_RANGE", "en");
    expect(titleDe.toLowerCase()).toContain("wert");
    expect(titleEn.toLowerCase()).toContain("value");
  });

  it("rendert VALUE_OUT_OF_RANGE-Description mit value/dpt/range", () => {
    const description = getFindingDescription(
      "VALUE_OUT_OF_RANGE",
      "de",
      { value: 200, dpt: "5.001", range_min: 0, range_max: 100 }
    );
    expect(description).toContain("200");
    expect(description).toContain("5.001");
    expect(description).toContain("0");
    expect(description).toContain("100");
  });

  it("faellt auf EN zurueck, wenn die Sprache nicht eingerichtet ist", () => {
    const titleEs = getFindingTitle("DPT_MISMATCH", "es");
    const titleEn = getFindingTitle("DPT_MISMATCH", "en");
    // Iter 14: nur DE+EN definiert. ES faellt auf EN zurueck.
    expect(titleEs).toEqual(titleEn);
  });

  it("liefert leeren String fuer unbekannte Codes (Iter 9 Fallback)", () => {
    const title = getFindingTitle("UNKNOWN_CODE", "de");
    expect(title).toBe("");
  });
});

describe("findings-i18n Iter 19: Phase 3 Codes", () => {
  it.each([
    "MULTI_RESPONDER",
    "READ_NO_RESPONSE",
    "TOGGLE_LOOP",
    "MULTI_TIME_MASTER",
  ])("hat Title in DE und EN: %s", (code) => {
    const titleDe = getFindingTitle(code, "de");
    const titleEn = getFindingTitle(code, "en");
    expect(titleDe).not.toEqual("");
    expect(titleEn).not.toEqual("");
    expect(titleDe).not.toEqual(titleEn);
  });

  it("rendert MULTI_RESPONDER-Description mit count + window_ms", () => {
    const description = getFindingDescription(
      "MULTI_RESPONDER",
      "de",
      {
        count: 3,
        window_ms: 1000,
        responding_sources: ["1.1.5", "1.1.6", "1.1.7"],
      }
    );
    expect(description).toContain("3");
    expect(description).toContain("1000");
  });

  it("rendert READ_NO_RESPONSE-Description mit read_at + timeout_sec", () => {
    const description = getFindingDescription(
      "READ_NO_RESPONSE",
      "en",
      { read_at: "2026-05-03T08:00:00", timeout_sec: 3 }
    );
    expect(description).toContain("2026-05-03T08:00:00");
    expect(description).toContain("3");
  });

  it("rendert TOGGLE_LOOP-Description mit period_ms + cycles", () => {
    const description = getFindingDescription(
      "TOGGLE_LOOP",
      "de",
      { period_ms: 2000, cycles: 6 }
    );
    expect(description).toContain("2000");
    expect(description).toContain("6");
  });

  it("rendert MULTI_TIME_MASTER-Description mit sources + clock_dpt", () => {
    const description = getFindingDescription(
      "MULTI_TIME_MASTER",
      "en",
      { sources: ["1.1.5", "1.1.6"], clock_dpt: "10.001" }
    );
    expect(description).toContain("10.001");
  });
});

describe("findings-i18n Iter 23: Phase 4 Codes", () => {
  it.each([
    "RECONNECT_STORM",
    "SEND_CYCLE_DRIFT",
    "REPEAT_APPROXIMATION",
  ])("hat Title in DE und EN: %s", (code) => {
    const titleDe = getFindingTitle(code, "de");
    const titleEn = getFindingTitle(code, "en");
    expect(titleDe).not.toEqual("");
    expect(titleEn).not.toEqual("");
    expect(titleDe).not.toEqual(titleEn);
  });

  it("rendert RECONNECT_STORM-Description mit silence_until + burst_count", () => {
    const description = getFindingDescription(
      "RECONNECT_STORM",
      "de",
      {
        silence_until: "2026-05-03T08:00:00",
        burst_count: 50,
        normal_avg: 2,
        factor: 25,
      }
    );
    expect(description).toContain("2026-05-03T08:00:00");
    expect(description).toContain("50");
  });

  it("rendert SEND_CYCLE_DRIFT-Description mit Verhaeltnis", () => {
    const description = getFindingDescription(
      "SEND_CYCLE_DRIFT",
      "de",
      { recent_median_dt: 25, baseline_median_dt: 60, ratio: 0.42 }
    );
    expect(description).toContain("25");
    expect(description).toContain("60");
    expect(description).toContain("0.42");
  });

  it("rendert REPEAT_APPROXIMATION-Description mit Tagen + Anzahl", () => {
    const description = getFindingDescription(
      "REPEAT_APPROXIMATION",
      "en",
      { total_repeats: 12, period_days: 1, repeats_per_day: 12 }
    );
    expect(description).toContain("12");
    expect(description).toContain("1");
  });
});
