import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.BER_WAR_MAP_PORT ?? process.env.PORT ?? 3001);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]],
  outputDir: "e2e/test-results",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off"
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } }
    }
  ],
  webServer: {
    command: process.env.PW_WEB_SERVER_CMD ?? "npm run dev",
    url: `http://localhost:${PORT}`,
    // Opt-in reuse only — stale dev servers after `npm run build` cause missing-chunk runtime errors.
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 120_000
  }
});
