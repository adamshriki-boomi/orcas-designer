'use client';

import { PenLine, Loader2 } from 'lucide-react';
import { SuggestionCard } from './suggestion-card';
import type { AnalysisResult } from '@/hooks/use-ux-writer';

interface ResultsPanelProps {
  results: AnalysisResult | null;
  analyzing: boolean;
  error: string | null;
}

export function ResultsPanel({ results, analyzing, error }: ResultsPanelProps) {
  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm">Analyzing your UI copy...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <PenLine className="size-10 opacity-30" />
        <div className="text-center">
          <p className="text-sm font-medium">UX Writer</p>
          <p className="text-xs mt-1">
            Upload a screenshot or describe a UI element to get<br />
            copy suggestions based on Boomi&apos;s UX Writing Guidelines
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      <p className="text-sm text-muted-foreground">{results.summary}</p>
      {results.suggestions.map((suggestion, i) => (
        <SuggestionCard key={i} suggestion={suggestion} />
      ))}
    </div>
  );
}
