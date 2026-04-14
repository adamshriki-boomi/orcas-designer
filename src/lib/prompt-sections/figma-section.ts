import type { Prompt } from '../types';

export function buildFigmaSection(project: Prompt): string {
  const field = project.figmaFileLink;
  if (!field.urlValue && field.files.length === 0) return '';

  const lines: string[] = ['## FIGMA TARGET (DESTINATION)'];

  if (field.urlValue) {
    lines.push(`**Figma Destination File URL**: ${field.urlValue}`);
    lines.push('');
    lines.push('### Prerequisite: Claude-to-Figma Plugin');
    lines.push('Check that `generate_figma_design` is available in your tools. If it is, use it to write designs to the destination file above.');
    lines.push('If not available, Figma output will be skipped — continue with HTML/CSS/JS output only.');
    lines.push('');
    lines.push('This destination URL is **write-only**. Do NOT extract or read designs from this URL. You MAY read from other Figma URLs listed in this brief (e.g., in `<current-implementation>`, `<design-system>`, or `<prototypes>`).');
    lines.push('If authentication fails, inform the user and continue with HTML/CSS/JS output only.');
  }

  if (field.additionalContext) {
    lines.push(`> Additional context: ${field.additionalContext}`);
  }

  return lines.join('\n\n');
}
