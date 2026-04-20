import { test, expect, populatedSeed, gotoApp } from './fixtures/test-base';

test.describe('UX Writer', () => {
  test.use({ seedData: populatedSeed() });

  test('shows list of analyses', async ({ page }) => {
    await gotoApp(page, 'ux-writer');
    await expect(page.getByText('Settings page copy review')).toBeVisible();
  });

  test('new-analysis route renders the form', async ({ page }) => {
    await gotoApp(page, 'ux-writer/new');
    await expect(page).toHaveURL(/\/ux-writer\/new/);
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
  });

  test('clicking an analysis opens its detail page', async ({ page }) => {
    await gotoApp(page, 'ux-writer');
    await page.getByText('Settings page copy review').click();
    await page.waitForURL(/\/ux-writer\/ux-1/);
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
  });
});
