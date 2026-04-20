'use client';

import dynamic from 'next/dynamic';
import { FlaskConical, BotMessageSquare, PenLine } from 'lucide-react';
import type { ActivityItem } from '@/lib/dashboard-metrics';
import { relativeTimeLabel } from '@/lib/dashboard-metrics';
import { SpaLink } from '@/components/ui/spa-link';

const ExBadge = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false }
);

const ExEmptyState = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExEmptyState })),
  { ssr: false }
);

export interface ActivityFeedProps {
  items: ActivityItem[];
  now?: Date;
  limit?: number;
}

export function ActivityFeed({ items, now, limit }: ActivityFeedProps) {
  const visible = typeof limit === 'number' ? items.slice(0, limit) : items;
  return (
    <section
      aria-label="Recent activity"
      className="rounded-2xl shadow-card bg-card p-4"
      data-testid="activity-feed"
    >
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Recent activity</h3>
      {visible.length === 0 ? (
        <div className="py-6" data-testid="activity-feed-empty">
          <ExEmptyState
            label="No activity yet"
            text="Create your first prompt, research project, or UX analysis."
          />
        </div>
      ) : (
        <ol className="divide-y divide-border/50" role="list">
          {visible.map((item) => (
            <li key={item.id}>
              <SpaLink
                href={item.href}
                className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40 rounded-lg cursor-pointer"
                data-testid={`activity-${item.id}`}
              >
                <SourceIcon source={item.source} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="uppercase tracking-wide">{sourceLabel(item.source)}</span>
                    <span className="mx-1.5">·</span>
                    <span>{relativeTimeLabel(item.timestamp, now)}</span>
                  </p>
                </div>
                {item.badgeLabel && (
                  <ExBadge color={(item.badgeColor ?? 'gray') as never} shape={'round' as never} useTextContent>
                    {item.badgeLabel}
                  </ExBadge>
                )}
              </SpaLink>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SourceIcon({ source }: { source: ActivityItem['source'] }) {
  const props = { 'aria-hidden': true, className: 'size-4 text-muted-foreground shrink-0' };
  switch (source) {
    case 'research':
      return <FlaskConical {...props} />;
    case 'prompt':
      return <BotMessageSquare {...props} />;
    case 'ux-analysis':
      return <PenLine {...props} />;
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
  }
}
