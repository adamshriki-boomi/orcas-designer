'use client';

import type { Project } from '@/lib/types';
import { ProjectCard } from './project-card';
import { EmptyState } from './empty-state';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {projects.map((project) => (
        <StaggerItem key={project.id}>
          <ProjectCard project={project} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
