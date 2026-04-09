'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Project } from '@/lib/types';
import { projectToRow } from './use-projects';

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

export function useProject(id: string) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const isLoading = project === undefined;

  const fetchProject = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      setProject(null);
    } else {
      setProject(toProject(data));
    }
  }, [id]);

  useEffect(() => {
    if (user && id) fetchProject();
  }, [user, id, fetchProject]);

  const updateProject = useCallback(async (updates: Partial<Project>): Promise<void> => {
    const supabase = createClient();

    // For updates, we need to merge form data into the existing data JSONB
    // First, build the row for non-data fields
    const row = projectToRow(updates);
    delete row.id; // Don't update the ID

    // Handle the data JSONB column specially — merge with existing
    const formFields = [
      'companyInfo', 'productInfo', 'featureInfo', 'currentImplementation',
      'uxResearch', 'uxWriting', 'figmaFileLink', 'designSystemStorybook',
      'designSystemNpm', 'designSystemFigma', 'prototypeSketches',
    ] as const;

    const hasFormUpdates = formFields.some(k => updates[k] !== undefined);
    if (hasFormUpdates && project) {
      // Merge: start with current data, overlay updates
      const currentData = {
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
      for (const key of formFields) {
        if (updates[key] !== undefined) {
          (currentData as Record<string, unknown>)[key] = updates[key];
        }
      }
      row.data = currentData;
    }

    const { error } = await supabase.from('projects').update(row as never).eq('id', id);
    if (error) throw error;
    await fetchProject();
  }, [id, project, fetchProject]);

  return { project, isLoading, updateProject };
}
