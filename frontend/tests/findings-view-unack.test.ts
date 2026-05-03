// F-004: Tests fuer Unack-Knopf im findings-view (Detail-Pane).

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/findings-view.js";
import type { ApiClient, FindingDto, FindingsListResponse } from "../src/api-client.js";

function findingFromOverrides(overrides: Partial<FindingDto> = {}): FindingDto {
  return {
    code: "DPT_MISMATCH",
    schema_version: 1,
    severity: "warning",
    ga: "1/2/3",
    source: "1.1.5",
    title: "DPT mismatch",
    description: "DPT does not match project",
    evidence: { project_dpt: "9.001", inferred_dpt: "1.001" },
    first_seen: "2026-05-01T08:00:00Z",
    last_seen: "2026-05-03T08:00:00Z",
    occurrence_count: 12,
    detector_version: "DPT_MISMATCH/v1",
    acknowledged: false,
    ...overrides,
  };
}

function makeApi(items: FindingDto[], overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    listFindings: vi.fn(async (): Promise<FindingsListResponse> => ({
      items,
      total: items.length,
      limit: 50,
      offset: 0,
    })),
    acknowledgeFinding: vi.fn(),
    unacknowledgeFinding: vi.fn(async () => undefined),
    refreshFindings: vi.fn(),
    exportFindingsMarkdown: vi.fn(async () => ""),
    ...overrides,
  } as unknown as ApiClient;
}

async function mount(api: ApiClient): Promise<HTMLElement> {
  const el = document.createElement("findings-view") as HTMLElement & {
    api?: ApiClient;
    updateComplete: Promise<unknown>;
  };
  (el as { api?: ApiClient }).api = api;
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

function btnByText(root: ShadowRoot, label: RegExp): HTMLButtonElement | null {
  return Array.from(root.querySelectorAll("button")).find((b) =>
    label.test((b.textContent ?? "").trim())
  ) ?? null;
}

describe("F-004 Findings-Unack", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Unacked Finding zeigt im Detail-Pane einen 'Ack'-Button", async () => {
    const el = await mount(makeApi([findingFromOverrides({ acknowledged: false })]));
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    // Item klicken -> Detail-Pane oeffnet
    const item = root.querySelector("li.item") as HTMLLIElement;
    item.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(btnByText(root, /^Ack$/)).toBeTruthy();
    expect(btnByText(root, /Unack|Ack zur/)).toBeFalsy();
  });

  it("Acked Finding zeigt im Detail-Pane einen 'Unack'-Button statt 'Ack'", async () => {
    const el = await mount(makeApi([findingFromOverrides({ acknowledged: true })]));
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const item = root.querySelector("li.item") as HTMLLIElement;
    item.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(btnByText(root, /Ack zur|Unack/)).toBeTruthy();
    expect(btnByText(root, /^Ack$/)).toBeFalsy();
  });

  it("Acked Items zeigen einen visuellen Indikator in der Liste", async () => {
    const el = await mount(
      makeApi([
        findingFromOverrides({ ga: "1/2/3", acknowledged: true }),
        findingFromOverrides({ ga: "1/2/4", acknowledged: false }),
      ])
    );
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const items = root.querySelectorAll("li.item");
    // Mindestens das acked Item hat eine acked-Klasse oder ein Marker-Element
    const ackedItem = Array.from(items).find((it) =>
      it.querySelector('[data-test="item-acked-marker"]') ||
      it.classList.contains("item--acked")
    );
    expect(ackedItem).toBeTruthy();
  });

  it("Klick auf 'Unack' ruft api.unacknowledgeFinding(ga, code)", async () => {
    const api = makeApi([
      findingFromOverrides({ ga: "1/2/3", code: "DPT_MISMATCH", acknowledged: true }),
    ]);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    (root.querySelector("li.item") as HTMLLIElement).click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const unack = btnByText(root, /Ack zur|Unack/);
    expect(unack).toBeTruthy();
    unack!.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.unacknowledgeFinding).toHaveBeenCalledWith("1/2/3", "DPT_MISMATCH");
  });

  it("Bus-weite Findings (ga=null) zeigen weder Ack noch Unack", async () => {
    const el = await mount(
      makeApi([findingFromOverrides({ ga: null, acknowledged: false })])
    );
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    (root.querySelector("li.item") as HTMLLIElement).click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const ack = btnByText(root, /^Ack$/);
    const unack = btnByText(root, /Ack zur|Unack/);
    // Backend verbietet Ack fuer ga=null. Ack-Button darf sichtbar sein
    // (mit disabled), Unack darf nicht erscheinen.
    if (ack) expect(ack.disabled).toBe(true);
    expect(unack).toBeFalsy();
  });
});
