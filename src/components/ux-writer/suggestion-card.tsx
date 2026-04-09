'use client';

import { ArrowRight } from 'lucide-react';
import type { Suggestion } from '@/hooks/use-ux-writer';
import dynamic from 'next/dynamic';

const ExBadge = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false }
);

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ExBadge color={"blue" as never} shape={"squared" as never} useTextContent>
          {suggestion.elementType}
        </ExBadge>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm line-through text-muted-foreground">
          {suggestion.before}
        </span>
        <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          {suggestion.after}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {suggestion.explanation}
      </p>

      <div className="flex">
        <ExBadge color={"gray" as never} shape={"round" as never} useTextContent>
          {suggestion.principle}
        </ExBadge>
      </div>
    </div>
  );
}
