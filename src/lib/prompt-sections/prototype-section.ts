import type { Prompt } from '../types';

export function buildPrototypeSection(project: Prompt): string {
  const field = project.prototypeSketches;
  const hasContent = field.urlValue || field.files.length > 0 || field.textValue;

  if (!hasContent) return '';

  const lines: string[] = ['## PROTOTYPES & SKETCHES'];

  if (field.inputType === 'url' && field.urlValue) {
    lines.push(`**Prototype URL**: ${field.urlValue}`);
    if (field.urlValue.includes('figma.com')) {
      lines.push('Use `/implement-design` to extract design specs from this Figma prototype.');
    }
  } else if (field.inputType === 'file' && field.files.length > 0) {
    lines.push('**Sketch images**:');
    for (const f of field.files) {
      lines.push(`- \`./assets/${f.name}\``);
    }
  } else if (field.inputType === 'text' && field.textValue) {
    lines.push(`**Description**:\n${field.textValue}`);
  }

  if (field.additionalContext) {
    lines.push(`> Additional context: ${field.additionalContext}`);
  }

  return lines.join('\n\n');
}
