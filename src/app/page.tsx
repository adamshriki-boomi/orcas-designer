'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useProjects } from '@/hooks/use-projects';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import { useSharedMemories, COMPANY_CONTEXT_MEMORY_ID } from '@/hooks/use-shared-memories';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { MANDATORY_SKILLS } from '@/lib/constants';
import { getActiveSkillsForProject } from '@/lib/skill-filter';
import { Layers, RefreshCw, Wand2, Brain } from 'lucide-react';

const ExChartLazy = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExChart })),
  { ssr: false }
);

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl shadow-card bg-card p-4">
      <div className={cn("flex size-10 items-center justify-center rounded-xl", color)}>
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <p className="font-heading text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { projects, isLoading } = useProjects();
  const { sharedSkills } = useSharedSkills();
  const { sharedMemories } = useSharedMemories();

  const totalRegenerations = useMemo(
    () => projects.reduce((sum, p) => sum + (p.regenerationCount ?? 0), 0),
    [projects]
  );
  const totalSkills = sharedSkills.length + MANDATORY_SKILLS.length;
  const totalMemories = sharedMemories.length;

  // Monthly buckets for last 6 months
  const monthlyBuckets = useMemo(() => {
    const now = new Date();
    const buckets: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      buckets[key] = 0;
    }
    projects.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([label, count]) => ({ x: label, y: count, z: label }));
  }, [projects]);

  // Projects by Interaction Level donut chart
  const interactionChartOptions = useMemo(() => ({
    type: 'donut-chart',
    width: 250,
    height: 250,
    thickness: 55,
    showLegends: true,
    legendShape: 'square',
    useNewLayout: true,
    legendAlignment: 'center',
    tooltip: { compactNumber: false },
    data: [
      { x: 'Static Mockups', y: projects.filter(p => p.interactionLevel === 'static').length },
      { x: 'Click-through', y: projects.filter(p => p.interactionLevel === 'click-through').length },
      { x: 'Full Prototype', y: projects.filter(p => p.interactionLevel === 'full-prototype').length },
    ],
  }), [projects]);

  const projectsOverTimeOptions = useMemo(() => ({
    type: 'stack-bar',
    width: 400,
    height: 280,
    barWidth: 'medium',
    showLegends: false,
    showGridLines: true,
    tooltip: { compactNumber: false },
    data: monthlyBuckets,
  }), [monthlyBuckets]);

  // Skills usage: include mandatory skills (active per project) + shared skills
  const skillsUsageOptions = useMemo(() => {
    const mandatoryData = MANDATORY_SKILLS
      .filter(s => s.includeCondition !== 'never')
      .map(skill => ({
        name: skill.name,
        count: projects.filter(p => getActiveSkillsForProject(p).some(as => as.name === skill.name)).length,
      }))
      .filter(d => d.count > 0);

    const skillUsageCounts = new Map<string, number>();
    for (const p of projects) {
      for (const sid of p.selectedSharedSkillIds) {
        skillUsageCounts.set(sid, (skillUsageCounts.get(sid) ?? 0) + 1);
      }
    }

    const sharedData = sharedSkills.map(skill => ({
      name: skill.name,
      count: skillUsageCounts.get(skill.id) ?? 0,
    }));

    const allSkills = [...mandatoryData, ...sharedData]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      type: 'stack-bar',
      width: 400,
      height: 280,
      barWidth: 'medium',
      showGridLines: true,
      showLegends: false,
      tooltip: { compactNumber: false },
      data: allSkills.map(s => ({
        x: s.name.slice(0, 14),
        y: s.count,
        z: s.name.slice(0, 14),
      })),
    };
  }, [projects, sharedSkills]);

  // Memories usage: include all shared memories (built-in + custom)
  const memoriesUsageOptions = useMemo(() => {
    const memoryUsageCounts = new Map<string, number>();
    for (const p of projects) {
      for (const mid of p.selectedSharedMemoryIds ?? []) {
        memoryUsageCounts.set(mid, (memoryUsageCounts.get(mid) ?? 0) + 1);
      }
    }

    const allMemories = sharedMemories
      .map(m => ({
        name: m.name,
        count: m.id === COMPANY_CONTEXT_MEMORY_ID
          ? projects.length
          : (memoryUsageCounts.get(m.id) ?? 0),
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      type: 'stack-bar',
      width: 400,
      height: 280,
      barWidth: 'medium',
      showGridLines: true,
      showLegends: false,
      tooltip: { compactNumber: false },
      data: allMemories.map(m => ({
        x: m.name.slice(0, 14),
        y: m.count,
        z: m.name.slice(0, 14),
      })),
    };
  }, [sharedMemories, projects]);

  const hasSkillsData = skillsUsageOptions.data.length > 0;
  const hasMemoriesData = memoriesUsageOptions.data.length > 0;

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" description="Create and manage your prompt projects" />
        <PageContainer>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <FadeIn>
        <Header
          title="Dashboard"
          description="Create and manage your prompt projects"
        />
        <PageContainer>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StaggerItem>
              <StatCard icon={Layers} label="Total Projects" value={projects.length} color="gradient-primary" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={RefreshCw} label="Regenerated" value={totalRegenerations} color="bg-accent" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={Wand2} label="Total Skills" value={totalSkills} color="bg-primary" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={Brain} label="Total Memories" value={totalMemories} color="bg-violet-500" />
            </StaggerItem>
          </StaggerContainer>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl shadow-card bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Projects by Interaction Level</h3>
              {projects.length > 0 ? (
                <ExChartLazy options={interactionChartOptions} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No projects yet</p>
              )}
            </div>
            <div className="rounded-2xl shadow-card bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Projects Over Time</h3>
              <ExChartLazy options={projectsOverTimeOptions} />
            </div>
            <div className="rounded-2xl shadow-card bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Skills Usage</h3>
              {hasSkillsData ? (
                <ExChartLazy options={skillsUsageOptions} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No skills in use</p>
              )}
            </div>
            <div className="rounded-2xl shadow-card bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Memories Usage</h3>
              {hasMemoriesData ? (
                <ExChartLazy options={memoriesUsageOptions} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No memories in use</p>
              )}
            </div>
          </div>
        </PageContainer>
      </FadeIn>
    </>
  );
}
