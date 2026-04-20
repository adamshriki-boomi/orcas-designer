'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { usePrompt } from '@/hooks/use-prompt';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import { useSharedMemories } from '@/hooks/use-shared-memories';
import {
  usePromptVersions,
  useGenerateVersion,
  useUpdateVersionLabel,
  useDeleteVersion,
} from '@/hooks/use-prompt-versions';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { FadeIn } from '@/components/ui/motion';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { PromptRenderer } from '@/components/prompt/prompt-renderer';
import { buildPromptGenerationPayload } from '@/lib/prompt-payload-builder';
import {
  getLatestCompleted,
  hasRunningVersion,
  totalTokens,
  formatTokens,
  elapsedSeconds,
  versionLabel,
  statusText,
} from '@/lib/prompt-version-utils';
import { cn } from '@/lib/utils';
import type { PromptVersion } from '@/lib/types';

interface PromptDetailClientProps {
  id: string;
}

export default function PromptDetailClient({ id }: PromptDetailClientProps) {
  const { project, isLoading: promptLoading } = usePrompt(id);
  const { sharedSkills } = useSharedSkills();
  const { sharedMemories } = useSharedMemories();
  const {
    versions,
    isLoading: versionsLoading,
    refresh: refreshVersions,
  } = usePromptVersions(project?.id ?? null);
  const { generate, isStarting, error: generateError } = useGenerateVersion();
  const { updateLabel } = useUpdateVersionLabel();
  const { deleteVersion } = useDeleteVersion();
  const { hasApiKey, loading: settingsLoading } = useUserSettings();
  const { copied, copy } = useCopyToClipboard();

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  const latestCompleted = useMemo(() => getLatestCompleted(versions), [versions]);
  const isGenerating = hasRunningVersion(versions);

  const selectedVersion: PromptVersion | null = useMemo(() => {
    if (selectedVersionId) {
      return versions.find((v) => v.id === selectedVersionId) ?? null;
    }
    const running = versions.find((v) => v.status === 'running');
    return running ?? latestCompleted;
  }, [selectedVersionId, versions, latestCompleted]);

  if (promptLoading || versionsLoading || settingsLoading) {
    return (
      <>
        <Header title="Prompt" description="Loading..." />
        <PageContainer>
          <div className="grid place-items-center min-h-[40vh]">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Header title="Prompt not found" description="This prompt doesn't exist or you don't have access." />
        <PageContainer>
          <Link
            href="/prompt-generator"
            className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}
          >
            <ArrowLeft className="size-4" />
            Back to Prompt Generator
          </Link>
        </PageContainer>
      </>
    );
  }

  async function handleRegenerate() {
    if (!project) return;
    setRegenOpen(false);
    try {
      const { wizardSnapshot, contextSnapshot } = buildPromptGenerationPayload(
        project,
        sharedSkills,
        sharedMemories,
      );
      await generate(project.id, wizardSnapshot, contextSnapshot);
      toast.success('Generating with Claude Opus 4.7...');
      await refreshVersions();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Generation failed';
      toast.error(message);
    }
  }

  async function handleCopy(content: string) {
    try {
      await copy(content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Unable to copy');
    }
  }

  async function handleSaveLabel(versionId: string) {
    try {
      await updateLabel(versionId, labelDraft);
      toast.success('Label saved');
      setEditingLabelId(null);
      await refreshVersions();
    } catch {
      toast.error('Unable to save label');
    }
  }

  async function handleDelete(versionId: string) {
    if (!confirm('Delete this version? This cannot be undone.')) return;
    try {
      await deleteVersion(versionId);
      toast.success('Version deleted');
      if (selectedVersionId === versionId) setSelectedVersionId(null);
      await refreshVersions();
    } catch {
      toast.error('Unable to delete version');
    }
  }

  const regenDisabled = !hasApiKey || isStarting || isGenerating;
  const regenTooltip = !hasApiKey
    ? 'Add your Claude API key in Settings'
    : isGenerating
      ? 'A generation is already running'
      : undefined;

  return (
    <>
      <Header
        title={project.name || 'Untitled prompt'}
        description={`${versions.length} version${versions.length === 1 ? '' : 's'}`}
      />
      <Breadcrumbs
        items={[
          { label: 'Prompt Generator', href: '/prompt-generator' },
          { label: project.name || 'Untitled' },
        ]}
      />
      <PageContainer wide>
        <FadeIn>
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              href="/prompt-generator"
              className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              {!hasApiKey && (
                <Link
                  href="/settings"
                  className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}
                >
                  Add Claude API key
                </Link>
              )}
              <Button
                onClick={() => setRegenOpen(true)}
                disabled={regenDisabled}
                title={regenTooltip}
                className="cursor-pointer"
              >
                <RefreshCw className={cn('size-4', isStarting && 'animate-spin')} />
                {isGenerating ? 'Generating...' : isStarting ? 'Starting...' : 'Regenerate'}
              </Button>
            </div>
          </div>

          {generateError && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="size-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{generateError}</p>
            </div>
          )}

          {versions.length === 0 ? (
            <EmptyState onRegenerate={() => setRegenOpen(true)} hasApiKey={hasApiKey} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
              <aside className="space-y-2" aria-label="Version history">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Versions
                </p>
                <div className="space-y-1">
                  {versions.map((v) => (
                    <VersionTab
                      key={v.id}
                      version={v}
                      isSelected={selectedVersion?.id === v.id}
                      onSelect={() => setSelectedVersionId(v.id)}
                    />
                  ))}
                </div>
              </aside>

              <section className="space-y-4 min-w-0">
                {selectedVersion ? (
                  <VersionPanel
                    version={selectedVersion}
                    onCopy={() => handleCopy(selectedVersion.content ?? '')}
                    copied={copied}
                    onEditLabel={() => {
                      setEditingLabelId(selectedVersion.id);
                      setLabelDraft(selectedVersion.label ?? '');
                    }}
                    onDelete={() => handleDelete(selectedVersion.id)}
                    onRetry={() => setRegenOpen(true)}
                    canRetry={selectedVersion.status === 'failed' && !regenDisabled}
                    editingLabel={editingLabelId === selectedVersion.id}
                    labelDraft={labelDraft}
                    onLabelDraftChange={setLabelDraft}
                    onSaveLabel={() => handleSaveLabel(selectedVersion.id)}
                    onCancelLabel={() => setEditingLabelId(null)}
                  />
                ) : (
                  <Card>
                    <CardContent>No version selected.</CardContent>
                  </Card>
                )}
              </section>
            </div>
          )}
        </FadeIn>
      </PageContainer>

      <AlertDialog open={regenOpen} onOpenChange={setRegenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate with Claude Opus 4.7?</AlertDialogTitle>
            <AlertDialogDescription>
              {latestCompleted ? (
                <>
                  Last version used ~{formatTokens(latestCompleted.outputTokens)} output tokens and took{' '}
                  {elapsedSeconds(latestCompleted)}s. A new generation starts from your current wizard answers.
                </>
              ) : (
                'A new generation takes 30–90 seconds and runs against your Claude API key.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} className="cursor-pointer">
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyState({
  onRegenerate,
  hasApiKey,
}: {
  onRegenerate: () => void;
  hasApiKey: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <p className="text-lg font-semibold">No generations yet</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This prompt hasn&apos;t been generated. Click below to have Claude Opus 4.7 author a
          Claude Code brief from your wizard answers.
        </p>
        <Button onClick={onRegenerate} disabled={!hasApiKey} className="cursor-pointer">
          <RefreshCw className="size-4" />
          Generate now
        </Button>
        {!hasApiKey && (
          <p className="text-xs text-muted-foreground">
            <Link href="/settings" className="underline">
              Add your Claude API key in Settings
            </Link>{' '}
            first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function VersionTab({
  version,
  isSelected,
  onSelect,
}: {
  version: PromptVersion;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const status = version.status;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected ? 'true' : undefined}
      className={cn(
        'w-full text-left rounded-lg border px-3 py-2 transition-all cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:bg-muted/50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate">{versionLabel(version)}</span>
        <StatusBadge status={status} />
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{new Date(version.createdAt).toLocaleString()}</span>
        {status === 'completed' && version.outputTokens !== null && (
          <span>· {formatTokens(version.outputTokens)} out</span>
        )}
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: PromptVersion['status'] }) {
  if (status === 'running') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="size-3 animate-spin" />
        Running
      </Badge>
    );
  }
  if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="secondary">Done</Badge>;
}

function VersionPanel({
  version,
  onCopy,
  copied,
  onEditLabel,
  onDelete,
  onRetry,
  canRetry,
  editingLabel,
  labelDraft,
  onLabelDraftChange,
  onSaveLabel,
  onCancelLabel,
}: {
  version: PromptVersion;
  onCopy: () => void;
  copied: boolean;
  onEditLabel: () => void;
  onDelete: () => void;
  onRetry: () => void;
  canRetry: boolean;
  editingLabel: boolean;
  labelDraft: string;
  onLabelDraftChange: (v: string) => void;
  onSaveLabel: () => void;
  onCancelLabel: () => void;
}) {
  return (
    <>
      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {editingLabel ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={labelDraft}
                    onChange={(e) => onLabelDraftChange(e.target.value)}
                    placeholder={`v${version.versionNumber}`}
                    className="w-64"
                  />
                  <Button size="sm" onClick={onSaveLabel} className="cursor-pointer">
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancelLabel} className="cursor-pointer">
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-base font-semibold">{versionLabel(version)}</h2>
                  <Button size="icon" variant="ghost" onClick={onEditLabel} className="cursor-pointer">
                    <Pencil className="size-3.5" />
                  </Button>
                </>
              )}
              <Badge variant="secondary">{statusText(version.status)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {version.status === 'completed' && version.content && (
                <Button variant="outline" size="sm" onClick={onCopy} className="cursor-pointer">
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
              {version.status === 'failed' && canRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} className="cursor-pointer">
                  <RefreshCw className="size-3.5" />
                  Retry
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onDelete} className="cursor-pointer">
                <Trash2 className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <Metadata version={version} />
        </CardContent>
      </Card>

      {version.status === 'running' && (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Generating your brief with Claude Opus 4.7</p>
            <p className="text-xs text-muted-foreground">
              This usually takes 30–90 seconds. This page refreshes automatically.
            </p>
          </CardContent>
        </Card>
      )}

      {version.status === 'failed' && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="size-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">Generation failed</p>
            <p className="text-sm text-destructive/80 mt-1">{version.errorMessage ?? 'Unknown error'}</p>
          </div>
        </div>
      )}

      {version.status === 'completed' && version.content && (
        <Card>
          <CardContent>
            <ScrollArea className="max-h-[70vh]">
              <PromptRenderer prompt={version.content} />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Metadata({ version }: { version: PromptVersion }) {
  const rows: Array<[string, string]> = [
    ['Model', version.model],
    ['Thinking', version.thinkingEnabled ? 'Adaptive' : 'Disabled'],
    ['Input tokens', formatTokens(version.inputTokens)],
    ['Output tokens', formatTokens(version.outputTokens)],
    ['Total tokens', formatTokens(totalTokens(version))],
    ['Elapsed', elapsedSeconds(version) !== null ? `${elapsedSeconds(version)}s` : '—'],
    ['Created', new Date(version.createdAt).toLocaleString()],
  ];
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium truncate">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
