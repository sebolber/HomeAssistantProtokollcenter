import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient } from "../src/api-client.js";

describe("ApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("listMessages baut Query-Params korrekt", async () => {
    const fetchMock = vi.fn(async () =>
      ({
        ok: true,
        async json() {
          return { items: [], total: 0, limit: 100, offset: 0 };
        },
      } as Response)
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new ApiClient();
    await client.listMessages({ severity: ["error", "warning"], source: "x", search: "dns" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const firstCall = fetchMock.mock.calls[0] as unknown as [string];
    const url = firstCall[0];
    expect(url).toContain("severity=error%2Cwarning");
    expect(url).toContain("source=x");
    expect(url).toContain("search=dns");
  });

  it("wirft bei HTTP-Fehler", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 } as Response))
    );
    const client = new ApiClient();
    await expect(client.listMessages()).rejects.toThrow("HTTP 500");
  });

  // F-001: Channel-Test-Knopf — POST /channels/{id}/test
  it("testChannel ruft POST /channels/{id}/test und liefert delivered/channel", async () => {
    const fetchMock = vi.fn(async () =>
      ({
        ok: true,
        status: 200,
        async json() {
          return { delivered: true, channel: "Telegram-Bot" };
        },
      } as Response)
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new ApiClient();
    const res = await client.testChannel(42);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/messagehub/channels/42/test");
    expect(init.method).toBe("POST");
    expect(res).toEqual({ delivered: true, channel: "Telegram-Bot" });
  });

  it("testChannel surface Rate-Limit-Antwort (429) als spezifische Fehlermeldung", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 429,
        async text() {
          return "rate limit exceeded";
        },
      } as Response))
    );
    const client = new ApiClient();
    await expect(client.testChannel(42)).rejects.toThrow(/429/);
  });

  // F-002: MQTT-Topic-Edit
  it("updateMqttTopic ruft PUT /mqtt-topics/{id} mit Payload", async () => {
    const fetchMock = vi.fn(async () =>
      ({
        ok: true,
        async json() {
          return {
            id: 7,
            topic_pattern: "z2m/+/state",
            source: "z2m",
            severity: "warning",
            enabled: true,
          };
        },
      } as Response)
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new ApiClient();
    await client.updateMqttTopic(7, {
      topic_pattern: "z2m/+/state",
      source: "z2m",
      severity: "warning",
      enabled: true,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/messagehub/mqtt-topics/7");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({
      topic_pattern: "z2m/+/state",
      source: "z2m",
      severity: "warning",
      enabled: true,
    });
  });

  it("updateMqttTopic wirft bei HTTP-Fehler", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 400, async text() { return "invalid"; } } as Response))
    );
    const client = new ApiClient();
    await expect(
      client.updateMqttTopic(7, { topic_pattern: "x", source: "y", severity: "info", enabled: true })
    ).rejects.toThrow("HTTP 400");
  });
});
