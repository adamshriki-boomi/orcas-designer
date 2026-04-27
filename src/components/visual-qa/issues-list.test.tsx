import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { VisualQaIssue } from '@/lib/types';

// Same mock seams as issue-card.test.tsx — see the comments there for why.
vi.mock('@/components/ui/input', () => ({
  Input: ({ leadingIcon: _li, clearable: _c, label, ...props }: Record<string, unknown> & { label?: string }) => (
    <label>
      {label}
      <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />
    </label>
  ),
}));
vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => (
    <label>
      {label}
      <textarea {...props} />
    </label>
  ),
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant: _v, size: _s, ...props }: Record<string, unknown> & { children?: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  ),
  buttonVariants: () => '',
}));
vi.mock('./issue-kebab', () => ({
  IssueKebab: ({
    actions,
  }: {
    actions: { key: string; label: string; onSelect: () => void; risky?: boolean }[];
  }) => (
    <div role="menu" aria-label="More actions">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          role="menuitem"
          onClick={action.onSelect}
        >
          {action.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('@boomi/exosphere', () => ({
  ExBadge: ({ children, color }: { children: React.ReactNode; color?: string }) => (
    <span data-testid="badge" data-color={color}>
      {children}
    </span>
  ),
  ExDialog: ({
    children,
    open,
    dialogTitle,
  }: {
    children: React.ReactNode;
    open?: boolean;
    dialogTitle?: string;
  }) =>
    open ? (
      <div role="alertdialog" aria-label={dialogTitle}>
        {children}
      </div>
    ) : null,
}));

const { IssuesList } = await import('./issues-list');

const mk = (overrides: Partial<VisualQaIssue> = {}): VisualQaIssue => ({
  id: overrides.id ?? Math.random().toString(36).slice(2),
  severity: 'medium',
  category: 'Layout',
  location: 'L',
  description: 'd',
  expected: 'e',
  actual: 'a',
  suggestedFix: 'f',
  ...overrides,
});

describe('IssuesList', () => {
  it('shows the empty-state message when there are no issues, but still shows the Add button', () => {
    render(<IssuesList issues={[]} onChange={() => {}} />);
    expect(screen.getByText(/no issues yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add issue/i })).toBeInTheDocument();
  });

  it('renders a flat list of cards (no per-category section headings)', () => {
    const issues: VisualQaIssue[] = [
      mk({ id: 'a', category: 'Layout', location: 'A' }),
      mk({ id: 'b', category: 'Typography', location: 'B' }),
      mk({ id: 'c', category: 'Layout', location: 'C' }),
    ];
    render(<IssuesList issues={issues} onChange={() => {}} />);
    // Category names appear inside cards as badges, not as section <h2>s.
    expect(screen.queryByRole('heading', { name: 'Layout' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Typography' })).toBeNull();
    // All three cards rendered (located via aria-label on each card).
    expect(screen.getByRole('group', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'B' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'C' })).toBeInTheDocument();
  });

  it('Add issue prepends a new draft card in edit mode', async () => {
    const onChange = vi.fn();
    render(
      <IssuesList
        issues={[mk({ id: 'a', location: 'A' })]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add issue/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [next] = onChange.mock.calls[0];
    expect(next).toHaveLength(2);
    // New issue is at the top (index 0).
    expect(next[0].id).not.toBe('a');
    expect(next[0].id).not.toBe('');
    expect(next[1].id).toBe('a');
    // It has default severity 'medium' and the default category.
    expect(next[0].severity).toBe('medium');
    expect(next[0].category).toBeTruthy();
  });

  it('clicking Cancel on a freshly added draft removes it from the list', () => {
    let issues: VisualQaIssue[] = [mk({ id: 'existing', location: 'kept' })];
    const onChange = vi.fn((next: VisualQaIssue[]) => {
      issues = next;
    });

    const { rerender } = render(<IssuesList issues={issues} onChange={onChange} />);

    // Click Add → new draft prepended, list now has 2 items
    fireEvent.click(screen.getByRole('button', { name: /add issue/i }));
    rerender(<IssuesList issues={issues} onChange={onChange} />);
    expect(issues).toHaveLength(2);

    // Click Cancel on the (new) edit-mode card. The draft is at index 0.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    rerender(<IssuesList issues={issues} onChange={onChange} />);

    // Cancel on a brand-new draft removes it from the list.
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe('existing');
  });

  it('clicking Edit on an existing card switches to edit mode but does NOT remove it on Cancel', async () => {
    const onChange = vi.fn();
    render(
      <IssuesList
        issues={[mk({ id: 'a', location: 'kept-after-cancel' })]}
        onChange={onChange}
      />
    );
    await act(async () => {});

    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    // Now in edit mode → Cancel button visible
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    // Cancel on an existing (non-draft) card must NOT call onChange
    expect(onChange).not.toHaveBeenCalled();
  });

  it('saving an existing card persists the patched issue in place', async () => {
    const onChange = vi.fn();
    render(
      <IssuesList
        issues={[
          mk({ id: 'a', location: 'A' }),
          mk({ id: 'b', location: 'B' }),
        ]}
        onChange={onChange}
      />
    );
    await act(async () => {});

    // Enter edit mode on the first card
    const cardA = screen.getByRole('group', { name: 'A' });
    fireEvent.click(cardA.querySelector('[role="menuitem"]') as Element);

    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: 'A-saved' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [next] = onChange.mock.calls[0];
    expect(next).toHaveLength(2);
    expect(next[0].location).toBe('A-saved');
    expect(next[1].location).toBe('B');
  });
});
