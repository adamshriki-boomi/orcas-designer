import { Suspense } from 'react';
import AnalysisDetailClient from './analysis-detail-client';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--exo-color-surface-secondary)]" />
        <div className="h-4 w-72 animate-pulse rounded bg-[var(--exo-color-surface-secondary)]" />
      </div>
      <div className="h-10 w-80 animate-pulse rounded bg-[var(--exo-color-surface-secondary)]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-[var(--exo-color-surface-secondary)]" />
        ))}
      </div>
    </div>
  );
}

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AnalysisDetailClient id={id} />
    </Suspense>
  );
}
