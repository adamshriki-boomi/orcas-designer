'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { SharedSkill } from '@/lib/types';
import { generateId } from '@/lib/id';

export function useSharedSkills() {
  const sharedSkills = useLiveQuery(
    () => db.sharedSkills.orderBy('name').toArray(),
    [],
    [] as SharedSkill[]
  );

  async function addSkill(skill: Omit<SharedSkill, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = generateId();
    const now = new Date().toISOString();
    await db.sharedSkills.add({ ...skill, id, createdAt: now, updatedAt: now });
    return id;
  }

  async function updateSkill(id: string, updates: Partial<SharedSkill>): Promise<void> {
    await db.sharedSkills.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async function deleteSkill(id: string): Promise<void> {
    await db.transaction('rw', db.sharedSkills, db.projects, async () => {
      await db.sharedSkills.delete(id);
      await db.projects.toCollection().modify((project) => {
        const ids = project.selectedSharedSkillIds;
        if (ids.includes(id)) {
          project.selectedSharedSkillIds = ids.filter(sid => sid !== id);
        }
      });
    });
  }

  async function isSkillUsed(id: string): Promise<string[]> {
    const used = await db.projects
      .filter(p => p.selectedSharedSkillIds.includes(id))
      .toArray();
    return used.map(p => p.name);
  }

  return { sharedSkills, addSkill, updateSkill, deleteSkill, isSkillUsed };
}
