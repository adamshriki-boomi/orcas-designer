'use client';

import { useId, useMemo, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link as LinkIcon, Image, Play, Wand2, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/types';
import { isFieldFilled } from '@/lib/validators';
import { PRODUCT_CONTEXT_MEMORY_IDS } from '@/hooks/use-shared-memories';
import { MANDATORY_SKILLS } from '@/lib/constants';
import Link from 'next/link';

interface ProjectCardProps {
  project: Project;
}

function getFilledCount(project: Project): number {
  // Company info always filled (locked Boomi Context memory)
  let count = 1;

  // Product info: field data OR a selected product memory
  if (
    isFieldFilled(project.productInfo) ||
    (project.selectedSharedMemoryIds ?? []).some((id) => PRODUCT_CONTEXT_MEMORY_IDS.includes(id))
  ) {
    count++;
  }

  const otherFields = [
    project.featureInfo,
    project.figmaFileLink,
    project.designSystemStorybook,
    project.designSystemNpm,
    project.designSystemFigma,
    project.prototypeSketches,
  ];
  count += otherFields.filter(isFieldFilled).length;

  return count;
}

const TOTAL_FIELDS = 8;

function getCompletionPercent(project: Project): number {
  return Math.round((getFilledCount(project) / TOTAL_FIELDS) * 100);
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProgressRing({ percent }: { percent: number }) {
  const gradientId = useId();
  const size = 44;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" role="img" aria-label={`${percent}% complete`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/50"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

function StatusChip({ icon: Icon, label, active = false }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      active ? 'bg-accent/15 text-accent-foreground' : 'bg-muted text-muted-foreground'
    )}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}

export const ProjectCard = memo(function ProjectCard({ project }: ProjectCardProps) {
  const { completion, filledCount, relativeTime, hasFigma, skillCount, memoryCount, interactionLevel, outputLabel, OutputIcon } = useMemo(() => {
    const comp = getCompletionPercent(project);
    const filled = getFilledCount(project);
    const time = getRelativeTime(project.updatedAt);
    const figma = project.figmaFileLink.urlValue.trim().length > 0;
    const skills = MANDATORY_SKILLS.length + (project.selectedSharedSkillIds?.length ?? 0) + (project.customSkills?.length ?? 0);
    const memories = (project.selectedSharedMemoryIds?.length ?? 0) + (project.customMemories?.length ?? 0);
    const interaction = project.interactionLevel ?? 'static';
    const label = interaction === 'full-prototype' ? 'Full Prototype' : interaction === 'click-through' ? 'Click-through' : 'Static';
    const icon = interaction === 'static' ? Image : Play;
    return { completion: comp, filledCount: filled, relativeTime: time, hasFigma: figma, skillCount: skills, memoryCount: memories, interactionLevel: interaction, outputLabel: label, OutputIcon: icon };
  }, [project]);

  return (
    <Link href={`/projects/placeholder?_id=${project.id}`} className="block">
      <Card className="group cursor-pointer hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="font-heading font-semibold truncate">{project.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{relativeTime}</p>
            </div>
            <div className="relative flex items-center justify-center">
              <ProgressRing percent={completion} />
              <span className="absolute text-[10px] font-semibold tabular-nums">{completion}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <StatusChip icon={LinkIcon} label="Figma" active={hasFigma} />
            <StatusChip icon={OutputIcon} label={outputLabel} active={!!interactionLevel} />
            <StatusChip icon={Wand2} label={`${skillCount} skills`} active={skillCount > 0} />
            <StatusChip icon={Brain} label={`${memoryCount} mem`} active={memoryCount > 0} />
          </div>
          <p className="text-xs text-muted-foreground">{filledCount} of 8 fields filled</p>
        </CardContent>
      </Card>
    </Link>
  );
});
