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
});
