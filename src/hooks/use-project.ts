'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Project } from '@/lib/types';

export function useProject(id: string) {
  const project = useLiveQuery(
    () => db.projects.get(id),
    [id],
    undefined as Project | undefined
  );

  async function updateProject(updates: Partial<Project>): Promise<void> {
    await db.projects.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  return { project, updateProject };
}
