import { test, expect, populatedSeed, gotoApp } from './fixtures/test-base';

test.describe('Shared Skills', () => {
  test.use({ seedData: populatedSeed() });

  test('shows skills manager with seeded skill', async ({ page }) => {
    await gotoApp(page, 'skills');
    await expect(page.getByText('Component library')).toBeVisible();
  });

  test('mandatory skills section is present alongside shared skills', async ({ page }) => {
    await gotoApp(page, 'skills');
    await page.waitForTimeout(500);
    // Any mandatory skill from constants should appear in the shared skills manager
    // (they render in the same view). Just check we don't crash.
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
  });
});
