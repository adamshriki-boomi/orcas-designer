'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Project } from '@/lib/types';
import { projectToRow, toProject } from './use-projects';

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
