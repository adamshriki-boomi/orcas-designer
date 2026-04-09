'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Project } from '@/lib/types';
import { emptyProject } from '@/lib/types';
import { generateId } from '@/lib/id';

function toProject(row: Record<string, unknown>): Project {
  const data = (row.data ?? {}) as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    companyInfo: data.companyInfo as Project['companyInfo'],
    productInfo: data.productInfo as Project['productInfo'],
    featureInfo: data.featureInfo as Project['featureInfo'],
    currentImplementation: data.currentImplementation as Project['currentImplementation'],
    uxResearch: data.uxResearch as Project['uxResearch'],
    uxWriting: data.uxWriting as Project['uxWriting'],
    figmaFileLink: data.figmaFileLink as Project['figmaFileLink'],
    designSystemStorybook: data.designSystemStorybook as Project['designSystemStorybook'],
    designSystemNpm: data.designSystemNpm as Project['designSystemNpm'],
    designSystemFigma: data.designSystemFigma as Project['designSystemFigma'],
    prototypeSketches: data.prototypeSketches as Project['prototypeSketches'],
    outputType: row.output_type as Project['outputType'],
    interactionLevel: row.interaction_level as Project['interactionLevel'],
    outputDirectory: row.output_directory as string,
    accessibilityLevel: row.accessibility_level as Project['accessibilityLevel'],
    externalResourcesAccessible: row.external_resources_accessible as boolean,
    browserCompatibility: row.browser_compatibility as Project['browserCompatibility'],
    promptMode: row.prompt_mode as Project['promptMode'],
    designDirection: row.design_direction as Project['designDirection'],
    selectedSharedSkillIds: row.selected_shared_skill_ids as string[],
    customSkills: (row.custom_skills ?? []) as Project['customSkills'],
    selectedSharedMemoryIds: row.selected_shared_memory_ids as string[],
    customMemories: (row.custom_memories ?? []) as Project['customMemories'],
    regenerationCount: row.regeneration_count as number,
    generatedPrompt: row.generated_prompt as string,
  };
}

export function projectToRow(project: Partial<Project>, userId?: string) {
  const row: Record<string, unknown> = {};
  if (userId !== undefined) row.user_id = userId;
  if (project.id !== undefined) row.id = project.id;
  if (project.name !== undefined) row.name = project.name;
  if (project.outputType !== undefined) row.output_type = project.outputType;
  if (project.interactionLevel !== undefined) row.interaction_level = project.interactionLevel;
  if (project.outputDirectory !== undefined) row.output_directory = project.outputDirectory;
  if (project.accessibilityLevel !== undefined) row.accessibility_level = project.accessibilityLevel;
  if (project.externalResourcesAccessible !== undefined) row.external_resources_accessible = project.externalResourcesAccessible;
  if (project.browserCompatibility !== undefined) row.browser_compatibility = project.browserCompatibility;
  if (project.promptMode !== undefined) row.prompt_mode = project.promptMode;
  if (project.designDirection !== undefined) row.design_direction = project.designDirection;
  if (project.selectedSharedSkillIds !== undefined) row.selected_shared_skill_ids = project.selectedSharedSkillIds;
  if (project.customSkills !== undefined) row.custom_skills = project.customSkills;
  if (project.selectedSharedMemoryIds !== undefined) row.selected_shared_memory_ids = project.selectedSharedMemoryIds;
  if (project.customMemories !== undefined) row.custom_memories = project.customMemories;
  if (project.regenerationCount !== undefined) row.regeneration_count = project.regenerationCount;
  if (project.generatedPrompt !== undefined) row.generated_prompt = project.generatedPrompt;

  // Pack form data fields into the `data` JSONB column
  const formFields = [
    'companyInfo', 'productInfo', 'featureInfo', 'currentImplementation',
    'uxResearch', 'uxWriting', 'figmaFileLink', 'designSystemStorybook',
    'designSystemNpm', 'designSystemFigma', 'prototypeSketches',
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

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setProjects(data.map(toProject));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user, fetchProjects]);

  const createProject = useCallback(async (name: string): Promise<string> => {
    const id = generateId();
    const project = emptyProject(id, name);
    const supabase = createClient();
    const row = projectToRow(project, user!.id);
    row.id = id;
    // Pack ALL form data for new projects
    row.data = {
      companyInfo: project.companyInfo,
      productInfo: project.productInfo,
      featureInfo: project.featureInfo,
      currentImplementation: project.currentImplementation,
      uxResearch: project.uxResearch,
      uxWriting: project.uxWriting,
      figmaFileLink: project.figmaFileLink,
      designSystemStorybook: project.designSystemStorybook,
      designSystemNpm: project.designSystemNpm,
      designSystemFigma: project.designSystemFigma,
      prototypeSketches: project.prototypeSketches,
    };
    const { error } = await supabase.from('projects').insert(row as never);
    if (error) throw error;
    await fetchProjects();
    return id;
  }, [user, fetchProjects]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    const supabase = createClient();
    await supabase.from('projects').delete().eq('id', id);
    await fetchProjects();
  }, [fetchProjects]);

  return { projects, isLoading, createProject, deleteProject };
}
