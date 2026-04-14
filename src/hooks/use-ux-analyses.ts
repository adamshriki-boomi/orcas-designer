'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { UxAnalysisEntry, UxAnalysisResult } from '@/lib/types';

export function toUxAnalysisEntry(row: Record<string, unknown>): UxAnalysisEntry {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    focusNotes: row.focus_notes as string | null,
    screenshotUrl: row.screenshot_url as string | null,
    includeAiVoice: row.include_ai_voice as boolean,
    results: row.results as UxAnalysisResult | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useUxAnalyses() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<UxAnalysisEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalyses = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ux_writer_analyses')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setAnalyses(data.map(toUxAnalysisEntry));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchAnalyses();
  }, [user, fetchAnalyses]);

  const deleteAnalysis = useCallback(async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('ux_writer_analyses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchAnalyses();
  }, [fetchAnalyses]);

  return { analyses, isLoading, deleteAnalysis };
}
