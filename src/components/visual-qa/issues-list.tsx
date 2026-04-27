'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import type { VisualQaCategory, VisualQaIssue } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { IssueCard } from './issue-card';

interface IssuesListProps {
  issues: VisualQaIssue[];
  onChange: (next: VisualQaIssue[]) => void;
}

const DEFAULT_CATEGORY: VisualQaCategory = 'Component';

export function IssuesList({ issues, onChange }: IssuesListProps) {
  // Per-card UI state. `editingIds` is the set of cards currently in edit mode.
  // `draftIds` tracks cards that were just added and have never been saved —
  // hitting Cancel on a draft removes it from the list entirely.
  const [editingIds, setEditingIds] = useState<Set<string>>(() => new Set());
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set());

  const startEdit = useCallback((id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const stopEdit = useCallback((id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDraftIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const onSaveCard = useCallback(
    (id: string, patch: Partial<VisualQaIssue>) => {
      onChange(issues.map((iss) => (iss.id === id ? { ...iss, ...patch } : iss)));
      stopEdit(id);
    },
    [issues, onChange, stopEdit]
  );

  const onCancelCard = useCallback(
    (id: string) => {
      if (draftIds.has(id)) {
        // Cancel on a never-saved draft removes it from the list.
        onChange(issues.filter((iss) => iss.id !== id));
      }
      stopEdit(id);
    },
    [issues, onChange, draftIds, stopEdit]
  );

  const onDeleteCard = useCallback(
    (id: string) => {
      onChange(issues.filter((iss) => iss.id !== id));
      stopEdit(id);
    },
    [issues, onChange, stopEdit]
  );

  const onAddIssue = useCallback(() => {
    const newId = generateId();
    const blank: VisualQaIssue = {
      id: newId,
      severity: 'medium',
      category: DEFAULT_CATEGORY,
      location: '',
      description: '',
      expected: '',
      actual: '',
      suggestedFix: '',
    };
    // New issue goes to the top of the list, opens in edit mode, and is
    // tracked as a draft so Cancel removes it.
    onChange([blank, ...issues]);
    setEditingIds((prev) => new Set([...prev, newId]));
    setDraftIds((prev) => new Set([...prev, newId]));
  }, [issues, onChange]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button variant="outline" size="sm" onClick={onAddIssue}>
          <Plus className="size-4" /> Add issue
        </Button>
      </div>
      {issues.length === 0 ? (
        <p className="text-sm text-[var(--exo-color-font-secondary,#475569)]">
          No issues yet.
        </p>
      ) : (
        issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            isEditing={editingIds.has(issue.id)}
            onStartEdit={() => startEdit(issue.id)}
            onSave={(patch) => onSaveCard(issue.id, patch)}
            onCancel={() => onCancelCard(issue.id)}
            onDelete={() => onDeleteCard(issue.id)}
          />
        ))
      )}
    </div>
  );
}

function generateId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
