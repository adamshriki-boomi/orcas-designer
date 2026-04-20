import { test as base, expect } from '@playwright/test';
import { mockSupabase, type MockSupabaseHandle } from './fixtures/mock-supabase';
import { emptySeed, type SeedData } from './fixtures/seed-data';
import { gotoApp } from './fixtures/test-base';

type AuthFixtures = {
  supabase: MockSupabaseHandle;
  seedData: SeedData;
};

/** Auth tests bypass the auto-login fixture to exercise the actual login flow. */
const test = base.extend<AuthFixtures>({
  seedData: async ({}, use) => {
    await use(emptySeed());
  },
  supabase: async ({ page, seedData }, use) => {
    const handle = await mockSupabase(page, seedData);
    await use(handle);
  },
});

test.describe('Auth', () => {
  test('redirects unauthenticated users from / to /login', async ({ page, supabase }) => {
    void supabase;
    await gotoApp(page);
    await page.waitForURL(/\/orcas-designer\/login$/);
    await expect(page.getByRole('heading', { name: 'Orcas Designer' })).toBeVisible();
  });

  test('login page shows magic link form by default', async ({ page, supabase }) => {
    void supabase;
    await gotoApp(page, 'login');
    await expect(page.getByRole('button', { name: 'Send magic link' })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with password instead/i })).toBeVisible();
  });

  test('can switch to password mode', async ({ page, supabase }) => {
    void supabase;
    await gotoApp(page, 'login');
    await page.getByRole('button', { name: /sign in with password instead/i }).click();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /use magic link instead/i })).toBeVisible();
  });

  test('password login redirects to dashboard on success', async ({ page, supabase }) => {
    void supabase;
    await gotoApp(page, 'login');
    await page.getByRole('button', { name: /sign in with password instead/i }).click();
    await page.getByPlaceholder('you@boomi.com').fill('test@boomi.com');
    await page.getByPlaceholder('Enter your password').fill('test-password');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.waitForURL(/\/orcas-designer\/?$/, { timeout: 15_000 });
    // Landed on dashboard — sidebar is visible
    await expect(page.getByRole('menuitem', { name: 'Dashboard' })).toBeVisible();
  });

  test('magic link submit shows confirmation state', async ({ page, supabase }) => {
    void supabase;
    await gotoApp(page, 'login');
    await page.getByPlaceholder('you@boomi.com').fill('test@boomi.com');
    await page.getByRole('button', { name: 'Send magic link' }).click();
    await expect(page.getByText(/check your email/i)).toBeVisible();
    await expect(page.getByText('test@boomi.com')).toBeVisible();
  });
});
