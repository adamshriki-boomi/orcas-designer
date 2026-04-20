import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { BUILT_IN_SKILLS, FRAMEWORK_GUIDANCE, getBuiltInSkillById } from './built-in-skills';
import { BUILT_IN_RESEARCH_METHODS } from './researcher-constants';

describe('BUILT_IN_SKILLS', () => {
  it('exports 15 research method skills', () => {
    expect(BUILT_IN_SKILLS).toHaveLength(15);
  });

  it('every skill has the required shape', () => {
    for (const skill of BUILT_IN_SKILLS) {
      expect(skill.id).toMatch(/^[a-z0-9-]+$/);
      expect(skill.name).toBeTruthy();
      expect(skill.category).toBe('UX Research');
      expect(Array.isArray(skill.tags)).toBe(true);
      expect(skill.description).toBeTruthy();
      expect(skill.content).toBeTruthy();
      expect(skill.content.length).toBeGreaterThan(200);
    }
  });

  it('skill IDs exactly match researcher-constants method IDs', () => {
    const skillIds = BUILT_IN_SKILLS.map(s => s.id).sort();
    const methodIds = BUILT_IN_RESEARCH_METHODS.map(m => m.id).sort();
    expect(skillIds).toEqual(methodIds);
  });

  it('has no duplicate IDs', () => {
    const ids = BUILT_IN_SKILLS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no skill is tagged Boomi Knowledge (methods synthesized from general UXR)', () => {
    for (const skill of BUILT_IN_SKILLS) {
      expect(skill.tags).not.toContain('Boomi Knowledge');
    }
  });

  it('getBuiltInSkillById returns the skill when found', () => {
    const skill = getBuiltInSkillById('heuristic-evaluation');
    expect(skill?.name).toBe('Heuristic Evaluation');
  });

  it('getBuiltInSkillById returns null for unknown IDs', () => {
    expect(getBuiltInSkillById('does-not-exist')).toBeNull();
  });

  it('all research methods have a FRAMEWORK_GUIDANCE entry (no generic fallback)', () => {
    // If any skill ended up with the generic fallback sentence, the test fails.
    // The real failure mode (module-init error) is already covered by the fact
    // that module import succeeded.
    for (const skill of BUILT_IN_SKILLS) {
      expect(skill.content).not.toContain('Follow established UX research best practices for this method.');
    }
  });

  it('every skill has a non-empty icon', () => {
    for (const skill of BUILT_IN_SKILLS) {
      expect(skill.icon).toBeTruthy();
      expect(typeof skill.icon).toBe('string');
    }
  });
});

/**
 * Parity check against the Researcher Edge Function.
 *
 * `supabase/functions/researcher-execute/index.ts` cannot import from `src/`
 * because it runs under Deno, so its FRAMEWORK_GUIDANCE map is maintained as
 * a byte-for-byte copy of the one in this file. The tests below read the Edge
 * Function source at test time and assert that every method's guidance string
 * appears verbatim there — any drift (renamed method, edited guidance text,
 * forgotten copy) fails the build.
 */
describe('FRAMEWORK_GUIDANCE parity with Edge Function', () => {
  const EDGE_FILE = path.resolve(__dirname, '../../supabase/functions/researcher-execute/index.ts');
  const edgeSource = readFileSync(EDGE_FILE, 'utf-8');

  it('Edge Function declares a FRAMEWORK_GUIDANCE map', () => {
    expect(edgeSource).toMatch(/const FRAMEWORK_GUIDANCE\s*:\s*Record<string,\s*string>\s*=\s*\{/);
  });

  // One focused test per entry — a failure points straight at the drifted key.
  for (const [id, content] of Object.entries(FRAMEWORK_GUIDANCE)) {
    it(`Edge Function contains byte-identical guidance for "${id}"`, () => {
      expect(edgeSource).toContain(content);
    });
  }

  it('Edge Function map has the same 15 entries and nothing extra', () => {
    const blockMatch = edgeSource.match(/const FRAMEWORK_GUIDANCE[^{]*\{([\s\S]*?)^};/m);
    expect(blockMatch, 'could not locate FRAMEWORK_GUIDANCE block in edge function').toBeTruthy();
    const body = blockMatch![1];
    // Each entry starts with `'method-id':\s*\``
    const keys = Array.from(body.matchAll(/['"]([a-z0-9-]+)['"]\s*:\s*`/g)).map((m) => m[1]);
    expect(new Set(keys)).toEqual(new Set(Object.keys(FRAMEWORK_GUIDANCE)));
  });
});
