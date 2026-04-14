import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

/**
 * The SPA redirect 404 page is critical infrastructure for GitHub Pages:
 * it rewrites dynamic /prompt-generator/[id] URLs to the pre-rendered
 * placeholder page. If the route pattern drifts from the actual Next.js
 * route, users get silently redirected to the dashboard instead of seeing
 * the detail page.
 */
const html = readFileSync(
  resolve(__dirname, '../../scripts/spa-redirect-404.html'),
  'utf-8',
);

// Extract the regex from the script source so we can test it in isolation.
const regexMatch = html.match(/path\.match\((\/.+?\/)\)/);
const routeRegex = regexMatch ? new RegExp(regexMatch[1].slice(1, -1)) : null;

describe('SPA redirect 404 — route consistency', () => {
  it('contains a route regex', () => {
    expect(routeRegex).not.toBeNull();
  });

  it('regex matches /prompt-generator/<uuid> paths', () => {
    expect('/prompt-generator/abc-123'.match(routeRegex!)).toBeTruthy();
    expect('/prompt-generator/f47ac10b-58cc-4372-a567-0e02b2c3d479'.match(routeRegex!)).toBeTruthy();
  });

  it('regex does NOT match old /projects/<id> paths', () => {
    expect('/projects/abc-123'.match(routeRegex!)).toBeNull();
  });

  it('redirect target uses /prompt-generator/placeholder', () => {
    expect(html).toContain('/prompt-generator/placeholder?_id=');
  });

  it('does not reference the old /projects route anywhere', () => {
    expect(html).not.toContain('/projects');
  });

  it('excludes /new and /placeholder from the ID redirect', () => {
    // These have their own static pages and must NOT go through the _id rewrite
    expect(html).toContain("!== 'new'");
    expect(html).toContain("!== 'placeholder'");
  });
});
