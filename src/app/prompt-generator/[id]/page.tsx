import { Suspense } from 'react';
import PromptDetailClient from './project-detail-client';

export function generateStaticParams() {
  // Must return a non-empty array for static export to work.
  // Real project IDs are runtime UUIDs — the 404.html SPA redirect handles them.
  return [{ id: 'placeholder' }];
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--exo-color-surface-secondary)]" />
        <div className="h-4 w-72 animate-pulse rounded bg-[var(--exo-color-surface-secondary)]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--exo-color-surface-secondary)]" />
        ))}
      </div>
    </div>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <PromptDetailClient id={id} />
    </Suspense>
  );
}
