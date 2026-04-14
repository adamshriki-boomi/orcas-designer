'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { UxAnalysisResult } from '@/lib/types';
import type { Json } from '@/lib/supabase-types';
import { deriveNameFromDescription } from '@/lib/ux-writer-utils';

interface AnalyzeParams {
  /** Signed URL passed to the edge function for image analysis */
  screenshotUrl: string | null;
  /** Storage path to persist in the DB (if different from screenshotUrl) */
  screenshotPath?: string | null;
  description: string;
  focusNotes: string | null;
  includeAiVoice: boolean;
}

/** Call the edge function and extract the result, throwing on errors. */
async function callEdgeFunction(
  params: AnalyzeParams,
  setError: (msg: string) => void,
): Promise<{ supabase: ReturnType<typeof createClient>; result: UxAnalysisResult; name: string }> {
  const supabase = createClient();
  const { data, error: fnError } = await supabase.functions.invoke('ux-writer-analyze', {
    body: params,
  });

  if (fnError) {
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

  const result = data as UxAnalysisResult;
  const name = result.name?.trim() || deriveNameFromDescription(params.description);

  return { supabase, result, name };
}

export function useUxAnalyze() {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Run analysis and insert a new row. Returns the new entry's ID + results. */
  const analyze = useCallback(async (params: AnalyzeParams): Promise<{ id: string; result: UxAnalysisResult }> => {
    if (!user) throw new Error('Not authenticated');
    setAnalyzing(true);
    setError(null);

    try {
      const { supabase, result, name } = await callEdgeFunction(params, setError);

      const { data: inserted, error: insertError } = await supabase
        .from('ux_writer_analyses')
        .insert({
          user_id: user.id,
          name,
          description: params.description,
          focus_notes: params.focusNotes,
          screenshot_url: params.screenshotPath ?? params.screenshotUrl,
          include_ai_voice: params.includeAiVoice,
          results: result as unknown as Json,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      return { id: inserted.id, result: { ...result, name } };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  /** Re-analyze an existing entry (update in place). */
  const reanalyze = useCallback(async (
    entryId: string,
    params: AnalyzeParams,
  ): Promise<UxAnalysisResult> => {
    if (!user) throw new Error('Not authenticated');
    setAnalyzing(true);
    setError(null);

    try {
      const { supabase, result, name } = await callEdgeFunction(params, setError);

      const { error: updateError } = await supabase
        .from('ux_writer_analyses')
        .update({
          name,
          description: params.description,
          focus_notes: params.focusNotes,
          screenshot_url: params.screenshotPath ?? params.screenshotUrl,
          include_ai_voice: params.includeAiVoice,
          results: result as unknown as Json,
        } as never)
        .eq('id', entryId);
      if (updateError) throw updateError;

      return { ...result, name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  return { analyze, reanalyze, analyzing, error };
}
