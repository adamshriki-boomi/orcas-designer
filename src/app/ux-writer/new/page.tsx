'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useUxAnalyze } from '@/hooks/use-ux-analyze';
import { createClient } from '@/lib/supabase';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/sonner';
import { Upload, X, AlertTriangle, Settings, Loader2 } from 'lucide-react';

export default function NewAnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasApiKey, loading: settingsLoading } = useUserSettings();
  const { analyze, analyzing } = useUxAnalyze();

  const [description, setDescription] = useState('');
  const [focusNotes, setFocusNotes] = useState('');
  const [includeAiVoice, setIncludeAiVoice] = useState(false);
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('ux-writer-screenshots')
        .upload(path, file);
      if (uploadError) {
        toast.error('Unable to upload screenshot');
        return;
      }
      setScreenshotPath(path);
      setScreenshotName(file.name);
    } catch {
      toast.error('Unable to upload screenshot');
    } finally {
      setUploading(false);
    }
  }, [user]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      // If we have a screenshot path, get a signed URL to pass to the edge function
      let screenshotUrl: string | null = null;
      if (screenshotPath) {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from('ux-writer-screenshots')
          .createSignedUrl(screenshotPath, 3600);
        if (!error && data?.signedUrl) {
          screenshotUrl = data.signedUrl;
        }
      }

      const { id } = await analyze({
        screenshotUrl,
        screenshotPath,
        description: description.trim(),
        focusNotes: focusNotes.trim() || null,
        includeAiVoice,
      });

      toast.success('Analysis complete');
      router.push(`/ux-writer/placeholder?_id=${encodeURIComponent(id)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [description, focusNotes, includeAiVoice, screenshotPath, analyze, router]);

  return (
    <FadeIn>
      <Header title="New Analysis" />
      <Breadcrumbs items={[
        { label: 'UX Writer', href: '/ux-writer' },
        { label: 'New Analysis' },
      ]} />
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
      <PageContainer>
        <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
          {/* Screenshot upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Screenshot</label>
            {screenshotPath ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30">
                <Upload className="size-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{screenshotName}</span>
                <button
                  type="button"
                  onClick={() => { setScreenshotPath(null); setScreenshotName(null); }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label
                className="flex items-center justify-center gap-2 px-3 py-8 rounded-md border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) uploadFile(file);
                }}
              >
                <Upload className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Drop an image or click to upload'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="ux-description">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="ux-description"
              rows={4}
              placeholder="e.g., Login dialog with error states for invalid credentials"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Focus notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="ux-focus">
              Focus Area
            </label>
            <Input
              id="ux-focus"
              type="text"
              placeholder="e.g., error messages, button labels, tooltips"
              value={focusNotes}
              onChange={(e) => setFocusNotes(e.target.value)}
            />
          </div>

          {/* AI Voice toggle */}
          <div
            className="flex items-center justify-between py-2 cursor-pointer"
            onClick={() => setIncludeAiVoice(!includeAiVoice)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIncludeAiVoice(!includeAiVoice); } }}
            role="switch"
            aria-checked={includeAiVoice}
            tabIndex={0}
          >
            <div>
              <p className="text-sm font-medium">Include AI Voice guidelines</p>
              <p className="text-xs text-muted-foreground">For AI features (chatbot, assistant text)</p>
            </div>
            <Switch
              checked={includeAiVoice}
              onCheckedChange={setIncludeAiVoice}
              size="sm"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={!description.trim() || analyzing || !hasApiKey}
          >
            {analyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </form>
      </PageContainer>
    </FadeIn>
  );
}
