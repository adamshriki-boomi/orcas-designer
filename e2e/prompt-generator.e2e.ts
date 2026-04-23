import { test, expect, emptySeed, populatedSeed, gotoApp } from './fixtures/test-base';

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
      'Feature Definition',
      'Feature Information',
      'Design System',
      'Voice & Writing',
      'Design Products',
      'Skills & Memories',
      'Review & Generate',
    ];
    for (const label of stepLabels) {
      await expect(page.getByRole('button', { name: new RegExp(`Go to step.*${label}`, 'i') })).toBeVisible();
    }
  });

  test('Feature Information step shows Current state only in improvement mode', async ({ page }) => {
    // Step indexes (0-based in URL): 1 = Feature Definition, 2 = Feature
    // Information. The "Current state" sub-section on step 2 is conditional
    // on the mode picked in step 1. Navigate between them via sidebar clicks
    // (soft navigation) so wizard form state persists.
    await gotoApp(page, `prompt-generator/new?step=2`);
    await page.waitForTimeout(500);

    // New mode is the emptyPrompt default — Current state should NOT render.
    await expect(page.getByRole('heading', { name: /^Current state/i })).toHaveCount(0);

    // Click the step-1 sidebar button (soft nav preserves form state).
    await page.getByRole('button', { name: /Go to step.*Feature Definition/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /Improvement of existing feature/i }).click();

    // Back to step 2 via sidebar — same wizard instance, state preserved.
    await page.getByRole('button', { name: /Go to step.*Feature Information/i }).click();
    await page.waitForTimeout(200);

    await expect(page.getByRole('heading', { name: /^Current state/i })).toBeVisible();
  });

  test('Design Products step blocks progression until one output is selected', async ({ page }) => {
    // Step 5 is Design Products. emptyPrompt defaults products=['wireframe'],
    // so the step starts valid. Deselect wireframe and assert the validation
    // message appears inline.
    await gotoApp(page, `prompt-generator/new?step=5`);
    await page.waitForTimeout(500);

    // Initially valid — no warning text.
    await expect(page.getByText(/Pick at least one output/i)).toHaveCount(0);

    // Toggle off the default wireframe selection.
    await page.getByRole('button', { name: /^Wireframe/i }).click();

    await expect(page.getByText(/Pick at least one output/i)).toBeVisible();
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

test.describe('Prompt Generator — review step, no API key', () => {
  // Seed without any user_settings row so hasApiKey=false and the inline
  // API-key prompt renders on step 7 (Review & Generate).
  test.use({ seedData: { ...emptySeed(), user_settings: [] } });

  test('review step shows inline API-key input instead of a Settings link', async ({ page }) => {
    await gotoApp(page, 'prompt-generator/new?step=7');
    // Wizard is client-rendered — give hydration a beat.
    await page.waitForTimeout(500);

    // Banner header is visible.
    await expect(page.getByRole('heading', { name: /Claude API key required/i })).toBeVisible();

    // Critical regression guard: the old "Open Settings" anchor (which did a
    // full-page nav and blew away wizard form state) must NOT be present.
    await expect(page.getByRole('link', { name: /Open Settings/i })).toHaveCount(0);

    // New inline flow: a password input + "Save key" button live in the banner.
    await expect(page.getByPlaceholder('sk-ant-...')).toBeVisible();
    const saveButton = page.getByRole('button', { name: /Save key/i });
    await expect(saveButton).toBeVisible();
    // Button stays disabled until something is typed.
    await expect(saveButton).toBeDisabled();
  });
});
