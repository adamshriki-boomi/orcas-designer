'use client';

import { MetricCard, type MetricCardProps } from './metric-card';
import { cn } from '@/lib/utils';

export interface StatsStripProps {
  stats: MetricCardProps[];
  className?: string;
}

export function StatsStrip({ stats, className }: StatsStripProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        className
      )}
      role="list"
      aria-label="Dashboard metrics"
    >
      {stats.map((stat) => (
        <div role="listitem" key={stat.label}>
          <MetricCard {...stat} />
        </div>
      ))}
    </div>
  );
}
