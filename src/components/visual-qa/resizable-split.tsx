'use client';

import { useResizableSplit } from '@/hooks/use-resizable-split';
import { cn } from '@/lib/utils';

interface ResizableSplitProps {
  children: [React.ReactNode, React.ReactNode];
  storageKey: string;
  defaultPct?: number;
  minPct?: number;
  maxPct?: number;
  className?: string;
}

export function ResizableSplit({
  children,
  storageKey,
  defaultPct = 60,
  minPct = 25,
  maxPct = 75,
  className,
}: ResizableSplitProps) {
  const { pct, containerRef, startDrag, onKeyDown } = useResizableSplit({
    storageKey,
    defaultPct,
    minPct,
    maxPct,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full w-full min-h-0 max-md:flex-col max-md:gap-3',
        className
      )}
      data-testid="resizable-split-container"
    >
      <div
        className="h-full min-w-0 min-h-0 max-md:w-full max-md:flex-1"
        style={{ width: `${pct}%` }}
      >
        {children[0]}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={pct}
        aria-valuemin={minPct}
        aria-valuemax={maxPct}
        tabIndex={0}
        onPointerDown={startDrag}
        onKeyDown={onKeyDown}
        className={cn(
          // 3px hit area = 1px visible line + 1px transparent padding on each side.
          // Padding (px) extends the click target without enlarging the visible divider.
          'hidden md:flex w-[3px] px-px mx-2 cursor-col-resize items-stretch justify-center shrink-0 group',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--exo-color-action,#3b82f6)]'
        )}
      >
        <span
          aria-hidden
          className="block h-full w-px bg-[var(--exo-color-border-default,#e2e8f0)] group-hover:bg-[var(--exo-color-action,#3b82f6)] group-active:bg-[var(--exo-color-action,#3b82f6)]"
        />
      </div>
      <div className="h-full min-w-0 min-h-0 flex-1 max-md:w-full max-md:flex-1">
        {children[1]}
      </div>
    </div>
  );
}
