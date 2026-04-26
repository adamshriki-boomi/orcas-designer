'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useUxAnalyze } from '@/hooks/use-ux-analyze';
import { useSharedMemories } from '@/hooks/use-shared-memories';
import { createClient } from '@/lib/supabase';
import {
  UX_WRITER_CONTEXT_MEMORY_IDS,
  UX_WRITER_LOCKED_MEMORY_IDS,
  BUILT_IN_AI_VOICE_MEMORY_ID,
} from '@/lib/constants';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { MemoryCard } from '@/components/memories/memory-card';
import { Upload, X, AlertTriangle, Settings, Loader2, Image as ImageIcon } from 'lucide-react';

export default function NewAnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasApiKey, loading: settingsLoading } = useUserSettings();
  const { analyze, analyzing } = useUxAnalyze();
  const { sharedMemories } = useSharedMemories();

  const [description, setDescription] = useState('');
  const [focusNotes, setFocusNotes] = useState('');
  const [memoryIds, setMemoryIds] = useState<string[]>(UX_WRITER_LOCKED_MEMORY_IDS);
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Built-in memories surfaced in the Context picker. Filtered + ordered by
  // UX_WRITER_CONTEXT_MEMORY_IDS so layout stays predictable as memories
  // load asynchronously.
  const contextMemories = useMemo(() => {
    return UX_WRITER_CONTEXT_MEMORY_IDS
      .map((id) => sharedMemories.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => m !== undefined);
  }, [sharedMemories]);

  // Revoke the local object URL when the preview changes or the page unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const uploadFile = useCallback(async (file: File) => {
    if (!user) return;

    // Show preview immediately — no need to wait for the upload
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setScreenshotName(file.name);

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('ux-writer-screenshots')
        .upload(path, file);
      if (uploadError) {
        toast.error('Unable to upload screenshot');
        setPreviewUrl(null);
        setScreenshotName(null);
        return;
      }
      setScreenshotPath(path);
    } catch {
      toast.error('Unable to upload screenshot');
      setPreviewUrl(null);
      setScreenshotName(null);
    } finally {
      setUploading(false);
    }
  }, [user, previewUrl]);

  const clearScreenshot = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScreenshotPath(null);
    setScreenshotName(null);
  }, [previewUrl]);

  const toggleMemory = useCallback((id: string) => {
    if (UX_WRITER_LOCKED_MEMORY_IDS.includes(id)) return;
    setMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

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
        // Kept for backwards compat with the include_ai_voice column; the
        // edge function reads from memoryIds when available.
        includeAiVoice: memoryIds.includes(BUILT_IN_AI_VOICE_MEMORY_ID),
        memoryIds,
      });

      toast.success('Analysis complete');
      router.push(`/ux-writer/placeholder?_id=${encodeURIComponent(id)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [description, focusNotes, memoryIds, screenshotPath, analyze, router]);

  return (
    <FadeIn>
      <Header title="New Analysis" />
      <Breadcrumbs items={[
        { label: 'UX Writer', href: '/ux-writer' },
        { label: 'New Analysis' },
      ]} />
      {!settingsLoading && !hasApiKey && (
        <div className="mx-auto mb-4 max-w-2xl px-6">
          <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
            <AlertTriangle className="size-5 shrink-0 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Claude API key required</p>
              <p className="text-xs text-muted-foreground">Add your API key in Settings to start analyzing UI copy.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
              <Settings className="size-4 mr-1.5" />
              Settings
            </Button>
          </div>
        </div>
      )}
      <PageContainer>
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
          {/* Screenshot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="size-4 text-muted-foreground" />
                Screenshot
              </CardTitle>
              <CardDescription>
                Upload the UI you want analyzed. PNG, JPEG, or WebP, up to 5 MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="space-y-2">
                  <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={screenshotName ?? 'UI screenshot'}
                      className="block max-h-96 w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {uploading ? 'Uploading…' : screenshotName}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearScreenshot}
                      disabled={uploading}
                    >
                      <X className="size-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-10 text-center transition-colors hover:border-primary/50"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) uploadFile(file);
                  }}
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? 'Uploading…' : 'Drop an image or click to upload'}
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
            </CardContent>
          </Card>

          {/* Description + Focus */}
          <Card>
            <CardHeader>
              <CardTitle>What are we looking at?</CardTitle>
              <CardDescription>
                Describe the screen so the analysis lands on the right copy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="ux-focus">
                  Focus area
                </label>
                <Input
                  id="ux-focus"
                  type="text"
                  placeholder="e.g., error messages, button labels, tooltips"
                  value={focusNotes}
                  onChange={(e) => setFocusNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Context (built-in shared memories) */}
          <Card>
            <CardHeader>
              <CardTitle>Context</CardTitle>
              <CardDescription>
                Boomi UX Writing Guidelines are always applied. Add more shared
                context to tailor the analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contextMemories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading context…</p>
              ) : (
                <div className="grid gap-2">
                  {contextMemories.map((memory) => {
                    const locked = UX_WRITER_LOCKED_MEMORY_IDS.includes(memory.id);
                    return (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        selected={locked || memoryIds.includes(memory.id)}
                        locked={locked}
                        onToggle={locked ? undefined : () => toggleMemory(memory.id)}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/ux-writer')}
              disabled={analyzing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!description.trim() || analyzing || !hasApiKey}
            >
              {analyzing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        </form>
      </PageContainer>
    </FadeIn>
  );
}
