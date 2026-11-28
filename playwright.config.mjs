import { defineConfig, devices } from "@playwright/test";

/* Every page is tested on a desktop, an iPhone and an iPad (real WebKit for the Apple ones). */
export default defineConfig({
  testDir: "tests",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    // Test exactly what gets published: build _site/ first, then serve it like GitHub Pages does.
    command: "node scripts/build.mjs && node scripts/serve.mjs 4173 _site",
    url: "http://localhost:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "iphone", use: { ...devices["iPhone 13"] } },
    { name: "ipad", use: { ...devices["iPad (gen 7)"] } },
  ],
});
