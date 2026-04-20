'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FlaskConical, BotMessageSquare, PenLine, FileText } from 'lucide-react';
import type { ResearcherProject } from '@/lib/researcher-types';
import type { ActivityItem } from '@/lib/dashboard-metrics';
import {
  progressPercent,
  RESEARCH_STATUS_COLOR,
  RESEARCH_STATUS_LABEL,
  relativeTimeLabel,
} from '@/lib/dashboard-metrics';
import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const ExBadge = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false }
);

const ExEmptyState = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExEmptyState })),
  { ssr: false }
);

export interface ActiveWorkPanelProps {
  runningJobs: ResearcherProject[];
  recentDrafts: ActivityItem[];
  now?: Date;
}

export function ActiveWorkPanel({ runningJobs, recentDrafts, now }: ActiveWorkPanelProps) {
  return (
    <section aria-label="Your active work" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RunningJobsPanel jobs={runningJobs} />
      <RecentDraftsPanel items={recentDrafts} now={now} />
    </section>
  );
}

function RunningJobsPanel({ jobs }: { jobs: ResearcherProject[] }) {
  return (
    <div className="rounded-2xl shadow-card bg-card p-4" data-testid="running-jobs-panel">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Running research jobs</h3>
      {jobs.length === 0 ? (
        <div className="py-6" data-testid="running-jobs-empty">
          <ExEmptyState
            label="No research running"
            text="Start a research project to see live progress here."
          />
        </div>
      ) : (
        <ul className="space-y-4" role="list">
          {jobs.map((job) => (
            <li key={job.id}>
              <ActiveJobRow job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActiveJobRow({ job }: { job: ResearcherProject }) {
  const pct = progressPercent(job.progress);
  const statusLabel = RESEARCH_STATUS_LABEL[job.status];
  const statusColor = RESEARCH_STATUS_COLOR[job.status];
  const current = job.progress?.currentMethod;
  return (
    <Link
      href={`/researcher/${job.id}`}
      className="block rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted cursor-pointer"
      data-testid={`active-job-${job.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{job.name || 'Untitled research'}</p>
          {current && (
            <p className="text-xs text-muted-foreground truncate">Running: {current}</p>
          )}
        </div>
        <ExBadge
          color={statusColor as never}
          shape={'round' as never}
          useTextContent
        >
          {statusLabel}
        </ExBadge>
      </div>
      <ProgressTrack>
        <ProgressIndicator
          className={cn(
            job.status === 'failed' && 'bg-destructive',
            job.status === 'completed' && 'bg-emerald-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </ProgressTrack>
      <p className="text-xs text-muted-foreground mt-1 tabular-nums" data-testid={`progress-${job.id}`}>
        {pct}% · {job.progress?.completedMethods.length ?? 0} of {job.progress?.totalMethods ?? 0} methods
      </p>
    </Link>
  );
}

function RecentDraftsPanel({ items, now }: { items: ActivityItem[]; now?: Date }) {
  return (
    <div className="rounded-2xl shadow-card bg-card p-4" data-testid="recent-drafts-panel">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Recent drafts & updates</h3>
      {items.length === 0 ? (
        <div className="py-6" data-testid="recent-drafts-empty">
          <ExEmptyState
            label="Nothing recent"
            text="Your recently updated work will show up here."
          />
        </div>
      ) : (
        <ul className="space-y-2" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted cursor-pointer"
              >
                <SourceIcon source={item.source} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {sourceLabel(item.source)} · {relativeTimeLabel(item.timestamp, now)}
                  </p>
                </div>
                {item.badgeLabel && (
                  <ExBadge color={(item.badgeColor ?? 'gray') as never} shape={'round' as never} useTextContent>
                    {item.badgeLabel}
                  </ExBadge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SourceIcon({ source }: { source: ActivityItem['source'] }) {
  const commonProps = { 'aria-hidden': true, className: 'size-4 text-muted-foreground shrink-0' };
  switch (source) {
    case 'research':
      return <FlaskConical {...commonProps} />;
    case 'prompt':
      return <BotMessageSquare {...commonProps} />;
    case 'ux-analysis':
      return <PenLine {...commonProps} />;
    default:
      return <FileText {...commonProps} />;
  }
}

function sourceLabel(source: ActivityItem['source']): string {
  switch (source) {
    case 'research':
      return 'Research';
    case 'prompt':
      return 'Prompt';
    case 'ux-analysis':
      return 'UX Analysis';
    default:
      return 'Item';
  }
}
