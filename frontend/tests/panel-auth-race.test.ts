// Iter D3: Auth-Race in firstUpdated.
// Wenn hass zur firstUpdated-Zeit noch nicht gesetzt ist (HA-Race),
// soll _reload + _subscribeLive nicht ohne Auth feuern. Stattdessen
// verzoegern wir auf den naechsten updated()-Tick mit hass.

import { describe, expect, it } from "vitest";
import "../src/messagehub-panel.js";
import type { LitElement } from "lit";

interface PanelLike extends LitElement {
  hass?: unknown;
  _initialized: boolean;
}

describe("messagehub-panel auth-race (Iter D3)", () => {
  it("initialisiert nicht, wenn hass noch nicht da ist", async () => {
    const el = document.createElement("messagehub-panel") as PanelLike;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el._initialized).toBe(false);
    document.body.removeChild(el);
  });

  it("initialisiert, sobald hass nachgereicht wird", async () => {
    const el = document.createElement("messagehub-panel") as PanelLike;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el._initialized).toBe(false);
    // hass nachreichen — typischer HA-Race
    el.hass = {
      auth: { data: { access_token: "tok" } },
      connection: { subscribeEvents: async () => () => {} },
    };
    await el.updateComplete;
    // Nach dem hass-Update muss der Initial-Pfad gelaufen sein.
    expect(el._initialized).toBe(true);
    document.body.removeChild(el);
  });

  it("initialisiert nur einmal, auch bei mehreren hass-Updates", async () => {
    const el = document.createElement("messagehub-panel") as PanelLike;
    document.body.appendChild(el);
    el.hass = {
      auth: { data: { access_token: "tok" } },
      connection: { subscribeEvents: async () => () => {} },
    };
    await el.updateComplete;
    expect(el._initialized).toBe(true);
    // Zweiter hass-Wechsel (z. B. neuer Token) darf nicht erneut
    // _reload+_subscribeLive feuern.
    el.hass = {
      auth: { data: { access_token: "tok2" } },
      connection: { subscribeEvents: async () => () => {} },
    };
    await el.updateComplete;
    // Initialized bleibt true — kein Reset.
    expect(el._initialized).toBe(true);
    document.body.removeChild(el);
  });
});
