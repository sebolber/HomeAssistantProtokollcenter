// F-005: Heartbeat-Delete + Enable/Disable-Toggle in heartbeats-view.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/simple-list-view.js";
import type { ApiClient, HeartbeatDto } from "../src/api-client.js";

function makeApi(items: HeartbeatDto[], overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    listHeartbeats: vi.fn(async () => items),
    upsertHeartbeat: vi.fn(),
    deleteHeartbeat: vi.fn(async () => undefined),
    setHeartbeatEnabled: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as ApiClient;
}

async function mount(api: ApiClient): Promise<HTMLElement> {
  const el = document.createElement("heartbeats-view") as HTMLElement & {
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

const items: HeartbeatDto[] = [
  {
    source: "raspi-keller",
    expected_interval_seconds: 3600,
    last_seen: "2026-05-03T08:00:00Z",
    silent_alert_active: false,
    enabled: true,
  },
  {
    source: "router",
    expected_interval_seconds: 600,
    last_seen: null,
    silent_alert_active: true,
    enabled: false,
  },
];

describe("F-005 Heartbeat Lifecycle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    // window.confirm in jsdom -> default true
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("rendert pro Zeile einen 'Loeschen'- und einen 'Pause/Aktivieren'-Knopf", async () => {
    const el = await mount(makeApi(items));
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const rows = root.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
    // Zeile 1 (enabled=true) hat 'Pause' + 'Loeschen'
    const row1Buttons = rows[0].querySelectorAll("button");
    const row1Labels = Array.from(row1Buttons).map((b) => (b.textContent ?? "").trim());
    expect(row1Labels).toContain("Pause");
    expect(row1Labels).toContain("Löschen");
    // Zeile 2 (enabled=false) hat 'Aktivieren' + 'Loeschen'
    const row2Buttons = rows[1].querySelectorAll("button");
    const row2Labels = Array.from(row2Buttons).map((b) => (b.textContent ?? "").trim());
    expect(row2Labels).toContain("Aktivieren");
    expect(row2Labels).toContain("Löschen");
  });

  it("Klick auf 'Loeschen' ruft deleteHeartbeat(source) nach Bestaetigung", async () => {
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const firstRow = root.querySelector("tbody tr") as HTMLTableRowElement;
    const deleteBtn = Array.from(firstRow.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").trim() === "Löschen"
    ) as HTMLButtonElement;
    deleteBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.deleteHeartbeat).toHaveBeenCalledWith("raspi-keller");
  });

  it("Klick auf 'Loeschen' ohne Bestaetigung ruft API NICHT", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const deleteBtn = Array.from(
      root.querySelectorAll("tbody tr:first-child button")
    ).find((b) => (b.textContent ?? "").trim() === "Löschen") as HTMLButtonElement;
    deleteBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.deleteHeartbeat).not.toHaveBeenCalled();
  });

  it("Klick auf 'Pause' ruft setHeartbeatEnabled(source, false)", async () => {
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const firstRow = root.querySelector("tbody tr") as HTMLTableRowElement;
    const pauseBtn = Array.from(firstRow.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").trim() === "Pause"
    ) as HTMLButtonElement;
    pauseBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.setHeartbeatEnabled).toHaveBeenCalledWith("raspi-keller", false);
  });

  it("Klick auf 'Aktivieren' (in Zeile mit enabled=false) ruft setHeartbeatEnabled(source, true)", async () => {
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const secondRow = root.querySelectorAll("tbody tr")[1] as HTMLTableRowElement;
    const enableBtn = Array.from(secondRow.querySelectorAll("button")).find(
      (b) => (b.textContent ?? "").trim() === "Aktivieren"
    ) as HTMLButtonElement;
    enableBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.setHeartbeatEnabled).toHaveBeenCalledWith("router", true);
  });

  it("Pause/Aktivieren ist confirm-frei (nur Delete erfordert Confirm)", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    confirmSpy.mockClear();
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const pauseBtn = Array.from(
      root.querySelectorAll("tbody tr:first-child button")
    ).find((b) => (b.textContent ?? "").trim() === "Pause") as HTMLButtonElement;
    pauseBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("nach erfolgreichem Delete laedt die Liste neu", async () => {
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const initialCalls = (api.listHeartbeats as ReturnType<typeof vi.fn>).mock.calls.length;
    const deleteBtn = Array.from(
      root.querySelectorAll("tbody tr:first-child button")
    ).find((b) => (b.textContent ?? "").trim() === "Löschen") as HTMLButtonElement;
    deleteBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    const finalCalls = (api.listHeartbeats as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(finalCalls).toBeGreaterThan(initialCalls);
  });
});
