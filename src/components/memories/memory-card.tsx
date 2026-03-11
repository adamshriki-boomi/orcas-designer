'use client';

import type { SharedMemory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Trash2, Edit, FileText } from 'lucide-react';

interface MemoryCardProps {
  memory: SharedMemory;
  selected?: boolean;
  onToggle?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MemoryCard({
  memory,
  selected = false,
  onToggle,
  onView,
  onEdit,
  onDelete,
}: MemoryCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        'transition-all duration-150',
        selected && 'ring-primary',
        onView && 'cursor-pointer hover:shadow-card-hover hover:scale-[1.01]'
      )}
      onClick={onView}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          {memory.isBuiltIn ? (
            <Lock className="size-4 shrink-0 text-muted-foreground" />
          ) : onToggle ? (
            <Checkbox
              checked={selected}
              onCheckedChange={onToggle}
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-3.5 text-muted-foreground" />
            {memory.name}
            {memory.isBuiltIn && (
              <Badge variant="secondary">Built-in</Badge>
            )}
          </CardTitle>
        </div>
        {!memory.isBuiltIn && (onEdit || onDelete) && (
          <CardAction>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit />
                  <span className="sr-only">Edit</span>
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Trash2 className="text-destructive" />
                  <span className="sr-only">Delete</span>
                </Button>
              )}
            </div>
          </CardAction>
        )}
        {memory.description && (
          <CardDescription className="line-clamp-2">{memory.description}</CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}
