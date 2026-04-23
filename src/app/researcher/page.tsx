'use client';

import { useResearcherProjects } from '@/hooks/use-researcher-projects';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, Search, FlaskConical, Loader2 } from 'lucide-react';
import { RESEARCH_TYPE_INFO } from '@/lib/researcher-constants';
import type { ResearcherProject } from '@/lib/researcher-types';
import { getRelativeTime } from '@/lib/relative-time';
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

function ResearchCard({ project }: { project: ResearcherProject }) {
  const relativeTime = getRelativeTime(project.updatedAt);
  const typeInfo = RESEARCH_TYPE_INFO[project.researchType];
  const methodCount = project.selectedMethodIds.length;
  const description = project.config.researchPurpose.description;
  const isRunning = project.status === 'running';
  const progress = project.progress;
  const runningPercent = progress && progress.totalMethods > 0
    ? Math.round(((progress.completedMethods?.length ?? 0) / progress.totalMethods) * 100)
    : 0;

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_BASE_PATH}/researcher/${project.id}`}
      className="block h-full"
    >
      <Card className="group h-full cursor-pointer hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
              {isRunning ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <FlaskConical className="size-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="font-heading font-semibold line-clamp-2 break-words">
                {project.name || 'Untitled Research'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{relativeTime}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isRunning ? (
            <div className="space-y-1.5 min-h-[2.5rem]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {progress?.completedMethods?.length ?? 0} of {progress?.totalMethods ?? methodCount} methods
                </span>
                <span className="font-medium tabular-nums">{runningPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
                  style={{ width: `${runningPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {description || <span className="italic opacity-60">No description</span>}
            </p>
          )}
        </CardContent>
        <div className="px-4 pb-1 flex items-center gap-2 flex-wrap">
          <ExBadge
            color={(STATUS_COLORS[project.status] ?? 'gray') as never}
            shape={"round" as never}
            useTextContent
          >
            {STATUS_LABELS[project.status] ?? project.status}
          </ExBadge>
          <ExBadge color={"navy" as never} shape={"squared" as never} useTextContent>
            {typeInfo?.label ?? project.researchType}
          </ExBadge>
          {methodCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {methodCount} method{methodCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
