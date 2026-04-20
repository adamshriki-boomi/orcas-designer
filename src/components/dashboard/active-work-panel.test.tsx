import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActiveWorkPanel } from './active-work-panel';
import { createRunningResearcherProject, createTestResearcherProject } from '@/test/helpers/researcher-fixtures';
import type { ActivityItem } from '@/lib/dashboard-metrics';

vi.mock('next/dynamic', () => ({
  default: (_loader: unknown, _options: unknown) => {
    const MockExBadge = ({ children, color }: { children: React.ReactNode; color?: string }) => (
      <span data-testid="ex-badge" data-color={color}>
        {children}
      </span>
    );
    const MockExEmptyState = ({ label, text }: { label?: string; text?: string }) => (
      <div data-testid="ex-empty-state">
        <h4>{label}</h4>
        <p>{text}</p>
      </div>
    );
    // We can't tell which one is being imported from just the loader function name,
    // so detect by the component name extracted from the module body.
    const loaderStr = String(_loader);
    if (loaderStr.includes('ExEmptyState')) return MockExEmptyState;
    return MockExBadge;
  },
}));

vi.mock('@/components/ui/spa-link', () => ({
  SpaLink: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function sampleActivity(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: 'prompt-1',
    source: 'prompt',
    title: 'Sample prompt',
    timestamp: '2026-04-19T00:00:00.000Z',
    href: '/prompt-generator/1',
    badgeLabel: 'static',
    badgeColor: 'navy',
    ...overrides,
  };
}

describe('ActiveWorkPanel', () => {
  it('renders running jobs with progress', () => {
    const job = createRunningResearcherProject({
      id: 'job-1',
      name: 'Persona study',
    });
    render(<ActiveWorkPanel runningJobs={[job]} recentDrafts={[]} />);
    expect(screen.getByText('Persona study')).toBeInTheDocument();
    expect(screen.getByTestId('progress-job-1').textContent).toContain('33%');
    expect(screen.getByTestId('progress-job-1').textContent).toContain('1 of 3 methods');
  });

  it('shows empty state when no running jobs', () => {
    render(<ActiveWorkPanel runningJobs={[]} recentDrafts={[]} />);
    expect(screen.getByTestId('running-jobs-empty')).toBeInTheDocument();
  });

  it('renders recent drafts with titles and labels', () => {
    const now = new Date('2026-04-20T00:00:00.000Z');
    render(
      <ActiveWorkPanel
        runningJobs={[]}
        recentDrafts={[
          sampleActivity({ id: 'prompt-1', title: 'Checkout flow', source: 'prompt' }),
          sampleActivity({ id: 'research-2', title: 'Persona study', source: 'research', badgeColor: 'yellow', badgeLabel: 'Running' }),
        ]}
        now={now}
      />
    );
    expect(screen.getByText('Checkout flow')).toBeInTheDocument();
    expect(screen.getByText('Persona study')).toBeInTheDocument();
  });

  it('shows empty state when no recent drafts', () => {
    render(<ActiveWorkPanel runningJobs={[]} recentDrafts={[]} />);
    expect(screen.getByTestId('recent-drafts-empty')).toBeInTheDocument();
  });

  it('links each running job to its detail page', () => {
    const job = createRunningResearcherProject({ id: 'abc-123' });
    render(<ActiveWorkPanel runningJobs={[job]} recentDrafts={[]} />);
    const link = screen.getByTestId('active-job-abc-123');
    expect(link.getAttribute('href')).toBe('/researcher/abc-123');
  });

  it('handles jobs with no progress gracefully', () => {
    const job = createTestResearcherProject({
      id: 'no-progress',
      name: 'Pending',
      status: 'pending',
      progress: null,
    });
    render(<ActiveWorkPanel runningJobs={[job]} recentDrafts={[]} />);
    expect(screen.getByTestId('progress-no-progress').textContent).toContain('0%');
    expect(screen.getByTestId('progress-no-progress').textContent).toContain('0 of 0 methods');
  });
});
