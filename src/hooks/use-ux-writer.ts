'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Json } from '@/lib/supabase-types';

export interface Suggestion {
  elementType: string;
  before: string;
  after: string;
  explanation: string;
  principle: string;
}

export interface AnalysisResult {
  suggestions: Suggestion[];
  summary: string;
}

export interface AnalysisEntry {
  id: string;
  description: string;
  focusNotes: string | null;
  screenshotUrl: string | null;
  results: AnalysisResult | null;
  createdAt: string;
}

interface AnalyzeParams {
  screenshotUrl: string | null;
  description: string;
  focusNotes: string | null;
  includeAiVoice: boolean;
}

export function useUxWriter() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('ux_writer_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (fetchError) { console.error('Failed to fetch history:', fetchError); return; }

    if (data) {
      setHistory(data.map((row) => ({
        id: row.id,
        description: row.description,
        focusNotes: row.focus_notes,
        screenshotUrl: row.screenshot_url,
        results: row.results as AnalysisResult | null,
        createdAt: row.created_at,
      })));
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user, fetchHistory]);

  const analyze = useCallback(async (params: AnalyzeParams): Promise<AnalysisResult> => {
    if (!user) throw new Error('Not authenticated');
    setAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke('ux-writer-analyze', {
        body: params,
      });

      if (fnError) {
        // Extract actual error from Edge Function response body
        let msg = 'Analysis failed';
        try {
          const ctx = fnError.context;
          if (ctx instanceof Response) {
            const body = await ctx.json();
            msg = body?.error || fnError.message || msg;
          } else {
            msg = fnError.message || msg;
          }
        } catch {
          msg = fnError.message || msg;
        }
        setError(msg);
        throw new Error(msg);
      }

      if (data?.error) {
        setError(data.error);
        throw new Error(data.error);
      }

      const result = data as AnalysisResult;
      setResults(result);

      // Save to history
      const { error: insertError } = await supabase.from('ux_writer_analyses').insert({
        user_id: user.id,
        description: params.description,
        focus_notes: params.focusNotes,
        screenshot_url: params.screenshotUrl,
        results: result as unknown as Json,
      });
      if (insertError) console.error('Failed to save analysis:', insertError);
      await fetchHistory();

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, [user, fetchHistory]);

  const loadEntry = useCallback((entry: AnalysisEntry) => {
    setResults(entry.results);
    setError(null);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase.from('ux_writer_analyses').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchHistory();
  }, [fetchHistory]);

  return { history, results, analyzing, error, analyze, loadEntry, deleteEntry };
}
