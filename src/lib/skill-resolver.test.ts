import { describe, it, expect } from 'vitest';
import { resolveSkill } from './skill-resolver';
import type { SharedSkill } from './types';

const dbSkill: SharedSkill = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Custom Skill',
  description: 'Custom',
  type: 'url',
  urlValue: 'https://example.com',
  fileContent: null,
  createdAt: '',
  updatedAt: '',
};

describe('resolveSkill', () => {
  it('returns a builtin resolution when ID matches BUILT_IN_SKILLS', () => {
    const r = resolveSkill('heuristic-evaluation', []);
    expect(r?.kind).toBe('builtin');
    if (r?.kind === 'builtin') {
      expect(r.skill.name).toBe('Heuristic Evaluation');
      expect(r.skill.content).toContain("Nielsen's 10 Usability Heuristics");
    }
  });

  it('returns a db resolution when ID matches a provided DB skill', () => {
    const r = resolveSkill(dbSkill.id, [dbSkill]);
    expect(r?.kind).toBe('db');
    if (r?.kind === 'db') {
      expect(r.skill.id).toBe(dbSkill.id);
    }
  });

  it('returns null when ID is not found anywhere', () => {
    expect(resolveSkill('unknown-id', [dbSkill])).toBeNull();
  });

  it('prefers built-in when an ID coincidentally matches both', () => {
    const faux: SharedSkill = { ...dbSkill, id: 'heuristic-evaluation' };
    const r = resolveSkill('heuristic-evaluation', [faux]);
    expect(r?.kind).toBe('builtin');
  });
});
