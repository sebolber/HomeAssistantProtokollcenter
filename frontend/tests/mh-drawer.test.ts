// Iter D2: <mh-drawer> Wiederverwendbare Detail-Pane-Komponente.

import { describe, expect, it } from "vitest";
import "../src/components/mh-drawer.js";
import type { LitElement } from "lit";

describe("<mh-drawer>", () => {
  it("rendert nichts, solange open=false", async () => {
    const drawer = document.createElement("mh-drawer") as LitElement;
    document.body.appendChild(drawer);
    await drawer.updateComplete;
    expect(
      drawer.shadowRoot?.querySelector('[data-test="mh-drawer"]'),
    ).toBeFalsy();
    document.body.removeChild(drawer);
  });

  it("rendert Backdrop + Drawer, wenn open=true", async () => {
    const drawer = document.createElement("mh-drawer") as LitElement & {
      open: boolean;
    };
    drawer.open = true;
    document.body.appendChild(drawer);
    await drawer.updateComplete;
    expect(
      drawer.shadowRoot?.querySelector('[data-test="mh-drawer-backdrop"]'),
    ).toBeTruthy();
    expect(
      drawer.shadowRoot?.querySelector('[data-test="mh-drawer"]'),
    ).toBeTruthy();
    document.body.removeChild(drawer);
  });

  it("feuert mh-drawer-close beim Backdrop-Click", async () => {
    const drawer = document.createElement("mh-drawer") as LitElement & {
      open: boolean;
    };
    drawer.open = true;
    document.body.appendChild(drawer);
    await drawer.updateComplete;
    const events: Event[] = [];
    drawer.addEventListener("mh-drawer-close", (ev) => events.push(ev));
    const backdrop = drawer.shadowRoot?.querySelector<HTMLElement>(
      '[data-test="mh-drawer-backdrop"]',
    );
    backdrop?.click();
    expect(events.length).toBe(1);
    document.body.removeChild(drawer);
  });

  it("feuert mh-drawer-close beim Klick auf Schliessen-Button", async () => {
    const drawer = document.createElement("mh-drawer") as LitElement & {
      open: boolean;
    };
    drawer.open = true;
    document.body.appendChild(drawer);
    await drawer.updateComplete;
    const events: Event[] = [];
    drawer.addEventListener("mh-drawer-close", (ev) => events.push(ev));
    const closeBtn = drawer.shadowRoot?.querySelector<HTMLButtonElement>(
      '[data-test="mh-drawer-close-btn"]',
    );
    closeBtn?.click();
    expect(events.length).toBe(1);
    document.body.removeChild(drawer);
  });

  it("feuert mh-drawer-close bei Escape, wenn open=true", async () => {
    const drawer = document.createElement("mh-drawer") as LitElement & {
      open: boolean;
    };
    drawer.open = true;
    document.body.appendChild(drawer);
    await drawer.updateComplete;
    const events: Event[] = [];
    drawer.addEventListener("mh-drawer-close", (ev) => events.push(ev));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(events.length).toBe(1);
    document.body.removeChild(drawer);
  });

  it("ignoriert Escape, wenn open=false", async () => {
    const drawer = document.createElement("mh-drawer") as LitElement & {
      open: boolean;
    };
    drawer.open = false;
    document.body.appendChild(drawer);
    await drawer.updateComplete;
    const events: Event[] = [];
    drawer.addEventListener("mh-drawer-close", (ev) => events.push(ev));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(events.length).toBe(0);
    document.body.removeChild(drawer);
  });

  it("uebernimmt das aria-label aus der label-Property", async () => {
    const drawer = document.createElement("mh-drawer") as LitElement & {
      open: boolean;
      label: string;
    };
    drawer.open = true;
    drawer.label = "Findings Detail";
    document.body.appendChild(drawer);
    await drawer.updateComplete;
    const aside = drawer.shadowRoot?.querySelector<HTMLElement>(
      '[data-test="mh-drawer"]',
    );
    expect(aside?.getAttribute("aria-label")).toBe("Findings Detail");
    document.body.removeChild(drawer);
  });
});
