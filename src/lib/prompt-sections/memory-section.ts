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
    'The following context files have been provided as project memories:',
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
