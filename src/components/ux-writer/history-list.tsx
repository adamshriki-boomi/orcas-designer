'use client';

import { Trash2, Clock } from 'lucide-react';
import type { AnalysisEntry } from '@/hooks/use-ux-writer';

interface HistoryListProps {
  entries: AnalysisEntry[];
  onSelect: (entry: AnalysisEntry) => void;
  onDelete: (id: string) => void;
}

export function HistoryList({ entries, onSelect, onDelete }: HistoryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No past analyses yet
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer group"
          onClick={() => onSelect(entry)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSelect(entry); }}
          role="button"
          tabIndex={0}
        >
          <Clock className="size-3.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">{entry.description}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive cursor-pointer p-1"
            aria-label="Delete analysis"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
