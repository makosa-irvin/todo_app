import { defineConfig, devices } from '@playwright/test';

/**
 * Both servers share one in-memory todo store for the whole test run,
 * so specs run serially and each one clears the store in beforeEach
 * rather than relying on test order or a fresh backend per test.
 *
 * Set PLAYWRIGHT_BASE_URL to run against a deployed environment instead
 * of localhost (e.g. to smoke-test a Vercel + Render deploy) — Playwright
 * then skips starting local dev servers and just points the browser at
 * the given URL. tests/helpers.ts reads PLAYWRIGHT_API_URL the same way,
 * for clearing todos directly against the deployed API:
 *
 *   PLAYWRIGHT_BASE_URL=https://todo-app.vercel.app \
 *   PLAYWRIGHT_API_URL=https://todo-api.onrender.com \
 *   npx playwright test
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const isRemote = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: isRemote
    ? undefined
    : [
        {
          command: 'npm run dev',
          cwd: '../server',
          url: 'http://localhost:4000/api/health',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
        {
          command: 'npm run dev',
          cwd: '../client',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

