// Iter E3: persisted-state Helper.

import { beforeEach, describe, expect, it } from "vitest";
import { loadPersisted, savePersisted } from "../src/utils/persisted-state.js";

interface Filters {
  severity: string[];
  source: string;
  hideKnxRead: boolean;
}

const DEFAULTS: Filters = {
  severity: ["error", "warning", "info"],
  source: "",
  hideKnxRead: false,
};

describe("persisted-state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("liefert Default bei leerem Storage", () => {
    const result = loadPersisted({
      key: "test.filters",
      versionKey: "test.filters.version",
      currentVersion: "v1",
      defaults: DEFAULTS,
    });
    expect(result).toEqual(DEFAULTS);
  });

  it("merged stored mit defaults", () => {
    localStorage.setItem(
      "test.filters",
      JSON.stringify({ source: "pihole" }),
    );
    const result = loadPersisted({
      key: "test.filters",
      versionKey: "test.filters.version",
      currentVersion: "v1",
      defaults: DEFAULTS,
    });
    expect(result.source).toBe("pihole");
    expect(result.severity).toEqual(["error", "warning", "info"]);
  });

  it("ruft Migration nur bei Versions-Mismatch", () => {
    localStorage.setItem(
      "test.filters",
      JSON.stringify({ severity: ["error"] }),
    );
    const calls: Array<string | null> = [];
    const result = loadPersisted({
      key: "test.filters",
      versionKey: "test.filters.version",
      currentVersion: "v2",
      defaults: DEFAULTS,
      migrate: (raw, fromVersion) => {
        calls.push(fromVersion);
        // Migration bringt severity = ["error", "warning"]
        return { ...raw, severity: ["error", "warning"] };
      },
    });
    expect(calls).toEqual([null]); // null = kein gespeicherter Marker
    expect(result.severity).toEqual(["error", "warning"]);
    // Marker ist jetzt v2.
    expect(localStorage.getItem("test.filters.version")).toBe("v2");
    // Zweiter Load: Migration NICHT mehr.
    const result2 = loadPersisted({
      key: "test.filters",
      versionKey: "test.filters.version",
      currentVersion: "v2",
      defaults: DEFAULTS,
      migrate: (raw, fromVersion) => {
        calls.push(fromVersion);
        return raw;
      },
    });
    expect(calls).toEqual([null]); // unveraendert — Migration nicht erneut.
    expect(result2.severity).toEqual(["error", "warning"]);
  });

  it("liefert Defaults bei kaputtem JSON", () => {
    localStorage.setItem("test.filters", "not-json");
    const result = loadPersisted({
      key: "test.filters",
      versionKey: "test.filters.version",
      currentVersion: "v1",
      defaults: DEFAULTS,
    });
    expect(result).toEqual(DEFAULTS);
  });

  it("savePersisted schreibt Wert + Version", () => {
    savePersisted(
      {
        key: "test.filters",
        versionKey: "test.filters.version",
        currentVersion: "v1",
      },
      { ...DEFAULTS, source: "knx-bus" },
    );
    expect(JSON.parse(localStorage.getItem("test.filters") ?? "{}").source)
      .toBe("knx-bus");
    expect(localStorage.getItem("test.filters.version")).toBe("v1");
  });

  it("setzt Versions-Marker auch ohne Migration", () => {
    localStorage.setItem("test.filters", JSON.stringify({}));
    loadPersisted({
      key: "test.filters",
      versionKey: "test.filters.version",
      currentVersion: "v3",
      defaults: DEFAULTS,
    });
    expect(localStorage.getItem("test.filters.version")).toBe("v3");
  });
});
