// 04-audit-tab.spec.ts — Audit-Tab vollstaendig.

import { test, expect } from "@playwright/test";

test.describe("Audit-Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/messagehub");
    await page.waitForFunction(() => !!document.querySelector("messagehub-panel"));
    await page.locator("messagehub-panel").locator('button[role="tab"]', { hasText: "Audit" }).click();
  });

  test("Audit-Tab laedt + ruft GET /audit?limit=200", async ({ page }) => {
    const reqPromise = page.waitForRequest((r) =>
      r.url().includes("/api/messagehub/audit") && r.url().includes("limit=200"),
    );
    await page.locator("messagehub-panel >> audit-view").waitFor();
    await reqPromise;
  });

  test("'Alle loeschen'-Knopf vorhanden", async ({ page }) => {
    const audit = page.locator("messagehub-panel >> audit-view");
    const clearBtn = audit.locator('button:has-text("Alle löschen"), button:has-text("Alle loeschen")');
    await expect(clearBtn).toBeVisible();
  });
});

test.describe("Findings-Tab — Unack-Luecke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/messagehub#findings");
    await page.waitForFunction(() => !!document.querySelector("messagehub-panel"));
  });

  // F-004 — Findings-Unack-Knopf fehlt im UI (ApiClient-Methode existiert ungenutzt).
  test.fixme("F-004: Akzeptierte Findings haben 'Ack zuruecknehmen'-Knopf", async ({ page }) => {
    const findings = page.locator("messagehub-panel >> stats-view >> findings-view");
    const ackedItem = findings.locator('[data-acked="true"]').first();
    if ((await ackedItem.count()) === 0) test.skip(true, "Keine acked Findings — Test ueberspringen");
    const unackBtn = ackedItem.locator(
      'button:has-text("Unack"), button:has-text("Ack zur"), button:has-text("Ack entfernen")',
    );
    await expect(unackBtn).toBeVisible({ timeout: 3000 });
    const reqPromise = page.waitForRequest(
      (r) => r.method() === "DELETE" && r.url().includes("/findings/ack/"),
    );
    await unackBtn.click();
    await reqPromise;
  });
});
