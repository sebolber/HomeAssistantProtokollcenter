// Iter D5: Live-Update-Subscription muss bei WebSocket-Reconnect
// erneut aufgesetzt werden, damit der User keine Updates verpasst.
//
// Konzept-Schwaeche D5: subscribeEvents wurde EINMAL in firstUpdated
// gerufen; bei HA-WS-Drop+Reconnect blieb die Subscription dahinter
// stehen (Stub-Tests mocken HA's connection-Lifecycle).

import { describe, expect, it } from "vitest";
import { LiveSubscription } from "../src/utils/live-subscribe.js";

interface SubArgs {
  cb: (ev: { data: unknown }) => void;
  type: string;
}

class FakeConnection {
  public subscribed: SubArgs[] = [];
  private _statusCbs: Array<(s: string) => void> = [];
  private _unsubs: Array<() => void> = [];

  async subscribeEvents(
    cb: (ev: { data: unknown }) => void,
    type: string,
  ): Promise<() => void> {
    this.subscribed.push({ cb, type });
    const unsub = (): void => {
      // sammeln, damit Test pruefen kann, ob die alte Subscription
      // beim Reconnect aufgeraeumt wurde.
      this._unsubs.push(unsub);
    };
    this._unsubs.push(unsub);
    return unsub;
  }

  // Vereinfachte HA-API fuer status-changes.
  addEventListener(name: string, cb: (s: string) => void): void {
    if (name === "ready") {
      this._statusCbs.push(cb);
    }
  }

  emitReady(): void {
    for (const cb of this._statusCbs) cb("ready");
  }

  unsubCount(): number {
    return this._unsubs.length;
  }
}

describe("LiveSubscription", () => {
  it("subscribes once on start", async () => {
    const conn = new FakeConnection();
    const events: unknown[] = [];
    const sub = new LiveSubscription(conn, "messagehub_message_added", (ev) =>
      events.push(ev.data),
    );
    await sub.start();
    expect(conn.subscribed.length).toBe(1);
    await sub.stop();
  });

  it("re-subscribes when connection emits ready (reconnect)", async () => {
    const conn = new FakeConnection();
    const events: unknown[] = [];
    const sub = new LiveSubscription(conn, "messagehub_message_added", (ev) =>
      events.push(ev.data),
    );
    await sub.start();
    expect(conn.subscribed.length).toBe(1);
    // Simuliere Drop + Reconnect.
    conn.emitReady();
    // Kurz warten, weil _onReady async re-subscribed.
    await new Promise((r) => setTimeout(r, 5));
    expect(conn.subscribed.length).toBe(2);
    await sub.stop();
  });

  it("delivers events from new subscription after reconnect", async () => {
    const conn = new FakeConnection();
    const events: unknown[] = [];
    const sub = new LiveSubscription(conn, "messagehub_message_added", (ev) =>
      events.push(ev.data),
    );
    await sub.start();
    // Erste Subscription liefert Event 1.
    conn.subscribed[0].cb({ data: { id: 1 } });
    // Drop + Reconnect.
    conn.emitReady();
    await new Promise((r) => setTimeout(r, 5));
    // Neue Subscription liefert Event 2.
    conn.subscribed[1].cb({ data: { id: 2 } });
    expect(events).toEqual([{ id: 1 }, { id: 2 }]);
    await sub.stop();
  });

  it("stop unsubscribes and ignores future ready events", async () => {
    const conn = new FakeConnection();
    const events: unknown[] = [];
    const sub = new LiveSubscription(conn, "messagehub_message_added", (ev) =>
      events.push(ev.data),
    );
    await sub.start();
    await sub.stop();
    // Nach stop() darf keine erneute Subscription entstehen.
    conn.emitReady();
    await new Promise((r) => setTimeout(r, 5));
    expect(conn.subscribed.length).toBe(1);
  });

  it("works with connection without addEventListener (HA backward compat)", async () => {
    // Fallback: alte HA-Versionen exposen kein addEventListener auf
    // connection — die Subscription darf trotzdem funktionieren, nur
    // ohne Re-Subscribe-Logik.
    const conn = {
      subscribeEvents: async (
        _cb: (ev: { data: unknown }) => void,
        _type: string,
      ): Promise<() => void> => () => {},
    };
    const sub = new LiveSubscription(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conn as any,
      "messagehub_message_added",
      () => {},
    );
    await sub.start();
    await sub.stop();
    // Kein Crash.
    expect(true).toBe(true);
  });
});
