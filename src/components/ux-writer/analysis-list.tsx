'use client';

import type { UxAnalysisEntry } from '@/lib/types';
import { AnalysisCard } from './analysis-card';
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/ui/motion';
import { PenLine, PlusCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export function AnalysisList({ analyses }: { analyses: UxAnalysisEntry[] }) {
  if (analyses.length === 0) {
    return (
      <FadeIn className="flex flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-xl" />
          <div className="relative rounded-full gradient-primary p-5">
            <PenLine className="size-8 text-white" />
          </div>
        </div>
        <h3 className="font-heading text-xl font-bold mb-2">No analyses yet</h3>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          Create your first UX writing analysis to get copy suggestions based on Boomi&apos;s UX Writing Guidelines.
        </p>
        <Link href="/ux-writer/new" className={buttonVariants({ size: 'lg' })}>
          <PlusCircle />
          New Analysis
        </Link>
      </FadeIn>
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {analyses.map((analysis) => (
        <StaggerItem key={analysis.id}>
          <AnalysisCard analysis={analysis} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
