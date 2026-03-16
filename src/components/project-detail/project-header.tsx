'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import type { Project } from '@/lib/types';

interface ProjectHeaderProps {
  project: Project;
  onRename?: (name: string) => void;
}

export function ProjectHeader({ project, onRename }: ProjectHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const createdDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const updatedDate = new Date(project.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  function startEditing() {
    setDraft(project.name);
    setEditing(true);
  }

  function save() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== project.name) {
      onRename?.(trimmed);
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(project.name);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  }

  return (
    <div className="space-y-1">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            className="text-2xl font-heading font-bold bg-transparent border-b-2 border-primary outline-none px-0 py-0.5 w-full max-w-md"
          />
          <button onClick={save} className="cursor-pointer text-primary hover:text-primary/80">
            <Check className="size-5" />
          </button>
          <button onMouseDown={cancel} className="cursor-pointer text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <h2 className="text-2xl font-heading font-bold">{project.name}</h2>
          {onRename && (
            <button
              onClick={startEditing}
              className="cursor-pointer text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
              aria-label="Rename project"
            >
              <Pencil className="size-4" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Created {createdDate}</span>
        <span className="text-muted-foreground/40">|</span>
        <span>Updated {updatedDate}</span>
      </div>
    </div>
  );
}
