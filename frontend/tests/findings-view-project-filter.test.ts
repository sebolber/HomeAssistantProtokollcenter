// Iter 26 (knx-findings): Filter "Nur Projekt-Befunde" in findings-view.
//
// Vertrag aus docs/messagehub_knx_konfigurationsfehler_recherche.md §9.9
// Iter 26. Test-zuerst-Artefakt:
// `test_findings_filter_excludes_runtime_only_findings`.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/findings-view.js";
import type {
  ApiClient,
  FindingDto,
  FindingsListResponse,
} from "../src/api-client.js";
import { isProjectRelated } from "../src/utils/findings-i18n.js";

function _finding(overrides: Partial<FindingDto> = {}): FindingDto {
  return {
    code: "PATTERN_CONSTANT_VALUE",
    schema_version: 1,
    severity: "warning",
    ga: "1/2/3",
    source: "1.1.5",
    title: "",
    description: "",
    evidence: {},
    first_seen: "2026-05-03T08:00:00+00:00",
    last_seen: "2026-05-03T08:00:00+00:00",
    occurrence_count: 1,
    detector_version: "PATTERN_CONSTANT_VALUE/v1",
    ...overrides,
  };
}

function makeApi(items: FindingDto[]): ApiClient {
  return {
    listFindings: vi.fn(
      async (): Promise<FindingsListResponse> => ({
        items,
        total: items.length,
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

describe("isProjectRelated (Iter 26 helper)", () => {
  it("klassifiziert DPT_MISMATCH als Projekt-Befund", () => {
    expect(isProjectRelated("DPT_MISMATCH")).toBe(true);
  });

  it("klassifiziert ORPHAN_GA + STALE_GA als Projekt-Befunde", () => {
    expect(isProjectRelated("ORPHAN_GA")).toBe(true);
    expect(isProjectRelated("STALE_GA")).toBe(true);
  });

  it("klassifiziert Laufzeit-Codes als nicht-Projekt", () => {
    expect(isProjectRelated("PATTERN_CONSTANT_VALUE")).toBe(false);
    expect(isProjectRelated("MULTI_RESPONDER")).toBe(false);
    expect(isProjectRelated("READ_NO_RESPONSE")).toBe(false);
    expect(isProjectRelated("TOGGLE_LOOP")).toBe(false);
    expect(isProjectRelated("HEALTH_BUSLOAD")).toBe(false);
  });
});

describe("findings-view Iter 26: Projekt-Filter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("test_findings_filter_excludes_runtime_only_findings", async () => {
    // Arrange — 2 Projekt-Findings + 3 Laufzeit-Findings.
    const api = makeApi([
      _finding({ code: "DPT_MISMATCH", ga: "1/2/3", severity: "error" }),
      _finding({ code: "ORPHAN_GA", ga: "1/2/4", severity: "info" }),
      _finding({ code: "PATTERN_CONSTANT_VALUE", ga: "1/2/5" }),
      _finding({ code: "READ_NO_RESPONSE", ga: "1/2/6" }),
      _finding({ code: "TOGGLE_LOOP", ga: "1/2/7", severity: "error" }),
    ]);
    const el = await mount(api);

    // Act — Filter aktivieren
    const toggle = el.shadowRoot!.querySelector(
      "[data-test='findings-project-only-toggle']"
    ) as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

    // Assert — nur DPT_MISMATCH + ORPHAN_GA gerendert.
    const items = el.shadowRoot!.querySelectorAll(
      "[data-test='findings-item']"
    );
    expect(items.length).toBe(2);
    const codes = Array.from(items).map(
      (item) =>
        item.querySelector("[data-test='item-code']")?.getAttribute("title")
    );
    expect(codes.sort()).toEqual(["DPT_MISMATCH", "ORPHAN_GA"]);
  });

  it("Filter aus -> alle Findings sichtbar", async () => {
    // Arrange
    const api = makeApi([
      _finding({ code: "DPT_MISMATCH", ga: "1/2/3" }),
      _finding({ code: "PATTERN_CONSTANT_VALUE", ga: "1/2/4" }),
    ]);
    const el = await mount(api);

    // Act — Filter ist standardmaessig aus
    const items = el.shadowRoot!.querySelectorAll(
      "[data-test='findings-item']"
    );

    // Assert
    expect(items.length).toBe(2);
  });

  it("Total zeigt 'gefiltert / total'-Zaehler", async () => {
    // Arrange
    const api = makeApi([
      _finding({ code: "DPT_MISMATCH", ga: "1/2/3" }),
      _finding({ code: "PATTERN_CONSTANT_VALUE", ga: "1/2/4" }),
      _finding({ code: "READ_NO_RESPONSE", ga: "1/2/5" }),
    ]);
    const el = await mount(api);
    const toggle = el.shadowRoot!.querySelector(
      "[data-test='findings-project-only-toggle']"
    ) as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

    // Assert — "1 / 3 Findings"
    const total = el.shadowRoot!.querySelector(
      "[data-test='findings-total']"
    ) as HTMLElement;
    expect(total.textContent).toContain("1");
    expect(total.textContent).toContain("3");
  });
});
