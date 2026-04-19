'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { ResearcherProject } from '@/lib/researcher-types';
import { toResearcherProject } from '@/lib/researcher-utils';

export function useResearcherProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ResearcherProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('researcher_projects')
      .select('*')
      .order('updated_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
      setProjects([]);
    } else {
      setError(null);
      setProjects((data ?? []).map(toResearcherProject));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user, fetchProjects]);

  return { projects, isLoading, error, refresh: fetchProjects };
}
