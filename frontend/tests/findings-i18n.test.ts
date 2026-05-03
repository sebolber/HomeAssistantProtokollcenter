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
