// Iter 60 / U5: Top-Sender-Tabelle bekommt sortierbare Spalten analog
// zu Iter 57 (Top-Geraete). Pure Helper sortTopSender wird vom Component
// benutzt — testbar ohne Mount.

import { describe, it, expect } from "vitest";
import {
  sortTopSender,
  type TopSenderSortKey,
} from "../src/components/stats-knx-view.js";

interface Row {
  ga: string;
  label?: string | null;
  rate_per_min: number;
  recommended_rate: number;
  severity: "green" | "yellow" | "orange" | "red";
}

const rows: Row[] = [
  {
    ga: "0/5/201",
    label: "Zentral Alarm",
    rate_per_min: 2.3,
    recommended_rate: 5.0,
    severity: "green",
  },
  {
    ga: "5/2/14",
    label: "Wetter Lux",
    rate_per_min: 142.0,
    recommended_rate: 2.0,
    severity: "red",
  },
  {
    ga: "1/3/5",
    label: null,
    rate_per_min: 12.4,
    recommended_rate: 2.0,
    severity: "orange",
  },
];

describe("sortTopSender (U5)", () => {
  it("sortiert nach rate_per_min desc als Default", () => {
    const result = sortTopSender(rows, "rate_per_min", "desc");
    expect(result.map((r) => r.ga)).toEqual(["5/2/14", "1/3/5", "0/5/201"]);
  });

  it("sortiert nach rate_per_min asc bei Toggle", () => {
    const result = sortTopSender(rows, "rate_per_min", "asc");
    expect(result.map((r) => r.ga)).toEqual(["0/5/201", "1/3/5", "5/2/14"]);
  });

  it("sortiert nach GA als String", () => {
    const result = sortTopSender(rows, "ga", "asc");
    expect(result.map((r) => r.ga)).toEqual(["0/5/201", "1/3/5", "5/2/14"]);
  });

  it("sortiert nach Label, leere Labels ans Ende bei asc", () => {
    const result = sortTopSender(rows, "label", "asc");
    expect(result.map((r) => r.ga)).toEqual(["5/2/14", "0/5/201", "1/3/5"]);
  });

  it("sortiert nach severity-Rang (red > orange > yellow > green) bei desc", () => {
    const result = sortTopSender(rows, "severity", "desc");
    expect(result.map((r) => r.severity)).toEqual(["red", "orange", "green"]);
  });

  it("sortiert nach severity asc (green > orange > red)", () => {
    const result = sortTopSender(rows, "severity", "asc");
    expect(result.map((r) => r.severity)).toEqual(["green", "orange", "red"]);
  });

  it("sortiert nach recommended_rate", () => {
    const result = sortTopSender(rows, "recommended_rate", "desc");
    expect(result.map((r) => r.ga)).toEqual(["0/5/201", "5/2/14", "1/3/5"]);
  });

  it("liefert eine neue Liste, mutiert das Original nicht", () => {
    const before = rows.map((r) => r.ga);
    sortTopSender(rows, "rate_per_min", "asc");
    const after = rows.map((r) => r.ga);
    expect(after).toEqual(before);
  });

  it("akzeptiert alle TopSenderSortKey-Varianten ohne Crash", () => {
    const keys: TopSenderSortKey[] = [
      "ga",
      "label",
      "rate_per_min",
      "recommended_rate",
      "severity",
    ];
    for (const k of keys) {
      expect(() => sortTopSender(rows, k, "desc")).not.toThrow();
    }
  });
});
