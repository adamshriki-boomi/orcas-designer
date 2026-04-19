'use client';

import { useResearcherProjects } from '@/hooks/use-researcher-projects';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, Search } from 'lucide-react';
import { getMethodById, RESEARCH_TYPE_INFO } from '@/lib/researcher-constants';
import type { ResearcherProject } from '@/lib/researcher-types';
import dynamic from 'next/dynamic';

const ExBadge = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false },
);

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  pending: 'blue',
  running: 'blue',
  completed: 'green',
  failed: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

function getRelativeTime(dateStr: string): string {
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

function ResearchCard({ project }: { project: ResearcherProject }) {
  const relativeTime = getRelativeTime(project.updatedAt);
  const typeInfo = RESEARCH_TYPE_INFO[project.researchType];
  const methodCount = project.selectedMethodIds.length;

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_BASE_PATH}/researcher/${project.id}`}
      className="block"
    >
      <Card className="group cursor-pointer hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="font-heading font-semibold truncate">
                {project.name || 'Untitled Research'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{relativeTime}</p>
            </div>
            <ExBadge
              color={(STATUS_COLORS[project.status] ?? 'gray') as never}
              shape={"round" as never}
              useTextContent
            >
              {STATUS_LABELS[project.status] ?? project.status}
            </ExBadge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <ExBadge color={"navy" as never} shape={"squared" as never} useTextContent>
              {typeInfo?.label ?? project.researchType}
            </ExBadge>
            {methodCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {methodCount} method{methodCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

export default function ResearcherPage() {
  const { projects, isLoading } = useResearcherProjects();

  return (
    <FadeIn>
      <Header
        title="Researcher"
        description="AI-powered UX research projects"
        action={
          <Link href="/researcher/new" className={buttonVariants()}>
            <PlusCircle />
            New Research
          </Link>
        }
      />
      <PageContainer>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <FadeIn className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-xl" />
              <div className="relative rounded-full gradient-primary p-5">
                <Search className="size-8 text-white" />
              </div>
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">No research projects yet</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm">
              Create your first UX research project to get AI-powered insights and analysis.
            </p>
            <Link href="/researcher/new" className={buttonVariants({ size: 'lg' })}>
              <PlusCircle />
              New Research
            </Link>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <StaggerItem key={project.id}>
                <ResearchCard project={project} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </PageContainer>
    </FadeIn>
  );
}
