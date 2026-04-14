'use client';

import { memo, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { UxAnalysisEntry } from '@/lib/types';
import dynamic from 'next/dynamic';

const ExBadge = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false },
);

export function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const AnalysisCard = memo(function AnalysisCard({ analysis }: { analysis: UxAnalysisEntry }) {
  const { relativeTime, suggestionCount } = useMemo(() => ({
    relativeTime: getRelativeTime(analysis.updatedAt),
    suggestionCount: analysis.results?.suggestions?.length ?? 0,
  }), [analysis]);

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_BASE_PATH}/ux-writer/${analysis.id}`}
      className="block"
    >
      <Card className="group cursor-pointer hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="font-heading font-semibold truncate">
                {analysis.name || 'Untitled Analysis'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{relativeTime}</p>
            </div>
            {suggestionCount > 0 && (
              <ExBadge color={"blue" as never} shape={"round" as never} useTextContent>
                {suggestionCount} {suggestionCount === 1 ? 'suggestion' : 'suggestions'}
              </ExBadge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {analysis.description}
          </p>
        </CardContent>
      </Card>
    </a>
  );
});
