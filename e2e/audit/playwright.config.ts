import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const HA_BASE_URL = process.env.HA_BASE_URL ?? "http://localhost:8124";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: HA_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    extraHTTPHeaders: process.env.HA_TOKEN
      ? { Authorization: `Bearer ${process.env.HA_TOKEN}` }
      : undefined,
  },
  projects: [
    {
      name: "chromium-admin",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
