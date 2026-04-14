import type { Prompt, SharedMemory } from '../types';
import { DESIGN_SYSTEM_MEMORY_IDS } from '../constants';

export function buildMemorySection(project: Prompt, sharedMemories: SharedMemory[]): string {
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
  ];

  if (hasDesignSystemMemory) {
    lines.push(
      '- If memories define a design system or component library (e.g., Storybook inventory, web components), these components are MANDATORY — use them directly as web components in your HTML. They are NOT framework-specific libraries to reimplement with vanilla JS.',
      '- For non-design-system tech stack mentions in memories (e.g., Redux, React Router), treat as design intent — implement equivalent behavior for the prototype.',
    );
  } else {
    lines.push(
      '- If memories reference production tech stack choices (e.g., React libraries, specific frameworks), treat them as design intent for the final product — for this prototype, implement equivalent behavior using the tech approach specified in <output-requirements>.',
    );
  }

  lines.push(
    '- If memories mention features or requirements not listed in the <context> feature requirements, treat them as out of scope for this prototype unless the user confirms otherwise at the checkpoint.',
  );

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
