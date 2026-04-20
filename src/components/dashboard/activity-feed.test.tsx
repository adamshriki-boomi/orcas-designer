import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityFeed } from './activity-feed';
import type { ActivityItem } from '@/lib/dashboard-metrics';

vi.mock('next/dynamic', () => ({
  default: (loader: unknown) => {
    const loaderStr = String(loader);
    if (loaderStr.includes('ExEmptyState')) {
      const MockExEmptyState = ({ label, text }: { label?: string; text?: string }) => (
        <div data-testid="ex-empty-state">
          <h4>{label}</h4>
          <p>{text}</p>
        </div>
      );
      return MockExEmptyState;
    }
    const MockExBadge = ({ children, color }: { children: React.ReactNode; color?: string }) => (
      <span data-testid="ex-badge" data-color={color}>
        {children}
      </span>
    );
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

function makeItem(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: 'prompt-1',
    source: 'prompt',
    title: 'Item',
    timestamp: '2026-04-19T00:00:00.000Z',
    href: '/prompt-generator/1',
    badgeLabel: 'static',
    badgeColor: 'navy',
    ...overrides,
  };
}

describe('ActivityFeed', () => {
  const now = new Date('2026-04-20T00:00:00.000Z');

  it('renders an empty state when no items', () => {
    render(<ActivityFeed items={[]} />);
    expect(screen.getByTestId('activity-feed-empty')).toBeInTheDocument();
  });

  it('renders all items with source labels and relative time', () => {
    render(
      <ActivityFeed
        items={[
          makeItem({ id: 'prompt-1', source: 'prompt', title: 'Prompt A' }),
          makeItem({ id: 'research-1', source: 'research', title: 'Research B' }),
          makeItem({ id: 'ux-1', source: 'ux-analysis', title: 'UX C' }),
        ]}
        now={now}
      />
    );
    expect(screen.getByText('Prompt A')).toBeInTheDocument();
    expect(screen.getByText('Research B')).toBeInTheDocument();
    expect(screen.getByText('UX C')).toBeInTheDocument();
    expect(screen.getAllByText('1d ago').length).toBe(3);
  });

  it('applies limit when provided', () => {
    const items = Array.from({ length: 15 }, (_, i) =>
      makeItem({ id: `p-${i}`, title: `Item ${i}`, timestamp: `2026-04-${String(19 - (i % 15)).padStart(2, '0')}T00:00:00.000Z` })
    );
    render(<ActivityFeed items={items} limit={5} now={now} />);
    const rendered = screen.getAllByTestId(/activity-p-/);
    expect(rendered).toHaveLength(5);
  });

  it('links to the item href', () => {
    render(
      <ActivityFeed
        items={[makeItem({ id: 'research-abc', source: 'research', href: '/researcher/abc' })]}
        now={now}
      />
    );
    const link = screen.getByTestId('activity-research-abc');
    expect(link.getAttribute('href')).toBe('/researcher/abc');
  });

  it('shows badge when badgeLabel is provided', () => {
    render(
      <ActivityFeed
        items={[makeItem({ id: 'a', badgeLabel: 'Completed', badgeColor: 'green' })]}
        now={now}
      />
    );
    expect(screen.getByTestId('ex-badge').textContent).toBe('Completed');
    expect(screen.getByTestId('ex-badge').getAttribute('data-color')).toBe('green');
  });

  it('hides badge when badgeLabel is null', () => {
    render(
      <ActivityFeed
        items={[makeItem({ id: 'a', badgeLabel: null, badgeColor: null })]}
        now={now}
      />
    );
    expect(screen.queryByTestId('ex-badge')).toBeNull();
  });
});
