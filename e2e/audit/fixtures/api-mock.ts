// Mock-Helper fuer Playwright-Tests, die ohne echte HA-Instanz laufen sollen.
// Verwendung:
//   import { mockMessagehubApi } from "./fixtures/api-mock.js";
//   await mockMessagehubApi(page, { messages: [...], stats: {...} });

import type { Page, Route } from "@playwright/test";

export interface MockData {
  messages?: Array<Record<string, unknown>>;
  sources?: string[];
  stats?: { total: number; severity_24h: Record<string, number> };
  webhooks?: Array<Record<string, unknown>>;
  channels?: Array<Record<string, unknown>>;
  mqttTopics?: Array<Record<string, unknown>>;
  heartbeats?: Array<Record<string, unknown>>;
  remediationHooks?: Array<Record<string, unknown>>;
  audit?: Array<Record<string, unknown>>;
}

export async function mockMessagehubApi(page: Page, data: MockData = {}): Promise<void> {
  await page.route("**/api/messagehub/messages**", (route: Route) => {
    if (route.request().method() === "DELETE") {
      return route.fulfill({ json: { deleted: 0 } });
    }
    return route.fulfill({
      json: {
        items: data.messages ?? [],
        total: data.messages?.length ?? 0,
        limit: 100,
        offset: 0,
      },
    });
  });

  await page.route("**/api/messagehub/sources", (route: Route) =>
    route.fulfill({ json: { sources: data.sources ?? [] } }),
  );

  await page.route("**/api/messagehub/stats", (route: Route) =>
    route.fulfill({
      json: data.stats ?? { total: 0, severity_24h: { error: 0, warning: 0, info: 0, debug: 0 } },
    }),
  );

  await page.route("**/api/messagehub/stats-extended**", (route: Route) =>
    route.fulfill({
      json: { heatmap: [], top_sources: [], mttr_per_source: [], severity_time_series: [] },
    }),
  );

  await page.route("**/api/messagehub/webhooks**", (route: Route) =>
    route.fulfill({ json: { webhooks: data.webhooks ?? [] } }),
  );

  await page.route("**/api/messagehub/channels**", (route: Route) =>
    route.fulfill({ json: { items: data.channels ?? [] } }),
  );

  await page.route("**/api/messagehub/mqtt-topics**", (route: Route) =>
    route.fulfill({ json: { items: data.mqttTopics ?? [] } }),
  );

  await page.route("**/api/messagehub/heartbeats**", (route: Route) =>
    route.fulfill({ json: { items: data.heartbeats ?? [] } }),
  );

  await page.route("**/api/messagehub/remediation-hooks**", (route: Route) =>
    route.fulfill({ json: { items: data.remediationHooks ?? [] } }),
  );

  await page.route("**/api/messagehub/audit**", (route: Route) =>
    route.fulfill({ json: { items: data.audit ?? [] } }),
  );

  await page.route("**/api/messagehub/saved-filters**", (route: Route) =>
    route.fulfill({ json: { items: [] } }),
  );

  await page.route("**/api/messagehub/findings**", (route: Route) =>
    route.fulfill({ json: { items: [], total: 0, limit: 100, offset: 0 } }),
  );

  await page.route("**/api/messagehub/knx-addresses**", (route: Route) =>
    route.fulfill({ json: { items: [] } }),
  );

  await page.route("**/api/messagehub/knx-stats/**", (route: Route) =>
    route.fulfill({ json: {} }),
  );
}
