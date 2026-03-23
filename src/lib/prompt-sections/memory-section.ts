import type { Project, SharedMemory } from '../types';
import { DESIGN_SYSTEM_MEMORY_IDS } from '../constants';

export function buildMemorySection(project: Project, sharedMemories: SharedMemory[]): string {
  const selectedIds = project.selectedSharedMemoryIds ?? [];
  const customMemories = project.customMemories ?? [];
  const selectedMemories = sharedMemories.filter((m) => selectedIds.includes(m.id));

  const hasMemories = selectedMemories.length > 0 || customMemories.length > 0;

  if (!hasMemories) return '';

  const hasDesignSystemMemory = selectedMemories.some((m) =>
    DESIGN_SYSTEM_MEMORY_IDS.includes(m.id),
  );

  const lines: string[] = [
    '## MEMORIES',
    '',
    'The following context files have been provided as project memories. Important notes:',
    '- If memories reference production tech stack choices (e.g., React libraries, specific frameworks), treat them as design intent for the final product — for this prototype, implement equivalent behavior using the tech approach specified in <output-requirements>.',
    '- If memories mention features or requirements not listed in the <context> feature requirements, treat them as out of scope for this prototype unless the user confirms otherwise at the checkpoint.',
  ];

  const hasNonDesignSystemMemory = selectedMemories.some(
    (m) => !DESIGN_SYSTEM_MEMORY_IDS.includes(m.id),
  ) || customMemories.length > 0;

  if (hasDesignSystemMemory) {
    lines.push('- **EXCEPTION — Design system memories are AUTHORITATIVE**: They define the MANDATORY component palette. You MUST use design system components from these memories for all matching UI elements. Do NOT treat them as "supporting context only".');
    if (hasNonDesignSystemMemory) {
      lines.push('- The authoritative feature scope is defined in <context> — non-design-system memories provide supporting context only.');
    }
  } else {
    lines.push('- The authoritative feature scope is defined in <context> — memories provide supporting context only.');
  }

  lines.push('');

  for (const memory of selectedMemories) {
    lines.push(`### ${memory.name} (${memory.fileName})`);
    lines.push('');
    lines.push(memory.content);
    lines.push('');
  }

  for (const memory of customMemories) {
    lines.push(`### ${memory.name} (custom)`);
    lines.push('');
    lines.push(memory.content);
    lines.push('');
  }

  return lines.join('\n');
}
