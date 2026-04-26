'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Info, Settings, Trash2, Upload, X,
  Loader2, PenLine, Image as ImageIcon, Clock,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useUxAnalysis } from '@/hooks/use-ux-analysis';
import { useUxAnalyze } from '@/hooks/use-ux-analyze';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useSharedMemories } from '@/hooks/use-shared-memories';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase';
import {
  UX_WRITER_CONTEXT_MEMORY_IDS,
  UX_WRITER_LOCKED_MEMORY_IDS,
  BUILT_IN_AI_VOICE_MEMORY_ID,
} from '@/lib/constants';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { FadeIn } from '@/components/ui/motion';
import { SuggestionCard } from '@/components/ux-writer/suggestion-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MemoryCard } from '@/components/memories/memory-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { extractScreenshotPath } from '@/lib/ux-writer-utils';

interface Props {
  id: string;
}

export default function AnalysisDetailClient({ id }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [actualId] = useState(() => {
    const queryId = searchParams.get('_id');
    return queryId && id === 'placeholder' ? queryId : id;
  });

  useEffect(() => {
    if (searchParams.get('_id')) {
      window.history.replaceState(null, '', `${process.env.NEXT_PUBLIC_BASE_PATH}/ux-writer/${actualId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { analysis, isLoading, refetch } = useUxAnalysis(actualId);
  const { reanalyze, analyzing } = useUxAnalyze();
  const { hasApiKey } = useUserSettings();
  const { sharedMemories } = useSharedMemories();
  const { user } = useAuth();

  // Edit mode state for Details tab
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editFocusNotes, setEditFocusNotes] = useState('');
  const [editMemoryIds, setEditMemoryIds] = useState<string[]>(UX_WRITER_LOCKED_MEMORY_IDS);
  const [editScreenshotPath, setEditScreenshotPath] = useState<string | null>(null);
  const [editScreenshotName, setEditScreenshotName] = useState<string | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Screenshot signed URL for display
  const [signedScreenshotUrl, setSignedScreenshotUrl] = useState<string | null>(null);

  // Built-in memories surfaced in the Context picker — same set as the
  // New Analysis page, ordered by UX_WRITER_CONTEXT_MEMORY_IDS.
  const contextMemories = useMemo(() => {
    return UX_WRITER_CONTEXT_MEMORY_IDS
      .map((id) => sharedMemories.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => m !== undefined);
  }, [sharedMemories]);

  // Memories selected for THIS saved analysis, used for the read-only view.
  const selectedContextMemories = useMemo(() => {
    if (!analysis) return [];
    const ids = new Set(analysis.memoryIds);
    // Backwards-compat: surface AI Voice if the legacy toggle was on
    if (analysis.includeAiVoice) ids.add(BUILT_IN_AI_VOICE_MEMORY_ID);
    return contextMemories.filter((m) => ids.has(m.id));
  }, [analysis, contextMemories]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('results');

  // Generate signed URL for screenshot
  useEffect(() => {
    if (!analysis?.screenshotUrl) {
      setSignedScreenshotUrl(null);
      return;
    }

    const storagePath = extractScreenshotPath(analysis.screenshotUrl);
    if (!storagePath) {
      setSignedScreenshotUrl(null);
      return;
    }

    const supabase = createClient();
    supabase.storage
      .from('ux-writer-screenshots')
      .createSignedUrl(storagePath, 3600)
      .then(({ data, error }) => {
        if (!error && data?.signedUrl) {
          setSignedScreenshotUrl(data.signedUrl);
        } else {
          setSignedScreenshotUrl(null);
        }
      });
  }, [analysis?.screenshotUrl]);

  const enterEditMode = useCallback(() => {
    if (!analysis) return;
    setEditDescription(analysis.description);
    setEditFocusNotes(analysis.focusNotes ?? '');
    // Restore selected memories. Backwards-compat: legacy rows only set
    // include_ai_voice; promote that to the AI Voice memory selection.
    const restored = new Set(analysis.memoryIds);
    UX_WRITER_LOCKED_MEMORY_IDS.forEach((id) => restored.add(id));
    if (analysis.includeAiVoice) restored.add(BUILT_IN_AI_VOICE_MEMORY_ID);
    setEditMemoryIds(Array.from(restored));
    setEditScreenshotPath(analysis.screenshotUrl);
    setEditScreenshotName(analysis.screenshotUrl ? 'Current screenshot' : null);
    // Reuse the already-fetched signed URL for the existing screenshot
    // preview so the user sees what they're editing before re-uploading.
    setEditPreviewUrl(signedScreenshotUrl);
    setEditing(true);
  }, [analysis, signedScreenshotUrl]);

  // Revoke any local object URL we own when the preview changes or the
  // edit form unmounts. (Signed URLs are http strings, not object URLs.)
  useEffect(() => {
    return () => {
      if (editPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(editPreviewUrl);
    };
  }, [editPreviewUrl]);

  const uploadFile = useCallback(async (file: File) => {
    if (!user) return;

    // Show preview immediately
    if (editPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(editPreviewUrl);
    const objectUrl = URL.createObjectURL(file);
    setEditPreviewUrl(objectUrl);
    setEditScreenshotName(file.name);

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
      setEditScreenshotPath(path);
    } catch {
      toast.error('Unable to upload screenshot');
    } finally {
      setUploading(false);
    }
  }, [user, editPreviewUrl]);

  const clearEditScreenshot = useCallback(() => {
    if (editPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(editPreviewUrl);
    setEditPreviewUrl(null);
    setEditScreenshotPath(null);
    setEditScreenshotName(null);
  }, [editPreviewUrl]);

  const toggleEditMemory = useCallback((id: string) => {
    if (UX_WRITER_LOCKED_MEMORY_IDS.includes(id)) return;
    setEditMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleReanalyze = useCallback(async () => {
    if (!editDescription.trim()) return;
    try {
      // Get a signed URL for the edge function if we have a screenshot path
      let screenshotUrl: string | null = null;
      if (editScreenshotPath) {
        if (editScreenshotPath.startsWith('http')) {
          screenshotUrl = editScreenshotPath;
        } else {
          const supabase = createClient();
          const { data, error } = await supabase.storage
            .from('ux-writer-screenshots')
            .createSignedUrl(editScreenshotPath, 3600);
          if (!error && data?.signedUrl) {
            screenshotUrl = data.signedUrl;
          }
        }
      }

      await reanalyze(actualId, {
        screenshotUrl,
        screenshotPath: editScreenshotPath?.startsWith('http') ? undefined : editScreenshotPath,
        description: editDescription.trim(),
        focusNotes: editFocusNotes.trim() || null,
        includeAiVoice: editMemoryIds.includes(BUILT_IN_AI_VOICE_MEMORY_ID),
        memoryIds: editMemoryIds,
      });

      await refetch();
      setEditing(false);
      setActiveTab('results');
      toast.success('Re-analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Re-analysis failed');
    }
  }, [actualId, editDescription, editFocusNotes, editMemoryIds, editScreenshotPath, reanalyze, refetch]);

  const handleDelete = useCallback(async () => {
    try {
      const supabase = createClient();

      // Clean up screenshot from storage if it exists
      if (analysis?.screenshotUrl && !analysis.screenshotUrl.startsWith('http')) {
        await supabase.storage.from('ux-writer-screenshots').remove([analysis.screenshotUrl]);
      }

      await supabase.from('ux_writer_analyses').delete().eq('id', actualId);
      setDeleteOpen(false);
      router.push('/ux-writer');
      toast.success('Analysis deleted');
    } catch {
      toast.error('Unable to delete analysis');
    }
  }, [actualId, analysis?.screenshotUrl, router]);

  if (isLoading) {
    return (
      <>
        <Header title="" />
        <PageContainer>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-72 animate-pulse rounded bg-muted" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  if (!analysis) {
    return (
      <>
        <Header title="Not Found" />
        <PageContainer>
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Analysis not found.</p>
            <Link href="/ux-writer" className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" />
              Back to UX Writer
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const suggestions = analysis.results?.suggestions ?? [];
  const summary = analysis.results?.summary ?? '';

  return (
    <FadeIn>
      <Header title={analysis.name || 'Untitled Analysis'} />
      <Breadcrumbs items={[
        { label: 'UX Writer', href: '/ux-writer' },
        { label: analysis.name || 'Untitled Analysis' },
      ]} />
      <PageContainer>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="results">
              <FileText className="size-3.5" />
              Results
            </TabsTrigger>
            <TabsTrigger value="details">
              <Info className="size-3.5" />
              Details
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="size-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* ===== Results Tab ===== */}
          <TabsContent value="results">
            {suggestions.length === 0 ? (
              <div className="py-16 text-center">
                <PenLine className="size-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No suggestions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {summary && (
                  <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-4">
                    {summary}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestions.map((suggestion, i) => (
                    <SuggestionCard key={i} suggestion={suggestion} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ===== Details Tab ===== */}
          <TabsContent value="details">
            {editing ? (
              /* Edit mode */
              <div className="mx-auto max-w-2xl space-y-6">
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
                    {editPreviewUrl ? (
                      <div className="space-y-2">
                        <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={editPreviewUrl}
                            alt={editScreenshotName ?? 'UI screenshot'}
                            className="block max-h-96 w-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted-foreground">
                            {uploading ? 'Uploading…' : editScreenshotName}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearEditScreenshot}
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
                    <Textarea
                      label="Description"
                      required
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                    <Input
                      label="Focus area"
                      type="text"
                      value={editFocusNotes}
                      onChange={(e) => setEditFocusNotes(e.target.value)}
                    />
                  </CardContent>
                </Card>

                {/* Context */}
                <Card>
                  <CardHeader>
                    <CardTitle>Context</CardTitle>
                    <CardDescription>
                      Boomi UX Writing Guidelines are always applied. Add more
                      shared context to tailor the analysis.
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
                              selected={locked || editMemoryIds.includes(memory.id)}
                              locked={locked}
                              onToggle={locked ? undefined : () => toggleEditMemory(memory.id)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditing(false)} disabled={analyzing}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReanalyze}
                    disabled={!editDescription.trim() || analyzing || !hasApiKey}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      'Re-analyze'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Read-only mode */
              <div className="mx-auto max-w-2xl space-y-6">
                {/* Screenshot preview */}
                {signedScreenshotUrl && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <ImageIcon className="size-4" />
                      Screenshot
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signedScreenshotUrl}
                        alt="UI screenshot"
                        className="w-full max-h-80 object-contain bg-muted/30"
                        onError={(e) => {
                          // Hide broken image
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{analysis.description}</p>
                </div>

                {/* Focus notes */}
                {analysis.focusNotes && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Focus area</p>
                    <p className="text-sm">{analysis.focusNotes}</p>
                  </div>
                )}

                {/* Context */}
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Context</p>
                  <p className="text-xs text-muted-foreground">
                    Boomi UX Writing Guidelines are always applied.
                  </p>
                  {selectedContextMemories.length > 0 ? (
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
                      {selectedContextMemories.map((m) => (
                        <li key={m.id}>{m.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No additional context attached.
                    </p>
                  )}
                </div>

                {/* Timestamps */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Created {new Date(analysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    Updated {new Date(analysis.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <Button variant="outline" onClick={enterEditMode}>
                  <PenLine className="size-3.5" />
                  Edit & Re-analyze
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ===== Settings Tab ===== */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="rounded-lg border border-destructive/20 p-6">
                <h3 className="text-base font-medium text-destructive mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete this analysis, there is no going back. All data will be permanently removed.
                </p>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-3.5" />
                  Delete Analysis
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete analysis?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The analysis and all its data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FadeIn>
  );
}
