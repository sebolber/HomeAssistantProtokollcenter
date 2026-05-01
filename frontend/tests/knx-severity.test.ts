import { describe, it, expect, vi, beforeEach } from "vitest";
import "../src/components/knx-addresses-view.js";
import type { KnxAddressesView } from "../src/components/knx-addresses-view.js";
import type { ApiClient, KnxAddressDto } from "../src/api-client.js";

function makeAddr(overrides: Partial<KnxAddressDto> = {}): KnxAddressDto {
  return {
    address: "1/2/3",
    label: "Wohnzimmer Licht",
    dpt: "1.001",
    description: null,
    log_enabled: true,
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

async function mount(items: KnxAddressDto[]): Promise<{ el: KnxAddressesView; api: ApiClient }> {
  const api = makeApi(items);
  const el = document.createElement("knx-addresses-view") as KnxAddressesView;
  el.api = api;
  document.body.appendChild(el);
  await el.updateComplete;
  // firstUpdated triggert _load asynchron
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return { el, api };
}

describe("knx-addresses-view severity inline edit", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("rendert die Severity-Pille als klickbaren Trigger fuer aktive GAs", async () => {
    const { el } = await mount([makeAddr({ log_enabled: true, log_severity: "info" })]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger");
    expect(trigger).not.toBeNull();
    expect(trigger!.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("rendert keinen Trigger fuer inaktive GAs (log_enabled=false)", async () => {
    const { el } = await mount([makeAddr({ log_enabled: false })]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger");
    expect(trigger).toBeNull();
  });

  it("oeffnet das Popover beim Click auf die Pille", async () => {
    const { el } = await mount([makeAddr({ log_severity: "info" })]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".sev-popover")).not.toBeNull();
    // 5 Optionen: debug, info, warning, error, auto
    const options = el.shadowRoot!.querySelectorAll(".sev-option");
    expect(options.length).toBe(5);
  });

  it("ruft upsertKnxAddress mit neuer Severity auf wenn andere Option gewaehlt wird", async () => {
    const item = makeAddr({ address: "5/0/1", log_severity: "info" });
    const { el, api } = await mount([item]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;
    // Reihenfolge: debug, info, warning, error, auto
    const errorOption = el.shadowRoot!.querySelectorAll(".sev-option")[3] as HTMLButtonElement;
    errorOption.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));

    expect(api.upsertKnxAddress).toHaveBeenCalledTimes(1);
    const call = (api.upsertKnxAddress as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.address).toBe("5/0/1");
    expect(call.log_severity).toBe("error");
  });

  it("setzt T/F-Defaults beim Wechsel auf 'auto', wenn noch leer", async () => {
    const item = makeAddr({
      log_severity: "info",
      severity_on_true: null,
      severity_on_false: null,
    });
    const { el, api } = await mount([item]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;
    const autoOption = el.shadowRoot!.querySelectorAll(".sev-option")[4] as HTMLButtonElement;
    autoOption.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));

    const call = (api.upsertKnxAddress as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.log_severity).toBe("auto");
    expect(call.severity_on_true).toBe("warning");
    expect(call.severity_on_false).toBe("info");
  });

  it("ruft die API nicht auf, wenn die aktuelle Severity gewaehlt wird", async () => {
    const item = makeAddr({ log_severity: "warning" });
    const { el, api } = await mount([item]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;
    const active = el.shadowRoot!.querySelector(".sev-option.active") as HTMLButtonElement;
    expect(active).not.toBeNull();
    active.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));

    expect(api.upsertKnxAddress).not.toHaveBeenCalled();
    expect(el.shadowRoot!.querySelector(".sev-popover")).toBeNull();
  });

  it("schliesst das Popover beim Click auf den Backdrop", async () => {
    const { el } = await mount([makeAddr()]);
    const trigger = el.shadowRoot!.querySelector("button.sev-trigger") as HTMLButtonElement;
    trigger.click();
    await el.updateComplete;
    const backdrop = el.shadowRoot!.querySelector(".sev-backdrop") as HTMLElement;
    expect(backdrop).not.toBeNull();
    backdrop.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".sev-popover")).toBeNull();
  });
});
