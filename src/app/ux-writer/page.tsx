'use client';

import { useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { FadeIn } from '@/components/ui/motion';
import { InputPanel } from '@/components/ux-writer/input-panel';
import { ResultsPanel } from '@/components/ux-writer/results-panel';
import { useUxWriter } from '@/hooks/use-ux-writer';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';
import { Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function UxWriterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { hasApiKey, loading: settingsLoading } = useUserSettings();
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
      {!settingsLoading && !hasApiKey && (
        <div className="mx-6 mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="size-5 text-yellow-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Claude API key required</p>
            <p className="text-xs text-muted-foreground">Add your API key in Settings to start analyzing UI copy.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
            <Settings className="size-4 mr-1.5" />
            Settings
          </Button>
        </div>
      )}
      <div className="flex flex-1 min-h-0 px-6 pb-6 gap-6" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Left panel: Input */}
        <div className="w-[380px] shrink-0 overflow-y-auto pr-2">
          <InputPanel
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
            disabled={!hasApiKey}
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
