'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export function useResearcherConfluence() {
  const { user } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState<string | null>(null);

  const publish = useCallback(async (projectId: string, spaceKey: string): Promise<void> => {
    if (!user) {
      setError('You must be logged in to publish to Confluence.');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setPageUrl(null);

    try {
      const supabase = createClient();
      const { data, error: invokeError } = await supabase.functions.invoke(
        'researcher-publish-confluence',
        { body: { projectId, spaceKey } }
      );

      if (invokeError) {
        setError(invokeError.message);
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      setPageUrl(data?.pageUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsPublishing(false);
    }
  }, [user]);

  return { publish, isPublishing, error, pageUrl };
}
