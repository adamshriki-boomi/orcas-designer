'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  iconColor?: string;
  className?: string;
}

export function MetricCard({ icon: Icon, label, value, iconColor = 'bg-primary', className }: MetricCardProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex items-center gap-3 rounded-2xl shadow-card bg-card p-4',
        className
      )}
    >
      <div className={cn('flex size-10 items-center justify-center rounded-xl', iconColor)}>
        <Icon className="size-5 text-white" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-2xl font-bold tabular-nums" data-testid="metric-card-value">
          {value}
        </p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}
