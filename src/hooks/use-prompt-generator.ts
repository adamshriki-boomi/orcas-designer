'use client';

import { useMemo } from 'react';
import type { Project, SharedSkill, SharedMemory } from '@/lib/types';
import { generatePrompt } from '@/lib/prompt-generator';

export function usePromptGenerator(
  project: Project | undefined,
  sharedSkills: SharedSkill[],
  sharedMemories: SharedMemory[] = []
) {
  const prompt = useMemo(() => {
    if (!project) return '';
    return generatePrompt(project, sharedSkills, sharedMemories);
  }, [project, sharedSkills, sharedMemories]);

  return { prompt };
}
