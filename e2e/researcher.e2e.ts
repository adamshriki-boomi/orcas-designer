import { test, expect, populatedSeed, gotoApp } from './fixtures/test-base';

test.describe('Researcher', () => {
  test.use({ seedData: populatedSeed() });

  test('shows list of research projects with status', async ({ page }) => {
    await gotoApp(page, 'researcher');
    await expect(page.getByText('Persona study')).toBeVisible();
    await expect(page.getByText('Checkout heuristic evaluation')).toBeVisible();
  });

  test('running project shows Running badge', async ({ page }) => {
    await gotoApp(page, 'researcher');
    // ExBadge with "Running" text should appear for the running project
    await expect(page.getByText('Running').first()).toBeVisible();
    await expect(page.getByText('Completed').first()).toBeVisible();
  });

  test('new-research route renders the wizard', async ({ page }) => {
    await gotoApp(page, 'researcher/new');
    await expect(page).toHaveURL(/\/researcher\/new/);
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
  });

  test('clicking a project opens its detail page', async ({ page }) => {
    await gotoApp(page, 'researcher');
    await page.getByText('Checkout heuristic evaluation').click();
    await page.waitForURL(/\/researcher\/research-completed-1/);
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
  });
});
