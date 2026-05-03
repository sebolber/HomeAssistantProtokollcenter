import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/channels-view.js";
import type { ChannelsView } from "../src/components/channels-view.js";
import type { ApiClient, ChannelDto } from "../src/api-client.js";

function makeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    listChannels: vi.fn(async () =>
      [
        {
          id: 1,
          name: "Telegram-Test",
          channel_type: "telegram",
          enabled: true,
          severity_threshold: "warning",
          quiet_start: null,
          quiet_end: null,
          quiet_bypass_error: true,
          throttle_seconds: 600,
          config: { bot_token: "x", chat_id: "12345" },
        },
      ] as ChannelDto[]
    ),
    testChannel: vi.fn(async () => ({ delivered: true, channel: "Telegram-Test" })),
    deleteChannel: vi.fn(),
    ...overrides,
  } as unknown as ApiClient;
}

async function mount(api: ApiClient): Promise<ChannelsView> {
  const el = document.createElement("channels-view") as ChannelsView;
  el.api = api;
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

describe("F-001 ChannelsView Test-Knopf", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("rendert pro Channel-Zeile einen 'Test'-Button", async () => {
    const el = await mount(makeApi());
    const buttons = el.shadowRoot!.querySelectorAll("td.actions button");
    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels).toContain("Test");
  });

  it("Klick auf 'Test' ruft api.testChannel(id)", async () => {
    const api = makeApi();
    const el = await mount(api);
    const testBtn = Array.from(
      el.shadowRoot!.querySelectorAll("td.actions button")
    ).find((b) => b.textContent?.trim() === "Test") as HTMLButtonElement;
    expect(testBtn).toBeTruthy();
    testBtn.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    expect(api.testChannel).toHaveBeenCalledWith(1);
  });

  it("Erfolgs-Toast nach Test mit delivered=true", async () => {
    const el = await mount(makeApi());
    const testBtn = Array.from(
      el.shadowRoot!.querySelectorAll("td.actions button")
    ).find((b) => b.textContent?.trim() === "Test") as HTMLButtonElement;
    testBtn.click();
    // Auf naechsten Tick warten — _toast wird async gesetzt.
    await new Promise((r) => setTimeout(r, 30));
    await el.updateComplete;
    const toast = el.shadowRoot!.querySelector(".toast");
    expect(toast?.textContent).toMatch(/Telegram-Test/);
    expect(toast?.textContent).toMatch(/zugestellt|erfolg|gesendet/i);
  });

  it("Fehler-Toast bei delivered=false", async () => {
    const api = makeApi({
      testChannel: vi.fn(async () => ({ delivered: false, channel: "Telegram-Test" })),
    } as Partial<ApiClient>);
    const el = await mount(api);
    const testBtn = Array.from(
      el.shadowRoot!.querySelectorAll("td.actions button")
    ).find((b) => b.textContent?.trim() === "Test") as HTMLButtonElement;
    testBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    await el.updateComplete;
    const toast = el.shadowRoot!.querySelector(".toast");
    expect(toast?.textContent?.toLowerCase()).toMatch(/fehl|nicht/);
  });

  it("Rate-Limit (429) wird im Toast als 'zu viele Versuche' angezeigt", async () => {
    const api = makeApi({
      testChannel: vi.fn(async () => {
        throw new Error("HTTP 429: rate limit exceeded");
      }),
    } as Partial<ApiClient>);
    const el = await mount(api);
    const testBtn = Array.from(
      el.shadowRoot!.querySelectorAll("td.actions button")
    ).find((b) => b.textContent?.trim() === "Test") as HTMLButtonElement;
    testBtn.click();
    await new Promise((r) => setTimeout(r, 30));
    await el.updateComplete;
    const toast = el.shadowRoot!.querySelector(".toast");
    expect(toast?.textContent?.toLowerCase()).toMatch(/zu viele|rate|warte|429/);
  });

  it("Test-Knopf ist waehrend laufendem Test deaktiviert (Doppel-Klick-Schutz)", async () => {
    let resolveFn: (v: { delivered: boolean; channel: string }) => void = () => undefined;
    const api = makeApi({
      testChannel: vi.fn(
        () =>
          new Promise<{ delivered: boolean; channel: string }>((r) => {
            resolveFn = r;
          })
      ),
    } as Partial<ApiClient>);
    const el = await mount(api);
    const testBtn = Array.from(
      el.shadowRoot!.querySelectorAll("td.actions button")
    ).find((b) => b.textContent?.trim() === "Test") as HTMLButtonElement;
    testBtn.click();
    await el.updateComplete;
    expect(testBtn.disabled).toBe(true);
    resolveFn({ delivered: true, channel: "Telegram-Test" });
    await new Promise((r) => setTimeout(r, 30));
    await el.updateComplete;
    expect(testBtn.disabled).toBe(false);
  });
});
