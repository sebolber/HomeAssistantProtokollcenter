// Iter 27 (knx-findings): CRUD-Flow fuer Severity-Override-Form.
//
// Test-zuerst-Artefakt aus §9.9 Iter 27.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/severity-override-form.js";
import type {
  ApiClient,
  SeverityOverrideItemDto,
  SeverityOverridesResponse,
} from "../src/api-client.js";

function _override(
  overrides: Partial<SeverityOverrideItemDto> = {}
): SeverityOverrideItemDto {
  return {
    code: "DPT_MISMATCH",
    default_severity: "error",
    override_severity: null,
    note: null,
    updated_at: null,
    ...overrides,
  };
}

function makeApi(
  items: SeverityOverrideItemDto[]
): ApiClient {
  return {
    listSeverityOverrides: vi.fn(
      async (): Promise<SeverityOverridesResponse> => ({
        items,
        total: items.length,
      })
    ),
    setSeverityOverride: vi.fn(async () => ({ ok: true })),
    clearSeverityOverride: vi.fn(async () => ({ cleared: true })),
  } as unknown as ApiClient;
}

async function mount(api: ApiClient): Promise<HTMLElement> {
  const el = document.createElement("severity-override-form") as HTMLElement & {
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

describe("severity-override-form CRUD", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("rendert eine Tabelle mit allen bekannten Codes", async () => {
    const api = makeApi([
      _override({ code: "DPT_MISMATCH", default_severity: "error" }),
      _override({ code: "MULTI_RESPONDER", default_severity: "warning" }),
      _override({ code: "SEND_CYCLE_DRIFT", default_severity: "info" }),
    ]);
    const el = await mount(api);
    const rows = el.shadowRoot!.querySelectorAll("[data-test='override-row']");
    expect(rows.length).toBe(3);
  });

  it("setzt einen Override beim Aendern des Selects", async () => {
    const api = makeApi([
      _override({ code: "DPT_MISMATCH", default_severity: "error" }),
    ]);
    const el = await mount(api);
    const select = el.shadowRoot!.querySelector(
      "[data-test='override-select']"
    ) as HTMLSelectElement;
    select.value = "warning";
    select.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 50));
    expect(api.setSeverityOverride).toHaveBeenCalledWith(
      "DPT_MISMATCH",
      "warning"
    );
  });

  it("loescht den Override beim Wechsel auf '— Default —'", async () => {
    const api = makeApi([
      _override({
        code: "DPT_MISMATCH",
        default_severity: "error",
        override_severity: "warning",
      }),
    ]);
    const el = await mount(api);
    const select = el.shadowRoot!.querySelector(
      "[data-test='override-select']"
    ) as HTMLSelectElement;
    select.value = "_default";
    select.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 50));
    expect(api.clearSeverityOverride).toHaveBeenCalledWith("DPT_MISMATCH");
  });

  it("zeigt Default-Pill in der entsprechenden Farbe", async () => {
    const api = makeApi([
      _override({ code: "DPT_MISMATCH", default_severity: "error" }),
      _override({ code: "MULTI_RESPONDER", default_severity: "warning" }),
    ]);
    const el = await mount(api);
    const pills = el.shadowRoot!.querySelectorAll(".mh-pill");
    expect(pills[0].classList.contains("mh-pill--error")).toBe(true);
    expect(pills[1].classList.contains("mh-pill--warning")).toBe(true);
  });

  it("zeigt Fehlermeldung, wenn API fehlschlaegt", async () => {
    const api = {
      listSeverityOverrides: vi.fn(async () => {
        throw new Error("HTTP 500");
      }),
    } as unknown as ApiClient;
    const el = await mount(api);
    const error = el.shadowRoot!.querySelector("[data-test='override-error']");
    expect(error).not.toBeNull();
  });

  it("laedt die Liste nach erfolgreichem Set-Override neu", async () => {
    const api = makeApi([
      _override({ code: "DPT_MISMATCH", default_severity: "error" }),
    ]);
    const el = await mount(api);
    const select = el.shadowRoot!.querySelector(
      "[data-test='override-select']"
    ) as HTMLSelectElement;
    select.value = "warning";
    select.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 50));
    // initial + nach Set
    expect(api.listSeverityOverrides).toHaveBeenCalledTimes(2);
  });
});
