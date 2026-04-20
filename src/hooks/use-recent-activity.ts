'use client';

import { useMemo } from 'react';
import { usePrompts } from '@/hooks/use-prompts';
import { useResearcherProjects } from '@/hooks/use-researcher-projects';
import { useUxAnalyses } from '@/hooks/use-ux-analyses';
import { mergeActivityFeeds, type ActivityItem } from '@/lib/dashboard-metrics';

export function useRecentActivity(limit = 10): {
  items: ActivityItem[];
  isLoading: boolean;
} {
  const { projects: prompts, isLoading: promptsLoading } = usePrompts();
  const { projects: research, isLoading: researchLoading } = useResearcherProjects();
  const { analyses, isLoading: uxLoading } = useUxAnalyses();

  const items = useMemo(
    () => mergeActivityFeeds(prompts, research, analyses, limit),
    [prompts, research, analyses, limit]
  );

  return {
    items,
    isLoading: promptsLoading || researchLoading || uxLoading,
  };
}
