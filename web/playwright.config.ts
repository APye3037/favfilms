import { defineConfig } from "@playwright/test";

// Acceptance test config (test-verifier stage). Runs against a real dev
// server talking to the LIVE Supabase project configured in .env.local.
// Not part of `npm test` (Vitest) — invoked explicitly via
// `npx playwright test` so it never interferes with unit-test CI wiring.
export default defineConfig({
  testDir: "./acceptance",
  testMatch: "**/*.pw.ts",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5183",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5183 --strictPort",
    url: "http://localhost:5183",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
