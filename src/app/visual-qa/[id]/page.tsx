import { Suspense } from 'react';
import ReportDetailClient from './report-detail-client';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--exo-color-surface-secondary)]" />
      <div className="h-64 animate-pulse rounded-2xl bg-[var(--exo-color-surface-secondary)]" />
    </div>
  );
}

export default async function VisualQaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ReportDetailClient id={id} />
    </Suspense>
  );
}
