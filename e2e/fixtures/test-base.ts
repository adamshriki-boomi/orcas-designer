import { test as base, expect, type Page } from '@playwright/test';
import { mockSupabase, type MockSupabaseHandle } from './mock-supabase';
import { emptySeed, populatedSeed, type SeedData } from './seed-data';

export const APP_BASE = '/orcas-designer';

/** Navigate to an app route, automatically prepending the Next.js basePath. */
export async function gotoApp(page: Page, path: string = ''): Promise<void> {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  await page.goto(path === '' ? APP_BASE : `${APP_BASE}${suffix}`);
}

type Fixtures = {
  supabase: MockSupabaseHandle;
  authenticatedPage: void;
  seedData: SeedData;
};

/**
 * Performs a real login flow via the password form. The mock's
 * /auth/v1/token?grant_type=password handler returns a valid session, and
 * the Supabase client persists it using its own cookie format so subsequent
 * page loads are authenticated.
 */
async function signIn(page: Page): Promise<void> {
  await gotoApp(page, 'login');
  await page.getByRole('button', { name: /sign in with password instead/i }).click();
  await page.getByPlaceholder('you@boomi.com').fill('test@boomi.com');
  await page.getByPlaceholder('Enter your password').fill('test-password');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(/\/orcas-designer\/?$/, { timeout: 15_000 });
}

export const test = base.extend<Fixtures>({
  seedData: async ({}, use) => {
    await use(emptySeed());
  },
  supabase: async ({ page, seedData }, use) => {
    const handle = await mockSupabase(page, seedData);
    await use(handle);
  },
  authenticatedPage: [
    async ({ page, supabase }, use) => {
      void supabase;
      await signIn(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
export { emptySeed, populatedSeed };
