import { test, expect, populatedSeed, emptySeed, gotoApp } from './fixtures/test-base';

test.describe('Dashboard', () => {
  test.describe('Empty state', () => {
    test.use({ seedData: emptySeed() });

    test('shows greeting, hero CTAs, and empty states', async ({ page }) => {
      await gotoApp(page);

      await expect(page.getByRole('heading', { name: /welcome|good morning|good afternoon|good evening/i })).toBeVisible();

      await expect(page.getByTestId('cta-new-prompt')).toBeVisible();
      await expect(page.getByTestId('cta-new-research')).toBeVisible();
      await expect(page.getByTestId('cta-new-ux-analysis')).toBeVisible();

      await expect(page.getByTestId('running-jobs-empty')).toBeVisible();
      await expect(page.getByTestId('recent-drafts-empty')).toBeVisible();
      await expect(page.getByTestId('activity-feed-empty')).toBeVisible();
    });

    test('hero CTAs navigate to the correct feature pages', async ({ page }) => {
      await gotoApp(page);
      await expect(page.getByTestId('cta-new-prompt')).toHaveAttribute(
        'href',
        /\/prompt-generator\/new$/
      );
      await expect(page.getByTestId('cta-new-research')).toHaveAttribute(
        'href',
        /\/researcher\/new$/
      );
      await expect(page.getByTestId('cta-new-ux-analysis')).toHaveAttribute(
        'href',
        /\/ux-writer\/new$/
      );
    });
  });

  test.describe('Populated state', () => {
    test.use({ seedData: populatedSeed() });

    test('shows personal stats reflecting the seed', async ({ page }) => {
      await gotoApp(page);

      // Personal stats strip (4 cards): prompts=2, research=2, ux=1, regens=2
      const promptsCard = page.getByRole('group', { name: /prompts/i });
      await expect(promptsCard).toContainText('2');

      const researchCard = page.getByRole('group', { name: 'Research projects' });
      await expect(researchCard).toContainText('2');

      const uxCard = page.getByRole('group', { name: 'UX analyses' });
      await expect(uxCard).toContainText('1');

      const regensCard = page.getByRole('group', { name: 'Regenerations' });
      await expect(regensCard).toContainText('2');
    });

    test('shows the running research job with progress bar', async ({ page }) => {
      await gotoApp(page);
      const runningJob = page.getByTestId('active-job-research-running-1');
      await expect(runningJob).toBeVisible();
      await expect(runningJob).toContainText('Persona study');
      await expect(page.getByTestId('progress-research-running-1')).toContainText('50%');
    });

    test('lists recent drafts across all three feature types', async ({ page }) => {
      await gotoApp(page);
      const draftsPanel = page.getByTestId('recent-drafts-panel');
      await expect(draftsPanel).toContainText('Checkout redesign');
      await expect(draftsPanel).toContainText('Persona study');
      await expect(draftsPanel).toContainText('Settings page copy review');
    });

    test('renders the activity feed with 3 items and correct navigation', async ({ page }) => {
      await gotoApp(page);
      const feed = page.getByTestId('activity-feed');
      await expect(feed).toBeVisible();
      await expect(feed.locator('[data-testid^="activity-prompt-"]')).toHaveCount(2);
      await expect(feed.locator('[data-testid^="activity-research-"]')).toHaveCount(2);
      await expect(feed.locator('[data-testid^="activity-ux-"]')).toHaveCount(1);

      // Links point at the right detail pages
      const promptActivity = feed.locator('[data-testid="activity-prompt-prompt-1"]');
      await expect(promptActivity).toHaveAttribute('href', /\/prompt-generator\/prompt-1$/);
    });

    test('renders trend chart cards including the 3 line-graph time-series', async ({ page }) => {
      await gotoApp(page);
      await expect(page.getByTestId('chart-prompts-by-interaction-level')).toBeVisible();
      await expect(page.getByTestId('chart-research-projects-by-status')).toBeVisible();
      await expect(page.getByTestId('chart-prompts-over-time')).toBeVisible();
      await expect(page.getByTestId('chart-research-jobs-over-time')).toBeVisible();
      await expect(page.getByTestId('chart-ux-analyses-over-time')).toBeVisible();
    });

    test('shows library pulse stats for shared skills/memories and in-flight state', async ({ page }) => {
      await gotoApp(page);
      // Second stats-strip is "library pulse"
      await expect(page.getByRole('group', { name: 'Shared skills' })).toBeVisible();
      await expect(page.getByRole('group', { name: 'Shared memories' })).toBeVisible();
      await expect(page.getByRole('group', { name: 'Running jobs' })).toContainText('1');
      await expect(page.getByRole('group', { name: 'Completed research' })).toContainText('1');
    });

    test('links to dynamic routes include the basePath (no Next.js Link prefetch)', async ({ page }) => {
      // Regression guard for prod 404s: Next.js <Link> renders href WITHOUT the
      // basePath in the DOM attribute and prefetches on hover/idle. With static
      // export on GitHub Pages those prefetches 404. SpaLink renders a plain
      // <a> with the full basePath-prefixed href. Every dynamic-route link on
      // the dashboard must start with `/orcas-designer/`.
      await gotoApp(page);
      await expect(page.getByTestId('activity-feed')).toBeVisible();
      const hrefs = await page.$$eval(
        'a[href*="/researcher/"], a[href*="/prompt-generator/"], a[href*="/ux-writer/"]',
        (anchors) => anchors.map((a) => a.getAttribute('href') ?? '')
      );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        const isDynamic = /\/(researcher|prompt-generator|ux-writer)\/(?!new$)[^/?#]+/.test(href);
        if (isDynamic) {
          expect(href, `dynamic-route link "${href}" must start with /orcas-designer/`).toMatch(
            /^\/orcas-designer\//
          );
        }
      }
    });

    test('dashboard does not trigger 404 responses for dynamic routes', async ({ page }) => {
      // Captures the prod symptom directly: while loading the dashboard, no
      // GET or HEAD to /researcher/:id / /prompt-generator/:id / /ux-writer/:id
      // should resolve with a 404. If this fails, a Next.js <Link> has slipped
      // in and is prefetching the dynamic route.
      const badResponses: string[] = [];
      page.on('response', (res) => {
        const url = res.url();
        const status = res.status();
        const matchesDynamic = /\/(researcher|prompt-generator|ux-writer)\/(?!new\b|placeholder\b)[^/?#]+$/.test(
          new URL(url).pathname
        );
        if (matchesDynamic && status === 404) {
          badResponses.push(`${res.request().method()} ${url} -> ${status}`);
        }
      });
      await gotoApp(page);
      await expect(page.getByTestId('activity-feed')).toBeVisible();
      await page.waitForTimeout(1000);
      expect(badResponses, 'dynamic routes must not 404 during dashboard load').toEqual([]);
    });

    test('no console errors on initial dashboard load', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
      });

      await gotoApp(page);
      await expect(page.getByTestId('activity-feed')).toBeVisible();
      // Give React/Exosphere a beat to finish mounting
      await page.waitForTimeout(500);

      // Filter out known benign warnings from Next.js / React in dev
      const real = errors.filter(
        (e) => !e.includes('Bail out to client-side rendering') && !e.includes('Download the React DevTools')
      );
      expect(real).toEqual([]);
    });
  });
});
