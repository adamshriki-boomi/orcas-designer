'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export function useResearcherRun() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (projectId: string): Promise<void> => {
    if (!user) {
      setError('You must be logged in to run research.');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      // Check for API key existence without fetching the actual key
      const supabase = createClient();
      const { count } = await supabase
        .from('user_settings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('claude_api_key', '');

      if (!count || count === 0) {
        setError('Claude API key is required. Please add it in Settings.');
        setIsRunning(false);
        return;
      }

      // Call the edge function (API key is read server-side by the worker)
      const { error: invokeError } = await supabase.functions.invoke('researcher-start', {
        body: { projectId },
      });

      if (invokeError) {
        setError(invokeError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsRunning(false);
    }
  }, [user]);

  return { run, isRunning, error };
}
