'use client';

import { Pencil, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import type { FormFieldData } from '@/lib/types';

interface FieldSummaryProps {
  label: string;
  field: FormFieldData;
  onEdit: () => void;
  memoryNames?: string[];
}

function getFieldDisplayValue(field: FormFieldData): string | null {
  let value: string | null = null;
  switch (field.inputType) {
    case 'url':
      value = field.urlValue.trim() || null;
      break;
    case 'file':
      if (field.files.length === 0) return null;
      return field.files.map((f) => f.name).join(', ');
    case 'text':
      value = field.textValue.trim() || null;
      break;
    default:
      return null;
  }
  // Strip values that contain raw HTML/SVG markup (data corruption safeguard)
  if (value && /^\s*</.test(value)) return null;
  return value;
}

export function FieldSummary({ label, field, onEdit, memoryNames }: FieldSummaryProps) {
  const displayValue = getFieldDisplayValue(field);
  const hasMemories = memoryNames && memoryNames.length > 0;

  return (
    <Card
      size="sm"
      className="cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:scale-[1.01]"
      onClick={onEdit}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${label}`}
    >
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="size-3" />
            <span className="sr-only">Edit {label}</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {hasMemories && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {memoryNames.map((name) => (
              <Badge key={name} variant="secondary" className="text-[10px] gap-1">
                <Brain className="size-2.5" />
                {name}
              </Badge>
            ))}
          </div>
        )}
        {displayValue ? (
          <p className="text-sm text-muted-foreground truncate" title={displayValue}>
            {displayValue}
          </p>
        ) : !hasMemories ? (
          <p className="text-sm text-muted-foreground/50 italic">Not set</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
