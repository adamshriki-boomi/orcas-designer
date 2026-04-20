'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { PromptVersion } from '@/lib/types';
import type { WizardSnapshot, ContextSnapshot } from '@/lib/prompt-payload-builder';

const POLL_INTERVAL_MS = 3000;

/** Convert a Supabase row into the camelCase PromptVersion type. */
function toPromptVersion(row: Record<string, unknown>): PromptVersion {
  return {
    id: row.id as string,
    promptId: row.prompt_id as string,
    userId: row.user_id as string,
    versionNumber: row.version_number as number,
    status: row.status as PromptVersion['status'],
    content: (row.content as string | null) ?? null,
    wizardSnapshot: (row.wizard_snapshot as Record<string, unknown>) ?? {},
    contextSnapshot: (row.context_snapshot as Record<string, unknown> | null) ?? null,
    model: row.model as string,
    inputTokens: (row.input_tokens as number | null) ?? null,
    outputTokens: (row.output_tokens as number | null) ?? null,
    thinkingEnabled: (row.thinking_enabled as boolean) ?? true,
    label: (row.label as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

export interface UsePromptVersionsResult {
  versions: PromptVersion[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Subscribes to prompt_versions for a given prompt_id. Uses polling (every 3s)
 * while any version is in `status='running'` to surface completion without
 * requiring Supabase realtime. Mirrors the Researcher feature pattern.
 */
export function usePromptVersions(promptId: string | null): UsePromptVersionsResult {
  const { user } = useAuth();
  const [versions, setVersions] = useState<PromptVersion[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const isLoading = versions === undefined;

  const fetchVersions = useCallback(async () => {
    if (!promptId) {
      setVersions([]);
      return;
    }
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', promptId)
      .order('version_number', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setVersions([]);
      return;
    }

    setError(null);
    setVersions((data ?? []).map((row) => toPromptVersion(row as Record<string, unknown>)));
  }, [promptId]);

  useEffect(() => {
    if (user && promptId) fetchVersions();
    else setVersions([]);
  }, [user, promptId, fetchVersions]);

  // Poll while any version is running.
  useEffect(() => {
    if (!versions || versions.length === 0) return;
    const anyRunning = versions.some((v) => v.status === 'running');
    if (!anyRunning) return;

    const interval = setInterval(() => {
      fetchVersions();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [versions, fetchVersions]);

  return {
    versions: versions ?? [],
    isLoading,
    error,
    refresh: fetchVersions,
  };
}

export interface UseGenerateVersionResult {
  generate: (
    promptId: string,
    wizardSnapshot: WizardSnapshot,
    contextSnapshot: ContextSnapshot,
  ) => Promise<{ versionId: string; versionNumber: number }>;
  isStarting: boolean;
  error: string | null;
}

/**
 * Starts a new AI generation via the `prompt-generator-start` edge function.
 * Returns immediately with the new version id/number; the worker runs in the
 * background and usePromptVersions picks up the completion via polling.
 */
export function useGenerateVersion(): UseGenerateVersionResult {
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (
      promptId: string,
      wizardSnapshot: WizardSnapshot,
      contextSnapshot: ContextSnapshot,
    ) => {
      if (!user) {
        throw new Error('You must be logged in to generate prompts.');
      }

      setIsStarting(true);
      setError(null);

      try {
        const supabase = createClient();

        const { count } = await supabase
          .from('user_settings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('claude_api_key', '');

        if (!count || count === 0) {
          const message = 'Claude API key is required. Please add it in Settings.';
          setError(message);
          throw new Error(message);
        }

        const { data, error: invokeError } = await supabase.functions.invoke(
          'prompt-generator-start',
          {
            body: { promptId, wizardSnapshot, contextSnapshot },
          },
        );

        if (invokeError) {
          // Try to surface the server-side error body rather than the generic
          // "Edge Function returned a non-2xx status code" message.
          let serverMessage: string | undefined;
          try {
            const ctx = invokeError.context as { json?: () => Promise<unknown> } | undefined;
            if (ctx?.json) {
              const parsed = (await ctx.json()) as { error?: string };
              serverMessage = parsed.error;
            }
          } catch {
            // swallow; fall through to generic
          }
          const message = serverMessage ?? invokeError.message ?? 'Failed to start generation.';
          setError(message);
          throw new Error(message);
        }

        const result = data as { versionId: string; versionNumber: number };
        return result;
      } finally {
        setIsStarting(false);
      }
    },
    [user],
  );

  return { generate, isStarting, error };
}

/**
 * Updates the user-visible label on a version row. Safe to call with an
 * empty string to clear the label.
 */
export function useUpdateVersionLabel() {
  const updateLabel = useCallback(async (versionId: string, label: string) => {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('prompt_versions')
      .update({ label: label.trim() === '' ? null : label.trim() })
      .eq('id', versionId);
    if (updateError) throw updateError;
  }, []);
  return { updateLabel };
}

/**
 * Soft-deletes a version by dropping its row. The DB cascades cleanly because
 * versions are not referenced elsewhere.
 */
export function useDeleteVersion() {
  const deleteVersion = useCallback(async (versionId: string) => {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from('prompt_versions')
      .delete()
      .eq('id', versionId);
    if (deleteError) throw deleteError;
  }, []);
  return { deleteVersion };
}

