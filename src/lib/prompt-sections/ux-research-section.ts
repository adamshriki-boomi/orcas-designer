import type { Project } from '../types';
import { parseGoogleDocUrl, buildGoogleDocsInstructions } from './url-utils';

export function buildUxResearchSection(project: Project): string {
  const field = project.uxResearch;
  const hasContent = field.urlValue || field.files.length > 0 || field.textValue;

  if (!hasContent) return '';

  const lines: string[] = ['## UX RESEARCH'];

  if (field.inputType === 'url' && field.urlValue) {
    const docInfo = parseGoogleDocUrl(field.urlValue);
    if (docInfo) {
      lines.push(buildGoogleDocsInstructions(field.urlValue, docInfo));
    } else {
      lines.push(`**UX Research URL**: ${field.urlValue}`);
      lines.push('Fetch this URL via WebFetch to access the research content.');
    }
  } else if (field.inputType === 'file' && field.files.length > 0) {
    lines.push('**Research files**:');
    for (const f of field.files) {
      lines.push(`- \`./assets/${f.name}\``);
    }
  } else if (field.inputType === 'text' && field.textValue) {
    lines.push(`**Research findings**:\n${field.textValue}`);
  }

  if (field.additionalContext) {
    lines.push(`> Additional context: ${field.additionalContext}`);
  }

  lines.push('');
  lines.push('Use these research insights to guide layout decisions, interaction flows, copy, and visual hierarchy.');

  return lines.join('\n\n');
}
