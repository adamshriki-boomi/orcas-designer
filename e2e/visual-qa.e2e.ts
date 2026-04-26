import { test, expect, populatedSeed, emptySeed, gotoApp } from './fixtures/test-base';

test.describe('Visual QA', () => {
  test.describe('Empty state', () => {
    test.use({ seedData: emptySeed() });

    test('list page renders empty state with a New Visual QA CTA', async ({ page }) => {
      await gotoApp(page, 'visual-qa');
      await expect(page.getByRole('heading', { name: 'Visual QA', exact: true })).toBeVisible();
      await expect(page.getByText(/no visual qa reports yet/i)).toBeVisible();
      const ctas = page.getByRole('link', { name: /new visual qa/i });
      await expect(ctas.first()).toBeVisible();
    });

    test('new page renders the form with title, design tabs, implementation upload', async ({ page }) => {
      await gotoApp(page, 'visual-qa/new');
      await expect(page).toHaveURL(/\/visual-qa\/new/);
      await expect(page.getByRole('heading', { name: 'New Visual QA' })).toBeVisible();
      // Title field is present
      await expect(page.getByLabel('Title')).toBeVisible();
      // Tabs for design source
      await expect(page.getByRole('button', { name: 'Upload', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Figma URL' })).toBeVisible();
      // Implementation section (CardTitle renders as a div, not a heading)
      await expect(page.getByText('Implementation', { exact: true })).toBeVisible();
      // Run button is disabled until inputs are valid
      await expect(page.getByRole('button', { name: /run visual qa/i })).toBeDisabled();
      await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
    });

    test('switching to Figma URL tab reveals a URL input', async ({ page }) => {
      await gotoApp(page, 'visual-qa/new');
      await page.getByRole('button', { name: 'Figma URL' }).click();
      await expect(page.getByLabel(/figma node url/i)).toBeVisible();
    });
  });

  test.describe('Populated state', () => {
    test.use({ seedData: populatedSeed() });

    test('list page surfaces the seeded report with severity counts', async ({ page }) => {
      await gotoApp(page, 'visual-qa');
      await expect(page.getByText('Onboarding hero')).toBeVisible();
      await expect(page.getByText(/High 1/i).first()).toBeVisible();
      await expect(page.getByText(/Med 1/i).first()).toBeVisible();
    });

    test('clicking a report opens its detail page with findings', async ({ page }) => {
      await gotoApp(page, 'visual-qa');
      await page.getByText('Onboarding hero').click();
      await page.waitForURL(/\/visual-qa\/vqa-1/);
      await expect(page.getByRole('heading', { name: 'Component' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Typography' })).toBeVisible();
      await expect(page.getByText(/CTA renders as outlined/i)).toBeVisible();
      await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
    });

    test('finding fields are editable in place', async ({ page }) => {
      await gotoApp(page, 'visual-qa/vqa-1');
      await page.waitForURL(/\/visual-qa\/vqa-1/);
      // Two findings have a Location input; target the one currently set to "Hero CTA".
      const locationInput = page.locator('input[value="Hero CTA"]').first();
      await expect(locationInput).toBeVisible();
      await locationInput.fill('Hero CTA — top right');
      await expect(page.locator('input[value="Hero CTA — top right"]')).toBeVisible();
    });
  });
});
