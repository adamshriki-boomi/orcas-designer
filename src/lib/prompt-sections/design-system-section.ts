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
    lines.push('Reference this Storybook for available components, their props, and usage patterns.');
  }
  if (sb.additionalContext) lines.push(`> Storybook context: ${sb.additionalContext}`);

  if (npm.urlValue || npm.textValue) {
    const val = npm.urlValue || npm.textValue;
    lines.push(`**NPM Package**: ${val}`);
    lines.push('Install and use this design system package for consistent component usage.');
  }
  if (npm.additionalContext) lines.push(`> NPM context: ${npm.additionalContext}`);

  if (figma.urlValue) {
    lines.push(`**Design System Figma URL**: ${figma.urlValue}`);
    lines.push(`Use \`${inv('code-connect-components')}\` to map Figma design tokens and components to code.`);
    lines.push(`Use \`${inv('create-design-system-rules')}\` to generate design system rules from this Figma file.`);
  }
  if (figma.additionalContext) lines.push(`> DS Figma context: ${figma.additionalContext}`);

  return lines.join('\n\n');
}
