import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { VisualQaIssue } from '@/lib/types';

// Mock the kebab + Exosphere primitives — same seams as issue-card.test.tsx.
vi.mock('./issue-kebab', () => ({
  IssueKebab: ({
    actions,
  }: {
    actions: { key: string; label: string; onSelect: () => void }[];
  }) => (
    <div role="menu" aria-label="More actions">
      {actions.map((a) => (
        <button key={a.key} type="button" role="menuitem" onClick={a.onSelect}>
          {a.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: Record<string, unknown> & { children?: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  ),
  buttonVariants: () => '',
}));
vi.mock('@boomi/exosphere', () => ({
  ExBadge: ({ children, color }: { children: React.ReactNode; color?: string }) => (
    <span data-color={color} data-testid="severity-badge">
      {children}
    </span>
  ),
  ExDialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
  }) => (open ? <div role="alertdialog">{children}</div> : null),
}));

const { IssuesPane } = await import('./issues-pane');

const sampleFindings: VisualQaIssue[] = [
  {
    id: 'f1',
    severity: 'high',
    category: 'Layout',
    location: 'Header',
    description: 'Title is misaligned',
    expected: 'Centered',
    actual: 'Left',
    suggestedFix: 'Align center',
  },
];

describe('IssuesPane', () => {
  it('renders the Issues heading', () => {
    render(
      <IssuesPane
        issues={sampleFindings}
        severityCounts={{ high: 1, medium: 0, low: 0 }}
        summary={null}
        onIssuesChange={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: 'Issues' })).toBeInTheDocument();
  });

  it('shows severity counts in the header', () => {
    render(
      <IssuesPane
        issues={[]}
        severityCounts={{ high: 3, medium: 5, low: 7 }}
        summary={null}
        onIssuesChange={() => {}}
      />
    );
    expect(screen.getByText(/High 3/)).toBeInTheDocument();
    expect(screen.getByText(/Medium 5/)).toBeInTheDocument();
    expect(screen.getByText(/Low 7/)).toBeInTheDocument();
  });

  it('renders the summary paragraph when provided', () => {
    render(
      <IssuesPane
        issues={[]}
        severityCounts={{ high: 0, medium: 0, low: 0 }}
        summary="Overall the implementation is close to the design."
        onIssuesChange={() => {}}
      />
    );
    expect(
      screen.getByText('Overall the implementation is close to the design.')
    ).toBeInTheDocument();
  });

  it('does not render a summary paragraph when summary is null', () => {
    const { container } = render(
      <IssuesPane
        issues={[]}
        severityCounts={{ high: 0, medium: 0, low: 0 }}
        summary={null}
        onIssuesChange={() => {}}
      />
    );
    // No <p> with summary text exists
    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach((p) => {
      expect(p.textContent).not.toMatch(/Overall|implementation/);
    });
  });

  it('renders issues list content when issues exist', () => {
    render(
      <IssuesPane
        issues={sampleFindings}
        severityCounts={{ high: 1, medium: 0, low: 0 }}
        summary={null}
        onIssuesChange={() => {}}
      />
    );
    // IssuesList renders cards as flat groups — locate one by aria-label.
    expect(screen.getByRole('group', { name: 'Header' })).toBeInTheDocument();
  });

  it('exposes a scroll container for issues', () => {
    const { container } = render(
      <IssuesPane
        issues={sampleFindings}
        severityCounts={{ high: 1, medium: 0, low: 0 }}
        summary={null}
        onIssuesChange={() => {}}
      />
    );
    const scroller = container.querySelector('.overflow-auto');
    expect(scroller).not.toBeNull();
  });
});
