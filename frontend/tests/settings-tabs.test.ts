import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/settings-view.js";
import type { SettingsView } from "../src/components/settings-view.js";
import type { ApiClient } from "../src/api-client.js";

function makeApi(): ApiClient {
  return {
    listWebhooks: vi.fn(async () => []),
    listKnxAddresses: vi.fn(async () => []),
    discoverKnxFromProject: vi.fn(async () => ({ items: [], status: "ok" })),
    listChannels: vi.fn(async () => []),
    listMqttTopics: vi.fn(async () => []),
    listHeartbeats: vi.fn(async () => []),
    listRemediationHooks: vi.fn(async () => []),
  } as unknown as ApiClient;
}

async function mount(): Promise<SettingsView> {
  const el = document.createElement("settings-view") as SettingsView;
  el.api = makeApi();
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

describe("settings-view tabs", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.settings.tab");
    } catch {
      // ignore
    }
    // F-010 / Iter +11: Hash zuruecksetzen, damit Tests aus
    // deep-linking.test.ts keinen Settings-Tab vorgeben.
    if (typeof window !== "undefined") {
      // Test-Sandbox: jsdom unterstuetzt history.replaceState ohne URL-Konflikt.
      window.history.replaceState(null, "", "/");
    }
  });

  it("rendert sieben Tabs (inkl. Iter L4.3 KI-Empfehlungen)", async () => {
    const el = await mount();
    const tabs = el.shadowRoot!.querySelectorAll("button.tab");
    expect(tabs.length).toBe(7);
    const labels = Array.from(tabs).map((t) =>
      t.querySelector("span:not(.tab-icon)")!.textContent?.trim()
    );
    expect(labels).toEqual([
      "Webhooks",
      "KNX-Bus",
      "Channels",
      "MQTT",
      "Heartbeats",
      "Auto-Remediation",
      "KI-Empfehlungen",
    ]);
  });

  it("startet im Webhooks-Tab und zeigt nur dessen Inhalt", async () => {
    const el = await mount();
    const active = el.shadowRoot!.querySelector("button.tab.active");
    expect(active!.getAttribute("title")).toBe("Webhooks");
    // KNX-View darf nicht im DOM sein
    expect(el.shadowRoot!.querySelector("knx-addresses-view")).toBeNull();
  });

  it("zeigt nach Click auf KNX-Tab nur die KNX-View", async () => {
    const el = await mount();
    const tabs = el.shadowRoot!.querySelectorAll("button.tab");
    (tabs[1] as HTMLButtonElement).click(); // KNX
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("knx-addresses-view")).not.toBeNull();
    // Webhooks-Sektion ist weg
    const h2 = el.shadowRoot!.querySelector("section h2");
    expect(h2).toBeNull();
  });

  it("persistiert die Tab-Auswahl in localStorage", async () => {
    const el = await mount();
    const tabs = el.shadowRoot!.querySelectorAll("button.tab");
    (tabs[3] as HTMLButtonElement).click(); // MQTT
    await el.updateComplete;
    expect(localStorage.getItem("messagehub.settings.tab")).toBe("mqtt");
  });

  it("liest die persistierte Tab-Auswahl beim Mount wieder ein", async () => {
    localStorage.setItem("messagehub.settings.tab", "channels");
    const el = await mount();
    const active = el.shadowRoot!.querySelector("button.tab.active");
    expect(active!.getAttribute("title")).toBe("Channels");
    expect(el.shadowRoot!.querySelector("channels-view")).not.toBeNull();
  });

  it("ignoriert kaputte localStorage-Werte und faellt auf 'webhooks' zurueck", async () => {
    localStorage.setItem("messagehub.settings.tab", "unbekannt");
    const el = await mount();
    const active = el.shadowRoot!.querySelector("button.tab.active");
    expect(active!.getAttribute("title")).toBe("Webhooks");
  });
});
