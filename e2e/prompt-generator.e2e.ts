import { test, expect, populatedSeed, gotoApp } from './fixtures/test-base';

test.describe('Prompt Generator — list and wizard', () => {
  test.use({ seedData: populatedSeed() });

  test('shows list of existing prompts', async ({ page }) => {
    await gotoApp(page, 'prompt-generator');
    await expect(page.getByText('Checkout redesign')).toBeVisible();
    await expect(page.getByText('Landing page rebuild')).toBeVisible();
  });

  test('new-prompt route renders the 8-step wizard', async ({ page }) => {
    await gotoApp(page, 'prompt-generator/new');
    await expect(page).toHaveURL(/\/prompt-generator\/new/);
    await page.waitForTimeout(500);
    // First step header
    await expect(page.getByRole('heading', { name: /Company & Product/i })).toBeVisible();
    // No crash
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
  });

  test('wizard sidebar lists the 8 step labels', async ({ page }) => {
    await gotoApp(page, 'prompt-generator/new');
    await page.waitForTimeout(500);
    const stepLabels = [
      'Company & Product',
      'Feature',
      'Current State',
      'Design System',
      'Voice & Writing',
      'Deliverables & Constraints',
      'Skills & Memories',
      'Review & Generate',
    ];
    for (const label of stepLabels) {
      await expect(page.getByRole('button', { name: new RegExp(`Go to step.*${label}`, 'i') })).toBeVisible();
    }
  });
});

test.describe('Prompt Generator — detail & versions', () => {
  test.use({ seedData: populatedSeed() });

  test('detail page shows versions sidebar', async ({ page }) => {
    await gotoApp(page, 'prompt-generator');
    await page.getByText('Checkout redesign').click();
    await page.waitForURL(/\/prompt-generator\/prompt-1/);
    // The AI-authored version content should render (v2 is latest completed)
    await expect(page.getByText(/Claude Code Brief/i)).toBeVisible();
    // Both versions appear in the sidebar. Scope to the Version history aside
    // because v2 also appears as the detail-panel heading when it is selected.
    const versionsAside = page.getByRole('complementary', { name: 'Version history' });
    await expect(versionsAside.getByText('Legacy (template)')).toBeVisible();
    await expect(versionsAside.getByText('v2')).toBeVisible();
  });

  test('selecting the legacy version swaps the content panel', async ({ page }) => {
    await gotoApp(page, 'prompt-generator');
    await page.getByText('Checkout redesign').click();
    await page.waitForURL(/\/prompt-generator\/prompt-1/);
    await page.getByText('Legacy (template)').click();
    await expect(page.getByText(/Legacy template output for Checkout/i)).toBeVisible();
  });

  test('regenerate button opens confirmation dialog', async ({ page }) => {
    await gotoApp(page, 'prompt-generator');
    await page.getByText('Checkout redesign').click();
    await page.waitForURL(/\/prompt-generator\/prompt-1/);
    await page.getByRole('button', { name: /^Regenerate$/i }).click();
    // ExDialog renders role="dialog" (not alertdialog) and exposes dialogTitle
    // as the accessible name rather than a text child. The description is
    // slotted into <ex-dialog>'s light DOM so it lives outside the shadow-DOM
    // role="dialog" subtree — assert the unique description text at page level.
    const dialog = page.getByRole('dialog', { name: /Regenerate with Claude Opus 4.7/i });
    await expect(dialog).toBeVisible();
    await expect(page.getByText(/Last version used/i)).toBeVisible();
  });
});
