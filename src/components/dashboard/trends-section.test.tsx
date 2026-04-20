import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrendsSection } from './trends-section';

vi.mock('next/dynamic', () => ({
  default: (loader: unknown) => {
    const loaderStr = String(loader);
    if (loaderStr.includes('ExEmptyState')) {
      const MockExEmptyState = ({ label }: { label?: string }) => (
        <div data-testid="ex-empty-state">{label}</div>
      );
      return MockExEmptyState;
    }
    const MockExChart = ({ options }: { options: Record<string, unknown> }) => (
      <div data-testid="ex-chart" data-chart-type={String(options.type)} data-count={(options.data as unknown[]).length} />
    );
    return MockExChart;
  },
}));

function empty() {
  return {
    researchByStatus: [],
    promptsOverTime: [],
    researchOverTime: [],
    uxOverTime: [],
    topSkills: [],
    topMemories: [],
    topResearchMethods: [],
  };
}

describe('TrendsSection', () => {
  it('renders all 7 chart cards', () => {
    const { container } = render(<TrendsSection {...empty()} />);
    const cards = container.querySelectorAll('[data-testid^="chart-"]');
    const cardTestIds = Array.from(cards)
      .map((c) => c.getAttribute('data-testid') ?? '')
      .filter((t) => !t.startsWith('chart-empty-'));
    expect(cardTestIds).toHaveLength(7);
  });

  it('renders empty state for donut/bar charts without data', () => {
    render(<TrendsSection {...empty()} />);
    expect(screen.getByTestId('chart-empty-research-projects-by-status')).toBeInTheDocument();
    expect(screen.getByTestId('chart-empty-top-skills-by-usage')).toBeInTheDocument();
    expect(screen.getByTestId('chart-empty-top-memories-by-usage')).toBeInTheDocument();
    expect(screen.getByTestId('chart-empty-top-research-methods')).toBeInTheDocument();
  });

  it('always renders line charts (even with zero data) to show time axis', () => {
    render(<TrendsSection {...empty()} />);
    expect(screen.queryByTestId('chart-empty-prompts-over-time')).toBeNull();
    expect(screen.queryByTestId('chart-empty-research-jobs-over-time')).toBeNull();
    expect(screen.queryByTestId('chart-empty-ux-analyses-over-time')).toBeNull();
  });

  it('uses line-graph type for time-series charts', () => {
    render(
      <TrendsSection
        {...empty()}
        promptsOverTime={[
          { x: 'Apr', y: 3, z: 'Apr' },
          { x: 'May', y: 5, z: 'May' },
        ]}
      />
    );
    const charts = screen.getAllByTestId('ex-chart');
    const lineChart = charts.find((c) => c.getAttribute('data-chart-type') === 'line-graph');
    expect(lineChart).toBeDefined();
  });

  it('uses donut-chart type for research-status chart', () => {
    render(
      <TrendsSection
        {...empty()}
        researchByStatus={[{ x: 'Completed', y: 4, z: 'Completed' }]}
      />
    );
    const charts = screen.getAllByTestId('ex-chart');
    const donut = charts.find((c) => c.getAttribute('data-chart-type') === 'donut-chart');
    expect(donut).toBeDefined();
  });

  it('uses stack-bar type for top-skills chart', () => {
    render(
      <TrendsSection
        {...empty()}
        topSkills={[{ x: 'A', y: 3, z: 'A' }]}
      />
    );
    const charts = screen.getAllByTestId('ex-chart');
    const bar = charts.find((c) => c.getAttribute('data-chart-type') === 'stack-bar');
    expect(bar).toBeDefined();
  });
});
