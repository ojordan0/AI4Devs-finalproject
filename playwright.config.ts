import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

import { testDatabaseUrl } from "./tests/support/test-database";

if (existsSync(".env")) {
  process.loadEnvFile();
}

// Its own port, so the tests can run while `npm run dev` is using port 3000.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Pixel 7"] } },
    { name: "webkit", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: `npm run db:migrate && npx tsx scripts/reset-test-database.ts && npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      APP_URL: baseURL,
      DATABASE_URL: testDatabaseUrl(process.env.DATABASE_URL),
    },
  },
});
