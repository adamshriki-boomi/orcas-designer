'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, Loader2, RefreshCw, Send, AlertTriangle, Trash2 } from 'lucide-react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useVisualQaReports } from '@/hooks/use-visual-qa-reports';
import { useVisualQaAnalyze } from '@/hooks/use-visual-qa-analyze';
import { useVisualQaPublishConfluence } from '@/hooks/use-visual-qa-publish-confluence';
import { computeSeverityCounts } from '@/lib/visual-qa-utils';
import { renderMarkdown } from '@/lib/visual-qa-confluence';
import type { VisualQaIssue, VisualQaReport } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { VisualQaImageViewer } from '@/components/visual-qa/visual-qa-image-viewer';
import { IssuesPane } from '@/components/visual-qa/issues-pane';
import { ResizableSplit } from '@/components/visual-qa/resizable-split';

interface ReportDetailClientProps {
  id: string;
}

export default function ReportDetailClient({ id: routeId }: ReportDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [id] = useState(() => {
    const queryId = searchParams.get('_id');
    return queryId && routeId === 'placeholder' ? queryId : routeId;
  });

  useEffect(() => {
    if (searchParams.get('_id')) {
      window.history.replaceState(
        null,
        '',
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/visual-qa/${id}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll for this route so the panes own the only scroll surface.
  // Without this, residual height (Toaster placeholder, Next.js dev tools button,
  // browser scrollbar gutter) can produce a ~20–40px page scroll that breaks the
  // "everything fits the viewport" promise of the layout.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const { getReport, updateReport, deleteReport } = useVisualQaReports();
  const { hasConfluenceSettings } = useUserSettings();
  const { analyze, analyzing } = useVisualQaAnalyze();
  const { publish, publishing } = useVisualQaPublishConfluence();

  const [report, setReport] = useState<VisualQaReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [titleDraft, setTitleDraft] = useState('');
  const [spaceKey, setSpaceKey] = useState('');
  const [showPublishForm, setShowPublishForm] = useState(false);

  const refresh = useCallback(async () => {
    const r = await getReport(id);
    setReport(r);
    if (r) setTitleDraft(r.title);
    setLoading(false);
  }, [id, getReport]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll while running
  useEffect(() => {
    if (!report || (report.status !== 'running' && report.status !== 'pending')) return;
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [report, refresh]);

  const onIssuesChange = useCallback(
    async (next: VisualQaIssue[]) => {
      if (!report) return;
      const counts = computeSeverityCounts(next);
      setReport({ ...report, issues: next, severityCounts: counts });
      try {
        await updateReport(report.id, { issues: next, severityCounts: counts });
      } catch (e) {
        toast.error('Failed to save change');
        console.error(e);
      }
    },
    [report, updateReport]
  );

  const onTitleBlur = useCallback(async () => {
    if (!report) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === report.title) return;
    try {
      await updateReport(report.id, { title: trimmed });
      setReport({ ...report, title: trimmed });
    } catch {
      toast.error('Failed to save title');
    }
  }, [report, titleDraft, updateReport]);

  const onReanalyze = useCallback(async () => {
    if (!report) return;
    try {
      await analyze({ reportId: report.id, memoryIds: report.memoryIds });
      toast.success('Re-analysis complete');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Re-analysis failed');
    }
  }, [report, analyze, refresh]);

  const onPublish = useCallback(async () => {
    if (!report || !spaceKey.trim()) return;
    try {
      const result = await publish({ reportId: report.id, spaceKey: spaceKey.trim() });
      toast.success('Published to Confluence');
      setReport({ ...report, confluencePageId: result.pageId, confluencePageUrl: result.pageUrl });
      setShowPublishForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed');
    }
  }, [report, spaceKey, publish]);

  const onExportMarkdown = useCallback(() => {
    if (!report) return;
    const md = renderMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-visual-qa.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  const onDelete = useCallback(async () => {
    if (!report) return;
    if (!confirm('Delete this Visual QA report? This cannot be undone.')) return;
    try {
      await deleteReport(report.id);
      router.push('/visual-qa');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }, [report, deleteReport, router]);

  if (loading) {
    return (
      <FadeIn>
        <PageContainer>
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </PageContainer>
      </FadeIn>
    );
  }

  if (!report) {
    return (
      <FadeIn>
        <Header title="Not found" />
        <PageContainer>
          <p className="text-sm text-muted-foreground">This report doesn&apos;t exist or you don&apos;t have access.</p>
          <Button variant="outline" onClick={() => router.push('/visual-qa')} className="mt-4">
            <ArrowLeft className="size-4" /> Back to Visual QA
          </Button>
        </PageContainer>
      </FadeIn>
    );
  }

  const isRunning = report.status === 'running' || report.status === 'pending';

  return (
    <FadeIn>
      {/* Height-locked column: Header + Breadcrumbs + the action band stay fixed; the split fills
          the remaining viewport height and each pane scrolls independently. The min-h-0 chain on
          every flex-column ancestor is required for the inner overflow-auto to actually scroll
          instead of growing the page. */}
      <PageContainer fluid className="flex h-[100dvh] min-h-0 flex-col overflow-hidden">
        <div className="shrink-0">
          <Header title={report.title} />
          <Breadcrumbs items={[{ label: 'Visual QA', href: '/visual-qa' }, { label: report.title }]} />
        </div>
        <div className="shrink-0 px-6 py-3 space-y-3">
            <section className="flex flex-wrap items-center gap-3">
              <Input
                label="Title"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={onTitleBlur}
                className="max-w-md"
              />
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={onReanalyze} disabled={analyzing || isRunning}>
                  {analyzing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Re-running…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-4" /> Re-run
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={onExportMarkdown}>
                  <Download className="size-4" /> Export Markdown
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPublishForm((v) => !v)}
                  disabled={!hasConfluenceSettings || report.status !== 'complete'}
                  title={!hasConfluenceSettings ? 'Add Confluence credentials in Settings' : undefined}
                >
                  <Send className="size-4" /> Publish to Confluence
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            </section>

            {showPublishForm && (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-2 text-sm font-medium">Publish to Confluence</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Enter the Confluence Space ID. The report will be created as a new page with both
                  screenshots attached and issues grouped by category.
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <Input
                    label="Space ID"
                    value={spaceKey}
                    onChange={(e) => setSpaceKey(e.target.value)}
                    placeholder="e.g., 123456789"
                    className="max-w-xs"
                  />
                  <Button onClick={onPublish} disabled={publishing || !spaceKey.trim()}>
                    {publishing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Publishing…
                      </>
                    ) : (
                      'Publish'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {report.confluencePageUrl && (
              <a
                href={report.confluencePageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-700 underline cursor-pointer"
              >
                <ExternalLink className="size-3.5" /> Open the published Confluence page
              </a>
            )}

            {report.status === 'error' && (
              <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
                <AlertTriangle className="size-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Visual QA failed</p>
                  <p className="text-xs text-red-700">{report.error ?? 'Unknown error'}</p>
                </div>
              </div>
            )}

            {isRunning && (
              <div className="flex items-center gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4">
                <Loader2 className="size-5 animate-spin text-blue-600" />
                <p className="text-sm text-blue-800">Running Visual QA — this usually takes 30–60 seconds.</p>
              </div>
            )}
          </div>

        <div className="flex flex-1 min-h-0 w-full px-6 pb-6">
          <ResizableSplit storageKey="vqa.splitPct" defaultPct={60}>
            <VisualQaImageViewer
              designImageUrl={report.designImageUrl}
              implImageUrl={report.implImageUrl}
              designFigmaUrl={report.designFigmaUrl}
            />
            <IssuesPane
              issues={report.issues}
              severityCounts={report.severityCounts}
              summary={report.summary}
              onIssuesChange={onIssuesChange}
            />
          </ResizableSplit>
        </div>
      </PageContainer>
    </FadeIn>
  );
}
