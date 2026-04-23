'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { SharedMemory } from '@/lib/types';
import {
  BUILT_IN_COMPANY_CONTEXT,
  BUILT_IN_PRODUCT_CONTEXT,
  BUILT_IN_UX_WRITING_GUIDELINES,
  BUILT_IN_AI_VOICE_GUIDELINES,
  BUILT_IN_UXR_OPERATIONS_GUIDE,
  BUILT_IN_UX_RESEARCH_PROCESS,
  BUILT_IN_COMPANY_CONTEXT_MEMORY_ID,
  BUILT_IN_PRODUCT_MEMORY_ID,
  BUILT_IN_UX_WRITING_MEMORY_ID,
  BUILT_IN_AI_VOICE_MEMORY_ID,
  BUILT_IN_UXR_OPERATIONS_GUIDE_MEMORY_ID,
  BUILT_IN_UX_RESEARCH_PROCESS_MEMORY_ID,
  COMPANY_CONTEXT_MEMORY_ID,
  PRODUCT_CONTEXT_MEMORY_IDS,
  DESIGN_SYSTEM_MEMORY_IDS,
  UX_WRITING_MEMORY_IDS,
} from '@/lib/constants';

// Re-export for backward compatibility
export { COMPANY_CONTEXT_MEMORY_ID, PRODUCT_CONTEXT_MEMORY_IDS, DESIGN_SYSTEM_MEMORY_IDS, UX_WRITING_MEMORY_IDS };

interface BuiltInMemorySeed {
  id: string;
  name: string;
  description: string;
  content: string;
  fileName: string;
  category: string;
  tags: string[];
}

const BUILT_IN_MEMORIES: BuiltInMemorySeed[] = [
  {
    id: BUILT_IN_COMPANY_CONTEXT_MEMORY_ID,
    name: 'Boomi Context',
    description: 'Built-in company context for Boomi',
    content: BUILT_IN_COMPANY_CONTEXT,
    fileName: 'boomi-context.md',
    category: 'Company',
    tags: [],
  },
  {
    id: BUILT_IN_PRODUCT_MEMORY_ID,
    name: 'Rivery Context',
    description: 'Built-in product context for Boomi Data Integration (formerly Rivery)',
    content: BUILT_IN_PRODUCT_CONTEXT,
    fileName: 'rivery-context.md',
    category: 'Product',
    tags: [],
  },
  {
    id: BUILT_IN_UX_WRITING_MEMORY_ID,
    name: 'UX Writing Guidelines',
    description: 'Built-in UX writing guidelines covering voice/tone, content patterns, error messages, CTAs, tooltips, and empty states',
    content: BUILT_IN_UX_WRITING_GUIDELINES,
    fileName: 'ux-writing-guidelines.md',
    category: 'Writing',
    tags: ['Boomi Knowledge'],
  },
  {
    id: BUILT_IN_AI_VOICE_MEMORY_ID,
    name: 'Boomi AI Voice',
    description: 'AI-specific voice and tone guidelines for Boomi AI responses and conversational content patterns',
    content: BUILT_IN_AI_VOICE_GUIDELINES,
    fileName: 'boomi-ai-voice.md',
    category: 'Writing',
    tags: ['Boomi Knowledge'],
  },
  {
    id: BUILT_IN_UXR_OPERATIONS_GUIDE_MEMORY_ID,
    name: 'UXR Operations Guide',
    description: "Research-focused summary of Boomi's UX Research Operations Guide — process, participants, data handling, and findings dissemination",
    content: BUILT_IN_UXR_OPERATIONS_GUIDE,
    fileName: 'uxr-operations-guide.md',
    category: 'UX Research',
    tags: ['Boomi Knowledge'],
  },
  {
    id: BUILT_IN_UX_RESEARCH_PROCESS_MEMORY_ID,
    name: 'UX Research Process',
    description: "Boomi's end-to-end UX Research process: project types (exploratory/generative/evaluative) and the 14-step project workflow",
    content: BUILT_IN_UX_RESEARCH_PROCESS,
    fileName: 'ux-research-process.md',
    category: 'UX Research',
    tags: ['Boomi Knowledge'],
  },
];

export function toSharedMemory(row: Record<string, unknown>): SharedMemory {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    content: row.content as string,
    fileName: row.file_name as string,
    isBuiltIn: row.is_built_in as boolean,
    category: (row.category as string | null) ?? null,
    tags: (row.tags as string[] | null) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useSharedMemories() {
  const { user } = useAuth();
  const [sharedMemories, setSharedMemories] = useState<SharedMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const seededRef = useRef(false);

  const fetchMemories = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shared_memories')
      .select('*')
      .order('name');
    if (!error && data) {
      setSharedMemories(data.map(toSharedMemory));
    }
  }, []);

  // Seed built-in memories on first load, then fetch
  useEffect(() => {
    if (!user) return;
    if (seededRef.current) return;
    seededRef.current = true;

    async function ensureBuiltInMemories() {
      const supabase = createClient();
      for (const mem of BUILT_IN_MEMORIES) {
        // Use SECURITY DEFINER function to upsert built-in memories
        await supabase.rpc('upsert_built_in_memory', {
          p_id: mem.id,
          p_name: mem.name,
          p_description: mem.description,
          p_content: mem.content,
          p_file_name: mem.fileName,
          p_category: mem.category,
          p_tags: mem.tags,
        });
      }
      await fetchMemories();
    }
    ensureBuiltInMemories()
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user, fetchMemories]);

  const addMemory = useCallback(async (
    memory: Omit<SharedMemory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shared_memories')
      .insert({
        name: memory.name,
        description: memory.description,
        content: memory.content,
        file_name: memory.fileName,
        is_built_in: false,
        created_by: user?.id,
        category: memory.category,
        tags: memory.tags,
      })
      .select('id')
      .single();
    if (error) throw error;
    await fetchMemories();
    return data.id;
  }, [user, fetchMemories]);

  const updateMemory = useCallback(async (id: string, updates: Partial<SharedMemory>): Promise<void> => {
    const supabase = createClient();
    const mapped: Record<string, unknown> = {};
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.description !== undefined) mapped.description = updates.description;
    if (updates.content !== undefined) mapped.content = updates.content;
    if (updates.fileName !== undefined) mapped.file_name = updates.fileName;
    if (updates.category !== undefined) mapped.category = updates.category;
    if (updates.tags !== undefined) mapped.tags = updates.tags;

    const { error } = await supabase.from('shared_memories').update(mapped as never).eq('id', id);
    if (error) throw error;
    await fetchMemories();
  }, [fetchMemories]);

  const deleteMemory = useCallback(async (id: string): Promise<void> => {
    const mem = sharedMemories.find(m => m.id === id);
    if (mem?.isBuiltIn) return;

    const supabase = createClient();
    const { error } = await supabase.from('shared_memories').delete().eq('id', id);
    if (error) throw error;
    await fetchMemories();
  }, [sharedMemories, fetchMemories]);

  const isMemoryUsed = useCallback(async (id: string): Promise<string[]> => {
    const supabase = createClient();
    const { data } = await supabase
      .from('prompts')
      .select('name')
      .contains('selected_shared_memory_ids', [id]);
    return data?.map(p => p.name) ?? [];
  }, []);

  return { sharedMemories, isLoading, addMemory, updateMemory, deleteMemory, isMemoryUsed };
}
