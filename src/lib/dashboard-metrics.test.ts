import { describe, it, expect } from 'vitest';
import {
  bucketByMonth,
  countResearchByStatus,
  topN,
  countResearchMethodUsage,
  countSharedSkillUsage,
  countSharedMemoryUsage,
  progressPercent,
  researchBadgeColor,
  mergeActivityFeeds,
  relativeTimeLabel,
  RESEARCH_STATUS_ORDER,
} from '@/lib/dashboard-metrics';
import { createTestPrompt } from '@/test/helpers/prompt-fixtures';
import {
  createTestResearcherProject,
  createRunningResearcherProject,
} from '@/test/helpers/researcher-fixtures';
import type { UxAnalysisEntry } from '@/lib/types';

function createTestUxAnalysis(overrides: Partial<UxAnalysisEntry> = {}): UxAnalysisEntry {
  return {
    id: 'ux-1',
    name: 'Test Analysis',
    description: 'A test analysis',
    focusNotes: null,
    screenshotUrl: null,
    includeAiVoice: false,
    results: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('bucketByMonth', () => {
  const now = new Date('2026-04-20T00:00:00.000Z');

  it('returns monthCount buckets in chronological order', () => {
    const result = bucketByMonth([], 6, now);
    expect(result).toHaveLength(6);
    // Last bucket should be current month (Apr 26)
    expect(result[5].x).toBe('Apr 26');
    // Oldest bucket should be 5 months back (Nov 25)
    expect(result[0].x).toBe('Nov 25');
  });

  it('counts timestamps into the correct month bucket', () => {
    const result = bucketByMonth(
      [
        '2026-04-10T00:00:00.000Z',
        '2026-04-15T00:00:00.000Z',
        '2026-03-01T00:00:00.000Z',
        '2025-12-25T00:00:00.000Z',
      ],
      6,
      now
    );
    const apr = result.find((b) => b.x === 'Apr 26');
    const mar = result.find((b) => b.x === 'Mar 26');
    const dec = result.find((b) => b.x === 'Dec 25');
    expect(apr?.y).toBe(2);
    expect(mar?.y).toBe(1);
    expect(dec?.y).toBe(1);
  });

  it('ignores timestamps outside the window', () => {
    const result = bucketByMonth(
      ['2024-01-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'],
      6,
      now
    );
    const total = result.reduce((s, b) => s + b.y, 0);
    expect(total).toBe(1);
  });

  it('returns ChartDatum with x, y, z fields', () => {
    const result = bucketByMonth(['2026-04-01T00:00:00.000Z'], 2, now);
    expect(result[0]).toHaveProperty('x');
    expect(result[0]).toHaveProperty('y');
    expect(result[0]).toHaveProperty('z');
  });
});

describe('countResearchByStatus', () => {
  it('counts projects by status, only returning non-zero', () => {
    const projects = [
      createTestResearcherProject({ id: 'a', status: 'completed' }),
      createTestResearcherProject({ id: 'b', status: 'completed' }),
      createTestResearcherProject({ id: 'c', status: 'running' }),
      createTestResearcherProject({ id: 'd', status: 'draft' }),
    ];
    const result = countResearchByStatus(projects);
    expect(result).toEqual([
      { x: 'Draft', y: 1, z: 'Draft' },
      { x: 'Running', y: 1, z: 'Running' },
      { x: 'Completed', y: 2, z: 'Completed' },
    ]);
  });

  it('returns empty array when no projects', () => {
    expect(countResearchByStatus([])).toEqual([]);
  });

  it('orders buckets by canonical status order', () => {
    const projects = [
      createTestResearcherProject({ id: 'a', status: 'failed' }),
      createTestResearcherProject({ id: 'b', status: 'draft' }),
      createTestResearcherProject({ id: 'c', status: 'completed' }),
    ];
    const result = countResearchByStatus(projects);
    expect(result.map((r) => r.x)).toEqual(['Draft', 'Completed', 'Failed']);
  });
});

describe('topN', () => {
  it('returns top N items sorted by count descending', () => {
    const items = [
      { name: 'A', c: 3 },
      { name: 'B', c: 10 },
      { name: 'C', c: 1 },
      { name: 'D', c: 7 },
    ];
    const result = topN(items, (i) => ({ label: i.name, count: i.c }), 2);
    expect(result).toHaveLength(2);
    expect(result[0].z).toBe('B');
    expect(result[1].z).toBe('D');
  });

  it('filters out zero-count items', () => {
    const items = [
      { name: 'A', c: 5 },
      { name: 'B', c: 0 },
    ];
    const result = topN(items, (i) => ({ label: i.name, count: i.c }));
    expect(result).toHaveLength(1);
    expect(result[0].z).toBe('A');
  });

  it('truncates long labels to 14 chars on x field', () => {
    const items = [{ name: 'A very long name here indeed', c: 1 }];
    const result = topN(items, (i) => ({ label: i.name, count: i.c }));
    expect(result[0].x.length).toBeLessThanOrEqual(14);
    expect(result[0].z).toBe('A very long name here indeed');
  });
});

describe('countResearchMethodUsage', () => {
  it('counts method ids across projects', () => {
    const projects = [
      createTestResearcherProject({ id: 'a', selectedMethodIds: ['heuristic-evaluation', 'task-analysis'] }),
      createTestResearcherProject({ id: 'b', selectedMethodIds: ['heuristic-evaluation'] }),
      createTestResearcherProject({ id: 'c', selectedMethodIds: ['persona-development'] }),
    ];
    const usage = countResearchMethodUsage(projects);
    expect(usage.get('heuristic-evaluation')).toBe(2);
    expect(usage.get('task-analysis')).toBe(1);
    expect(usage.get('persona-development')).toBe(1);
  });
});

describe('countSharedSkillUsage', () => {
  it('counts skill ids across prompts', () => {
    const prompts = [
      createTestPrompt({ id: 'a', selectedSharedSkillIds: ['s1', 's2'] }),
      createTestPrompt({ id: 'b', selectedSharedSkillIds: ['s1'] }),
    ];
    const usage = countSharedSkillUsage(prompts);
    expect(usage.get('s1')).toBe(2);
    expect(usage.get('s2')).toBe(1);
  });
});

describe('countSharedMemoryUsage', () => {
  it('counts memory ids across prompts', () => {
    const prompts = [
      createTestPrompt({ id: 'a', selectedSharedMemoryIds: ['m1', 'm2'] }),
      createTestPrompt({ id: 'b', selectedSharedMemoryIds: ['m1'] }),
    ];
    const usage = countSharedMemoryUsage(prompts);
    expect(usage.get('m1')).toBe(2);
    expect(usage.get('m2')).toBe(1);
  });
});

describe('progressPercent', () => {
  it('returns 0 for null progress', () => {
    expect(progressPercent(null)).toBe(0);
  });

  it('returns 0 when total is 0', () => {
    expect(progressPercent({ currentMethod: '', completedMethods: [], totalMethods: 0 })).toBe(0);
  });

  it('returns percentage rounded to nearest int', () => {
    expect(progressPercent({ currentMethod: 'x', completedMethods: ['a'], totalMethods: 3 })).toBe(33);
    expect(progressPercent({ currentMethod: 'x', completedMethods: ['a', 'b'], totalMethods: 4 })).toBe(50);
    expect(progressPercent({ currentMethod: 'x', completedMethods: ['a', 'b', 'c'], totalMethods: 3 })).toBe(100);
  });

  it('clamps to 0-100', () => {
    expect(progressPercent({ currentMethod: '', completedMethods: ['a', 'b', 'c', 'd'], totalMethods: 2 })).toBe(100);
  });
});

describe('researchBadgeColor', () => {
  it('maps each status to a badge color', () => {
    expect(researchBadgeColor('draft')).toBe('gray');
    expect(researchBadgeColor('pending')).toBe('blue');
    expect(researchBadgeColor('running')).toBe('yellow');
    expect(researchBadgeColor('completed')).toBe('green');
    expect(researchBadgeColor('failed')).toBe('red');
  });

  it('covers every status in the canonical order', () => {
    for (const s of RESEARCH_STATUS_ORDER) {
      expect(researchBadgeColor(s)).toBeDefined();
    }
  });
});

describe('mergeActivityFeeds', () => {
  it('merges and sorts by timestamp descending', () => {
    const prompts = [
      createTestPrompt({ id: 'p1', name: 'Prompt A', updatedAt: '2026-04-10T00:00:00.000Z' }),
      createTestPrompt({ id: 'p2', name: 'Prompt B', updatedAt: '2026-04-05T00:00:00.000Z' }),
    ];
    const research = [
      createTestResearcherProject({ id: 'r1', name: 'Research X', updatedAt: '2026-04-15T00:00:00.000Z' }),
    ];
    const ux = [
      createTestUxAnalysis({ id: 'u1', name: 'Analysis Y', updatedAt: '2026-04-12T00:00:00.000Z' }),
    ];
    const result = mergeActivityFeeds(prompts, research, ux);
    expect(result[0].title).toBe('Research X');
    expect(result[1].title).toBe('Analysis Y');
    expect(result[2].title).toBe('Prompt A');
    expect(result[3].title).toBe('Prompt B');
  });

  it('limits result count', () => {
    const prompts = Array.from({ length: 20 }, (_, i) =>
      createTestPrompt({ id: `p${i}`, name: `P${i}`, updatedAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00.000Z` })
    );
    const result = mergeActivityFeeds(prompts, [], [], 5);
    expect(result).toHaveLength(5);
  });

  it('tags each item with its source and href', () => {
    const prompts = [createTestPrompt({ id: 'p1', updatedAt: '2026-04-10T00:00:00.000Z' })];
    const research = [createTestResearcherProject({ id: 'r1', updatedAt: '2026-04-10T00:00:00.000Z' })];
    const ux = [createTestUxAnalysis({ id: 'u1', updatedAt: '2026-04-10T00:00:00.000Z' })];
    const result = mergeActivityFeeds(prompts, research, ux);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));
    expect(byId['prompt-p1'].source).toBe('prompt');
    expect(byId['prompt-p1'].href).toBe('/prompt-generator/p1');
    expect(byId['research-r1'].source).toBe('research');
    expect(byId['research-r1'].href).toBe('/researcher/r1');
    expect(byId['ux-u1'].source).toBe('ux-analysis');
    expect(byId['ux-u1'].href).toBe('/ux-writer/u1');
  });

  it('uses research status color for research items', () => {
    const running = createRunningResearcherProject({ id: 'r1' });
    const result = mergeActivityFeeds([], [running], []);
    expect(result[0].badgeColor).toBe('yellow');
    expect(result[0].badgeLabel).toBe('Running');
  });

  it('uses green badge for analyzed UX and gray for draft', () => {
    const analyzed = createTestUxAnalysis({
      id: 'a',
      updatedAt: '2026-04-10T00:00:00.000Z',
      results: { name: 'r', suggestions: [], summary: 's' },
    });
    const draft = createTestUxAnalysis({ id: 'b', updatedAt: '2026-04-10T00:00:00.000Z', results: null });
    const result = mergeActivityFeeds([], [], [analyzed, draft]);
    const analyzedItem = result.find((r) => r.id === 'ux-a');
    const draftItem = result.find((r) => r.id === 'ux-b');
    expect(analyzedItem?.badgeColor).toBe('green');
    expect(draftItem?.badgeColor).toBe('gray');
  });
});

describe('relativeTimeLabel', () => {
  const now = new Date('2026-04-20T12:00:00.000Z');

  it('returns "just now" for <1 minute', () => {
    expect(relativeTimeLabel('2026-04-20T11:59:30.000Z', now)).toBe('just now');
  });

  it('returns minutes ago for <1 hour', () => {
    expect(relativeTimeLabel('2026-04-20T11:30:00.000Z', now)).toBe('30m ago');
  });

  it('returns hours ago for <1 day', () => {
    expect(relativeTimeLabel('2026-04-20T05:00:00.000Z', now)).toBe('7h ago');
  });

  it('returns days ago for <1 week', () => {
    expect(relativeTimeLabel('2026-04-17T12:00:00.000Z', now)).toBe('3d ago');
  });

  it('returns weeks ago for <5 weeks', () => {
    expect(relativeTimeLabel('2026-04-06T12:00:00.000Z', now)).toBe('2w ago');
  });

  it('returns months ago for <1 year', () => {
    expect(relativeTimeLabel('2026-01-20T12:00:00.000Z', now)).toBe('3mo ago');
  });

  it('returns years ago otherwise', () => {
    expect(relativeTimeLabel('2024-04-20T12:00:00.000Z', now)).toBe('2y ago');
  });
});
