// F-010: Deep-Link via URL-Hash fuer Sub-Tabs (Settings + Stats).
// Format:
//   #messages
//   #stats[/live|/knx|/findings][?source=X.Y.Z]
//   #settings[/webhooks|/knx|/channels|/mqtt|/heartbeats|/remediation]
//   #audit
// Backwards-Compat: #findings -> #stats/findings (alter Pfad bleibt aktiv).

import { describe, it, expect, beforeEach } from "vitest";
import "../src/components/stats-view.js";
import "../src/components/settings-view.js";
import type { ApiClient } from "../src/api-client.js";

function fakeApi(): ApiClient {
  return {
    getStats: async () => ({ total: 0, severity_24h: { error: 0, warning: 0, info: 0, debug: 0 } }),
    getStatsExtended: async () => ({ heatmap: [], top_sources: [] }),
    listSources: async () => [],
    listFindings: async () => ({ items: [], total: 0, limit: 50, offset: 0 }),
    listWebhooks: async () => [],
    listKnxAddresses: async () => [],
    listChannels: async () => [],
    listMqttTopics: async () => [],
    listHeartbeats: async () => [],
    listRemediationHooks: async () => [],
    discoverKnxFromProject: async () => ({ items: [], status: "ok" }),
    getKnxBusAnalysisState: async () => ({ enabled: false }),
  } as unknown as ApiClient;
}

async function mount<T extends HTMLElement>(tag: string): Promise<T> {
  const el = document.createElement(tag) as T & {
    api?: ApiClient;
    updateComplete: Promise<unknown>;
  };
  (el as { api?: ApiClient }).api = fakeApi();
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

describe("F-010 Deep-Linking via Hash", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.hash = "";
  });

  describe("stats-view", () => {
    it("Backwards-Compat: #findings oeffnet weiterhin Findings-Tab", async () => {
      window.location.hash = "#findings";
      const el = await mount<HTMLElement>("stats-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const activeBtn = root.querySelector("button.subtab.active");
      expect(activeBtn?.textContent?.trim()).toMatch(/Konfigurations-Check/);
    });

    it("#stats/live aktiviert Live-Status-Tab", async () => {
      window.location.hash = "#stats/live";
      const el = await mount<HTMLElement>("stats-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const activeBtn = root.querySelector("button.subtab.active");
      expect(activeBtn?.textContent?.trim()).toMatch(/Live-Status/);
    });

    it("#stats/knx aktiviert KNX-Bus-Analyse-Tab", async () => {
      window.location.hash = "#stats/knx";
      const el = await mount<HTMLElement>("stats-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const activeBtn = root.querySelector("button.subtab.active");
      expect(activeBtn?.textContent?.trim()).toMatch(/KNX-Bus-Analyse/);
    });

    it("#stats/findings?source=1.1.42 setzt Source-Filter", async () => {
      window.location.hash = "#stats/findings?source=1.1.42";
      const el = await mount<HTMLElement>("stats-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const findings = root.querySelector("findings-view");
      expect(findings).toBeTruthy();
      expect((findings as HTMLElement & { sourceFilter: string }).sourceFilter).toBe("1.1.42");
    });

    it("hashchange-Event wechselt den aktiven Sub-Tab live", async () => {
      const el = await mount<HTMLElement>("stats-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      window.location.hash = "#stats/knx";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      const activeBtn = root.querySelector("button.subtab.active");
      expect(activeBtn?.textContent?.trim()).toMatch(/KNX-Bus-Analyse/);
    });
  });

  describe("settings-view", () => {
    it("#settings/mqtt aktiviert MQTT-Sub-Tab", async () => {
      window.location.hash = "#settings/mqtt";
      const el = await mount<HTMLElement>("settings-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const activeBtn = root.querySelector("button.tab.active");
      expect(activeBtn?.textContent?.trim()).toMatch(/MQTT/);
    });

    it("#settings/channels aktiviert Channels-Sub-Tab", async () => {
      window.location.hash = "#settings/channels";
      const el = await mount<HTMLElement>("settings-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const activeBtn = root.querySelector("button.tab.active");
      expect(activeBtn?.textContent?.trim()).toMatch(/Channels/);
    });

    it("#settings/heartbeats aktiviert Heartbeats-Sub-Tab", async () => {
      window.location.hash = "#settings/heartbeats";
      const el = await mount<HTMLElement>("settings-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const activeBtn = root.querySelector("button.tab.active");
      expect(activeBtn?.textContent?.trim()).toMatch(/Heartbeats/);
    });

    it("#settings/remediation aktiviert Auto-Remediation-Sub-Tab", async () => {
      window.location.hash = "#settings/remediation";
      const el = await mount<HTMLElement>("settings-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const activeBtn = root.querySelector("button.tab.active");
      expect(activeBtn?.textContent?.trim()).toMatch(/Auto-Remediation/);
    });

    it("Tab-Klick aktualisiert den URL-Hash", async () => {
      const el = await mount<HTMLElement>("settings-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const knxTab = Array.from(root.querySelectorAll("button.tab")).find(
        (b) => (b.textContent ?? "").trim() === "KNX-Bus"
      ) as HTMLButtonElement;
      knxTab.click();
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      expect(window.location.hash).toBe("#settings/knx");
    });

    it("Unbekannter Sub-Tab im Hash faellt auf Default 'webhooks' zurueck", async () => {
      window.location.hash = "#settings/bogus";
      const el = await mount<HTMLElement>("settings-view");
      const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
      const activeBtn = root.querySelector("button.tab.active");
      expect(activeBtn?.textContent?.trim()).toMatch(/Webhooks/);
    });
  });
});
