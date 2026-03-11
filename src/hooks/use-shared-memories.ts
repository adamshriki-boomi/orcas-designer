'use client';

import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { SharedMemory } from '@/lib/types';
import { generateId } from '@/lib/id';
import { BUILT_IN_COMPANY_CONTEXT, BUILT_IN_PRODUCT_CONTEXT } from '@/lib/constants';

const BUILT_IN_MEMORY_ID = 'built-in-company-context';
const BUILT_IN_PRODUCT_MEMORY_ID = 'built-in-rivery-context';

export const COMPANY_CONTEXT_MEMORY_ID = BUILT_IN_MEMORY_ID;
export const PRODUCT_CONTEXT_MEMORY_IDS = [BUILT_IN_PRODUCT_MEMORY_ID];

export function useSharedMemories() {
  const sharedMemories = useLiveQuery(
    () => db.sharedMemories.orderBy('name').toArray(),
    [],
    [] as SharedMemory[]
  );

  useEffect(() => {
    let cancelled = false;
    async function ensureBuiltInMemories() {
      try {
        const existing = await db.sharedMemories.get(BUILT_IN_MEMORY_ID);
        if (cancelled) return;
        if (!existing) {
          await db.sharedMemories.add({
            id: BUILT_IN_MEMORY_ID,
            name: 'Boomi Context',
            description: 'Built-in company context for Boomi',
            content: BUILT_IN_COMPANY_CONTEXT,
            fileName: 'boomi-context.md',
            isBuiltIn: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else if (existing.name !== 'Boomi Context') {
          await db.sharedMemories.update(BUILT_IN_MEMORY_ID, {
            name: 'Boomi Context',
            description: 'Built-in company context for Boomi',
            fileName: 'boomi-context.md',
          });
        }
        if (cancelled) return;
        const existingProduct = await db.sharedMemories.get(BUILT_IN_PRODUCT_MEMORY_ID);
        if (cancelled) return;
        if (!existingProduct) {
          await db.sharedMemories.add({
            id: BUILT_IN_PRODUCT_MEMORY_ID,
            name: 'Rivery Context',
            description: 'Built-in product context for Boomi Data Integration (formerly Rivery)',
            content: BUILT_IN_PRODUCT_CONTEXT,
            fileName: 'rivery-context.md',
            isBuiltIn: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to seed built-in memories:', err);
      }
    }
    ensureBuiltInMemories();
    return () => { cancelled = true; };
  }, []);

  async function addMemory(
    memory: Omit<SharedMemory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = generateId();
    const now = new Date().toISOString();
    await db.sharedMemories.add({ ...memory, id, createdAt: now, updatedAt: now });
    return id;
  }

  async function updateMemory(id: string, updates: Partial<SharedMemory>): Promise<void> {
    await db.sharedMemories.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async function deleteMemory(id: string): Promise<void> {
    const memory = await db.sharedMemories.get(id);
    if (memory?.isBuiltIn) return;

    await db.transaction('rw', db.sharedMemories, db.projects, async () => {
      await db.sharedMemories.delete(id);
      await db.projects.toCollection().modify((project) => {
        const ids = project.selectedSharedMemoryIds ?? [];
        if (ids.includes(id)) {
          project.selectedSharedMemoryIds = ids.filter((mid) => mid !== id);
        }
      });
    });
  }

  async function isMemoryUsed(id: string): Promise<string[]> {
    const used = await db.projects
      .filter((p) => (p.selectedSharedMemoryIds ?? []).includes(id))
      .toArray();
    return used.map((p) => p.name);
  }

  return { sharedMemories, addMemory, updateMemory, deleteMemory, isMemoryUsed };
}
