'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Project } from '@/lib/types';
import { emptyProject } from '@/lib/types';
import { generateId } from '@/lib/id';

export function useProjects() {
  const rawProjects = useLiveQuery(
    () => db.projects.orderBy('updatedAt').reverse().toArray(),
    [],
  );
  const projects = rawProjects ?? [];
  const isLoading = rawProjects === undefined;

  async function createProject(name: string): Promise<string> {
    const id = generateId();
    const project = emptyProject(id, name);
    await db.projects.add(project);
    return id;
  }

  async function deleteProject(id: string): Promise<void> {
    await db.projects.delete(id);
  }

  return { projects, isLoading, createProject, deleteProject };
}
