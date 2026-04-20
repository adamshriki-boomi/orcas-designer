'use client';

import { useMemo } from 'react';
import {
  BotMessageSquare,
  Brain,
  CheckCircle2,
  FlaskConical,
  Loader2,
  PenLine,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { usePrompts } from '@/hooks/use-prompts';
import { useResearcherProjects } from '@/hooks/use-researcher-projects';
import { useUxAnalyses } from '@/hooks/use-ux-analyses';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import { useSharedMemories, COMPANY_CONTEXT_MEMORY_ID } from '@/hooks/use-shared-memories';
import { useRecentActivity } from '@/hooks/use-recent-activity';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { DashboardHero, greetingFor } from '@/components/dashboard/dashboard-hero';
import { ActiveWorkPanel } from '@/components/dashboard/active-work-panel';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { StatsStrip } from '@/components/dashboard/stats-strip';
import { TrendsSection } from '@/components/dashboard/trends-section';
import { MANDATORY_SKILLS } from '@/lib/constants';
import { getActiveSkillsForPrompt } from '@/lib/skill-filter';
import {
  bucketByMonth,
  countPromptsByInteractionLevel,
  countResearchByStatus,
  countResearchMethodUsage,
  countSharedMemoryUsage,
  countSharedSkillUsage,
  mergeActivityFeeds,
  topN,
} from '@/lib/dashboard-metrics';
import { BUILT_IN_RESEARCH_METHODS } from '@/lib/researcher-constants';

const DASHBOARD_DESCRIPTION = 'Your workspace across prompts, research, and UX writing';

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects: prompts, isLoading: promptsLoading } = usePrompts();
  const { projects: research, isLoading: researchLoading } = useResearcherProjects();
  const { analyses, isLoading: analysesLoading } = useUxAnalyses();
  const { sharedSkills } = useSharedSkills();
  const { sharedMemories } = useSharedMemories();
  const { items: activity } = useRecentActivity(10);

  const isLoading = promptsLoading || researchLoading || analysesLoading;

  const fullName = (user?.user_metadata as Record<string, unknown> | undefined)?.full_name as
    | string
    | undefined;

  const runningJobs = useMemo(
    () => research.filter((p) => p.status === 'running' || p.status === 'pending'),
    [research]
  );

  const recentDrafts = useMemo(
    () => mergeActivityFeeds(prompts, research, analyses, 5),
    [prompts, research, analyses]
  );

  const totalRegenerations = useMemo(
    () => prompts.reduce((s, p) => s + (p.regenerationCount ?? 0), 0),
    [prompts]
  );

  const completedResearch = useMemo(
    () => research.filter((p) => p.status === 'completed').length,
    [research]
  );

  const subtitleParts: string[] = [];
  if (runningJobs.length > 0)
    subtitleParts.push(`${runningJobs.length} research job${runningJobs.length === 1 ? '' : 's'} running`);
  if (prompts.length > 0 || analyses.length > 0)
    subtitleParts.push(`${prompts.length + analyses.length + research.length} items in your workspace`);
  const subtitle = subtitleParts.join(' · ');

  const personalStats = [
    {
      icon: BotMessageSquare,
      label: 'Prompts',
      value: prompts.length,
      iconColor: 'bg-primary',
    },
    {
      icon: FlaskConical,
      label: 'Research projects',
      value: research.length,
      iconColor: 'bg-accent',
    },
    {
      icon: PenLine,
      label: 'UX analyses',
      value: analyses.length,
      iconColor: 'bg-violet-500',
    },
    {
      icon: RefreshCw,
      label: 'Regenerations',
      value: totalRegenerations,
      iconColor: 'bg-emerald-500',
    },
  ];

  const pulseStats = [
    {
      icon: Wand2,
      label: 'Shared skills',
      value: sharedSkills.length + MANDATORY_SKILLS.length,
      iconColor: 'bg-primary',
    },
    {
      icon: Brain,
      label: 'Shared memories',
      value: sharedMemories.length,
      iconColor: 'bg-violet-500',
    },
    {
      icon: Loader2,
      label: 'Running jobs',
      value: runningJobs.length,
      iconColor: 'bg-yellow-500',
    },
    {
      icon: CheckCircle2,
      label: 'Completed research',
      value: completedResearch,
      iconColor: 'bg-emerald-500',
    },
  ];

  const trendsData = useMemo(() => {
    // Skills: combine mandatory (counted by per-prompt activation) + shared
    const mandatoryUsage = MANDATORY_SKILLS.filter((s) => s.includeCondition !== 'never').map((skill) => ({
      label: skill.name,
      count: prompts.filter((p) => getActiveSkillsForPrompt(p).some((as) => as.name === skill.name)).length,
    }));
    const sharedSkillUsage = countSharedSkillUsage(prompts);
    const sharedSkillsData = sharedSkills.map((skill) => ({
      label: skill.name,
      count: sharedSkillUsage.get(skill.id) ?? 0,
    }));
    const topSkills = topN(
      [...mandatoryUsage, ...sharedSkillsData],
      (d) => ({ label: d.label, count: d.count }),
      8
    );

    // Memories: company context counted on all prompts
    const sharedMemoryUsage = countSharedMemoryUsage(prompts);
    const topMemories = topN(
      sharedMemories.map((m) => ({
        label: m.name,
        count: m.id === COMPANY_CONTEXT_MEMORY_ID
          ? prompts.length
          : sharedMemoryUsage.get(m.id) ?? 0,
      })),
      (d) => ({ label: d.label, count: d.count }),
      8
    );

    // Top research methods
    const methodUsage = countResearchMethodUsage(research);
    const topResearchMethods = topN(
      BUILT_IN_RESEARCH_METHODS.map((m) => ({
        label: m.name,
        count: methodUsage.get(m.id) ?? 0,
      })),
      (d) => ({ label: d.label, count: d.count }),
      8
    );

    return {
      interactionLevels: countPromptsByInteractionLevel(prompts),
      researchByStatus: countResearchByStatus(research),
      promptsOverTime: bucketByMonth(prompts.map((p) => p.createdAt)),
      researchOverTime: bucketByMonth(
        research.filter((r) => r.completedAt).map((r) => r.completedAt as string)
      ),
      uxOverTime: bucketByMonth(analyses.map((a) => a.createdAt)),
      topSkills,
      topMemories,
      topResearchMethods,
    };
  }, [prompts, research, analyses, sharedSkills, sharedMemories]);

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" description={DASHBOARD_DESCRIPTION} />
        <PageContainer>
          <DashboardSkeleton />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" description={DASHBOARD_DESCRIPTION} />
      <PageContainer>
        <div className="space-y-8">
          <DashboardHero greeting={greetingFor(fullName)} subtitle={subtitle || undefined} />
          <ActiveWorkPanel runningJobs={runningJobs} recentDrafts={recentDrafts} />
          <StatsStrip stats={personalStats} />
          <ActivityFeed items={activity} limit={10} />
          <StatsStrip stats={pulseStats} />
          <TrendsSection {...trendsData} />
        </div>
      </PageContainer>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
