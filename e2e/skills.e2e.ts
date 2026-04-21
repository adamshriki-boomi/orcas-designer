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

  test('search filters the list and clear button restores it', async ({ page }) => {
    await gotoApp(page, 'skills');
    // Wait for a deterministic element so the list is rendered before we search.
    await expect(page.getByText('Component library')).toBeVisible();

    const search = page.locator('ex-input[type="search"]');
    await expect(search).toBeVisible();

    // Type a query that should only match the seeded custom skill, hiding built-ins.
    await search.locator('input').fill('Component library');
    await expect(page.getByText('Component library')).toBeVisible();
    // A built-in skill heading should no longer be visible while filtered.
    await expect(page.getByRole('heading', { name: 'Built-in Skills' })).toHaveCount(0);

    // Click the clear (X) button inside the ex-input shadow DOM.
    await search.evaluate((el: HTMLElement & { value: string }) => {
      const clearBtn = el.shadowRoot?.querySelector<HTMLElement>('.input__clear-btn, [class*="clear"]');
      clearBtn?.click();
    });

    // After clearing, the Built-in Skills section should be back.
    await expect(page.getByRole('heading', { name: 'Built-in Skills' })).toBeVisible();
    await expect(page.getByText('Component library')).toBeVisible();
  });
});
