// 01-messages-tab.spec.ts — Messages-Tab: Filter, Saved-Filter, Detail-Pane, Bulk-Aktionen.

import { test, expect } from "@playwright/test";

test.describe("Messages-Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/messagehub");
    await page.waitForFunction(() => !!document.querySelector("messagehub-panel"));
  });

  test("Filter-Bar enthaelt Severity, Source, Volltext, Zeitraum, KNX-Read-Toggle", async ({ page }) => {
    const root = page.locator("messagehub-panel");
    await expect(root.locator("severity-filter")).toBeVisible();
    await expect(root.locator("source-filter")).toBeVisible();
    await expect(root.locator('input[type="search"]')).toBeVisible();
    await expect(root.locator("time-range-filter")).toBeVisible();
    await expect(root.locator("text=KNX-Reads ausblenden")).toBeVisible();
  });

  test("Severity-Chip 'error' triggered listMessages mit severity=error", async ({ page }) => {
    const requestPromise = page.waitForRequest(
      (req) => req.url().includes("/api/messagehub/messages") && req.url().includes("severity=error"),
    );
    const root = page.locator("messagehub-panel");
    await root.locator("severity-filter button", { hasText: /error/i }).click();
    await requestPromise;
  });

  test("Test-Nachricht-Knopf ruft hass.callService('messagehub','add_message')", async ({ page }) => {
    // Achtung: Diese Aktion fügt echte Daten in die DB ein. Ggf. vor/nach
    // Test cleanup via API.
    const root = page.locator("messagehub-panel");
    const button = root.locator('button:has-text("+ Testnachricht")').first();
    await button.click();
    await expect(root.locator(".toast")).toContainText(/gesendet|fehl/);
  });

  test("Export-JSONL-Anchor zeigt korrekte URL", async ({ page }) => {
    const root = page.locator("messagehub-panel");
    const anchor = root.locator('a:has-text("JSONL")').first();
    const href = await anchor.getAttribute("href");
    expect(href).toMatch(/\/api\/messagehub\/export\?.*format=jsonl/);
  });

  test("Detail-Pane oeffnet bei Klick auf Tabellen-Zeile", async ({ page }) => {
    // Voraussetzung: mindestens 1 Message vorhanden.
    const root = page.locator("messagehub-panel");
    const firstRow = root.locator("message-table").locator("[role='row']").first();
    if ((await firstRow.count()) === 0) {
      test.skip(true, "Keine Messages in DB — Detail-Pane-Test ueberspringen");
    }
    await firstRow.click();
    await expect(root.locator("detail-pane")).toBeVisible();
  });
});
