import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * CivicResolve Playwright E2E — critical role flows against a running app + seeded DB.
 *
 * Prerequisites: migrate + seed, then either leave `npm run dev` up or let webServer start it.
 */
const PORT = Number(process.env.E2E_PORT || 3000);
// Prefer localhost to match AUTH_URL in .env (cookies / Auth.js trust host)
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: path.join(__dirname, "e2e"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Prefer desktop viewport so complaint tables (not mobile cards) render
    ...devices["Desktop Chrome"],
  },
  globalTeardown: path.join(__dirname, "e2e", "global-teardown.ts"),
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.E2E_WEB_SERVER_COMMAND || "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
