'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText, BookOpen, Settings, Trash2,
  Copy, Check, RefreshCw, ChevronDown, ChevronRight,
  Clock, Loader2, AlertTriangle, FlaskConical,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useResearcherProject } from '@/hooks/use-researcher-project';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { FadeIn } from '@/components/ui/motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { RESEARCH_TYPE_INFO, getMethodById } from '@/lib/researcher-constants';
import type { ResearcherProject, MethodResult } from '@/lib/researcher-types';
import { MarkdownContent } from '@/components/researcher/markdown-content';
import { ExecutiveSummaryView } from '@/components/researcher/executive-summary-view';
import dynamic from 'next/dynamic';

const ExBadge = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false },
);

/* ── Progress indicator for running state ── */
function RunningProgress({ project }: { project: ResearcherProject }) {
  const progress = project.progress;
  const completedCount = progress?.completedMethods?.length ?? 0;
  const totalCount = progress?.totalMethods ?? project.selectedMethodIds.length;
  const currentMethod = progress?.currentMethod;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const currentMethodInfo = currentMethod ? getMethodById(currentMethod) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Loader2 className="size-5 animate-spin text-primary" />
        <div>
          <p className="text-sm font-medium">Research in progress...</p>
          <p className="text-xs text-muted-foreground">
            {currentMethodInfo
              ? `Running: ${currentMethodInfo.name}`
              : 'Preparing research methods...'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedCount} of {totalCount} methods completed</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Completed methods list */}
      {progress?.completedMethods && progress.completedMethods.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Completed</p>
          <div className="flex flex-wrap gap-1.5">
            {progress.completedMethods.map((methodId) => {
              const method = getMethodById(methodId);
              return (
                <Badge key={methodId} variant="secondary">
                  <Check className="size-3 mr-1" />
                  {method?.name ?? methodId}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Expandable method result section ── */
function MethodResultSection({ result, defaultExpanded }: { result: MethodResult; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const method = getMethodById(result.methodId);

  const completedDate = result.completedAt
    ? new Date(result.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-sm transition-all',
        expanded && 'shadow-md',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30 cursor-pointer"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform',
              expanded ? 'bg-primary text-primary-foreground rotate-90' : 'bg-primary/10 text-primary',
            )}
          >
            <ChevronRight className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold leading-tight truncate">
                {result.title || method?.name || result.methodId}
              </h3>
              {result.error && (
                <ExBadge color={"red" as never} shape={"round" as never} useTextContent>
                  Error
                </ExBadge>
              )}
              {!result.error && method?.mode && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    method.mode === 'analytical'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {method.mode}
                </span>
              )}
            </div>
            {!expanded && method?.shortDescription && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {method.shortDescription}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          {completedDate && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1">
              <Clock className="size-3" />
              {completedDate}
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t bg-gradient-to-b from-muted/20 to-transparent px-6 py-6">
          {result.error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Method failed</p>
                  <p className="mt-1 text-sm text-destructive/80">{result.error}</p>
                </div>
              </div>
            </div>
          ) : (
            <MarkdownContent>{result.content}</MarkdownContent>
          )}
        </div>
      )}
    </article>
  );
}

/* ── Config display ── */
function ConfigDisplay({ project }: { project: ResearcherProject }) {
  const typeInfo = RESEARCH_TYPE_INFO[project.researchType];
  const { config } = project;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Research Type</span>
            <Badge>{typeInfo?.label ?? project.researchType}</Badge>
          </div>

          {config.researchPurpose.title && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Title</span>
              <span className="text-sm font-medium">{config.researchPurpose.title}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Methods</span>
            <span className="text-sm font-medium">{project.selectedMethodIds.length}</span>
          </div>

          {config.researchPurpose.goals.filter(g => g.trim()).length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Goals</span>
              <span className="text-sm font-medium">
                {config.researchPurpose.goals.filter(g => g.trim()).length} defined
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Target Audience</span>
            <span className="text-sm font-medium max-w-64 truncate">
              {config.targetAudience.description || 'Not provided'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Selected methods */}
      {project.selectedMethodIds.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Selected Methods</h3>
          <div className="flex flex-wrap gap-1.5">
            {project.selectedMethodIds.map((id) => {
              const method = getMethodById(id);
              return (
                <Badge key={id} variant="secondary">
                  {method?.name ?? id}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main detail component ── */
interface Props {
  id: string;
}

export default function ResearchDetailClient({ id }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [actualId] = useState(() => {
    const queryId = searchParams.get('_id');
    return queryId && id === 'placeholder' ? queryId : id;
  });

  useEffect(() => {
    if (searchParams.get('_id')) {
      window.history.replaceState(null, '', `${process.env.NEXT_PUBLIC_BASE_PATH}/researcher/${actualId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { project, isLoading, updateProject, deleteProject } = useResearcherProject(actualId, () => {
    toast.success('Research completed! Your results are ready.');
  });
  const { copied, copy } = useCopyToClipboard();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Set default tab based on status
  useEffect(() => {
    if (!project) return;
    if (project.status === 'running') {
      setActiveTab('summary');
    } else if (project.status === 'failed') {
      setActiveTab('summary');
    }
  }, [project?.status]);

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await copy(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  }, [copy]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteProject();
      setDeleteOpen(false);
      router.push('/researcher');
      toast.success('Research project deleted');
    } catch {
      toast.error('Unable to delete research project');
    }
  }, [deleteProject, router]);

  const handleRetry = useCallback(async () => {
    try {
      await updateProject({ status: 'draft', errorMessage: null });
      toast.success('Research project reset to draft');
    } catch {
      toast.error('Unable to reset research project');
    }
  }, [updateProject]);

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

  if (!project) {
    return (
      <>
        <Header title="Not Found" />
        <PageContainer>
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Research project not found.</p>
            <Link href="/researcher" className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" />
              Back to Researcher
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const methodResults = project.methodResults
    ? Object.values(project.methodResults)
    : [];

  return (
    <>
      <FadeIn>
        <Header title={project.name || 'Untitled Research'} />
        <Breadcrumbs items={[
          { label: 'Researcher', href: '/researcher' },
          { label: project.name || 'Untitled Research' },
        ]} />
        <PageContainer>
          {/* Running state */}
          {project.status === 'running' && (
            <div className="mb-6">
              <RunningProgress project={project} />
            </div>
          )}

          {/* Failed state */}
          {project.status === 'failed' && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Research failed</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {project.errorMessage || 'An unknown error occurred during research execution.'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </div>
          )}

          {/* Draft state */}
          {project.status === 'draft' && (
            <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 flex items-center gap-3">
              <FlaskConical className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                This research project is in draft status. It has not been executed yet.
              </p>
            </div>
          )}

          {/* Tabs for completed (and visible for all states) */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="summary">
                <BookOpen className="size-3.5" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="methods">
                <FlaskConical className="size-3.5" />
                Methods
              </TabsTrigger>
              <TabsTrigger value="framing">
                <FileText className="size-3.5" />
                Framing Doc
              </TabsTrigger>
              <TabsTrigger value="process-book">
                <BookOpen className="size-3.5" />
                Process Book
              </TabsTrigger>
              <TabsTrigger value="config">
                <Settings className="size-3.5" />
                Config
              </TabsTrigger>
            </TabsList>

            {/* ===== Summary Tab ===== */}
            <TabsContent value="summary">
              {project.executiveSummary ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-2xl font-bold tracking-tight">
                        Executive Summary
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Action-oriented synthesis across {methodResults.length} research method
                        {methodResults.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(project.executiveSummary!, 'Executive summary')}
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? 'Copied' : 'Copy markdown'}
                    </Button>
                  </div>
                  <ExecutiveSummaryView markdown={project.executiveSummary} />
                </div>
              ) : (
                <div className="py-16 text-center">
                  <BookOpen className="size-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {project.status === 'running'
                      ? 'Summary will appear once research completes.'
                      : 'No executive summary available.'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ===== Methods Tab ===== */}
            <TabsContent value="methods">
              {methodResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-2xl font-bold tracking-tight">
                        Method Results
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Detailed findings from each research method — click any card to expand
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs">
                      <FlaskConical className="size-3.5 text-primary" />
                      <span className="font-semibold text-foreground">{methodResults.length}</span>
                      <span className="text-muted-foreground">
                        method{methodResults.length !== 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>
                  <div className="space-y-3">
                    {methodResults.map((result, i) => (
                      <MethodResultSection
                        key={result.methodId}
                        result={result}
                        defaultExpanded={methodResults.length === 1 && i === 0}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <FlaskConical className="size-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {project.status === 'running'
                      ? 'Method results will appear as they complete.'
                      : 'No method results available.'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ===== Framing Document Tab ===== */}
            <TabsContent value="framing">
              {project.framingDocument ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-2xl font-bold tracking-tight">
                        Framing Document
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        The research question, goals, and scope captured at kickoff
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(project.framingDocument!, 'Framing document')}
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? 'Copied' : 'Copy markdown'}
                    </Button>
                  </div>
                  <div className="rounded-2xl border bg-card p-6 sm:p-8">
                    <MarkdownContent>{project.framingDocument}</MarkdownContent>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <FileText className="size-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No framing document available.</p>
                </div>
              )}
            </TabsContent>

            {/* ===== Process Book Tab ===== */}
            <TabsContent value="process-book">
              {project.processBook ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-2xl font-bold tracking-tight">
                        Process Book
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        The researcher-facing narrative: approach, findings, synthesis, roadmap
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(project.processBook!, 'Process book')}
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? 'Copied' : 'Copy markdown'}
                    </Button>
                  </div>
                  <div className="rounded-2xl border bg-card p-6 sm:p-8">
                    <MarkdownContent>{project.processBook}</MarkdownContent>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <BookOpen className="size-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {project.status === 'running'
                      ? 'Process book will appear once research completes.'
                      : 'No process book available.'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ===== Config Tab ===== */}
            <TabsContent value="config">
              <div className="space-y-6">
                <ConfigDisplay project={project} />

                {/* Timestamps */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    Updated {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Danger zone */}
                <div className="rounded-lg border border-destructive/20 p-6">
                  <h3 className="text-base font-medium text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete this research project, there is no going back. All data will be permanently removed.
                  </p>
                  <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-3.5" />
                    Delete Research
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </PageContainer>
      </FadeIn>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete research project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The research project and all its data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
