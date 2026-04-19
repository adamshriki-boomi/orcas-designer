'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { ResearcherProject } from '@/lib/researcher-types';
import { researcherProjectToRow, toResearcherProject } from '@/lib/researcher-utils';

const POLL_INTERVAL_MS = 3000;

export function useResearcherProject(id: string, onCompleted?: () => void) {
  const { user } = useAuth();
  const [project, setProject] = useState<ResearcherProject | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const isLoading = project === undefined;
  const prevStatusRef = useRef<string | null>(null);

  const fetchProject = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('researcher_projects')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !data) {
      setProject(null);
      if (fetchError) setError(fetchError.message);
    } else {
      setError(null);
      const converted = toResearcherProject(data);
      setProject(converted);
    }
  }, [id]);

  useEffect(() => {
    if (user && id) fetchProject();
  }, [user, id, fetchProject]);

  // Fire onCompleted callback on running -> completed transition
  useEffect(() => {
    if (!project) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = project.status;
    if (prev === 'running' && project.status === 'completed') {
      onCompleted?.();
    }
  }, [project, onCompleted]);

  // Polling: refetch every 3s when status is 'running'
  useEffect(() => {
    if (!project || project.status !== 'running') return;
    const interval = setInterval(() => {
      fetchProject();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [project?.status, fetchProject]);

  const updateProject = useCallback(async (updates: Partial<ResearcherProject>): Promise<void> => {
    const supabase = createClient();
    const row = researcherProjectToRow(updates);
    delete row.id;
    const { error: updateError } = await supabase
      .from('researcher_projects')
      .update(row as never)
      .eq('id', id);
    if (updateError) throw updateError;
    await fetchProject();
  }, [id, fetchProject]);

  const deleteProject = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from('researcher_projects')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
    setProject(null);
  }, [id]);

  return { project, isLoading, error, updateProject, deleteProject };
}
