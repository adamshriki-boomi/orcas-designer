'use client';

import dynamic from 'next/dynamic';
import type { ChartDatum } from '@/lib/dashboard-metrics';

const ExChart = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExChart })),
  { ssr: false }
);

const ExEmptyState = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExEmptyState })),
  { ssr: false }
);

export interface TrendsSectionProps {
  researchByStatus: ChartDatum[];
  promptsOverTime: ChartDatum[];
  researchOverTime: ChartDatum[];
  uxOverTime: ChartDatum[];
  topSkills: ChartDatum[];
  topMemories: ChartDatum[];
  topResearchMethods: ChartDatum[];
}

export function TrendsSection(props: TrendsSectionProps) {
  return (
    <section aria-label="Trends and top items" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ChartCard title="Research projects by status" data={props.researchByStatus} type="donut" />
      <ChartCard title="Prompts over time" data={props.promptsOverTime} type="line" alwaysShow />
      <ChartCard title="Research jobs over time" data={props.researchOverTime} type="line" alwaysShow />
      <ChartCard title="UX analyses over time" data={props.uxOverTime} type="line" alwaysShow />
      <ChartCard title="Top skills by usage" data={props.topSkills} type="bar" />
      <ChartCard title="Top memories by usage" data={props.topMemories} type="bar" />
      <ChartCard title="Top research methods" data={props.topResearchMethods} type="bar" />
    </section>
  );
}

type ChartType = 'donut' | 'bar' | 'line';

function buildOptions(type: ChartType, data: ChartDatum[]): Record<string, unknown> {
  if (type === 'donut') {
    return {
      type: 'donut-chart',
      width: 260,
      height: 260,
      thickness: 55,
      showLegends: true,
      legendShape: 'square',
      useNewLayout: true,
      legendAlignment: 'center',
      tooltip: { compactNumber: false },
      data,
    };
  }
  if (type === 'line') {
    return {
      type: 'line-graph',
      scaleX: { type: 'ordinal', padding: 0.01 },
      width: 420,
      height: 260,
      thickness: 2,
      showLegends: false,
      hideGrid: false,
      paddingBottom: 0,
      paddingRight: 0,
      xAxisLabelDirection: 'slanted',
      tooltip: { compactNumber: false },
      data,
    };
  }
  return {
    type: 'stack-bar',
    width: 420,
    height: 260,
    barWidth: 'medium',
    showGridLines: true,
    showLegends: false,
    tooltip: { compactNumber: false },
    data,
  };
}

function ChartCard({
  title,
  data,
  type,
  alwaysShow,
}: {
  title: string;
  data: ChartDatum[];
  type: ChartType;
  alwaysShow?: boolean;
}) {
  const hasData = data.some((d) => d.y > 0);
  const shouldRender = alwaysShow || hasData;
  return (
    <div
      className="rounded-2xl shadow-card bg-card p-4"
      data-testid={`chart-${slugify(title)}`}
    >
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{title}</h3>
      {shouldRender ? (
        <ExChart options={buildOptions(type, data)} />
      ) : (
        <div className="py-8" data-testid={`chart-empty-${slugify(title)}`}>
          <ExEmptyState label="No data yet" text="Create items to see this chart." />
        </div>
      )}
    </div>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
