import type { Prompt, FormFieldData } from '../types';
import { parseGoogleDocUrl, buildGoogleDocsInstructions } from './url-utils';

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

export function buildContextSection(project: Prompt): string {
  const lines: string[] = ['## CONTEXT'];
  const company = renderField('Company Info', project.companyInfo);
  const product = renderField('Product Info', project.productInfo);
  // Feature info: detect Google Docs URLs for access strategy
  let feature: string;
  if (project.featureInfo.inputType === 'url' && project.featureInfo.urlValue) {
    const docInfo = parseGoogleDocUrl(project.featureInfo.urlValue);
    if (docInfo) {
      feature = buildGoogleDocsInstructions(project.featureInfo.urlValue, docInfo, 'Feature Info');
      if (project.featureInfo.additionalContext) {
        feature += `\n> Additional context: ${project.featureInfo.additionalContext}`;
      }
    } else {
      feature = renderField('Feature Info', project.featureInfo);
    }
  } else {
    feature = renderField('Feature Info', project.featureInfo);
  }

  if (company) lines.push(company);
  if (product) lines.push(product);
  if (feature) lines.push(feature);
  return lines.join('\n\n');
}
