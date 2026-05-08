// Iter D5: Re-Subscribe-faehiger Wrapper um hass.connection.subscribeEvents.
//
// Hintergrund: HA's WebSocket-Connection droppt gelegentlich (Updates,
// Network-Glitches). Ein subscribeEvents-Aufruf in firstUpdated() haelt
// nur die initiale Subscription — nach Reconnect ist sie tot, der User
// sieht keine Live-Updates mehr und merkt es nur, wenn er F5 drueckt.
//
// LiveSubscription:
// - haengt sich (wenn verfuegbar) an connection.addEventListener("ready")
//   und ruft bei jedem ready-Event subscribeEvents() neu auf.
// - sauberer Lifecycle (start/stop) plus Idempotenz beim Re-Connect:
//   alte Subscription wird unsubed, neue ueberschreibt.
// - Fallback fuer alte HA-Versionen ohne addEventListener: arbeitet
//   wie bisher (eine Subscription, kein Re-Subscribe).

type ReadyListener = (status: string) => void;

interface HassConnectionLike {
  subscribeEvents?: (
    cb: (ev: { data: unknown }) => void,
    type: string,
  ) => Promise<() => void>;
  addEventListener?: (name: string, cb: ReadyListener) => void;
  removeEventListener?: (name: string, cb: ReadyListener) => void;
}

export class LiveSubscription {
  private _unsub: (() => void) | null = null;
  private _stopped = false;
  private _readyHandler: ReadyListener | null = null;
  private _resubscribing = false;

  constructor(
    private readonly _conn: HassConnectionLike,
    private readonly _eventType: string,
    private readonly _onEvent: (ev: { data: unknown }) => void,
  ) {}

  async start(): Promise<void> {
    if (this._stopped) return;
    await this._subscribeNow();
    if (typeof this._conn.addEventListener === "function") {
      this._readyHandler = (status: string): void => {
        // HA emittiert "ready" bei jedem (Re-)Connect. Bei manchen
        // HA-Versionen ist der Event-Typ anders; wir handeln nur den
        // bekannten "ready"-Pfad.
        if (status !== "ready" && status !== undefined) return;
        if (this._stopped || this._resubscribing) return;
        // async re-subscribe; Fehler werden im subscribeNow-Pfad geloggt.
        void this._resubscribe();
      };
      this._conn.addEventListener("ready", this._readyHandler);
    }
  }

  async stop(): Promise<void> {
    this._stopped = true;
    if (
      this._readyHandler !== null
      && typeof this._conn.removeEventListener === "function"
    ) {
      this._conn.removeEventListener("ready", this._readyHandler);
    }
    this._readyHandler = null;
    if (this._unsub !== null) {
      try {
        this._unsub();
      } catch {
        // Hot-Path-sicher: HA kann beim teardown raisen.
      }
      this._unsub = null;
    }
  }

  private async _subscribeNow(): Promise<void> {
    if (this._conn.subscribeEvents === undefined) return;
    try {
      const unsub = await this._conn.subscribeEvents(
        this._onEvent,
        this._eventType,
      );
      this._unsub = unsub;
    } catch (err) {
      // Beim Erst-Setup wird der Aufrufer den Fehler sehen, bei
      // Reconnect-Versuch loggen wir es nur — sonst koennte ein
      // einzelner ready-Spike den UI-Thread killen.
      // eslint-disable-next-line no-console
      console.warn("LiveSubscription subscribe failed", err);
    }
  }

  private async _resubscribe(): Promise<void> {
    this._resubscribing = true;
    try {
      if (this._unsub !== null) {
        try {
          this._unsub();
        } catch {
          // ignore
        }
        this._unsub = null;
      }
      await this._subscribeNow();
    } finally {
      this._resubscribing = false;
    }
  }
}
