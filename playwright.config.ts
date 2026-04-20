import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3100';
const BASE_URL = `http://localhost:${PORT}/orcas-designer`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `PORT=${PORT} NEXT_DIST_DIR=.next-e2e npm run dev`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://e2e-mock.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-mock-anon-key',
      NEXT_DIST_DIR: '.next-e2e',
    },
  },
});
