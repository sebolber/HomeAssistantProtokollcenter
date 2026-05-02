/**
 * Regression-Tests fuer den "nur aktive" Filter in knx-addresses-view.
 *
 * Hintergrund: Bug 6d65a16 / 1a4349b — der Filter zeigte nichts an
 * obwohl GAs als log_enabled gespeichert waren. Ursachen:
 *   1. SQLite liefert log_enabled als Integer 0/1, JS-Vergleich !== bool brach
 *   2. API GET-Handler gab log_enabled gar nicht zurueck (jetzt to_dict)
 *
 * Diese Tests stellen sicher dass die UI mit beiden Wertformen umgeht
 * (true und 1 als Truthy) und dass der Filter tatsaechlich filtert.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import "../src/components/knx-addresses-view.js";
import type { KnxAddressesView } from "../src/components/knx-addresses-view.js";
import type { ApiClient, KnxAddressDto } from "../src/api-client.js";

function makeAddr(overrides: Partial<KnxAddressDto> = {}): KnxAddressDto {
  return {
    address: "0/0/1",
    label: "Test",
    dpt: null,
    description: null,
    log_enabled: false,
    log_severity: "info",
    severity_on_true: null,
    severity_on_false: null,
    ...overrides,
  };
}

function makeApi(items: KnxAddressDto[]): ApiClient {
  return {
    listKnxAddresses: vi.fn(async () => items),
    upsertKnxAddress: vi.fn(async (patch: KnxAddressDto) => patch),
    discoverKnxFromProject: vi.fn(async () => ({ items: [], status: "ok" })),
  } as unknown as ApiClient;
}

async function mount(items: KnxAddressDto[]): Promise<KnxAddressesView> {
  const el = document.createElement("knx-addresses-view") as KnxAddressesView;
  el.api = makeApi(items);
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

function visibleAddresses(el: KnxAddressesView): string[] {
  const rows = el.shadowRoot!.querySelectorAll("table tbody tr");
  return Array.from(rows).map((r) => r.querySelector("td")?.textContent?.trim() || "");
}

async function setOnlyEnabled(el: KnxAddressesView, on: boolean): Promise<void> {
  const cb = el.shadowRoot!.querySelector(
    'input[type="checkbox"]',
  ) as HTMLInputElement;
  cb.checked = on;
  cb.dispatchEvent(new Event("change", { bubbles: true }));
  await el.updateComplete;
}

describe("knx-addresses-view filter 'nur aktive'", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("zeigt alle Eintraege wenn Filter aus", async () => {
    const el = await mount([
      makeAddr({ address: "0/0/1", log_enabled: true }),
      makeAddr({ address: "0/0/2", log_enabled: false }),
    ]);
    const addrs = visibleAddresses(el);
    expect(addrs).toContain("0/0/1");
    expect(addrs).toContain("0/0/2");
  });

  it("zeigt nur aktive wenn Filter an (Boolean-Werte)", async () => {
    const el = await mount([
      makeAddr({ address: "0/0/1", log_enabled: true }),
      makeAddr({ address: "0/0/2", log_enabled: false }),
    ]);
    await setOnlyEnabled(el, true);
    const addrs = visibleAddresses(el);
    expect(addrs).toContain("0/0/1");
    expect(addrs).not.toContain("0/0/2");
  });

  it("erkennt Integer 1 / 0 als log_enabled (SQLite-Format)", async () => {
    // Regression: SQLite-Backend liefert via JSON 0/1 als Integer
    // statt true/false. Der Filter muss Truthy-Logik nutzen.
    const items = [
      { ...makeAddr({ address: "0/0/1" }), log_enabled: 1 as unknown as boolean },
      { ...makeAddr({ address: "0/0/2" }), log_enabled: 0 as unknown as boolean },
    ];
    const el = await mount(items);
    await setOnlyEnabled(el, true);
    const addrs = visibleAddresses(el);
    expect(addrs).toContain("0/0/1");
    expect(addrs).not.toContain("0/0/2");
  });

  it("zeigt leere Liste wenn keine GA aktiv ist", async () => {
    const el = await mount([
      makeAddr({ address: "0/0/1", log_enabled: false }),
      makeAddr({ address: "0/0/2", log_enabled: false }),
    ]);
    await setOnlyEnabled(el, true);
    expect(visibleAddresses(el)).toEqual([]);
  });
});
