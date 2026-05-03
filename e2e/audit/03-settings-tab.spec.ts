// 03-settings-tab.spec.ts — Alle 6 Settings-Sub-Tabs erreichbar.
// Bekannte UI-Luecken sind als test.fixme markiert — sie werden GRUEN, sobald
// der Fix implementiert ist (dann: test.fixme → test umstellen).

import { test, expect } from "@playwright/test";

test.describe("Settings-Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/messagehub");
    await page.waitForFunction(() => !!document.querySelector("messagehub-panel"));
    await page.locator("messagehub-panel").locator('button[role="tab"]', { hasText: "Einstellungen" }).click();
  });

  test("6 Sub-Tabs sichtbar: Webhooks, KNX-Bus, Channels, MQTT, Heartbeats, Auto-Remediation", async ({ page }) => {
    const settings = page.locator("messagehub-panel >> settings-view");
    const tabs = settings.locator("nav.tabs button");
    await expect(tabs).toHaveCount(6);
    await expect(tabs.nth(0)).toContainText("Webhooks");
    await expect(tabs.nth(1)).toContainText("KNX-Bus");
    await expect(tabs.nth(2)).toContainText("Channels");
    await expect(tabs.nth(3)).toContainText("MQTT");
    await expect(tabs.nth(4)).toContainText("Heartbeats");
    await expect(tabs.nth(5)).toContainText("Auto-Remediation");
  });

  test("Webhooks: listWebhooks wird beim Tab-Mount aufgerufen", async ({ page }) => {
    const reqPromise = page.waitForRequest((r) => r.url().endsWith("/api/messagehub/webhooks"));
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "Webhooks" }).click();
    await reqPromise;
  });

  test("KNX-Bus: knx-addresses-view rendert", async ({ page }) => {
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "KNX-Bus" }).click();
    await expect(settings.locator("knx-addresses-view")).toBeVisible();
  });

  test("Channels: channels-view rendert + listChannels() wird aufgerufen", async ({ page }) => {
    const reqPromise = page.waitForRequest((r) => r.url().endsWith("/api/messagehub/channels"));
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "Channels" }).click();
    await expect(settings.locator("channels-view")).toBeVisible();
    await reqPromise;
  });

  // F-001 — Channel-Test-Knopf fehlt im UI.
  test.fixme("F-001: Channels haben einen 'Test'-Knopf, der POST /channels/{id}/test ausloest", async ({ page }) => {
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "Channels" }).click();
    const channels = settings.locator("channels-view");
    const testButton = channels.locator('button:has-text("Test")').first();
    await expect(testButton).toBeVisible({ timeout: 3000 });
    const reqPromise = page.waitForRequest((r) => r.url().includes("/channels/") && r.url().endsWith("/test"));
    await testButton.click();
    await reqPromise;
  });

  test("MQTT: mqtt-topics-view rendert + listMqttTopics() wird aufgerufen", async ({ page }) => {
    const reqPromise = page.waitForRequest((r) => r.url().endsWith("/api/messagehub/mqtt-topics"));
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "MQTT" }).click();
    await expect(settings.locator("mqtt-topics-view")).toBeVisible();
    await reqPromise;
  });

  // F-002 — MQTT-Topic-Edit fehlt im UI (Backend-PUT-Endpoint existiert).
  test.fixme("F-002: MQTT-Topic-Zeilen haben einen 'Edit'-Knopf, der PUT /mqtt-topics/{id} ausloest", async ({ page }) => {
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "MQTT" }).click();
    const view = settings.locator("mqtt-topics-view");
    const firstRow = view.locator("tbody tr").first();
    if ((await firstRow.count()) === 0) test.skip(true, "Keine MQTT-Topics — Edit-Test ueberspringen");
    const editButton = firstRow.locator('button:has-text("Edit"), button:has-text("Bearbeiten")');
    await expect(editButton).toBeVisible({ timeout: 3000 });
  });

  test("Heartbeats: heartbeats-view rendert + listHeartbeats() wird aufgerufen", async ({ page }) => {
    const reqPromise = page.waitForRequest((r) => r.url().endsWith("/api/messagehub/heartbeats"));
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "Heartbeats" }).click();
    await expect(settings.locator("heartbeats-view")).toBeVisible();
    await reqPromise;
  });

  // F-005 — Heartbeat-Delete fehlt im UI UND Backend.
  test.fixme("F-005: Heartbeat-Zeilen haben 'Loeschen'-Knopf, der DELETE /heartbeats/{source} ausloest", async ({ page }) => {
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "Heartbeats" }).click();
    const firstRow = settings.locator("heartbeats-view tbody tr").first();
    if ((await firstRow.count()) === 0) test.skip(true, "Keine Heartbeats — Test ueberspringen");
    const deleteButton = firstRow.locator('button:has-text("Loeschen")');
    await expect(deleteButton).toBeVisible({ timeout: 3000 });
  });

  test("Auto-Remediation: remediation-view rendert + listRemediationHooks() wird aufgerufen", async ({ page }) => {
    const reqPromise = page.waitForRequest((r) => r.url().endsWith("/api/messagehub/remediation-hooks"));
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "Auto-Remediation" }).click();
    await expect(settings.locator("remediation-view")).toBeVisible();
    await reqPromise;
  });

  // F-006 — Remediation-Hook-Edit fehlt im UI UND Backend.
  test.fixme("F-006: Remediation-Hook-Zeilen haben 'Edit'-Knopf, der PUT /remediation-hooks/{id} ausloest", async ({ page }) => {
    const settings = page.locator("messagehub-panel >> settings-view");
    await settings.locator("button.tab", { hasText: "Auto-Remediation" }).click();
    const firstRow = settings.locator("remediation-view tbody tr").first();
    if ((await firstRow.count()) === 0) test.skip(true, "Keine Hooks — Test ueberspringen");
    const editButton = firstRow.locator('button:has-text("Edit"), button:has-text("Bearbeiten")');
    await expect(editButton).toBeVisible({ timeout: 3000 });
  });
});
