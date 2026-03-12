'use client';

import type { Project } from '@/lib/types';

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const createdDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const updatedDate = new Date(project.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>Created {createdDate}</span>
      <span className="text-muted-foreground/40">|</span>
      <span>Updated {updatedDate}</span>
    </div>
  );
}
