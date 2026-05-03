// F-008: detail-pane.ts ruft nach setMessageStatus + setMessageSeverity
// gezieltes getMessage(id), patcht this.msg, dispatcht message-updated.
// Spart die N-Item-Liste beim Refresh nach jedem Status-Wechsel.

import { describe, it, expect, beforeEach, vi } from "vitest";
import "../src/components/detail-pane.js";
import type { ApiClient, MessageDto } from "../src/api-client.js";

function makeMsg(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: 42,
    timestamp: "2026-05-03T12:00:00Z",
    severity: "warning",
    source: "raspi",
    text: "DNS slow",
    metadata: null,
    webhook_id: null,
    ...overrides,
  };
}

function makeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    getMessage: vi.fn(async (id: number) =>
      makeMsg({
        id,
        // Default: Backend hat den Status bereits umgestellt
        ...(({ status: "acknowledged" } as unknown) as Partial<MessageDto>),
      })
    ),
    setMessageStatus: vi.fn(async () => undefined),
    setMessageSeverity: vi.fn(async () => undefined),
    getMessageTags: vi.fn(async () => []),
    getRunbookForSource: vi.fn(async () => null),
    addMessageTag: vi.fn(async () => []),
    removeMessageTag: vi.fn(async () => []),
    ...overrides,
  } as unknown as ApiClient;
}

async function mount(
  api: ApiClient,
  msg: MessageDto = makeMsg()
): Promise<HTMLElement> {
  const el = document.createElement("detail-pane") as HTMLElement & {
    api?: ApiClient;
    msg: MessageDto;
    updateComplete: Promise<unknown>;
  };
  el.api = api;
  el.msg = msg;
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

function btnByText(root: ShadowRoot, label: RegExp): HTMLButtonElement | null {
  return Array.from(root.querySelectorAll("button")).find((b) =>
    label.test((b.textContent ?? "").trim())
  ) ?? null;
}

describe("F-008 detail-pane targeted refresh", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("Status-Klick ruft setMessageStatus(id, status) UND getMessage(id) — keine Listen-Calls", async () => {
    const api = makeApi();
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    btnByText(root, /Bestätigen|Bestaetigen/)!.click();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.setMessageStatus).toHaveBeenCalledWith(42, "acknowledged");
    expect(api.getMessage).toHaveBeenCalledWith(42);
  });

  it("dispatcht 'message-updated' mit dem frischen MessageDto", async () => {
    const api = makeApi();
    const el = await mount(api);
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    const updatedEvent = new Promise<CustomEvent>((resolve) => {
      el.addEventListener(
        "message-updated",
        (e) => resolve(e as CustomEvent),
        { once: true }
      );
    });
    btnByText(root, /Bestätigen|Bestaetigen/)!.click();
    const ev = await updatedEvent;
    expect(ev.detail).toMatchObject({ msg: { id: 42 } });
  });

  it("updated this.msg direkt nach dem Status-Wechsel", async () => {
    const fetchedMsg = makeMsg({ id: 42, text: "REFRESHED" });
    const api = makeApi({
      getMessage: vi.fn(async () => fetchedMsg),
    } as Partial<ApiClient>);
    const el = await mount(api) as HTMLElement & { msg: MessageDto };
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    btnByText(root, /Bestätigen|Bestaetigen/)!.click();
    await new Promise((r) => setTimeout(r, 30));
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(el.msg.text).toBe("REFRESHED");
  });

  it("getMessage-Fehler bricht den UI-Flow nicht — Toast-Event 'error'", async () => {
    const errorEvent = vi.fn();
    const api = makeApi({
      getMessage: vi.fn(async () => {
        throw new Error("HTTP 500");
      }),
    } as Partial<ApiClient>);
    const el = await mount(api);
    el.addEventListener("error", (e) => errorEvent((e as unknown as CustomEvent).detail));
    const root = (el as unknown as { shadowRoot: ShadowRoot }).shadowRoot;
    btnByText(root, /Bestätigen|Bestaetigen/)!.click();
    await new Promise((r) => setTimeout(r, 30));
    // setMessageStatus war erfolgreich, getMessage-Fehler darf den Pane
    // nicht haengen lassen — error-Event wird gefeuert.
    expect(api.setMessageStatus).toHaveBeenCalled();
    expect(errorEvent).toHaveBeenCalled();
  });
});
