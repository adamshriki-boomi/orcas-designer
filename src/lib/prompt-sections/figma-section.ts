import type { Project } from '../types';

export function buildFigmaSection(project: Project): string {
  const field = project.figmaFileLink;
  if (!field.urlValue && field.files.length === 0) return '';

  const lines: string[] = ['## FIGMA TARGET (DESTINATION)'];

  if (field.urlValue) {
    lines.push(`**Figma Destination File URL**: ${field.urlValue}`);
    lines.push('');
    lines.push('### Setup: Claude-to-Figma Plugin');
    lines.push('Before writing to Figma, ensure the **Claude-to-Figma** MCP plugin is installed and authenticated:');
    lines.push('1. Install the official **"Claude-to-Figma"** MCP plugin (Figma marketplace) if not already installed.');
    lines.push('2. Authenticate with Figma via the plugin\'s OAuth flow when prompted.');
    lines.push('3. Once authenticated, use the `generate_figma_design` tool to write designs to the destination file above.');
    lines.push('');
    lines.push('This is a **write-only destination**. Do NOT attempt to extract or read designs from this file.');
    lines.push('If authentication fails, inform the user and continue with HTML/CSS/JS output only.');
  }

  if (field.additionalContext) {
    lines.push(`> Additional context: ${field.additionalContext}`);
  }

  return lines.join('\n\n');
}
