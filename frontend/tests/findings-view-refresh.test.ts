// Iter 29a (knx-findings): findings-view "Aktualisieren"-Button.
//
// Vertrag: Klick auf den Button ruft `refreshFindings(ga)` fuer jede
// GA aus dem aktuellen Filter; danach wird die Liste neu geladen.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/findings-view.js";
import type {
  ApiClient,
  FindingDto,
  FindingsListResponse,
} from "../src/api-client.js";

function _finding(overrides: Partial<FindingDto> = {}): FindingDto {
  return {
    code: "DPT_MISMATCH",
    schema_version: 1,
    severity: "error",
    ga: "1/2/3",
    source: "1.1.5",
    title: "DPT-Mismatch",
    description: "Soll 9.001, Ist 1.001",
    evidence: { project_dpt: "9.001", inferred_dpt: "1.001", confidence: 0.94 },
    first_seen: "2026-05-03T08:00:00+00:00",
    last_seen: "2026-05-03T08:30:00+00:00",
    occurrence_count: 1,
    detector_version: "DPT_MISMATCH/v1",
    ...overrides,
  };
}

function makeApi(items: FindingDto[]): ApiClient {
  const api = {
    listFindings: vi.fn(
      async (): Promise<FindingsListResponse> => ({
        items,
        total: items.length,
        limit: 50,
        offset: 0,
      })
    ),
    refreshFindings: vi.fn(async (ga: string) => ({
      ga,
      period_days: 7,
      findings_recorded: 1,
    })),
    acknowledgeFinding: vi.fn(async () => ({ acknowledged: true })),
  } as unknown as ApiClient;
  return api;
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

describe("findings-view Iter 29a: Aktualisieren-Button", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("ruft refreshFindings fuer jede GA aus dem Filter", async () => {
    const items = [
      _finding({ ga: "1/2/3" }),
      _finding({ ga: "1/2/4", code: "VALUE_OUT_OF_RANGE" }),
    ];
    const api = makeApi(items);
    const el = await mount(api);
    const btn = el.shadowRoot!.querySelector(
      "[data-test='findings-refresh-btn']"
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    await new Promise((r) => setTimeout(r, 50));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(api.refreshFindings).toHaveBeenCalledTimes(2);
    const calls = (api.refreshFindings as unknown as { mock: { calls: unknown[][] } })
      .mock.calls;
    const gas = calls.map((c) => c[0]);
    expect(gas).toContain("1/2/3");
    expect(gas).toContain("1/2/4");
  });

  it("dedupliziert duplicate GAs", async () => {
    const items = [
      _finding({ ga: "1/2/3", code: "DPT_MISMATCH" }),
      _finding({ ga: "1/2/3", code: "VALUE_OUT_OF_RANGE" }),
    ];
    const api = makeApi(items);
    const el = await mount(api);
    const btn = el.shadowRoot!.querySelector(
      "[data-test='findings-refresh-btn']"
    ) as HTMLButtonElement;
    btn.click();
    await new Promise((r) => setTimeout(r, 50));
    expect(api.refreshFindings).toHaveBeenCalledTimes(1);
  });

  it("laedt die Liste nach Refresh neu", async () => {
    const api = makeApi([_finding()]);
    const el = await mount(api);
    const btn = el.shadowRoot!.querySelector(
      "[data-test='findings-refresh-btn']"
    ) as HTMLButtonElement;
    btn.click();
    await new Promise((r) => setTimeout(r, 50));
    expect(api.listFindings).toHaveBeenCalledTimes(2); // initial + nach Refresh
  });

  it("zeigt Fehlermeldung, wenn keine GA im Filter ist", async () => {
    // Nur bus-weite Findings (ga=null).
    const api = makeApi([_finding({ ga: null, code: "HEALTH_BUSLOAD" })]);
    const el = await mount(api);
    const btn = el.shadowRoot!.querySelector(
      "[data-test='findings-refresh-btn']"
    ) as HTMLButtonElement;
    btn.click();
    await new Promise((r) => setTimeout(r, 50));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(api.refreshFindings).not.toHaveBeenCalled();
    const error = el.shadowRoot!.querySelector("[data-test='findings-error']");
    expect(error).not.toBeNull();
  });
});
