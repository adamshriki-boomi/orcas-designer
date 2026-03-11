import type { Project, FormFieldData } from '../types';

function renderField(label: string, field: FormFieldData): string {
  const parts: string[] = [];
  if (field.inputType === 'url' && field.urlValue) {
    parts.push(`**${label}**: ${field.urlValue}`);
  } else if (field.inputType === 'file' && field.files.length > 0) {
    parts.push(`**${label}** (attached files):`);
    for (const f of field.files) {
      parts.push(`- \`./assets/${f.name}\` (${f.mimeType})`);
    }
  } else if (field.inputType === 'text' && field.textValue) {
    parts.push(`**${label}**:\n${field.textValue}`);
  }
  if (field.additionalContext) {
    parts.push(`> Additional context: ${field.additionalContext}`);
  }
  return parts.join('\n');
}

export function buildContextSection(project: Project): string {
  const lines: string[] = ['## CONTEXT'];
  const company = renderField('Company Info', project.companyInfo);
  const product = renderField('Product Info', project.productInfo);
  const feature = renderField('Feature Info', project.featureInfo);
  if (company) lines.push(company);
  if (product) lines.push(product);
  if (feature) lines.push(feature);
  return lines.join('\n\n');
}
