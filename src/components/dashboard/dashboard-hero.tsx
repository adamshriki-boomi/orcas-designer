'use client';

import Link from 'next/link';
import { BotMessageSquare, FlaskConical, PenLine, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardHeroProps {
  greeting: string;
  subtitle?: string;
}

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  testId: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'New prompt',
    description: 'Configure a design prompt',
    href: '/prompt-generator/new',
    icon: BotMessageSquare,
    testId: 'cta-new-prompt',
  },
  {
    label: 'New research',
    description: 'Run an AI UX research project',
    href: '/researcher/new',
    icon: FlaskConical,
    testId: 'cta-new-research',
  },
  {
    label: 'New UX analysis',
    description: 'Review copy against UX guidelines',
    href: '/ux-writer/new',
    icon: PenLine,
    testId: 'cta-new-ux-analysis',
  },
];

export function DashboardHero({ greeting, subtitle }: DashboardHeroProps) {
  return (
    <section
      aria-label="Dashboard hero"
      className="rounded-2xl shadow-card bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8"
    >
      <div className="mb-5 md:mb-6">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
          {greeting}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionTile key={action.label} action={action} />
        ))}
      </div>
    </section>
  );
}

function QuickActionTile({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      data-testid={action.testId}
      className={cn(
        'group/cta flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-4',
        'transition-all hover:border-primary/40 hover:bg-card hover:shadow-md cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover/cta:bg-primary group-hover/cta:text-white">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{action.label}</p>
        <p className="text-xs text-muted-foreground truncate">{action.description}</p>
      </div>
    </Link>
  );
}

export function greetingFor(fullName: string | null | undefined, now: Date = new Date()): string {
  const first = firstName(fullName);
  const hour = now.getHours();
  let prefix = 'Welcome back';
  if (hour < 12) prefix = 'Good morning';
  else if (hour < 18) prefix = 'Good afternoon';
  else prefix = 'Good evening';
  return first ? `${prefix}, ${first}` : prefix;
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}
