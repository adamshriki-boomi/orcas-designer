'use client';

import { useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { FadeIn } from '@/components/ui/motion';
import { InputPanel } from '@/components/ux-writer/input-panel';
import { ResultsPanel } from '@/components/ux-writer/results-panel';
import { useUxWriter } from '@/hooks/use-ux-writer';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';

export default function UxWriterPage() {
  const { user } = useAuth();
  const { history, results, analyzing, error, analyze, loadEntry, deleteEntry } = useUxWriter();

  const handleAnalyze = useCallback(async (params: {
    screenshotUrl: string | null;
    description: string;
    focusNotes: string | null;
    includeAiVoice: boolean;
  }) => {
    try {
      await analyze(params);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [analyze]);

  const handleScreenshotUpload = useCallback(async (file: File): Promise<string> => {
    const supabase = createClient();
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('ux-writer-screenshots')
      .upload(path, file);
    if (error) {
      toast.error('Failed to upload screenshot');
      throw error;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('ux-writer-screenshots')
      .getPublicUrl(path);
    return publicUrl;
  }, [user]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteEntry(id);
      toast.success('Analysis deleted');
    } catch {
      toast.error('Failed to delete analysis');
    }
  }, [deleteEntry]);

  return (
    <FadeIn>
      <Header title="UX Writer" description="Analyze and improve UI copy using Boomi's UX Writing Guidelines" />
      <div className="flex flex-1 min-h-0 px-6 pb-6 gap-6" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Left panel: Input */}
        <div className="w-[380px] shrink-0 overflow-y-auto pr-2">
          <InputPanel
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
            history={history}
            onHistorySelect={loadEntry}
            onHistoryDelete={handleDelete}
            onScreenshotUpload={handleScreenshotUpload}
          />
        </div>

        {/* Right panel: Results */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <ResultsPanel results={results} analyzing={analyzing} error={error} />
        </div>
      </div>
    </FadeIn>
  );
}
