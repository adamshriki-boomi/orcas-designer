import type { SharedSkill } from './types';
import { type BuiltInSkill, getBuiltInSkillById } from './built-in-skills';

export type ResolvedSkill =
  | { kind: 'builtin'; skill: BuiltInSkill }
  | { kind: 'db'; skill: SharedSkill };

export function resolveSkill(id: string, dbSkills: SharedSkill[]): ResolvedSkill | null {
  const builtIn = getBuiltInSkillById(id);
  if (builtIn) return { kind: 'builtin', skill: builtIn };

  const db = dbSkills.find((s) => s.id === id);
  if (db) return { kind: 'db', skill: db };

  return null;
}
