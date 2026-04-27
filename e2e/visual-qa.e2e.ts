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

    test('clicking a report opens its detail page with issues', async ({ page }) => {
      await gotoApp(page, 'visual-qa');
      await page.getByText('Onboarding hero').click();
      await page.waitForURL(/\/visual-qa\/vqa-1/);
      // Issues now render as a flat list of cards. Category appears as a badge
      // inside each card, not as a section heading.
      await expect(page.getByRole('group', { name: 'Hero CTA' })).toBeVisible();
      await expect(page.getByRole('group', { name: 'Hero heading' })).toBeVisible();
      await expect(page.getByText(/CTA renders as outlined/i)).toBeVisible();
      await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
    });

    test('each issue card has a kebab menu wired with Edit and Delete actions', async ({ page }) => {
      await gotoApp(page, 'visual-qa/vqa-1');
      await page.waitForURL(/\/visual-qa\/vqa-1/);

      // Cards default to read-only normal mode (no inline editor inputs).
      const cta = page.getByRole('group', { name: 'Hero CTA' });
      await expect(cta.locator('input[value="Hero CTA"]')).toHaveCount(0);

      // The kebab is rendered as an ExDropdown inside the card.
      await expect(cta.locator('ex-dropdown')).toHaveCount(1);

      // Open the dropdown so its menu becomes visible, then verify both menu
      // items are present and labelled correctly. The actual click→state
      // transition (Edit opens the form, Delete opens the confirm dialog) is
      // covered by IssueCard unit tests — here we only verify the kebab DOM
      // is correctly wired so the user has the affordances they expect.
      await cta.locator('ex-dropdown').click();
      const items = cta.locator('ex-menu-item');
      await expect(items).toHaveCount(2);
      await expect(items.nth(0)).toContainText('Edit');
      await expect(items.nth(1)).toContainText('Delete');
      // The Delete item is rendered with the risky variant (red treatment).
      const deleteVariant = await items.nth(1).getAttribute('variant');
      expect(deleteVariant).toBe('risky');
    });

    test('Add issue prepends a new draft card in edit mode; Cancel removes it', async ({ page }) => {
      await gotoApp(page, 'visual-qa/vqa-1');
      await page.waitForURL(/\/visual-qa\/vqa-1/);

      // Wait for the seeded cards to render before measuring.
      await expect(page.getByRole('group', { name: 'Hero CTA' })).toBeVisible();
      const before = await page.getByRole('group').count();

      await page.getByRole('button', { name: /add issue/i }).click();

      // A new draft card opens in edit mode at the top — Save and Cancel visible.
      await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

      // Cancel discards the draft and the count returns to baseline.
      await page.getByRole('button', { name: 'Cancel' }).click();
      const after = await page.getByRole('group').count();
      expect(after).toBe(before);
    });


    test('detail page renders the resizable split with default 60/40', async ({ page }) => {
      await gotoApp(page, 'visual-qa/vqa-1');
      await page.waitForURL(/\/visual-qa\/vqa-1/);
      // Separator becomes visible only at md+ widths
      await page.setViewportSize({ width: 1280, height: 800 });
      // The separator carries aria-orientation="vertical" and aria-valuenow set
      const sep = page.locator('[role="separator"][aria-orientation="vertical"]');
      await expect(sep).toBeVisible();
      await expect(sep).toHaveAttribute('aria-valuenow', '60');
    });

    test('detail page locks to viewport height with no window scroll', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoApp(page, 'visual-qa/vqa-1');
      await page.waitForURL(/\/visual-qa\/vqa-1/);
      // Wait for the split to render so layout has stabilized
      await expect(page.locator('[role="separator"][aria-orientation="vertical"]')).toBeVisible();

      // Body should be locked to overflow:hidden so the panes own the scroll surface.
      // The lock is applied in a mount useEffect — poll briefly to absorb the
      // microtask delay between separator appearing and effect committing.
      await expect
        .poll(async () => page.evaluate(() => getComputedStyle(document.body).overflow))
        .toBe('hidden');

      // Window scroll should not move even after attempting to scroll.
      await page.mouse.wheel(0, 500);
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);
    });

    test('keyboard ArrowRight on separator persists the new split width', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoApp(page, 'visual-qa/vqa-1');
      await page.waitForURL(/\/visual-qa\/vqa-1/);

      const sep = page.locator('[role="separator"][aria-orientation="vertical"]');
      await expect(sep).toBeVisible();
      await sep.focus();
      // Shift+ArrowRight = +5
      await page.keyboard.press('Shift+ArrowRight');
      await expect(sep).toHaveAttribute('aria-valuenow', '65');

      await page.reload();
      const sepAfter = page.locator('[role="separator"][aria-orientation="vertical"]');
      await expect(sepAfter).toHaveAttribute('aria-valuenow', '65');
    });

    test('the Exosphere segmented control has both child segments wired before the user clicks', async ({ page }) => {
      // REGRESSION GUARD: ExSegmentedControls registers click listeners on
      // its children inside its one-shot `firstUpdated()` Lit lifecycle. If
      // the parent and children load through separate dynamic imports, the
      // parent can mount before its children and end up with zero registered
      // segments — clicks then silently no-op. This test asserts both child
      // segments are present as real children of the parent web component
      // BEFORE any user interaction, so a regression to split imports is
      // caught even when a particular click happens to work via timing.
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoApp(page, 'visual-qa/vqa-1');
      await page.waitForURL(/\/visual-qa\/vqa-1/);

      // Wait for the segmented control to render
      const segmentedControls = page.locator('ex-segmentedcontrols');
      await expect(segmentedControls).toBeAttached();

      // Both child segments must be direct children of the parent — not
      // delayed/loading placeholders.
      const childSegments = segmentedControls.locator(':scope > ex-segmentedcontrol');
      await expect(childSegments).toHaveCount(2);

      // The labels are exactly "Stacked" and "Overlay" in order. Lit reflects
      // `label` to the DOM as a JS property (not an attribute), so we read it
      // via evaluate.
      const labels = await childSegments.evaluateAll((els) =>
        els.map((el) => (el as unknown as { label?: string }).label ?? '')
      );
      expect(labels).toEqual(['Stacked', 'Overlay']);
    });

    test('switching to Overlay mode reveals the opacity slider and swap button', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoApp(page, 'visual-qa/vqa-1');
      await page.waitForURL(/\/visual-qa\/vqa-1/);

      // Stacked is default — slider not present
      await expect(page.getByLabel('Opacity', { exact: true })).toHaveCount(0);

      // Click the actual Overlay segment by targeting the second child of
      // the parent segmented control. This walks the same chain as the user
      // (real DOM event into the Lit component) instead of going through
      // getByRole, which could pick up some unrelated "Overlay" text node.
      await page.locator('ex-segmentedcontrols > ex-segmentedcontrol').nth(1).click();

      // The slider must appear — confirms the click reached the parent's
      // listener and React state actually flipped to 'overlay'.
      const slider = page.getByLabel('Opacity', { exact: true });
      await expect(slider).toBeVisible();
      await expect(slider).toHaveValue('50');

      // Scrub the slider to 25
      await slider.fill('25');
      const topImage = page.getByTestId('overlay-top');
      await expect(topImage).toHaveAttribute('style', /opacity:\s*0\.25/);

      // Swap flips the top layer
      await page.getByRole('button', { name: /swap top layer/i }).click();
      await expect(topImage).toHaveAttribute('alt', 'Implementation');

      // Click back to Stacked — the round-trip confirms the child→parent
      // event chain works in both directions, not just on first interaction.
      await page.locator('ex-segmentedcontrols > ex-segmentedcontrol').nth(0).click();
      await expect(page.getByLabel('Opacity', { exact: true })).toHaveCount(0);
    });

    test('mobile width hides the separator and stacks the panes', async ({ page }) => {
      await page.setViewportSize({ width: 600, height: 800 });
      await gotoApp(page, 'visual-qa/vqa-1');
      await page.waitForURL(/\/visual-qa\/vqa-1/);

      const sep = page.locator('[role="separator"][aria-orientation="vertical"]');
      await expect(sep).toBeHidden();
      // Both panes are present, Issues still reachable
      await expect(page.getByRole('heading', { name: 'Issues' })).toBeVisible();
    });
  });
});
