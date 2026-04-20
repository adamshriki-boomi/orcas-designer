import { test, expect, populatedSeed, gotoApp } from './fixtures/test-base';

test.describe('Shared Memories', () => {
  test.use({ seedData: populatedSeed() });

  test('shows memories manager with built-in memory', async ({ page }) => {
    await gotoApp(page, 'memories');
    await expect(page.getByText('Boomi Context').first()).toBeVisible();
  });

  test('page renders without crashing', async ({ page }) => {
    await gotoApp(page, 'memories');
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
  });
});
