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

  test('search filters the list and clear button restores it', async ({ page }) => {
    await gotoApp(page, 'memories');
    await expect(page.getByText('Boomi Context').first()).toBeVisible();

    const search = page.locator('ex-input[type="search"]');
    await expect(search).toBeVisible();

    // A query that matches no memories should show the empty state.
    await search.locator('input').fill('zzz-no-match-zzz');
    await expect(page.getByText(/no memories match/i)).toBeVisible();

    // Click the clear (X) button inside the ex-input shadow DOM.
    await search.evaluate((el: HTMLElement & { value: string }) => {
      const clearBtn = el.shadowRoot?.querySelector<HTMLElement>('.input__clear-btn, [class*="clear"]');
      clearBtn?.click();
    });

    await expect(page.getByText('Boomi Context').first()).toBeVisible();
    await expect(page.getByText(/no memories match/i)).toHaveCount(0);
  });
});
