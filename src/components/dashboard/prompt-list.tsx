'use client';

import type { Prompt } from '@/lib/types';
import { PromptCard } from './prompt-card';
import { EmptyState } from './empty-state';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';

interface PromptListProps {
  projects: Prompt[];
}

export function PromptList({ projects }: PromptListProps) {
  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {projects.map((project) => (
        <StaggerItem key={project.id}>
          <PromptCard project={project} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
