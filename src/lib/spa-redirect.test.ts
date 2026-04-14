import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

/**
 * The SPA redirect 404 page is critical infrastructure for GitHub Pages:
 * it rewrites dynamic /prompt-generator/[id] and /ux-writer/[id] URLs
 * to the pre-rendered placeholder page. If the route pattern drifts from
 * the actual Next.js route, users get silently redirected to the dashboard
 * instead of seeing the detail page.
 */
const html = readFileSync(
  resolve(__dirname, '../../scripts/spa-redirect-404.html'),
  'utf-8',
);

describe('SPA redirect 404 — Prompt Generator routes', () => {
  it('contains /prompt-generator/placeholder redirect target', () => {
    expect(html).toContain('/prompt-generator/placeholder?_id=');
  });

  it('does not reference the old /projects route anywhere', () => {
    expect(html).not.toContain("'/projects");
  });

  it('excludes /new and /placeholder from the prompt-generator ID redirect', () => {
    expect(html).toContain("!== 'new'");
    expect(html).toContain("!== 'placeholder'");
  });
});

describe('SPA redirect 404 — UX Writer routes', () => {
  it('contains /ux-writer/placeholder redirect target', () => {
    expect(html).toContain('/ux-writer/placeholder?_id=');
  });

  it('contains a ux-writer route match', () => {
    expect(html).toContain('/ux-writer/');
  });
});
