// 02-stats-tab.spec.ts — Stats-Sub-Tabs + Hash-Routing.

import { test, expect } from "@playwright/test";

test.describe("Stats-Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/messagehub");
    await page.waitForFunction(() => !!document.querySelector("messagehub-panel"));
    await page.locator("messagehub-panel").locator('button[role="tab"]', { hasText: "Statistik" }).click();
  });

  test("Drei Sub-Tabs sichtbar: Live-Status, KNX-Bus-Analyse, Konfigurations-Check", async ({ page }) => {
    const stats = page.locator("messagehub-panel >> stats-view");
    await expect(stats).toBeVisible();
    const subtabs = stats.locator("nav.subtabs button");
    await expect(subtabs).toHaveCount(3);
  });

  test("Sub-Tab 'Live-Status' rendert stats-live-view + ruft GET /stats", async ({ page }) => {
    const reqPromise = page.waitForRequest((req) => req.url().includes("/api/messagehub/stats"));
    const stats = page.locator("messagehub-panel >> stats-view");
    await stats.locator("button.subtab", { hasText: "Live-Status" }).click();
    await expect(stats.locator("stats-live-view")).toBeVisible();
    await reqPromise;
  });

  test("Sub-Tab 'KNX-Bus-Analyse' rendert stats-knx-view + ruft GET /knx-stats/summary", async ({ page }) => {
    const reqPromise = page.waitForRequest((req) =>
      req.url().includes("/api/messagehub/knx-stats/summary"),
    );
    const stats = page.locator("messagehub-panel >> stats-view");
    await stats.locator("button.subtab", { hasText: "KNX-Bus-Analyse" }).click();
    await expect(stats.locator("stats-knx-view")).toBeVisible();
    await reqPromise;
  });

  test("Hash-Routing: /messagehub#findings oeffnet Konfigurations-Check", async ({ page }) => {
    await page.evaluate(() => {
      window.location.hash = "#findings";
    });
    const stats = page.locator("messagehub-panel >> stats-view");
    await expect(stats.locator("findings-view")).toBeVisible();
  });

  test("Hash-Routing mit Source-Filter: /messagehub#findings?source=1.1.42", async ({ page }) => {
    await page.evaluate(() => {
      window.location.hash = "#findings?source=1.1.42";
    });
    const stats = page.locator("messagehub-panel >> stats-view");
    await expect(stats.locator("findings-view")).toBeVisible();
    // Findings-View sollte den Source-Filter anwenden — Verifikation via Request.
    const req = await page.waitForRequest((r) =>
      r.url().includes("/api/messagehub/findings") && r.url().includes("source=1.1.42"),
    );
    expect(req).toBeTruthy();
  });

  // F-010 / Iter +11: erweitertes Deep-Link-Routing.
  test("F-010: #stats/knx oeffnet KNX-Bus-Analyse-Sub-Tab direkt", async ({ page }) => {
    await page.goto("/messagehub#stats/knx");
    await page.waitForFunction(() => !!document.querySelector("messagehub-panel"));
    const stats = page.locator("messagehub-panel >> stats-view");
    await expect(stats.locator("stats-knx-view")).toBeVisible();
  });

  test("F-010: #settings/mqtt oeffnet Settings-Tab + MQTT-Sub-Tab direkt", async ({ page }) => {
    await page.goto("/messagehub#settings/mqtt");
    await page.waitForFunction(() => !!document.querySelector("messagehub-panel"));
    const settings = page.locator("messagehub-panel >> settings-view");
    await expect(settings.locator("mqtt-topics-view")).toBeVisible();
  });

  test("F-010: Tab-Klick aktualisiert URL-Hash (Browser-History)", async ({ page }) => {
    await page.goto("/messagehub");
    await page.waitForFunction(() => !!document.querySelector("messagehub-panel"));
    await page
      .locator("messagehub-panel")
      .locator('button[role="tab"]', { hasText: "Audit" })
      .click();
    await expect(page).toHaveURL(/#audit$/);
  });
});
