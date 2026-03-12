import type { Project } from '../types';
import { MANDATORY_SKILLS } from '../constants';

function inv(name: string): string {
  return MANDATORY_SKILLS.find(s => s.name === name)?.invocation ?? `/${name}`;
}

export function buildDesignSystemSection(project: Project): string {
  const sb = project.designSystemStorybook;
  const npm = project.designSystemNpm;
  const figma = project.designSystemFigma;

  const hasContent =
    sb.urlValue || sb.files.length > 0 || sb.textValue ||
    npm.urlValue || npm.files.length > 0 || npm.textValue ||
    figma.urlValue || figma.files.length > 0 || figma.textValue;

  if (!hasContent) return '';

  const lines: string[] = ['## DESIGN SYSTEM'];

  if (sb.urlValue) {
    lines.push(`**Storybook URL**: ${sb.urlValue}`);
    lines.push(`**IMPORTANT — Storybook Discovery**: Before writing any code, use Playwright MCP (or WebFetch) to systematically scrape this Storybook site:
1. Visit the Storybook URL and navigate the sidebar to discover ALL available components
2. For each component, visit its docs/canvas page and extract: component name, available props (with types and defaults), variants/states, and usage examples
3. Save a summary of the full component inventory to \`./assets/design-system-inventory.md\`
4. Use this inventory as the single source of truth for all UI implementation — prefer existing Storybook components over custom CSS`);
  }
  if (sb.additionalContext) lines.push(`> Storybook context: ${sb.additionalContext}`);

  if (npm.textValue) {
    lines.push(`**NPM Install Command**: \`${npm.textValue}\``);
  }
  if (npm.urlValue) {
    lines.push(`**NPM Package URL**: ${npm.urlValue}`);
  }
  if (npm.textValue || npm.urlValue) {
    lines.push('Install and use this design system package for consistent component usage.');
  }
  if (npm.additionalContext) lines.push(`> NPM context: ${npm.additionalContext}`);

  if (figma.urlValue) {
    lines.push(`**Design System Figma URL**: ${figma.urlValue}`);
    lines.push('Reference this Figma file for design tokens, component styles, and visual specifications.');
  }
  if (figma.additionalContext) lines.push(`> DS Figma context: ${figma.additionalContext}`);

  return lines.join('\n\n');
}
