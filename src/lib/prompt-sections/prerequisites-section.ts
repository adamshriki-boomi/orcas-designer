import type { Prompt } from '../types';
import { DESIGN_SYSTEM_MEMORY_IDS } from '../constants';
import { isFigmaUrl } from './url-utils';

export function buildPrerequisitesSection(project: Prompt): string {
  const tools: string[] = [];

  // Figma MCP — needed if any Figma URLs exist (target, current-impl figma links, prototype figma, design system figma)
  const hasFigmaTarget = !!(project.figmaFileLink.urlValue || project.figmaFileLink.files.length > 0);
  const hasSourceFigma = project.currentImplementation.figmaLinks.length > 0 ||
    !!(project.designSystemFigma.urlValue || project.designSystemFigma.files.length > 0);
  const protoUrl = project.prototypeSketches.urlValue;
  const hasPrototypeFigma = !!protoUrl && isFigmaUrl(protoUrl);
  const hasImplFigma = !!project.currentImplementation.urlValue && isFigmaUrl(project.currentImplementation.urlValue);

  if (hasFigmaTarget || hasSourceFigma || hasPrototypeFigma || hasImplFigma) {
    const purposes: string[] = [];
    if (hasFigmaTarget) purposes.push('write designs to Figma target (`generate_figma_design`)');
    if (hasSourceFigma || hasPrototypeFigma || hasImplFigma) purposes.push('read design specs from Figma source files (`get_design_context`, `get_screenshot`)');
    tools.push(`- **Figma MCP plugin** — ${purposes.join('; ')}`);
  }

  // Playwright MCP — needed if any non-Figma URLs need to be visited
  const hasNonFigmaUrl = !!project.currentImplementation.urlValue && !isFigmaUrl(project.currentImplementation.urlValue);
  const hasStorybookUrl = !!project.designSystemStorybook.urlValue;
  const hasNonFigmaPrototype = !!protoUrl && !isFigmaUrl(protoUrl);

  if (hasNonFigmaUrl || hasStorybookUrl || hasNonFigmaPrototype) {
    const targets: string[] = [];
    if (hasNonFigmaUrl) targets.push('current implementation URL');
    if (hasStorybookUrl) targets.push('Storybook');
    if (hasNonFigmaPrototype) targets.push('prototype URL');
    tools.push(`- **Playwright MCP** (or WebFetch fallback) — visit and screenshot: ${targets.join(', ')}`);
  }

  // Google Docs MCP — needed if any URLs are Google Docs
  const urlsToCheck = [
    project.featureInfo.urlValue,
    project.uxResearch.urlValue,
    project.companyInfo.urlValue,
    project.productInfo.urlValue,
  ].filter(Boolean);

  const hasGoogleDocs = urlsToCheck.some(url => {
    try { return new URL(url).hostname === 'docs.google.com'; } catch { return false; }
  });

  if (hasGoogleDocs) {
    tools.push('- **Google Docs MCP** — read Google Docs/Sheets/Slides content directly (falls back to public export URL)');
  }

  if (tools.length === 0) return '';

  const lines: string[] = [
    '## PREREQUISITES',
    '',
    'The following MCP tools enhance this workflow. Verify they are available before starting:',
    '',
    ...tools,
    '',
    'If a tool is unavailable, the workflow includes fallback instructions for each step.',
  ];

  return lines.join('\n');
}
