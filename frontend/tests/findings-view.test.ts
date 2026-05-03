// Iter 9 (knx-findings): leere Findings-View als 3. Sub-Tab.
//
// Testet: Render des leeren Tabs (Header, Empty-State, listFindings-
// Aufruf). Render mit Items kommt in Iter 10.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/findings-view.js";
import type { ApiClient, FindingsListResponse } from "../src/api-client.js";

function makeApiWithEmptyList(): ApiClient {
  return {
    listFindings: vi.fn(
      async (): Promise<FindingsListResponse> => ({
        items: [],
        total: 0,
        limit: 50,
        offset: 0,
      })
    ),
  } as unknown as ApiClient;
}

async function mount(api: ApiClient): Promise<HTMLElement> {
  const el = document.createElement("findings-view") as HTMLElement & {
    api?: ApiClient;
    updateComplete: Promise<unknown>;
  };
  el.api = api;
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

describe("findings-view (Iter 9: leerer Tab)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("rendert einen Header 'Konfigurations-Check'", async () => {
    const api = makeApiWithEmptyList();
    const el = await mount(api);
    const header = el.shadowRoot!.querySelector(
      "[data-test='findings-header']"
    );
    expect(header?.textContent).toContain("Konfigurations-Check");
  });

  it("ruft api.listFindings beim Mount auf", async () => {
    const api = makeApiWithEmptyList();
    await mount(api);
    expect(api.listFindings).toHaveBeenCalledTimes(1);
  });

  it("zeigt Empty-State, wenn keine Findings vorhanden sind", async () => {
    const api = makeApiWithEmptyList();
    const el = await mount(api);
    const empty = el.shadowRoot!.querySelector("[data-test='findings-empty']");
    expect(empty).not.toBeNull();
    expect(empty?.textContent ?? "").toMatch(/keine|empty/i);
  });

  it("hat einen Severity-Filter mit allen vier Stufen", async () => {
    const api = makeApiWithEmptyList();
    const el = await mount(api);
    const filter = el.shadowRoot!.querySelector(
      "[data-test='findings-severity-filter']"
    );
    expect(filter).not.toBeNull();
    const optionValues = Array.from(
      filter?.querySelectorAll("option") ?? []
    ).map((o) => (o as HTMLOptionElement).value);
    // "" = alle, plus die vier Severities.
    expect(optionValues).toEqual(
      expect.arrayContaining(["", "debug", "info", "warning", "error"])
    );
  });

  it("rendert einen leeren Tabellen-Container fuer spaetere Items", async () => {
    const api = makeApiWithEmptyList();
    const el = await mount(api);
    const table = el.shadowRoot!.querySelector(
      "[data-test='findings-table']"
    );
    // Render des Tabellen-Containers ist auch im Empty-State OK; Items
    // kommen in Iter 10. Der Container muss mindestens existieren.
    expect(table).not.toBeNull();
  });

  it("zeigt Fehlermeldung, wenn die API fehlschlaegt", async () => {
    const api = {
      listFindings: vi.fn(async () => {
        throw new Error("HTTP 500");
      }),
    } as unknown as ApiClient;
    const el = await mount(api);
    const error = el.shadowRoot!.querySelector("[data-test='findings-error']");
    expect(error).not.toBeNull();
  });
});

describe("findings-view (Iter 9: Sub-Tab-Integration)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.stats.subtab");
    } catch {
      // noop
    }
  });

  it("findings-view ist als Custom Element registriert", () => {
    const ctor = customElements.get("findings-view");
    expect(ctor).toBeDefined();
  });
});
