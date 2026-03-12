'use client';

import { cn } from '@/lib/utils';

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn('animate-fade-in', className)}
      style={delay ? { animationDelay: `${delay}s`, animationFillMode: 'both' } : undefined}
    >
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}
