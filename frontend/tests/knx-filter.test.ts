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
    // Iter 53: Default ist jetzt "nur aktive"=true. Tests, die alle
    // Eintraege sehen wollen, schalten explizit aus.
    try {
      localStorage.removeItem("messagehub.knx-addresses.only-enabled");
    } catch {
      // ignore
    }
  });

  it("zeigt alle Eintraege wenn Filter aus", async () => {
    const el = await mount([
      makeAddr({ address: "0/0/1", log_enabled: true }),
      makeAddr({ address: "0/0/2", log_enabled: false }),
    ]);
    // Iter 53: Default ist on -> explizit ausschalten
    await setOnlyEnabled(el, false);
    const addrs = visibleAddresses(el);
    expect(addrs).toContain("0/0/1");
    expect(addrs).toContain("0/0/2");
  });

  it("zeigt nur aktive wenn Filter an (Boolean-Werte)", async () => {
    const el = await mount([
      makeAddr({ address: "0/0/1", log_enabled: true }),
      makeAddr({ address: "0/0/2", log_enabled: false }),
    ]);
    // Default ist on — Filter braucht nicht extra geschaltet werden
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
    const addrs = visibleAddresses(el);
    expect(addrs).toContain("0/0/1");
    expect(addrs).not.toContain("0/0/2");
  });

  it("zeigt leere Liste wenn keine GA aktiv ist", async () => {
    const el = await mount([
      makeAddr({ address: "0/0/1", log_enabled: false }),
      makeAddr({ address: "0/0/2", log_enabled: false }),
    ]);
    // Default-Filter ist on; beide inaktiv -> leer
    expect(visibleAddresses(el)).toEqual([]);
  });

  it("Iter 53: Default-Filter ist 'nur aktive' beim ersten Aufruf", async () => {
    const el = await mount([
      makeAddr({ address: "0/0/1", log_enabled: true }),
      makeAddr({ address: "0/0/2", log_enabled: false }),
    ]);
    const cb = el.shadowRoot!.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it("Iter 53: Persistiert den Filter-Status in localStorage", async () => {
    const el = await mount([makeAddr({ address: "0/0/1", log_enabled: true })]);
    await setOnlyEnabled(el, false);
    expect(localStorage.getItem("messagehub.knx-addresses.only-enabled")).toBe("0");
    await setOnlyEnabled(el, true);
    expect(localStorage.getItem("messagehub.knx-addresses.only-enabled")).toBe("1");
  });

  it("Iter 53: Filtert ETS-Platzhalter-Labels (z. B. '------')", async () => {
    const el = await mount([
      makeAddr({ address: "0/0/1", log_enabled: false, label: "Echtes Label" }),
      makeAddr({ address: "0/0/2", log_enabled: false, label: "----------" }),
      makeAddr({ address: "0/0/3", log_enabled: false, label: "  --- ---  " }),
    ]);
    // Filter "nur aktive" muss aus, sonst sehen wir nichts (alle false).
    await setOnlyEnabled(el, false);
    const addrs = visibleAddresses(el);
    expect(addrs).toContain("0/0/1");
    expect(addrs).not.toContain("0/0/2");
    expect(addrs).not.toContain("0/0/3");
  });

  it("Iter 53: Aktive GAs werden NICHT als Platzhalter ausgeblendet", async () => {
    // User hat eine "----"-GA bewusst aktiv geschaltet -> behalten.
    const el = await mount([
      makeAddr({ address: "0/0/1", log_enabled: true, label: "----------" }),
    ]);
    await setOnlyEnabled(el, false);
    expect(visibleAddresses(el)).toContain("0/0/1");
  });
});

describe("knx-addresses-view Iter 54 (N2): Toggle-On-Severity-Default", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.knx-addresses.only-enabled");
    } catch {
      // ignore
    }
  });

  async function mountWithCapture(items: KnxAddressDto[]): Promise<{
    el: KnxAddressesView;
    upsertCalls: KnxAddressDto[];
  }> {
    const upsertCalls: KnxAddressDto[] = [];
    const api = {
      listKnxAddresses: vi.fn(async () => items),
      upsertKnxAddress: vi.fn(async (patch: KnxAddressDto) => {
        upsertCalls.push(patch);
        return patch;
      }),
      discoverKnxFromProject: vi.fn(async () => ({ items: [], status: "ok" })),
    } as unknown as ApiClient;
    const el = document.createElement("knx-addresses-view") as KnxAddressesView;
    el.api = api;
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    return { el, upsertCalls };
  }

  async function clickToggle(el: KnxAddressesView): Promise<void> {
    // Toggle-Switch in der Tabellenzeile (input type=checkbox in tbody)
    const toggle = el.shadowRoot!.querySelector(
      "tbody input[type=checkbox]"
    ) as HTMLInputElement;
    toggle.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }

  it("setzt severity auf 'warning' beim Aktivieren wenn vorher 'info'", async () => {
    const { el, upsertCalls } = await mountWithCapture([
      makeAddr({ address: "0/0/1", log_enabled: false, log_severity: "info" }),
    ]);
    // Damit wir die inaktive GA sehen, Filter ausschalten
    await setOnlyEnabled(el, false);
    await clickToggle(el);
    expect(upsertCalls.length).toBe(1);
    expect(upsertCalls[0].log_enabled).toBe(true);
    expect(upsertCalls[0].log_severity).toBe("warning");
  });

  it("behaelt severity unveraendert beim Aktivieren wenn vorher 'error'", async () => {
    const { el, upsertCalls } = await mountWithCapture([
      makeAddr({ address: "0/0/1", log_enabled: false, log_severity: "error" }),
    ]);
    await setOnlyEnabled(el, false);
    await clickToggle(el);
    expect(upsertCalls[0].log_severity).toBe("error");
  });

  it("behaelt severity beim Deaktivieren ('warning' -> 'warning')", async () => {
    const { el, upsertCalls } = await mountWithCapture([
      makeAddr({ address: "0/0/1", log_enabled: true, log_severity: "warning" }),
    ]);
    // Default-Filter on zeigt schon die aktive GA
    await clickToggle(el);
    expect(upsertCalls[0].log_enabled).toBe(false);
    // Severity bleibt "warning" — User hat sie bewusst gewaehlt
    expect(upsertCalls[0].log_severity).toBe("warning");
  });
});
