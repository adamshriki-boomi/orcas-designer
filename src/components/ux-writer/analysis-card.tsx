'use client';

import { memo, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { UxAnalysisEntry } from '@/lib/types';
import { PenLine } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getRelativeTime } from '@/lib/relative-time';

const ExBadge = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false },
);

export const AnalysisCard = memo(function AnalysisCard({ analysis }: { analysis: UxAnalysisEntry }) {
  const { relativeTime, suggestionCount, hasResults } = useMemo(() => ({
    relativeTime: getRelativeTime(analysis.updatedAt),
    suggestionCount: analysis.results?.suggestions?.length ?? 0,
    hasResults: analysis.results != null,
  }), [analysis]);

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_BASE_PATH}/ux-writer/${analysis.id}`}
      className="block h-full"
    >
      <Card className="group h-full cursor-pointer hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <PenLine className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="font-heading font-semibold line-clamp-2 break-words">
                {analysis.name || 'Untitled Analysis'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{relativeTime}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {analysis.description || <span className="italic opacity-60">No description</span>}
          </p>
        </CardContent>
        <div className="px-4 pb-1 flex items-center gap-2 flex-wrap">
          {hasResults ? (
            <ExBadge color={"blue" as never} shape={"round" as never} useTextContent>
              {suggestionCount} {suggestionCount === 1 ? 'suggestion' : 'suggestions'}
            </ExBadge>
          ) : (
            <ExBadge color={"gray" as never} shape={"round" as never} useTextContent>
              Draft
            </ExBadge>
          )}
        </div>
      </Card>
    </a>
  );
});
