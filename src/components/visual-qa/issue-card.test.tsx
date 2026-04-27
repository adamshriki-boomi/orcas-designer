import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { VisualQaIssue } from '@/lib/types';

// The shared ui adapters wrap Exosphere via next/dynamic and don't render in
// jsdom. Swap them for plain HTML so we can assert label→input association.
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

// Mock the kebab so jsdom renders synchronous menu items we can find by role.
// (The real IssueKebab uses next/dynamic + ExDropdown/ExMenu/ExMenuItem; the
// dynamic doesn't always pick up vi.mock for the inner Lit components when
// the kebab subtree is bundled inside a single dynamic — extracting + mocking
// the local module is the reliable seam.)
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
          data-risky={action.risky ? 'true' : 'false'}
        >
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock ExBadge directly (its dynamic wrapper does pick up the mock — the
// kebab's nested-children pattern is what needed extraction).
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

const { IssueCard } = await import('./issue-card');

const sample = (overrides: Partial<VisualQaIssue> = {}): VisualQaIssue => ({
  id: 'iss-1',
  severity: 'high',
  category: 'Component',
  exosphereComponent: 'ExButton',
  location: 'Primary CTA',
  description: 'CTA uses tertiary instead of primary',
  expected: 'Primary button',
  actual: 'Tertiary button',
  suggestedFix: 'Use ExButton type="primary"',
  ...overrides,
});

// Helper: render and wait for next/dynamic to resolve so Exosphere primitives
// (mocked) render their children. Use `findBy*` queries directly when possible.
async function flushDynamic() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('IssueCard — Normal mode', () => {
  it('renders severity, category, and component as badges', async () => {
    render(
      <IssueCard
        issue={sample()}
        isEditing={false}
        onStartEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );
    await flushDynamic();
    const badges = await screen.findAllByTestId('badge');
    const text = badges.map((b) => b.textContent);
    expect(text).toContain('High');
    expect(text).toContain('Component');
    expect(text).toContain('ExButton');
  });

  it('shows the location, description, expected, actual, and suggested fix as read-only text', () => {
    render(
      <IssueCard
        issue={sample()}
        isEditing={false}
        onStartEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.getByText('Primary CTA')).toBeInTheDocument();
    expect(screen.getByText('CTA uses tertiary instead of primary')).toBeInTheDocument();
    expect(screen.getByText('Primary button')).toBeInTheDocument();
    expect(screen.getByText('Tertiary button')).toBeInTheDocument();
    expect(screen.getByText('Use ExButton type="primary"')).toBeInTheDocument();
  });

  it('omits the Exosphere component badge when not set', async () => {
    render(
      <IssueCard
        issue={sample({ exosphereComponent: undefined })}
        isEditing={false}
        onStartEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );
    await flushDynamic();
    const badges = await screen.findAllByTestId('badge');
    const text = badges.map((b) => b.textContent);
    expect(text).not.toContain('ExButton');
  });

  it('does not render edit form fields', () => {
    render(
      <IssueCard
        issue={sample()}
        isEditing={false}
        onStartEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.queryByLabelText(/severity/i)).toBeNull();
    expect(screen.queryByLabelText(/category/i)).toBeNull();
  });

  it('clicking Edit in the kebab fires onStartEdit', async () => {
    const onStartEdit = vi.fn();
    render(
      <IssueCard
        issue={sample()}
        isEditing={false}
        onStartEdit={onStartEdit}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );
    await flushDynamic();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(onStartEdit).toHaveBeenCalledTimes(1);
  });
});

describe('IssueCard — Delete confirmation', () => {
  it('clicking Delete in the kebab opens a confirmation dialog (does NOT delete yet)', async () => {
    const onDelete = vi.fn();
    render(
      <IssueCard
        issue={sample()}
        isEditing={false}
        onStartEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={onDelete}
      />
    );
    await flushDynamic();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
  });

  it('confirming the dialog fires onDelete', async () => {
    const onDelete = vi.fn();
    render(
      <IssueCard
        issue={sample()}
        isEditing={false}
        onStartEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={onDelete}
      />
    );
    await flushDynamic();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('cancelling the dialog does not fire onDelete and closes the dialog', async () => {
    const onDelete = vi.fn();
    render(
      <IssueCard
        issue={sample()}
        isEditing={false}
        onStartEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={onDelete}
      />
    );
    await flushDynamic();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(onDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });
});

describe('IssueCard — Edit mode', () => {
  it('renders editable form fields', () => {
    render(
      <IssueCard
        issue={sample()}
        isEditing={true}
        onStartEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.getByLabelText('Severity')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
  });

  it('typing into a field updates the local draft, not the parent', () => {
    const onSave = vi.fn();
    render(
      <IssueCard
        issue={sample()}
        isEditing={true}
        onStartEdit={() => {}}
        onSave={onSave}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );
    const location = screen.getByLabelText('Location') as HTMLInputElement;
    fireEvent.change(location, { target: { value: 'New CTA location' } });
    expect(location.value).toBe('New CTA location');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('clicking Save fires onSave with the patched draft', () => {
    const onSave = vi.fn();
    render(
      <IssueCard
        issue={sample()}
        isEditing={true}
        onStartEdit={() => {}}
        onSave={onSave}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Updated CTA' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const patch = onSave.mock.calls[0][0];
    expect(patch.location).toBe('Updated CTA');
  });

  it('clicking Cancel fires onCancel and does NOT call onSave', () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(
      <IssueCard
        issue={sample()}
        isEditing={true}
        onStartEdit={() => {}}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'discarded' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Save trims fields and converts an empty Exosphere component to undefined', () => {
    const onSave = vi.fn();
    render(
      <IssueCard
        issue={sample({ exosphereComponent: 'ExButton' })}
        isEditing={true}
        onStartEdit={() => {}}
        onSave={onSave}
        onCancel={() => {}}
        onDelete={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText(/exosphere component/i), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: '  trimmed  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const patch = onSave.mock.calls[0][0];
    expect(patch.exosphereComponent).toBeUndefined();
    expect(patch.location).toBe('trimmed');
  });
});
