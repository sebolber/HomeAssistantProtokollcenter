// Iter E6: Hash-Router-Helper.

import { describe, expect, it } from "vitest";
import { parseHashRoute } from "../src/utils/hash-route.js";

describe("parseHashRoute", () => {
  it("liefert messages als Default fuer leere Hash", () => {
    expect(parseHashRoute("").top).toBe("messages");
    expect(parseHashRoute("#").top).toBe("messages");
  });

  it("erkennt die vier Top-Tabs", () => {
    expect(parseHashRoute("#messages").top).toBe("messages");
    expect(parseHashRoute("#settings").top).toBe("settings");
    expect(parseHashRoute("#stats").top).toBe("stats");
    expect(parseHashRoute("#audit").top).toBe("audit");
  });

  it("aliased #findings auf stats/findings", () => {
    const route = parseHashRoute("#findings");
    expect(route.top).toBe("stats");
    expect(route.sub).toBe("findings");
  });

  it("parst Sub-Tab nach dem Slash", () => {
    expect(parseHashRoute("#stats/knx").sub).toBe("knx");
    expect(parseHashRoute("#settings/mqtt").sub).toBe("mqtt");
  });

  it("liest Query-Parameter", () => {
    const route = parseHashRoute("#stats/findings?source=1.1.5&foo=bar");
    expect(route.top).toBe("stats");
    expect(route.sub).toBe("findings");
    expect(route.query.get("source")).toBe("1.1.5");
    expect(route.query.get("foo")).toBe("bar");
  });

  it("alias mit Query: #findings?source=...", () => {
    const route = parseHashRoute("#findings?source=1.1.42");
    expect(route.top).toBe("stats");
    expect(route.sub).toBe("findings");
    expect(route.query.get("source")).toBe("1.1.42");
  });

  it("faellt bei unbekanntem Top-Tab auf messages zurueck", () => {
    expect(parseHashRoute("#bogus").top).toBe("messages");
    expect(parseHashRoute("#bogus/sub").top).toBe("messages");
  });
});
