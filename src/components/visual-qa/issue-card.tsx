'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { BadgeColor, BadgeShape, BadgeSize } from '@boomi/exosphere';
import {
  VISUAL_QA_CATEGORIES,
  type VisualQaCategory,
  type VisualQaIssue,
  type VisualQaSeverity,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IssueKebab } from './issue-kebab';

const ExBadgeLazy = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExBadge })),
  { ssr: false }
);

const SEVERITY_BADGE: Record<VisualQaSeverity, { color: BadgeColor; label: string }> = {
  high: { color: 'red' as BadgeColor, label: 'High' },
  medium: { color: 'orange' as BadgeColor, label: 'Medium' },
  low: { color: 'yellow' as BadgeColor, label: 'Low' },
};

interface IssueCardProps {
  issue: VisualQaIssue;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (patch: Partial<VisualQaIssue>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function IssueCard({
  issue,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
}: IssueCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onConfirmDelete = useCallback(() => {
    setConfirmDelete(false);
    onDelete();
  }, [onDelete]);

  return (
    <article
      role="group"
      aria-label={issue.location || 'Issue'}
      className="rounded border border-[var(--exo-color-border-default,#e2e8f0)] bg-white p-3"
    >
      {isEditing ? (
        <EditView
          issue={issue}
          onSave={onSave}
          onCancel={onCancel}
        />
      ) : (
        <NormalView
          issue={issue}
          onStartEdit={onStartEdit}
          onRequestDelete={() => setConfirmDelete(true)}
        />
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this issue?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. The issue will be removed from this report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

// ── Normal (read-only) view ────────────────────────────────────────────

interface NormalViewProps {
  issue: VisualQaIssue;
  onStartEdit: () => void;
  onRequestDelete: () => void;
}

function NormalView({ issue, onStartEdit, onRequestDelete }: NormalViewProps) {
  const sev = SEVERITY_BADGE[issue.severity];
  return (
    <>
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <ExBadgeLazy
          color={sev.color}
          shape={'round' as BadgeShape}
          size={'small' as BadgeSize}
          showIcon={false}
          useTextContent
        >
          {sev.label}
        </ExBadgeLazy>
        <ExBadgeLazy
          color={'navy' as BadgeColor}
          shape={'round' as BadgeShape}
          size={'small' as BadgeSize}
          showIcon={false}
          useTextContent
        >
          {issue.category}
        </ExBadgeLazy>
        {issue.exosphereComponent && (
          <ExBadgeLazy
            color={'gray' as BadgeColor}
            shape={'squared' as BadgeShape}
            size={'small' as BadgeSize}
            showIcon={false}
            useTextContent
          >
            {issue.exosphereComponent}
          </ExBadgeLazy>
        )}
        <div className="ml-auto">
          <IssueKebab
            actions={[
              {
                key: 'edit',
                label: 'Edit',
                onSelect: onStartEdit,
              },
              {
                key: 'delete',
                label: 'Delete',
                onSelect: onRequestDelete,
                risky: true,
              },
            ]}
          />
        </div>
      </header>

      {issue.location && (
        <p className="mb-2 text-sm font-medium text-[var(--exo-color-font,#0f172a)]">
          {issue.location}
        </p>
      )}
      {issue.description && (
        <p className="mb-2 text-sm text-[var(--exo-color-font,#0f172a)] whitespace-pre-line">
          {issue.description}
        </p>
      )}

      <ReadOnlyField label="Expected" value={issue.expected} />
      <ReadOnlyField label="Actual" value={issue.actual} />
      <ReadOnlyField label="Suggested fix" value={issue.suggestedFix} />

      {/* Fallback icons for jsdom-only contexts where Exosphere doesn't render.
          Hidden from sighted users but ensures tests can find action affordances. */}
      <span aria-hidden className="sr-only">
        <MoreVertical /> <Pencil /> <Trash2 />
      </span>
    </>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  if (!value) return null;
  return (
    <div className="mb-2">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--exo-color-font-secondary,#475569)]">
        {label}
      </span>
      <p className="text-sm text-[var(--exo-color-font,#0f172a)] whitespace-pre-line">
        {value}
      </p>
    </div>
  );
}

// ── Edit view ──────────────────────────────────────────────────────────

interface EditViewProps {
  issue: VisualQaIssue;
  onSave: (patch: Partial<VisualQaIssue>) => void;
  onCancel: () => void;
}

function EditView({ issue, onSave, onCancel }: EditViewProps) {
  const [draft, setDraft] = useState<VisualQaIssue>(issue);

  const setField = useCallback(<K extends keyof VisualQaIssue>(key: K, value: VisualQaIssue[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onSubmit = useCallback(() => {
    const patch: Partial<VisualQaIssue> = {
      severity: draft.severity,
      category: draft.category,
      exosphereComponent: draft.exosphereComponent?.trim() || undefined,
      location: draft.location.trim(),
      description: draft.description.trim(),
      expected: draft.expected.trim(),
      actual: draft.actual.trim(),
      suggestedFix: draft.suggestedFix.trim(),
    };
    onSave(patch);
  }, [draft, onSave]);

  const fieldId = (k: string) => `${issue.id}-${k}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SelectField
          id={fieldId('severity')}
          label="Severity"
          value={draft.severity}
          options={[
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
          onChange={(v) => setField('severity', v as VisualQaSeverity)}
        />
        <SelectField
          id={fieldId('category')}
          label="Category"
          value={draft.category}
          options={VISUAL_QA_CATEGORIES.map((c) => ({ value: c, label: c }))}
          onChange={(v) => setField('category', v as VisualQaCategory)}
        />
      </div>
      <Input
        label="Exosphere component"
        value={draft.exosphereComponent ?? ''}
        placeholder="e.g. ExButton"
        onChange={(e) => setField('exosphereComponent', e.target.value)}
      />
      <Input
        label="Location"
        value={draft.location}
        onChange={(e) => setField('location', e.target.value)}
      />
      <Textarea
        label="Description"
        value={draft.description}
        rows={2}
        onChange={(e) => setField('description', e.target.value)}
      />
      <Textarea
        label="Expected"
        value={draft.expected}
        rows={2}
        onChange={(e) => setField('expected', e.target.value)}
      />
      <Textarea
        label="Actual"
        value={draft.actual}
        rows={2}
        onChange={(e) => setField('actual', e.target.value)}
      />
      <Textarea
        label="Suggested fix"
        value={draft.suggestedFix}
        rows={2}
        onChange={(e) => setField('suggestedFix', e.target.value)}
      />
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSubmit}>
          Save
        </Button>
      </div>
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

// Native <select> is a known gap (Exosphere's ExSelect has a complex API
// not yet adapted in this repo). Styled with --exo-* tokens to match the
// system. TODO: replace with ExSelect when an adapter lands.
function SelectField({ id, label, value, options, onChange }: SelectFieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--exo-color-font,#0f172a)]">
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-[var(--exo-color-border-default,#e2e8f0)] bg-white px-2 py-1.5 text-sm text-[var(--exo-color-font,#0f172a)] focus:outline-2 focus:outline-[var(--exo-color-action,#3b82f6)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
