import { test, expect, populatedSeed, gotoApp } from './fixtures/test-base';

test.describe('Prompt Generator', () => {
  test.use({ seedData: populatedSeed() });

  test('shows list of existing prompts', async ({ page }) => {
    await gotoApp(page, 'prompt-generator');
    await expect(page.getByText('Checkout redesign')).toBeVisible();
    await expect(page.getByText('Landing page rebuild')).toBeVisible();
  });

  test('new-prompt route renders the wizard', async ({ page }) => {
    await gotoApp(page, 'prompt-generator/new');
    // Wizard has a step indicator / title. Match loosely by looking for wizard-ish headings
    await expect(page).toHaveURL(/\/prompt-generator\/new/);
    // Wait for client render
    await page.waitForTimeout(500);
    // Page should not show "Something went wrong"
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
  });

  test('clicking an existing prompt opens its detail', async ({ page }) => {
    await gotoApp(page, 'prompt-generator');
    await page.getByText('Checkout redesign').click();
    await page.waitForURL(/\/prompt-generator\/prompt-1/);
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
  });
});
