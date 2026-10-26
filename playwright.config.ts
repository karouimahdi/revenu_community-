import { defineConfig, devices } from '@playwright/test';

// 3001, not 3000: Next.js falls back there itself when 3000 is taken, so
// this also happens to match a dev server you already had running.
const WEB_PORT = 3001;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Both need to be up: Strapi is the data layer, Next.js is the app under
  // test. reuseExistingServer locally picks up a dev server already running.
  webServer: [
    {
      command: 'npm run develop --workspace=apps/cms',
      url: 'http://127.0.0.1:1337/api/discussions',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev --workspace=apps/web',
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { PORT: String(WEB_PORT) },
    },
  ],
});
