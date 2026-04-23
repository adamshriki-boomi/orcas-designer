'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Prompt } from '@/lib/types';
import { emptyPrompt } from '@/lib/types';
import { generateId } from '@/lib/id';

import { emptyFeatureDefinition, emptyDesignProducts } from '@/lib/types';

export function toPrompt(row: Record<string, unknown>): Prompt {
  const data = (row.data ?? {}) as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    companyInfo: data.companyInfo as Prompt['companyInfo'],
    productInfo: data.productInfo as Prompt['productInfo'],
    // featureDefinition / designProducts are new — fall back to empty shapes
    // when reading legacy rows saved before the Phase 4 realignment.
    featureDefinition: (data.featureDefinition as Prompt['featureDefinition']) ?? emptyFeatureDefinition(),
    featureInfo: data.featureInfo as Prompt['featureInfo'],
    currentImplementation: data.currentImplementation as Prompt['currentImplementation'],
    uxResearch: data.uxResearch as Prompt['uxResearch'],
    uxWriting: data.uxWriting as Prompt['uxWriting'],
    figmaFileLink: data.figmaFileLink as Prompt['figmaFileLink'],
    designSystemStorybook: data.designSystemStorybook as Prompt['designSystemStorybook'],
    designSystemNpm: data.designSystemNpm as Prompt['designSystemNpm'],
    designSystemFigma: data.designSystemFigma as Prompt['designSystemFigma'],
    prototypeSketches: data.prototypeSketches as Prompt['prototypeSketches'],
    designProducts: (data.designProducts as Prompt['designProducts']) ?? emptyDesignProducts(),
    promptMode: row.prompt_mode as Prompt['promptMode'],
    selectedSharedSkillIds: row.selected_shared_skill_ids as string[],
    customSkills: (row.custom_skills ?? []) as Prompt['customSkills'],
    selectedSharedMemoryIds: row.selected_shared_memory_ids as string[],
    customMemories: (row.custom_memories ?? []) as Prompt['customMemories'],
    regenerationCount: row.regeneration_count as number,
    generatedPrompt: row.generated_prompt as string,
  };
}

export function promptToRow(project: Partial<Prompt>, userId?: string) {
  const row: Record<string, unknown> = {};
  if (userId !== undefined) row.user_id = userId;
  if (project.id !== undefined) row.id = project.id;
  if (project.name !== undefined) row.name = project.name;
  if (project.promptMode !== undefined) row.prompt_mode = project.promptMode;
  if (project.selectedSharedSkillIds !== undefined) row.selected_shared_skill_ids = project.selectedSharedSkillIds;
  if (project.customSkills !== undefined) row.custom_skills = project.customSkills;
  if (project.selectedSharedMemoryIds !== undefined) row.selected_shared_memory_ids = project.selectedSharedMemoryIds;
  if (project.customMemories !== undefined) row.custom_memories = project.customMemories;
  if (project.regenerationCount !== undefined) row.regeneration_count = project.regenerationCount;
  if (project.generatedPrompt !== undefined) row.generated_prompt = project.generatedPrompt;

  // Pack form data fields into the `data` JSONB column. Deliverables-era
  // columns (output_directory, accessibility_level, browser_compatibility,
  // external_resources_accessible, design_direction) are no longer written
  // by the app; they remain in the table for historical rows.
  const formFields = [
    'companyInfo', 'productInfo', 'featureDefinition', 'featureInfo',
    'currentImplementation', 'uxResearch', 'uxWriting', 'figmaFileLink',
    'designSystemStorybook', 'designSystemNpm', 'designSystemFigma',
    'prototypeSketches', 'designProducts',
  ] as const;
  const data: Record<string, unknown> = {};
  let hasData = false;
  for (const key of formFields) {
    if (project[key] !== undefined) {
      data[key] = project[key];
      hasData = true;
    }
  }
  if (hasData) row.data = data;

  return row;
}

export function usePrompts() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setProjects(data.map(toPrompt));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user, fetchProjects]);

  const createPrompt = useCallback(async (name: string): Promise<string> => {
    const id = generateId();
    const project = emptyPrompt(id, name);
    const supabase = createClient();
    const row = promptToRow(project, user!.id);
    row.id = id;
    const { error } = await supabase.from('prompts').insert(row as never);
    if (error) throw error;
    await fetchProjects();
    return id;
  }, [user, fetchProjects]);

  const deletePrompt = useCallback(async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from('prompts').delete().eq('id', id);
    if (error) throw error;
    await fetchProjects();
  }, [fetchProjects]);

  return { projects, isLoading, createPrompt, deletePrompt };
}
