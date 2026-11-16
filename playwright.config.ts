import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke tests against the production build (`npm run build` first).
 * Uses the installed Google Chrome (channel "chrome"), so no browser download is needed.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173", trace: "retain-on-failure" },
  webServer: { command: "npm run preview", port: 4173, reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "tablet", use: { viewport: { width: 820, height: 1180 }, hasTouch: true, channel: "chrome" } },
    { name: "phone", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
});
