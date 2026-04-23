'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Prompt } from '@/lib/types';
import { promptToRow, toPrompt } from './use-prompts';

export function usePrompt(id: string) {
  const { user } = useAuth();
  const [project, setProject] = useState<Prompt | null | undefined>(undefined);
  const isLoading = project === undefined;

  const fetchPrompt = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      setProject(null);
    } else {
      setProject(toPrompt(data));
    }
  }, [id]);

  useEffect(() => {
    if (user && id) fetchPrompt();
  }, [user, id, fetchPrompt]);

  const updatePrompt = useCallback(async (updates: Partial<Prompt>): Promise<void> => {
    const supabase = createClient();

    // For updates, we need to merge form data into the existing data JSONB
    // First, build the row for non-data fields
    const row = promptToRow(updates);
    delete row.id; // Don't update the ID

    // Handle the data JSONB column specially — merge with existing
    const formFields = [
      'companyInfo', 'productInfo', 'featureInfo', 'currentImplementation',
      'uxResearch', 'uxWriting', 'prototypeSketches',
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
        prototypeSketches: project.prototypeSketches,
      };
      for (const key of formFields) {
        if (updates[key] !== undefined) {
          (currentData as Record<string, unknown>)[key] = updates[key];
        }
      }
      row.data = currentData;
    }

    const { error } = await supabase.from('prompts').update(row as never).eq('id', id);
    if (error) throw error;
    await fetchPrompt();
  }, [id, project, fetchPrompt]);

  return { project, isLoading, updatePrompt };
}
