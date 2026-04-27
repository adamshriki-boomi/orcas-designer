import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, test, expect } from 'vitest';

/**
 * Guards against the class of bug where a new Edge Function is added to
 * supabase/functions/ but no matching [functions.<name>] block is added to
 * supabase/config.toml. Without the block, verify_jwt defaults to true and
 * the Supabase gateway rejects the CORS preflight OPTIONS (no JWT), which
 * surfaces as a 401 on the browser-side POST.
 *
 * See commit e065520 for the original researcher-functions incident.
 */

const projectRoot = path.resolve(__dirname, '../..');
const functionsDir = path.join(projectRoot, 'supabase/functions');
const configPath = path.join(projectRoot, 'supabase/config.toml');

function getEdgeFunctionNames(): string[] {
  return readdirSync(functionsDir)
    .filter((name) => statSync(path.join(functionsDir, name)).isDirectory())
    // Underscore-prefixed dirs (e.g. `_shared`) hold helpers shared across
    // functions and are not deployable functions themselves — Supabase's CLI
    // skips them. Mirror that here so they don't trip the registration check.
    .filter((name) => !name.startsWith('_'))
    .sort();
}

function parseFunctionVerifyJwt(content: string): Record<string, boolean | undefined> {
  const result: Record<string, boolean | undefined> = {};
  let currentFunction: string | null = null;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (line.length === 0) continue;

    const funcHeader = line.match(/^\[functions\.([^\]]+)\]$/);
    if (funcHeader) {
      currentFunction = funcHeader[1];
      if (!(currentFunction in result)) result[currentFunction] = undefined;
      continue;
    }
    if (line.startsWith('[') && line.endsWith(']')) {
      currentFunction = null;
      continue;
    }
    if (currentFunction) {
      const vjwt = line.match(/^verify_jwt\s*=\s*(true|false)$/);
      if (vjwt) result[currentFunction] = vjwt[1] === 'true';
    }
  }

  return result;
}

describe('Supabase Edge Functions config.toml', () => {
  test.each(getEdgeFunctionNames())(
    'edge function "%s" is registered with verify_jwt = false',
    (name) => {
      const config = parseFunctionVerifyJwt(readFileSync(configPath, 'utf-8'));

      expect(
        name in config,
        `Missing [functions.${name}] block in supabase/config.toml.\n` +
          `All Edge Functions must be registered with verify_jwt = false so that\n` +
          `CORS preflight OPTIONS requests (which carry no JWT) pass the Supabase\n` +
          `gateway. Internal authentication is still enforced inside the function\n` +
          `via supabase.auth.getUser(). See commit e065520 for context.`
      ).toBe(true);

      expect(
        config[name],
        `[functions.${name}] must have verify_jwt = false (current: ${config[name]}).`
      ).toBe(false);
    }
  );

  test('parser correctly reads config.toml', () => {
    const config = parseFunctionVerifyJwt(readFileSync(configPath, 'utf-8'));
    expect(Object.keys(config).length).toBeGreaterThan(0);
  });

  test('parser ignores inline comments and other sections', () => {
    const sample = [
      '[api]',
      'enabled = true',
      '',
      '[functions.foo]',
      'verify_jwt = false # comment',
      '',
      '# [functions.commented-out]',
      '# verify_jwt = true',
      '',
      '[functions.bar]',
      'verify_jwt = true',
      '',
      '[experimental]',
      'verify_jwt = false',
    ].join('\n');

    const parsed = parseFunctionVerifyJwt(sample);
    expect(parsed).toEqual({ foo: false, bar: true });
  });
});
