import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

// Load gitignored .env.e2e.local (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD) without extra deps.
if (existsSync(".env.e2e.local")) {
  const text = readFileSync(".env.e2e.local", "utf8");
  for (const line of text.split("\n")) {
    const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// Local-only E2E. Targets a local Next server wired to the DEV Convex deployment via .env.local.
const PORT = process.env.E2E_PORT ?? "3006";
export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts/,
  timeout: 240_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 240_000,
    actionTimeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
