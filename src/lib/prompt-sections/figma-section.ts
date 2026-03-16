import type { Project } from '../types';

export function buildFigmaSection(project: Project): string {
  const field = project.figmaFileLink;
  if (!field.urlValue && field.files.length === 0) return '';

  const lines: string[] = ['## FIGMA TARGET (DESTINATION)'];

  if (field.urlValue) {
    lines.push(`**Figma Destination File URL**: ${field.urlValue}`);
    lines.push('This is the **destination** Figma file. If the Figma MCP `generate_figma_design` tool is available, use it to write designs here. If the tool is not available, skip Figma output entirely — HTML/CSS/JS is the primary deliverable.');
    lines.push('> **IMPORTANT**: Do NOT attempt to extract or read designs from this file. It is a target for writing, not a source for reading.');
  }

  if (field.additionalContext) {
    lines.push(`> Additional context: ${field.additionalContext}`);
  }

  return lines.join('\n\n');
}
