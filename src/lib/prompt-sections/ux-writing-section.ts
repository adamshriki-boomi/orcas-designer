import type { Project, SharedMemory } from '../types';
import { UX_WRITING_MEMORY_IDS } from '../constants';
import { parseGoogleDocUrl, buildGoogleDocsInstructions } from './url-utils';

export function buildUxWritingSection(project: Project, sharedMemories: SharedMemory[] = []): string {
  const field = project.uxWriting;
  const hasContent = field.urlValue || field.files.length > 0 || field.textValue;

  const selectedMemories = sharedMemories.filter(
    (m) => UX_WRITING_MEMORY_IDS.includes(m.id) && project.selectedSharedMemoryIds.includes(m.id)
  );

  if (!hasContent && selectedMemories.length === 0) return '';

  const lines: string[] = ['## UX WRITING GUIDELINES'];

  for (const memory of selectedMemories) {
    lines.push(`### ${memory.name}`);
    lines.push(memory.content);
    lines.push('');
  }

  if (field.inputType === 'url' && field.urlValue) {
    const docInfo = parseGoogleDocUrl(field.urlValue);
    if (docInfo) {
      lines.push(buildGoogleDocsInstructions(field.urlValue, docInfo));
    } else {
      lines.push(`**UX Writing URL**: ${field.urlValue}`);
      lines.push('Fetch this URL via WebFetch to access the writing guidelines.');
    }
  } else if (field.inputType === 'file' && field.files.length > 0) {
    lines.push('**Writing guideline files**:');
    for (const f of field.files) {
      lines.push(`- \`./assets/${f.name}\``);
    }
  } else if (field.inputType === 'text' && field.textValue) {
    lines.push(`**Writing guidelines**:\n${field.textValue}`);
  }

  if (field.additionalContext) {
    lines.push(`> Additional context: ${field.additionalContext}`);
  }

  lines.push('');
  lines.push(`Apply these UX writing guidelines when generating ALL user-facing copy, including:
- Button labels, CTAs, and action text
- Error messages, validation messages, and system notifications
- Tooltips, help text, and instructional copy
- Empty states and onboarding messages
- Page titles, section headers, and navigation labels`);

  return lines.join('\n\n');
}
