// 00-smoke.spec.ts — Panel laedt, Sidebar-Eintrag sichtbar, alle 4 Top-Tabs erreichbar.
// Erfordert eine laufende HA-Instanz mit installiertem messagehub-Custom-Component.

import { test, expect } from "@playwright/test";

test.describe("Panel-Smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/messagehub");
    // Warten, bis Custom Element gemountet ist (Lit setzt Shadow-DOM auf).
    await page.waitForFunction(() => !!document.querySelector("messagehub-panel"), { timeout: 15_000 });
  });

  test("Panel-Header zeigt 'Message Hub' und 4 Tabs", async ({ page }) => {
    const root = page.locator("messagehub-panel");
    await expect(root).toBeVisible();
    // Tabs sind im Shadow-DOM — direkt via locator-Pfad.
    const tabs = root.locator("nav.tabs button");
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toHaveText(/Nachrichten/);
    await expect(tabs.nth(1)).toHaveText(/Statistik/);
    await expect(tabs.nth(2)).toHaveText(/Einstellungen/);
    await expect(tabs.nth(3)).toHaveText(/Audit/);
  });

  test("Tab 'Statistik' wechselt zu stats-view", async ({ page }) => {
    const root = page.locator("messagehub-panel");
    await root.locator('button[role="tab"]', { hasText: "Statistik" }).click();
    await expect(root.locator("stats-view")).toBeVisible();
  });

  test("Tab 'Einstellungen' wechselt zu settings-view", async ({ page }) => {
    const root = page.locator("messagehub-panel");
    await root.locator('button[role="tab"]', { hasText: "Einstellungen" }).click();
    await expect(root.locator("settings-view")).toBeVisible();
  });

  test("Tab 'Audit' wechselt zu audit-view", async ({ page }) => {
    const root = page.locator("messagehub-panel");
    await root.locator('button[role="tab"]', { hasText: "Audit" }).click();
    await expect(root.locator("audit-view")).toBeVisible();
  });
});
