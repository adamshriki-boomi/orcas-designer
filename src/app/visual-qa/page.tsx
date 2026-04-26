'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, AlertTriangle, Settings, ScanEye } from 'lucide-react';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useVisualQaReports } from '@/hooks/use-visual-qa-reports';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { buttonVariants, Button } from '@/components/ui/button';

export default function VisualQaPage() {
  const router = useRouter();
  const { reports, isLoading } = useVisualQaReports();
  const { hasApiKey, loading: settingsLoading } = useUserSettings();

  return (
    <FadeIn>
      <Header
        title="Visual QA"
        description="Compare a Figma design against the implementation and produce a developer-ready report."
        action={
          <Link href="/visual-qa/new" className={buttonVariants()}>
            <PlusCircle />
            New Visual QA
          </Link>
        }
      />
      {!settingsLoading && !hasApiKey && (
        <div className="mx-6 mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="size-5 text-yellow-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Claude API key required</p>
            <p className="text-xs text-muted-foreground">
              Add your API key in Settings before running a Visual QA.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
            <Settings className="size-4 mr-1.5" />
            Settings
          </Button>
        </div>
      )}
      <PageContainer>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/visual-qa/${r.id}`}
                  className="block rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {r.implImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.implImageUrl}
                        alt=""
                        className="size-16 shrink-0 rounded border border-border object-cover"
                      />
                    ) : (
                      <div className="size-16 shrink-0 rounded border border-border bg-muted flex items-center justify-center">
                        <ScanEye className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        <SeverityChip count={r.severityCounts.high} label="High" tone="red" />
                        <SeverityChip count={r.severityCounts.medium} label="Med" tone="orange" />
                        <SeverityChip count={r.severityCounts.low} label="Low" tone="yellow" />
                        <StatusChip status={r.status} />
                        {r.confluencePageUrl && (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">
                            Published
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </FadeIn>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
      <ScanEye className="size-8 text-muted-foreground" />
      <h2 className="mt-3 text-base font-semibold">No Visual QA reports yet</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Upload a design and an implementation screenshot. Claude generates a prioritized gap report
        you can edit and publish to Confluence.
      </p>
      <Link href="/visual-qa/new" className={`${buttonVariants()} mt-4`}>
        <PlusCircle />
        New Visual QA
      </Link>
    </div>
  );
}

function SeverityChip({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: 'red' | 'orange' | 'yellow';
}) {
  if (!count) return null;
  const tones = {
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };
  return <span className={`rounded px-1.5 py-0.5 ${tones[tone]}`}>{label} {count}</span>;
}

function StatusChip({ status }: { status: string }) {
  if (status === 'complete') return null;
  const tones: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    running: 'bg-blue-100 text-blue-700',
    error: 'bg-red-100 text-red-700',
  };
  return <span className={`rounded px-1.5 py-0.5 capitalize ${tones[status] ?? tones.pending}`}>{status}</span>;
}
