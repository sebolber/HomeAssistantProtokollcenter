// F-006: Remediation-Edit + Toggle.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/simple-list-view.js";
import type { ApiClient, RemediationHookDto } from "../src/api-client.js";

function makeApi(items: RemediationHookDto[], overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    listRemediationHooks: vi.fn(async () => items),
    createRemediationHook: vi.fn(),
    updateRemediationHook: vi.fn(async () => undefined),
    deleteRemediationHook: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as ApiClient;
}

async function mount(api: ApiClient): Promise<HTMLElement> {
  const el = document.createElement("remediation-view") as HTMLElement & {
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

const items: RemediationHookDto[] = [
  {
    id: 1,
    name: "AP-Restart",
    source_pattern: "unifi-ap%",
    fingerprint: null,
    automation_id: "script.restart_ap",
    confirm_required: true,
    enabled: true,
  },
  {
    id: 2,
    name: "Pi-Reboot",
    source_pattern: "raspi%",
    fingerprint: null,
    automation_id: "script.reboot_pi",
    confirm_required: false,
    enabled: false,
  },
];

describe("F-006 Remediation Edit + Toggle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("rendert pro Zeile einen 'Bearbeiten' + 'Pause/Aktivieren'-Knopf", async () => {
    const el = await mount(makeApi(items));
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const rows = root.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
    const labels1 = Array.from(rows[0].querySelectorAll("button")).map(
      (b) => (b.textContent ?? "").trim()
    );
    expect(labels1).toContain("Bearbeiten");
    expect(labels1).toContain("Pause");
    expect(labels1).toContain("Löschen");
    // Zeile 2 ist disabled -> 'Aktivieren'
    const labels2 = Array.from(rows[1].querySelectorAll("button")).map(
      (b) => (b.textContent ?? "").trim()
    );
    expect(labels2).toContain("Aktivieren");
  });

  it("Klick auf 'Bearbeiten' wechselt Zeile in Edit-Modus mit Feldern", async () => {
    const el = await mount(makeApi(items));
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const editBtn = Array.from(root.querySelectorAll("tbody tr:first-child button")).find(
      (b) => (b.textContent ?? "").trim() === "Bearbeiten"
    ) as HTMLButtonElement;
    editBtn.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const inputs = root.querySelectorAll("tbody tr:first-child input");
    // Mindestens 3 Text-Inputs (name, source_pattern, automation_id)
    const textInputs = Array.from(inputs).filter(
      (i) => (i as HTMLInputElement).type !== "checkbox"
    );
    expect(textInputs.length).toBeGreaterThanOrEqual(3);
  });

  it("'Speichern' im Edit-Modus ruft updateRemediationHook(id, payload)", async () => {
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const editBtn = Array.from(root.querySelectorAll("tbody tr:first-child button")).find(
      (b) => (b.textContent ?? "").trim() === "Bearbeiten"
    ) as HTMLButtonElement;
    editBtn.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    // automation_id korrigieren
    const automationInput = Array.from(
      root.querySelectorAll<HTMLInputElement>("tbody tr:first-child input")
    ).find((i) => i.value === "script.restart_ap") as HTMLInputElement;
    expect(automationInput).toBeTruthy();
    automationInput.value = "script.unifi_restart";
    automationInput.dispatchEvent(new Event("input"));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const saveBtn = Array.from(root.querySelectorAll("tbody tr:first-child button")).find(
      (b) => (b.textContent ?? "").trim() === "Speichern"
    ) as HTMLButtonElement;
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.updateRemediationHook).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        name: "AP-Restart",
        automation_id: "script.unifi_restart",
        source_pattern: "unifi-ap%",
      })
    );
  });

  it("'Pause' ruft updateRemediationHook(id, {enabled: false}) ohne Confirm", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    confirmSpy.mockClear();
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const pauseBtn = Array.from(root.querySelectorAll("tbody tr:first-child button")).find(
      (b) => (b.textContent ?? "").trim() === "Pause"
    ) as HTMLButtonElement;
    pauseBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.updateRemediationHook).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ enabled: false })
    );
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("'Aktivieren' (Zeile 2) ruft updateRemediationHook(id, {enabled: true})", async () => {
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const enableBtn = Array.from(root.querySelectorAll("tbody tr:nth-child(2) button")).find(
      (b) => (b.textContent ?? "").trim() === "Aktivieren"
    ) as HTMLButtonElement;
    enableBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.updateRemediationHook).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ enabled: true })
    );
  });

  it("'Abbrechen' im Edit-Modus verwirft Aenderungen ohne API-Call", async () => {
    const api = makeApi(items);
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const editBtn = Array.from(root.querySelectorAll("tbody tr:first-child button")).find(
      (b) => (b.textContent ?? "").trim() === "Bearbeiten"
    ) as HTMLButtonElement;
    editBtn.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const cancelBtn = Array.from(root.querySelectorAll("tbody tr:first-child button")).find(
      (b) => (b.textContent ?? "").trim() === "Abbrechen"
    ) as HTMLButtonElement;
    cancelBtn.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(api.updateRemediationHook).not.toHaveBeenCalled();
  });
});
