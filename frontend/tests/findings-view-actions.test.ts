// Iter 10 (knx-findings): findings-view End-to-End mit Items + Ack-Flow.
//
// Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.9
// Iter 10. Test-zuerst-Artefakt fuer den Ack-Flow + Detail-Pane.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/findings-view.js";
import type {
  ApiClient,
  FindingDto,
  FindingsListResponse,
} from "../src/api-client.js";

function _finding(overrides: Partial<FindingDto> = {}): FindingDto {
  return {
    code: "PATTERN_CONSTANT_VALUE",
    schema_version: 1,
    severity: "warning",
    ga: "1/2/3",
    source: "1.1.220",
    title: "Konstant-Wert-Spam",
    description: "Sensor sendet konstanten Wert.",
    evidence: { samples: 15, value: "0.0", legacy_text: "Sensor stumm" },
    first_seen: "2026-05-03T08:00:00+00:00",
    last_seen: "2026-05-03T08:30:00+00:00",
    occurrence_count: 3,
    detector_version: "PATTERN_CONSTANT_VALUE/v1",
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
    acknowledgeFinding: vi.fn(async () => ({ acknowledged: true })),
    unacknowledgeFinding: vi.fn(async () => ({ acknowledged: false })),
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

describe("findings-view Iter 10: Item-Rendering", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("rendert pro Finding eine Zeile mit Severity-Pill + Code + GA", async () => {
    const api = makeApi([_finding()]);
    const el = await mount(api);
    const items = el.shadowRoot!.querySelectorAll("[data-test='findings-item']");
    expect(items.length).toBe(1);
    const pill = items[0].querySelector(".mh-pill");
    expect(pill).not.toBeNull();
    expect(pill?.classList.contains("mh-pill--warning")).toBe(true);
    const codeEl = items[0].querySelector("[data-test='item-code']");
    expect(codeEl?.textContent).toContain("PATTERN_CONSTANT_VALUE");
    const gaEl = items[0].querySelector("[data-test='item-ga']");
    expect(gaEl?.textContent).toContain("1/2/3");
  });

  it("zeigt Konstant-Wert-Spam (Health/Pattern) als regulaeres Item", async () => {
    const api = makeApi([
      _finding({ code: "PATTERN_CONSTANT_VALUE" }),
    ]);
    const el = await mount(api);
    const items = el.shadowRoot!.querySelectorAll("[data-test='findings-item']");
    expect(items.length).toBe(1);
    expect(
      items[0].querySelector("[data-test='item-code']")?.textContent
    ).toContain("PATTERN_CONSTANT_VALUE");
  });

  it("rendert Severity-Pill in passender Klasse pro Severity", async () => {
    const api = makeApi([
      _finding({ severity: "error", code: "DPT_MISMATCH" }),
      _finding({ severity: "warning", code: "MULTI_RESPONDER", ga: "1/2/4" }),
      _finding({ severity: "info", code: "ORPHAN_GA", ga: "1/2/5" }),
    ]);
    const el = await mount(api);
    const pills = el.shadowRoot!.querySelectorAll(".mh-pill");
    const classes = Array.from(pills).map((p) => p.className);
    expect(classes.some((c) => c.includes("mh-pill--error"))).toBe(true);
    expect(classes.some((c) => c.includes("mh-pill--warning"))).toBe(true);
    expect(classes.some((c) => c.includes("mh-pill--info"))).toBe(true);
  });

  it("zeigt Detail-Pane mit Evidence beim Klick auf eine Zeile", async () => {
    const api = makeApi([_finding()]);
    const el = await mount(api);
    const item = el.shadowRoot!.querySelector(
      "[data-test='findings-item']"
    ) as HTMLElement;
    item.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const detail = el.shadowRoot!.querySelector("[data-test='findings-detail']");
    expect(detail).not.toBeNull();
    // Evidence als KV-Liste sichtbar.
    const detailText = detail?.textContent ?? "";
    expect(detailText).toContain("samples");
    expect(detailText).toContain("15");
  });
});

describe("findings-view Iter 10: Ack-Flow", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("ruft acknowledgeFinding mit (ga, code) beim Klick auf Ack-Button", async () => {
    const api = makeApi([_finding()]);
    const el = await mount(api);
    // Detail-Pane oeffnen, dann Ack-Button druecken.
    const item = el.shadowRoot!.querySelector(
      "[data-test='findings-item']"
    ) as HTMLElement;
    item.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const ackBtn = el.shadowRoot!.querySelector(
      "[data-test='findings-ack-btn']"
    ) as HTMLButtonElement;
    expect(ackBtn).not.toBeNull();
    ackBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(api.acknowledgeFinding).toHaveBeenCalledTimes(1);
    expect(api.acknowledgeFinding).toHaveBeenCalledWith(
      expect.objectContaining({ ga: "1/2/3", code: "PATTERN_CONSTANT_VALUE" })
    );
  });

  it("laedt die Liste nach erfolgreichem Ack neu", async () => {
    const api = makeApi([_finding()]);
    const el = await mount(api);
    const item = el.shadowRoot!.querySelector(
      "[data-test='findings-item']"
    ) as HTMLElement;
    item.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const ackBtn = el.shadowRoot!.querySelector(
      "[data-test='findings-ack-btn']"
    ) as HTMLButtonElement;
    ackBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(api.listFindings).toHaveBeenCalledTimes(2); // initial + nach Ack
  });

  it("zeigt Fehlermeldung, wenn Ack fehlschlaegt", async () => {
    const api = makeApi([_finding()]);
    (api as unknown as { acknowledgeFinding: unknown }).acknowledgeFinding = vi.fn(
      async () => {
        throw new Error("HTTP 500");
      }
    );
    const el = await mount(api);
    const item = el.shadowRoot!.querySelector(
      "[data-test='findings-item']"
    ) as HTMLElement;
    item.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const ackBtn = el.shadowRoot!.querySelector(
      "[data-test='findings-ack-btn']"
    ) as HTMLButtonElement;
    ackBtn.click();
    await new Promise((r) => setTimeout(r, 50));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const error = el.shadowRoot!.querySelector("[data-test='findings-error']");
    expect(error).not.toBeNull();
  });
});
