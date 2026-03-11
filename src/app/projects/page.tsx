'use client';

import { useProjects } from '@/hooks/use-projects';
import { ProjectList } from '@/components/dashboard/project-list';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { FadeIn } from '@/components/ui/motion';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();

  return (
    <FadeIn>
      <Header
        title="Projects"
        description="All your design & development prompt projects"
        action={
          <Link href="/projects/new" className={buttonVariants()}>
            <PlusCircle />
            New Project
          </Link>
        }
      />
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Projects' }]} />
      <PageContainer>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <ProjectList projects={projects} />
        )}
      </PageContainer>
    </FadeIn>
  );
}
