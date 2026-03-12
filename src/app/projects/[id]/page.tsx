import ProjectDetailClient from './project-detail-client';

export function generateStaticParams() {
  // Must return a non-empty array for static export to work.
  // Real project IDs are runtime UUIDs — the 404.html SPA redirect handles them.
  return [{ id: 'placeholder' }];
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailClient id={id} />;
}
