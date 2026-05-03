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

  // F-005: Heartbeat-Lifecycle.
  it("deleteHeartbeat ruft DELETE /heartbeats/{source} mit URL-Encoding", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true } as Response));
    vi.stubGlobal("fetch", fetchMock);
    const client = new ApiClient();
    await client.deleteHeartbeat("raspi keller/A");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/messagehub/heartbeats/raspi%20keller%2FA");
    expect(init.method).toBe("DELETE");
  });

  it("setHeartbeatEnabled ruft PATCH /heartbeats/{source} mit JSON", async () => {
    const fetchMock = vi.fn(async () =>
      ({ ok: true, async json() { return { source: "a", enabled: false }; } } as Response)
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = new ApiClient();
    await client.setHeartbeatEnabled("a", false);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/messagehub/heartbeats/a");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ enabled: false });
  });

  it("deleteHeartbeat wirft bei 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 } as Response)));
    const client = new ApiClient();
    await expect(client.deleteHeartbeat("ghost")).rejects.toThrow("HTTP 404");
  });

  // F-011: KNX-GA-Export-URL-Helfer.
  it("knxStatsGaExportUrl encodiert die GA korrekt (Slashes!)", async () => {
    const client = new ApiClient();
    const url = client.knxStatsGaExportUrl("1/2/3", "csv", {
      from: "2026-05-01T00:00:00Z",
      to: "2026-05-03T23:59:59Z",
    });
    // 1/2/3 muss als 1%2F2%2F3 erscheinen, sonst trifft der Router falsch.
    expect(url).toContain("/api/messagehub/knx-stats/ga/1%2F2%2F3/export");
    expect(url).toContain("format=csv");
    expect(url).toMatch(/from=2026-05-01T00%3A00%3A00Z/);
    expect(url).toMatch(/to=2026-05-03T23%3A59%3A59Z/);
  });

  it("knxStatsGaExportUrl ohne from/to baut nur format-Param", async () => {
    const client = new ApiClient();
    const url = client.knxStatsGaExportUrl("0/0/1", "json");
    expect(url).toContain("/api/messagehub/knx-stats/ga/0%2F0%2F1/export");
    expect(url).toContain("format=json");
    expect(url).not.toContain("from=");
    expect(url).not.toContain("to=");
  });

  it("knxStatsGaExportUrl mit baseUrl-Prefix", async () => {
    const client = new ApiClient("https://ha.local:8123");
    const url = client.knxStatsGaExportUrl("1/2/3", "csv");
    expect(url.startsWith("https://ha.local:8123/api/messagehub/knx-stats/ga/")).toBe(true);
  });
});
