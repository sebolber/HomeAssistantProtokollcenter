// Iter UX-2 + Iter D2: Selection-Eindeutigkeit + gemeinsame mh-drawer-
// Komponente. Drawer ist jetzt das wiederverwendbare ``<mh-drawer>``
// (siehe components/mh-drawer.ts), gerendert via slotted Content.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/findings-view.js";
import type { ApiClient, FindingDto, FindingsListResponse } from "../src/api-client.js";

function findOpenDrawer(host: HTMLElement): HTMLElement | null {
  // <mh-drawer> rendert nur, wenn open=true. Sein Shadow-DOM enthaelt
  // [data-test="mh-drawer"]. Wir suchen vom findings-view aus per
  // Slot-Path.
  const drawerEl = host.shadowRoot?.querySelector("mh-drawer") ?? null;
  if (!drawerEl) return null;
  const aside = drawerEl.shadowRoot?.querySelector<HTMLElement>(
    '[data-test="mh-drawer"]',
  );
  return aside ?? null;
}

function findBackdrop(host: HTMLElement): HTMLElement | null {
  const drawerEl = host.shadowRoot?.querySelector("mh-drawer") ?? null;
  return (
    drawerEl?.shadowRoot?.querySelector<HTMLElement>(
      '[data-test="mh-drawer-backdrop"]',
    ) ?? null
  );
}


function makeFinding(overrides: Partial<FindingDto>): FindingDto {
  return {
    code: "RECONNECT_STORM",
    schema_version: 1,
    severity: "warning",
    ga: null,
    source: "1.1.10",
    title: "",
    description: "",
    evidence: {},
    first_seen: "2026-05-04T06:06:45",
    last_seen: "2026-05-04T06:06:45",
    occurrence_count: 1,
    detector_version: "RECONNECT_STORM/v1",
    acknowledged: false,
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
      }),
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
  for (let i = 0; i < 6; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
  return el;
}

async function settle(el: HTMLElement): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await (el as HTMLElement & { updateComplete: Promise<unknown> })
      .updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe("findings-view UX-2 — selection & drawer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Klick markiert NUR den geklickten Eintrag (Iter UX-2 Bug 1)", async () => {
    // Drei bus-weite RECONNECT_STORM-Findings mit gleichem code + ga=null
    // + gleichem last_seen, aber unterschiedlicher Source — frueher
    // kollidierte _itemKey und alle wurden markiert.
    const items = [
      makeFinding({ source: "1.1.133" }),
      makeFinding({ source: "1.1.140" }),
      makeFinding({ source: "1.1.220" }),
    ];
    const el = await mount(makeApi(items));

    const rows = el.shadowRoot!.querySelectorAll(".item");
    expect(rows.length).toBe(3);

    (rows[0] as HTMLElement).click();
    await settle(el);

    const selected = el.shadowRoot!.querySelectorAll(".item.item--selected");
    expect(selected.length).toBe(1);
    // Klick auf zweiten -> nur der zweite ist selected
    (rows[1] as HTMLElement).click();
    await settle(el);
    const selected2 = el.shadowRoot!.querySelectorAll(".item.item--selected");
    expect(selected2.length).toBe(1);
  });

  it("Detail-Pane oeffnet sich als rechts-fixed Drawer mit Backdrop (Iter UX-2 Bug 2)", async () => {
    const items = [makeFinding({ source: "1.1.133" })];
    const el = await mount(makeApi(items));

    const row = el.shadowRoot!.querySelector(".item") as HTMLElement;
    row.click();
    await settle(el);

    // Iter D2: Drawer ist jetzt <mh-drawer>; sein Shadow-DOM enthaelt
    // den eigentlichen Drawer + Backdrop.
    const drawer = findOpenDrawer(el);
    expect(drawer).not.toBeNull();
    const backdrop = findBackdrop(el);
    expect(backdrop).not.toBeNull();
  });

  it("Backdrop-Klick schliesst Drawer (Iter UX-2 Bug 2)", async () => {
    const items = [makeFinding({ source: "1.1.133" })];
    const el = await mount(makeApi(items));
    const row = el.shadowRoot!.querySelector(".item") as HTMLElement;
    row.click();
    await settle(el);

    const backdrop = findBackdrop(el)!;
    backdrop.click();
    await settle(el);
    expect(findOpenDrawer(el)).toBeNull();
    expect(
      el.shadowRoot!.querySelector(".item.item--selected"),
    ).toBeNull();
  });

  it("Escape schliesst Drawer (Iter UX-2 Bug 2)", async () => {
    const items = [makeFinding({ source: "1.1.133" })];
    const el = await mount(makeApi(items));
    const row = el.shadowRoot!.querySelector(".item") as HTMLElement;
    row.click();
    await settle(el);
    expect(findOpenDrawer(el)).not.toBeNull();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await settle(el);
    expect(findOpenDrawer(el)).toBeNull();
  });

  it("Detail-Pane zeigt korrekte Source des angeklickten Eintrags", async () => {
    const items = [
      makeFinding({ source: "1.1.133" }),
      makeFinding({ source: "1.1.140" }),
      makeFinding({ source: "1.1.220" }),
    ];
    const el = await mount(makeApi(items));
    const rows = el.shadowRoot!.querySelectorAll(".item");
    (rows[1] as HTMLElement).click();
    await settle(el);
    // Iter D2: Inhalt sitzt im Slot des <mh-drawer>; also pruefen wir
    // den findings-view-internen Detail-Block.
    const detail = el.shadowRoot!.querySelector('[data-test="findings-detail"]');
    expect(detail?.textContent ?? "").toContain("1.1.140");
  });
});
