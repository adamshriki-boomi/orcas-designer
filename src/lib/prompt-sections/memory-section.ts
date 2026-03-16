import type { Project, SharedMemory } from '../types';

export function buildMemorySection(project: Project, sharedMemories: SharedMemory[]): string {
  const selectedIds = project.selectedSharedMemoryIds ?? [];
  const customMemories = project.customMemories ?? [];
  const selectedMemories = sharedMemories.filter((m) => selectedIds.includes(m.id));

  const hasMemories = selectedMemories.length > 0 || customMemories.length > 0;

  if (!hasMemories) return '';

  const lines: string[] = [
    '## MEMORIES',
    '',
    'The following context files have been provided as project memories. Important notes:',
    '- If memories reference production tech stack choices (e.g., React libraries, specific frameworks), treat them as design intent for the final product — for this prototype, implement equivalent behavior using the tech approach specified in <output-requirements>.',
    '- If memories mention features or requirements not listed in the <context> feature requirements, treat them as out of scope for this prototype unless the user confirms otherwise at the checkpoint.',
    '- The authoritative feature scope is defined in <context> — memories provide supporting context only.',
    '',
  ];

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
