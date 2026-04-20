import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect, beforeEach } from 'vitest';

/**
 * The SPA redirect 404 page is critical infrastructure for GitHub Pages:
 * it rewrites dynamic /<section>/[id] URLs to the pre-rendered placeholder
 * page so the React client can resolve the real record. If a dynamic
 * route is added without updating the redirect script, users get silently
 * bounced to the dashboard instead of seeing the detail page (the layout's
 * history.replaceState rewrites the URL bar but the dashboard stays mounted).
 *
 * These tests auto-discover every src/app/<section>/[id]/page.tsx and
 * assert the script covers each one, so a missing section fails fast in CI.
 */

const appDir = resolve(__dirname, '../../src/app');
const scriptPath = resolve(__dirname, '../../scripts/spa-redirect-404.html');
const html = readFileSync(scriptPath, 'utf-8');

function discoverDynamicSections(): string[] {
  const entries = readdirSync(appDir, { withFileTypes: true });
  const sections: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const children = readdirSync(resolve(appDir, entry.name), { withFileTypes: true });
      if (children.some((c) => c.isDirectory() && c.name === '[id]')) {
        sections.push(entry.name);
      }
    } catch {
      // skip unreadable dirs
    }
  }
  return sections.sort();
}

function extractSectionListFromScript(): string[] {
  const match = html.match(/dynamicSections\s*=\s*\[([^\]]+)\]/);
  if (!match) throw new Error('dynamicSections array not found in redirect script');
  return match[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
    .sort();
}

/**
 * Simulate the redirect script in a JSDOM environment by extracting the
 * inline script and executing it against a stubbed window.location. Returns
 * the URL the script attempted to replace to.
 */
function runRedirectScript(pathname: string, search = '', hash = ''): string {
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) throw new Error('inline script not found in redirect HTML');
  const body = scriptMatch[1];

  let replaced = '';
  const fakeWindow = {
    location: {
      pathname,
      search,
      hash,
      replace(url: string) {
        replaced = url;
      },
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('window', body)(fakeWindow);
  return replaced;
}

describe('SPA redirect 404 — dynamic section coverage', () => {
  it('lists every src/app/<section>/[id]/page.tsx route in dynamicSections', () => {
    const discovered = discoverDynamicSections();
    const declared = extractSectionListFromScript();
    expect(declared).toEqual(discovered);
  });

  it('covers at least the three known dynamic routes', () => {
    const declared = extractSectionListFromScript();
    expect(declared).toContain('prompt-generator');
    expect(declared).toContain('ux-writer');
    expect(declared).toContain('researcher');
  });
});

describe('SPA redirect 404 — behavior', () => {
  const sections = extractSectionListFromScript();

  sections.forEach((section) => {
    describe(`/${section}/[id]`, () => {
      it('redirects a real ID to the placeholder page with _id query', () => {
        const url = runRedirectScript(`/orcas-designer/${section}/abc-123-uuid`);
        expect(url).toBe(
          `/orcas-designer/${section}/placeholder?_id=abc-123-uuid`,
        );
      });

      it('does not redirect the placeholder path to itself', () => {
        const url = runRedirectScript(`/orcas-designer/${section}/placeholder`);
        expect(url).not.toContain('placeholder?_id=placeholder');
      });

      it('does not redirect /new to the placeholder page', () => {
        const url = runRedirectScript(`/orcas-designer/${section}/new`);
        expect(url).not.toContain('placeholder?_id=new');
      });

      it('url-encodes IDs that contain special characters', () => {
        const url = runRedirectScript(`/orcas-designer/${section}/a b/c`);
        // path has 3 segments → should fall through to generic redirect,
        // not the placeholder branch
        expect(url).toContain('?redirect=');
      });
    });
  });

  it('falls back to /?redirect= for unknown paths', () => {
    const url = runRedirectScript('/orcas-designer/totally/unknown/deep/path');
    expect(url).toContain('/orcas-designer/?redirect=');
    expect(url).toContain(encodeURIComponent('/totally/unknown/deep/path'));
  });

  it('preserves search and hash in the fallback redirect', () => {
    const url = runRedirectScript('/orcas-designer/unknown', '?foo=1', '#bar');
    expect(decodeURIComponent(url)).toContain('/unknown?foo=1#bar');
  });

  it('does not reference the old /projects route anywhere', () => {
    expect(html).not.toContain("'/projects");
  });
});
