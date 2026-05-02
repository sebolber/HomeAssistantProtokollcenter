import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/stats-view.js";
import type { ApiClient } from "../src/api-client.js";

function makeApi(): ApiClient {
  return {
    getStats: vi.fn(async () => ({ total: 0, severity_24h: {} })),
    listSources: vi.fn(async () => []),
    getStatsExtended: vi.fn(async () => ({ heatmap: [], top_sources: [] })),
  } as unknown as ApiClient;
}

async function mount(): Promise<HTMLElement> {
  const el = document.createElement("stats-view") as HTMLElement & {
    api?: ApiClient;
    updateComplete: Promise<unknown>;
  };
  el.api = makeApi();
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

describe("stats-view sub-tabs", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    try {
      localStorage.removeItem("messagehub.stats.subtab");
    } catch {
      // ignore
    }
  });

  it("rendert zwei Sub-Tabs: Live-Status + KNX-Bus-Analyse", async () => {
    const el = await mount();
    const tabs = el.shadowRoot!.querySelectorAll("button.subtab");
    expect(tabs.length).toBe(2);
    const labels = Array.from(tabs).map((t) => t.textContent?.trim());
    expect(labels).toEqual(["Live-Status", "KNX-Bus-Analyse"]);
  });

  it("startet im Live-Status-Sub-Tab", async () => {
    const el = await mount();
    expect(el.shadowRoot!.querySelector("stats-live-view")).not.toBeNull();
    expect(el.shadowRoot!.querySelector("stats-knx-view")).toBeNull();
  });

  it("wechselt nach Click auf KNX-Tab zur KNX-View", async () => {
    const el = await mount();
    const tabs = el.shadowRoot!.querySelectorAll("button.subtab");
    (tabs[1] as HTMLButtonElement).click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(el.shadowRoot!.querySelector("stats-knx-view")).not.toBeNull();
    expect(el.shadowRoot!.querySelector("stats-live-view")).toBeNull();
  });

  it("persistiert den aktiven Sub-Tab in localStorage", async () => {
    const el = await mount();
    const tabs = el.shadowRoot!.querySelectorAll("button.subtab");
    (tabs[1] as HTMLButtonElement).click();
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(localStorage.getItem("messagehub.stats.subtab")).toBe("knx");
  });

  it("liest die persistierte Auswahl beim Mount wieder ein", async () => {
    localStorage.setItem("messagehub.stats.subtab", "knx");
    const el = await mount();
    expect(el.shadowRoot!.querySelector("stats-knx-view")).not.toBeNull();
  });

  it("ignoriert kaputte localStorage-Werte und faellt auf 'live' zurueck", async () => {
    localStorage.setItem("messagehub.stats.subtab", "unbekannt");
    const el = await mount();
    expect(el.shadowRoot!.querySelector("stats-live-view")).not.toBeNull();
  });
});
