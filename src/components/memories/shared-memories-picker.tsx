'use client';

import type { SharedMemory } from '@/lib/types';
import { MemoryCard } from './memory-card';

interface SharedMemoriesPickerProps {
  sharedMemories: SharedMemory[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function SharedMemoriesPicker({
  sharedMemories,
  selectedIds,
  onChange,
}: SharedMemoriesPickerProps) {
  function handleToggle(memoryId: string) {
    if (selectedIds.includes(memoryId)) {
      onChange(selectedIds.filter((id) => id !== memoryId));
    } else {
      onChange([...selectedIds, memoryId]);
    }
  }

  if (sharedMemories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No shared memories available. Create shared memories on the Memories page to use them here.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {sharedMemories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          selected={memory.isBuiltIn || selectedIds.includes(memory.id)}
          onToggle={memory.isBuiltIn ? undefined : () => handleToggle(memory.id)}
        />
      ))}
    </div>
  );
}
