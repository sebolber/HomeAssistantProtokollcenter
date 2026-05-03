import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/simple-list-view.js";
import type { ApiClient, MqttTopicDto } from "../src/api-client.js";

function makeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  const items: MqttTopicDto[] = [
    {
      id: 1,
      topic_pattern: "z2m/+/availability",
      source: "z2m.health",
      severity: "warning",
      enabled: true,
    },
    {
      id: 2,
      topic_pattern: "iot/sensor/+",
      source: "iot",
      severity: "info",
      enabled: false,
    },
  ];
  return {
    listMqttTopics: vi.fn(async () => items),
    createMqttTopic: vi.fn(),
    updateMqttTopic: vi.fn(async () => undefined),
    deleteMqttTopic: vi.fn(),
    ...overrides,
  } as unknown as ApiClient;
}

async function mount(api: ApiClient): Promise<HTMLElement> {
  const el = document.createElement("mqtt-topics-view") as unknown as HTMLElement & {
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
  return (
    Array.from(root.querySelectorAll("button")).find((b) =>
      label.test(b.textContent ?? "")
    ) ?? null
  );
}

describe("F-002 mqtt-topics-view Edit-Funktion", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("rendert pro Zeile einen Edit-Button", async () => {
    const el = await mount(makeApi());
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const editBtns = Array.from(root.querySelectorAll("button")).filter(
      (b) => b.textContent?.trim() === "Bearbeiten"
    );
    expect(editBtns.length).toBe(2);
  });

  it("Klick auf 'Bearbeiten' wechselt die Zeile in den Edit-Modus mit pre-gefuellten Feldern", async () => {
    const el = await mount(makeApi());
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const editBtn = btnByText(root, /Bearbeiten/);
    expect(editBtn).toBeTruthy();
    editBtn!.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const inputs = root.querySelectorAll<HTMLInputElement>("tbody input[type='text'], tbody input:not([type])");
    // Pattern + Source = 2 Text-Inputs, Severity + Enabled per Select/Checkbox
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    const patternInput = Array.from(inputs).find(
      (i) => i.value === "z2m/+/availability"
    );
    expect(patternInput).toBeTruthy();
  });

  it("'Speichern' im Edit-Modus ruft api.updateMqttTopic(id, payload)", async () => {
    const api = makeApi();
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    btnByText(root, /Bearbeiten/)!.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    // Pattern aendern
    const patternInput = Array.from(
      root.querySelectorAll<HTMLInputElement>("tbody input")
    ).find((i) => i.value === "z2m/+/availability") as HTMLInputElement;
    patternInput.value = "z2m/+/availability_corrected";
    patternInput.dispatchEvent(new Event("input"));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    // Speichern klicken
    btnByText(root, /Speichern/)!.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.updateMqttTopic).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        topic_pattern: "z2m/+/availability_corrected",
        source: "z2m.health",
      })
    );
  });

  it("'Abbrechen' im Edit-Modus verwirft Aenderungen ohne API-Call", async () => {
    const api = makeApi();
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    btnByText(root, /Bearbeiten/)!.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    btnByText(root, /Abbrechen/)!.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(api.updateMqttTopic).not.toHaveBeenCalled();
    // Original-Wert wieder sichtbar
    const code = root.querySelector("tbody td code");
    expect(code?.textContent).toBe("z2m/+/availability");
  });

  it("Edit erlaubt Toggle des enabled-Flags", async () => {
    const api = makeApi();
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    btnByText(root, /Bearbeiten/)!.click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const checkbox = root.querySelector<HTMLInputElement>("tbody input[type='checkbox']");
    expect(checkbox).toBeTruthy();
    expect(checkbox!.checked).toBe(true);
    checkbox!.checked = false;
    checkbox!.dispatchEvent(new Event("change"));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    btnByText(root, /Speichern/)!.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.updateMqttTopic).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ enabled: false })
    );
  });
});
