'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { UxAnalysisEntry, UxAnalysisResult } from '@/lib/types';
import { toUxAnalysisEntry } from './use-ux-analyses';
import type { Json } from '@/lib/supabase-types';

export function useUxAnalysis(id: string) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<UxAnalysisEntry | null | undefined>(undefined);
  const isLoading = analysis === undefined;

  const fetchAnalysis = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ux_writer_analyses')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      setAnalysis(null);
    } else {
      setAnalysis(toUxAnalysisEntry(data));
    }
  }, [id]);

  useEffect(() => {
    if (user && id) fetchAnalysis();
  }, [user, id, fetchAnalysis]);

  const updateAnalysis = useCallback(async (updates: {
    name?: string;
    description?: string;
    focusNotes?: string | null;
    screenshotUrl?: string | null;
    includeAiVoice?: boolean;
    results?: UxAnalysisResult | null;
  }): Promise<void> => {
    const supabase = createClient();
    const row: Record<string, unknown> = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.focusNotes !== undefined) row.focus_notes = updates.focusNotes;
    if (updates.screenshotUrl !== undefined) row.screenshot_url = updates.screenshotUrl;
    if (updates.includeAiVoice !== undefined) row.include_ai_voice = updates.includeAiVoice;
    if (updates.results !== undefined) row.results = updates.results as unknown as Json;

    const { error } = await supabase
      .from('ux_writer_analyses')
      .update(row as never)
      .eq('id', id);
    if (error) throw error;
    await fetchAnalysis();
  }, [id, fetchAnalysis]);

  return { analysis, isLoading, updateAnalysis, refetch: fetchAnalysis };
}
