import { describe, it, expect } from 'vitest';
import { BUILT_IN_SKILLS, getBuiltInSkillById } from './built-in-skills';
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
