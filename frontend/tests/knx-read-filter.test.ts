// Iter 61 / U15: GroupValueRead-Telegramme im Nachrichten-Tab
// optional ausblenden. Pure Helper isKnxReadMessage erkennt sie am
// "(GroupValueRead)"-Suffix im text + source=knx-bus.

import { describe, it, expect } from "vitest";
import { isKnxReadMessage } from "../src/messagehub-panel.js";

describe("isKnxReadMessage (U15)", () => {
  it("erkennt KNX-GroupValueRead-Telegramme", () => {
    expect(
      isKnxReadMessage({
        source: "knx-bus",
        text: "R001 Diele - Bewegungsmelder - Alarm schalten (GroupValueRead)",
      }),
    ).toBe(true);
  });

  it("erkennt KNX-GroupValueWrite-Telegramme NICHT als Read", () => {
    expect(
      isKnxReadMessage({
        source: "knx-bus",
        text: "R001 Diele - Bewegungsmelder - Alarm schalten = 1",
      }),
    ).toBe(false);
  });

  it("erkennt KNX-GroupValueResponse NICHT als Read", () => {
    expect(
      isKnxReadMessage({
        source: "knx-bus",
        text: "R001 Diele - Bewegungsmelder - Alarm schalten = 0 (GroupValueResponse)",
      }),
    ).toBe(false);
  });

  it("ignoriert non-knx-bus-Quellen", () => {
    expect(
      isKnxReadMessage({
        source: "pihole",
        text: "(GroupValueRead) — sieht aus wie KNX, ist aber Pi-hole-Eigenbau",
      }),
    ).toBe(false);
  });

  it("ignoriert leere Texte", () => {
    expect(isKnxReadMessage({ source: "knx-bus", text: "" })).toBe(false);
  });
});
