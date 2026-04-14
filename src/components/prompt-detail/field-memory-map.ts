import {
  COMPANY_CONTEXT_MEMORY_ID,
  PRODUCT_CONTEXT_MEMORY_IDS,
  DESIGN_SYSTEM_MEMORY_IDS,
  UX_WRITING_MEMORY_IDS,
} from '@/lib/constants';
import type { SharedMemory } from '@/lib/types';

// Memories always shown for a field (locked, not toggleable)
export const LOCKED_MEMORY_MAP: Record<string, string[]> = {
  companyInfo: [COMPANY_CONTEXT_MEMORY_ID],
};

// Memories shown only when selected
export const SELECTABLE_MEMORY_MAP: Record<string, string[]> = {
  productInfo: PRODUCT_CONTEXT_MEMORY_IDS,
  designSystemStorybook: DESIGN_SYSTEM_MEMORY_IDS,
  uxWriting: UX_WRITING_MEMORY_IDS,
};

export function getMemoryNames(
  fieldKey: string,
  selectedIds: string[],
  sharedMemories: SharedMemory[],
): string[] {
  const names: string[] = [];
  const lockedIds = LOCKED_MEMORY_MAP[fieldKey] ?? [];
  for (const id of lockedIds) {
    const name = sharedMemories.find((m) => m.id === id)?.name;
    if (name) names.push(name);
  }
  const selectableIds = SELECTABLE_MEMORY_MAP[fieldKey] ?? [];
  for (const id of selectableIds) {
    if (selectedIds.includes(id)) {
      const name = sharedMemories.find((m) => m.id === id)?.name;
      if (name) names.push(name);
    }
  }
  return names;
}
