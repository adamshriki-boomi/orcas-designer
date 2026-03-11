'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useProjects } from '@/hooks/use-projects';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import { useSharedMemories } from '@/hooks/use-shared-memories';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { MANDATORY_SKILLS } from '@/lib/constants';
import { isFieldFilled } from '@/lib/validators';
import { Layers, CheckCircle2, Wand2, Brain, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/lib/types';

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

function isProjectComplete(project: Project): boolean {
  const fields = [
    project.companyInfo,
    project.productInfo,
    project.featureInfo,
    project.figmaFileLink,
    project.designSystemStorybook,
    project.designSystemNpm,
    project.designSystemFigma,
    project.prototypeSketches,
  ];
  return fields.every(isFieldFilled);
}

export default function DashboardPage() {
  const { projects, isLoading } = useProjects();
  const { sharedSkills } = useSharedSkills();
  const { sharedMemories } = useSharedMemories();

  const completedCount = projects.filter(isProjectComplete).length;
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

  // Chart options
  const completionChartOptions = useMemo(() => ({
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
      { x: 'Complete', y: completedCount },
      { x: 'Incomplete', y: Math.max(0, projects.length - completedCount) },
    ],
  }), [completedCount, projects.length]);

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

  const skillUsageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      for (const sid of p.selectedSharedSkillIds) {
        counts.set(sid, (counts.get(sid) ?? 0) + 1);
      }
    }
    return counts;
  }, [projects]);

  const memoryUsageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      for (const mid of p.selectedSharedMemoryIds ?? []) {
        counts.set(mid, (counts.get(mid) ?? 0) + 1);
      }
    }
    return counts;
  }, [projects]);

  const skillsUsageOptions = useMemo(() => ({
    type: 'grouped-bar',
    width: 400,
    height: 280,
    showGridLines: true,
    showLegends: false,
    tooltip: { compactNumber: false },
    data: sharedSkills.slice(0, 8).map((s) => ({
      category: s.name.slice(0, 14),
      subcategory: 'Usage',
      value: skillUsageCounts.get(s.id) ?? 0,
    })),
  }), [sharedSkills, skillUsageCounts]);

  const memoriesUsageOptions = useMemo(() => ({
    type: 'grouped-bar',
    width: 400,
    height: 280,
    showGridLines: true,
    showLegends: false,
    tooltip: { compactNumber: false },
    data: sharedMemories
      .filter((m) => !m.isBuiltIn)
      .slice(0, 8)
      .map((m) => ({
        category: m.name.slice(0, 14),
        subcategory: 'Usage',
        value: memoryUsageCounts.get(m.id) ?? 0,
      })),
  }), [sharedMemories, memoryUsageCounts]);

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" description="Manage your design & development prompt projects" />
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
          description="Manage your design & development prompt projects"
          action={
            <Link href="/projects/new" className={buttonVariants()}>
              <PlusCircle />
              New Project
            </Link>
          }
        />
        <PageContainer>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StaggerItem>
              <StatCard icon={Layers} label="Total Projects" value={projects.length} color="gradient-primary" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={CheckCircle2} label="Completed" value={completedCount} color="bg-accent" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={Wand2} label="Total Skills" value={totalSkills} color="bg-primary" />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon={Brain} label="Total Memories" value={totalMemories} color="bg-secondary" />
            </StaggerItem>
          </StaggerContainer>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl shadow-card bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Completion Rate</h3>
              <ExChartLazy options={completionChartOptions} />
            </div>
            <div className="rounded-2xl shadow-card bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Projects Over Time</h3>
              <ExChartLazy options={projectsOverTimeOptions} />
            </div>
            <div className="rounded-2xl shadow-card bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Skills Usage</h3>
              {sharedSkills.length > 0 ? (
                <ExChartLazy options={skillsUsageOptions} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No shared skills yet</p>
              )}
            </div>
            <div className="rounded-2xl shadow-card bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Memories Usage</h3>
              {sharedMemories.filter((m) => !m.isBuiltIn).length > 0 ? (
                <ExChartLazy options={memoriesUsageOptions} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No custom memories yet</p>
              )}
            </div>
          </div>
        </PageContainer>
      </FadeIn>
    </>
  );
}
