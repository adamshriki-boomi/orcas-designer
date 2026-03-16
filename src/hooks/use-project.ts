'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Project } from '@/lib/types';

const LOADING = Symbol('loading');

export function useProject(id: string) {
  const result = useLiveQuery(
    async () => (await db.projects.get(id)) ?? null,
    [id],
    LOADING as unknown as Project | null
  );

  const isLoading = result === (LOADING as unknown);
  const project = isLoading ? undefined : result;

  async function updateProject(updates: Partial<Project>): Promise<void> {
    await db.projects.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  return { project, isLoading, updateProject };
}
