'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Info, Settings, Trash2, Upload, X,
  Loader2, PenLine, Image, Clock,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useUxAnalysis } from '@/hooks/use-ux-analysis';
import { useUxAnalyze } from '@/hooks/use-ux-analyze';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { FadeIn } from '@/components/ui/motion';
import { SuggestionCard } from '@/components/ux-writer/suggestion-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import dynamic from 'next/dynamic';

const ExBadge = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false },
);

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
  const { user } = useAuth();

  // Edit mode state for Details tab
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editFocusNotes, setEditFocusNotes] = useState('');
  const [editIncludeAiVoice, setEditIncludeAiVoice] = useState(false);
  const [editScreenshotPath, setEditScreenshotPath] = useState<string | null>(null);
  const [editScreenshotName, setEditScreenshotName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Screenshot signed URL for display
  const [signedScreenshotUrl, setSignedScreenshotUrl] = useState<string | null>(null);

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
    setEditIncludeAiVoice(analysis.includeAiVoice);
    setEditScreenshotPath(analysis.screenshotUrl);
    setEditScreenshotName(analysis.screenshotUrl ? 'Current screenshot' : null);
    setEditing(true);
  }, [analysis]);

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
      setEditScreenshotPath(path);
      setEditScreenshotName(file.name);
    } catch {
      toast.error('Unable to upload screenshot');
    } finally {
      setUploading(false);
    }
  }, [user]);

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
        includeAiVoice: editIncludeAiVoice,
      });

      await refetch();
      setEditing(false);
      setActiveTab('results');
      toast.success('Re-analysis complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Re-analysis failed');
    }
  }, [actualId, editDescription, editFocusNotes, editIncludeAiVoice, editScreenshotPath, reanalyze, refetch]);

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
              <div className="max-w-xl space-y-6">
                {/* Screenshot */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Screenshot</label>
                  {editScreenshotPath ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30">
                      <Upload className="size-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{editScreenshotName}</span>
                      <button
                        type="button"
                        onClick={() => { setEditScreenshotPath(null); setEditScreenshotName(null); }}
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
                  <label className="text-sm font-medium" htmlFor="edit-description">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="edit-description"
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                {/* Focus notes */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="edit-focus">
                    Focus Area
                  </label>
                  <Input
                    id="edit-focus"
                    type="text"
                    value={editFocusNotes}
                    onChange={(e) => setEditFocusNotes(e.target.value)}
                  />
                </div>

                {/* AI Voice toggle */}
                <div
                  className="flex items-center justify-between py-2 cursor-pointer"
                  onClick={() => setEditIncludeAiVoice(!editIncludeAiVoice)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditIncludeAiVoice(!editIncludeAiVoice); } }}
                  role="switch"
                  aria-checked={editIncludeAiVoice}
                  tabIndex={0}
                >
                  <div>
                    <p className="text-sm font-medium">Include AI Voice guidelines</p>
                    <p className="text-xs text-muted-foreground">For AI features (chatbot, assistant text)</p>
                  </div>
                  <Switch
                    checked={editIncludeAiVoice}
                    onCheckedChange={setEditIncludeAiVoice}
                    size="sm"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleReanalyze}
                    disabled={!editDescription.trim() || analyzing || !hasApiKey}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Re-analyze'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} disabled={analyzing}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Read-only mode */
              <div className="max-w-xl space-y-6">
                {/* Screenshot preview */}
                {signedScreenshotUrl && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Image className="size-4" />
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
                    <p className="text-sm font-medium text-muted-foreground">Focus Area</p>
                    <p className="text-sm">{analysis.focusNotes}</p>
                  </div>
                )}

                {/* AI Voice */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">AI Voice Guidelines</p>
                  <ExBadge
                    color={(analysis.includeAiVoice ? 'green' : 'gray') as never}
                    shape={"round" as never}
                    useTextContent
                  >
                    {analysis.includeAiVoice ? 'Included' : 'Not included'}
                  </ExBadge>
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
