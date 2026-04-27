'use client';

import dynamic from 'next/dynamic';
import type { BadgeColor, BadgeShape, BadgeSize } from '@boomi/exosphere';
import type { VisualQaIssue, VisualQaSeverityCounts } from '@/lib/types';
import { IssuesList } from './issues-list';

const ExBadgeLazy = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false }
);

interface IssuesPaneProps {
  issues: VisualQaIssue[];
  severityCounts: VisualQaSeverityCounts;
  summary: string | null;
  onIssuesChange: (next: VisualQaIssue[]) => void;
}

export function IssuesPane({
  issues,
  severityCounts,
  summary,
  onIssuesChange,
}: IssuesPaneProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[var(--exo-color-border-default,#e2e8f0)] bg-white">
      <div className="flex-1 min-h-0 overflow-auto px-4 py-4 space-y-4">
        <header className="flex flex-wrap items-center gap-2">
          <h2 className="mr-1 text-sm font-semibold text-[var(--exo-color-font,#0f172a)]">
            Issues
          </h2>
          <SeverityBadge color="red" count={severityCounts.high} label="High" />
          <SeverityBadge color="orange" count={severityCounts.medium} label="Medium" />
          <SeverityBadge color="yellow" count={severityCounts.low} label="Low" />
        </header>
        {summary && (
          <p className="text-sm text-[var(--exo-color-font-secondary,#475569)]">
            {summary}
          </p>
        )}
        <IssuesList issues={issues} onChange={onIssuesChange} />
      </div>
    </div>
  );
}

interface SeverityBadgeProps {
  color: 'red' | 'orange' | 'yellow';
  count: number;
  label: string;
}

function SeverityBadge({ color, count, label }: SeverityBadgeProps) {
  return (
    <ExBadgeLazy
      color={color as BadgeColor}
      shape={'round' as BadgeShape}
      size={'small' as BadgeSize}
      showIcon={false}
      useTextContent
    >
      {label} {count}
    </ExBadgeLazy>
  );
}
