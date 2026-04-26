import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRecentActivity } from './use-recent-activity';
import { createTestPrompt } from '@/test/helpers/prompt-fixtures';
import { createTestResearcherProject } from '@/test/helpers/researcher-fixtures';
import type { UxAnalysisEntry } from '@/lib/types';

const mockUsePrompts = vi.fn();
const mockUseResearcherProjects = vi.fn();
const mockUseUxAnalyses = vi.fn();

vi.mock('@/hooks/use-prompts', () => ({
  usePrompts: () => mockUsePrompts(),
}));
vi.mock('@/hooks/use-researcher-projects', () => ({
  useResearcherProjects: () => mockUseResearcherProjects(),
}));
vi.mock('@/hooks/use-ux-analyses', () => ({
  useUxAnalyses: () => mockUseUxAnalyses(),
}));

function uxEntry(overrides: Partial<UxAnalysisEntry> = {}): UxAnalysisEntry {
  return {
    id: 'u1',
    name: 'Analysis',
    description: '',
    focusNotes: null,
    screenshotUrl: null,
    includeAiVoice: false,
    memoryIds: [],
    results: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useRecentActivity', () => {
  beforeEach(() => {
    mockUsePrompts.mockReset();
    mockUseResearcherProjects.mockReset();
    mockUseUxAnalyses.mockReset();
  });

  it('merges items from all three sources sorted by updated_at desc', () => {
    mockUsePrompts.mockReturnValue({
      projects: [
        createTestPrompt({ id: 'p1', name: 'Prompt 1', updatedAt: '2026-04-10T00:00:00.000Z' }),
      ],
      isLoading: false,
    });
    mockUseResearcherProjects.mockReturnValue({
      projects: [
        createTestResearcherProject({ id: 'r1', name: 'Research 1', updatedAt: '2026-04-15T00:00:00.000Z' }),
      ],
      isLoading: false,
    });
    mockUseUxAnalyses.mockReturnValue({
      analyses: [uxEntry({ id: 'u1', name: 'UX 1', updatedAt: '2026-04-12T00:00:00.000Z' })],
      isLoading: false,
    });

    const { result } = renderHook(() => useRecentActivity());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0].title).toBe('Research 1');
    expect(result.current.items[1].title).toBe('UX 1');
    expect(result.current.items[2].title).toBe('Prompt 1');
  });

  it('reports loading when any dependency is loading', () => {
    mockUsePrompts.mockReturnValue({ projects: [], isLoading: true });
    mockUseResearcherProjects.mockReturnValue({ projects: [], isLoading: false });
    mockUseUxAnalyses.mockReturnValue({ analyses: [], isLoading: false });

    const { result } = renderHook(() => useRecentActivity());
    expect(result.current.isLoading).toBe(true);
  });

  it('respects the limit parameter', () => {
    const prompts = Array.from({ length: 15 }, (_, i) =>
      createTestPrompt({
        id: `p${i}`,
        name: `P${i}`,
        updatedAt: `2026-04-${String((i % 30) + 1).padStart(2, '0')}T00:00:00.000Z`,
      })
    );
    mockUsePrompts.mockReturnValue({ projects: prompts, isLoading: false });
    mockUseResearcherProjects.mockReturnValue({ projects: [], isLoading: false });
    mockUseUxAnalyses.mockReturnValue({ analyses: [], isLoading: false });

    const { result } = renderHook(() => useRecentActivity(5));
    expect(result.current.items).toHaveLength(5);
  });

  it('returns empty array when no data', () => {
    mockUsePrompts.mockReturnValue({ projects: [], isLoading: false });
    mockUseResearcherProjects.mockReturnValue({ projects: [], isLoading: false });
    mockUseUxAnalyses.mockReturnValue({ analyses: [], isLoading: false });

    const { result } = renderHook(() => useRecentActivity());
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
