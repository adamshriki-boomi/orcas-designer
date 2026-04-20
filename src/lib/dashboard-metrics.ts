import type { Prompt, UxAnalysisEntry } from '@/lib/types';
import type { ResearcherProject, ResearchProgress, ResearchProjectStatus } from '@/lib/researcher-types';

export type ChartDatum = { x: string; y: number; z: string };

export type ActivitySource = 'prompt' | 'research' | 'ux-analysis';

export type ActivityItem = {
  id: string;
  source: ActivitySource;
  title: string;
  timestamp: string;
  href: string;
  badgeLabel: string | null;
  badgeColor: BadgeColor | null;
};

export type BadgeColor = 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'orange' | 'navy';

export function monthKey(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function bucketByMonth(
  timestamps: string[],
  monthCount = 6,
  now: Date = new Date()
): ChartDatum[] {
  const buckets: Record<string, number> = {};
  const order: string[] = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    buckets[key] = 0;
    order.push(key);
  }
  for (const ts of timestamps) {
    const key = monthKey(new Date(ts));
    if (key in buckets) buckets[key]++;
  }
  return order.map((k) => ({ x: k, y: buckets[k], z: k }));
}

export const RESEARCH_STATUS_ORDER: ResearchProjectStatus[] = [
  'draft',
  'pending',
  'running',
  'completed',
  'failed',
];

export const RESEARCH_STATUS_LABEL: Record<ResearchProjectStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

export const RESEARCH_STATUS_COLOR: Record<ResearchProjectStatus, BadgeColor> = {
  draft: 'gray',
  pending: 'blue',
  running: 'yellow',
  completed: 'green',
  failed: 'red',
};

export function countResearchByStatus(projects: ResearcherProject[]): ChartDatum[] {
  const counts: Record<ResearchProjectStatus, number> = {
    draft: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  };
  for (const p of projects) {
    if (p.status in counts) counts[p.status]++;
  }
  return RESEARCH_STATUS_ORDER
    .filter((s) => counts[s] > 0)
    .map((s) => ({
      x: RESEARCH_STATUS_LABEL[s],
      y: counts[s],
      z: RESEARCH_STATUS_LABEL[s],
    }));
}


export function topN<T>(
  items: T[],
  keyFn: (item: T) => { label: string; count: number },
  n = 8
): ChartDatum[] {
  return items
    .map(keyFn)
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map((d) => ({ x: d.label.slice(0, 14), y: d.count, z: d.label }));
}

export function countResearchMethodUsage(projects: ResearcherProject[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const p of projects) {
    for (const mid of p.selectedMethodIds) {
      usage.set(mid, (usage.get(mid) ?? 0) + 1);
    }
  }
  return usage;
}

export function countSharedSkillUsage(prompts: Prompt[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const p of prompts) {
    for (const sid of p.selectedSharedSkillIds ?? []) {
      usage.set(sid, (usage.get(sid) ?? 0) + 1);
    }
  }
  return usage;
}

export function countSharedMemoryUsage(prompts: Prompt[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const p of prompts) {
    for (const mid of p.selectedSharedMemoryIds ?? []) {
      usage.set(mid, (usage.get(mid) ?? 0) + 1);
    }
  }
  return usage;
}

export function progressPercent(progress: ResearchProgress | null): number {
  if (!progress || progress.totalMethods === 0) return 0;
  const done = progress.completedMethods.length;
  const pct = Math.round((done / progress.totalMethods) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function researchBadgeColor(status: ResearchProjectStatus): BadgeColor {
  return RESEARCH_STATUS_COLOR[status];
}

function promptActivity(p: Prompt): ActivityItem {
  return {
    id: `prompt-${p.id}`,
    source: 'prompt',
    title: p.name || 'Untitled prompt',
    timestamp: p.updatedAt,
    href: `/prompt-generator/${p.id}`,
    badgeLabel: p.generatedPrompt ? 'Generated' : 'Draft',
    badgeColor: 'navy',
  };
}

function researchActivity(r: ResearcherProject): ActivityItem {
  return {
    id: `research-${r.id}`,
    source: 'research',
    title: r.name || 'Untitled research',
    timestamp: r.updatedAt,
    href: `/researcher/${r.id}`,
    badgeLabel: RESEARCH_STATUS_LABEL[r.status],
    badgeColor: RESEARCH_STATUS_COLOR[r.status],
  };
}

function uxActivity(a: UxAnalysisEntry): ActivityItem {
  return {
    id: `ux-${a.id}`,
    source: 'ux-analysis',
    title: a.name || 'Untitled analysis',
    timestamp: a.updatedAt,
    href: `/ux-writer/${a.id}`,
    badgeLabel: a.results ? 'Analyzed' : 'Draft',
    badgeColor: a.results ? 'green' : 'gray',
  };
}

export function mergeActivityFeeds(
  prompts: Prompt[],
  research: ResearcherProject[],
  uxAnalyses: UxAnalysisEntry[],
  limit = 10
): ActivityItem[] {
  const all: ActivityItem[] = [
    ...prompts.map(promptActivity),
    ...research.map(researchActivity),
    ...uxAnalyses.map(uxActivity),
  ];
  return all
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export function relativeTimeLabel(timestamp: string, now: Date = new Date()): string {
  const then = new Date(timestamp).getTime();
  const diffMs = Math.max(0, now.getTime() - then);
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
