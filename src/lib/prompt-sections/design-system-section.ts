import type { Project } from '../types';
import { MANDATORY_SKILLS, DESIGN_SYSTEM_MEMORY_IDS } from '../constants';
import { normalizeNpmPackage } from './npm-utils';

function inv(name: string): string {
  return MANDATORY_SKILLS.find(s => s.name === name)?.invocation ?? `/${name}`;
}

export function buildDesignSystemSection(project: Project): string {
  const sb = project.designSystemStorybook;
  const npm = project.designSystemNpm;
  const figma = project.designSystemFigma;

  const hasStorybookMemory = (project.selectedSharedMemoryIds ?? []).some(
    (id) => DESIGN_SYSTEM_MEMORY_IDS.includes(id),
  );

  const hasContent =
    sb.urlValue || sb.files.length > 0 || sb.textValue ||
    npm.urlValue || npm.files.length > 0 || npm.textValue ||
    figma.urlValue || figma.files.length > 0 || figma.textValue ||
    hasStorybookMemory;

  if (!hasContent) return '';

  const lines: string[] = ['## DESIGN SYSTEM'];

  if (sb.urlValue) {
    lines.push(`**Storybook URL**: ${sb.urlValue}`);
    lines.push(`**IMPORTANT — Storybook Discovery**: Before writing any code, use Playwright MCP (preferred) or WebFetch to systematically scrape this Storybook site:
1. Visit the Storybook URL and navigate the sidebar to discover ALL available components
2. For each component, visit its docs/canvas page and extract: component name, available props (with types and defaults), variants/states, and usage examples
3. Save a summary of the full component inventory to \`./assets/design-system-inventory.md\`
4. Use this inventory as the single source of truth for all UI implementation — prefer existing Storybook components over custom CSS

If the sidebar content is not scrapable (common with SPAs), try accessing the Storybook's \`stories.json\` or \`index.json\` endpoint (e.g., \`${sb.urlValue}/stories.json\`) for a machine-readable component index. If Storybook is entirely inaccessible, build using standard HTML semantic elements styled with the design tokens from <design-direction> (colors, font, border radius, motion style). Use clean, consistent component patterns (buttons, inputs, cards, tables, modals, drawers) and apply the design tokens as CSS custom properties.`);
  }
  if (!sb.urlValue && hasStorybookMemory) {
    lines.push('**Storybook**: A component inventory for the design system is provided in the `<memories>` section. Use it as the primary reference for available components, props, tokens, and patterns.');
    lines.push('**Note**: The memory uses React prop notation (PascalCase components, camelCase props). For the HTML/CSS/JS prototype, convert to web component equivalents: PascalCase → kebab-case tag names (e.g., `ExButton` → `<ex-button>`), camelCase props → kebab-case attributes (e.g., `tooltipText` → `tooltip-text`), boolean props → attributes present/absent.');
  }
  if (sb.additionalContext) lines.push(`> Storybook context: ${sb.additionalContext}`);

  if (npm.textValue) {
    const normalizedNpm = normalizeNpmPackage(npm.textValue);
    lines.push(`**Package**: \`${normalizedNpm}\``);
    lines.push(`**Install**: \`npm i ${normalizedNpm}\``);
  }
  if (npm.urlValue) {
    lines.push(`**NPM Package URL**: ${npm.urlValue}`);
  }
  if (npm.textValue || npm.urlValue) {
    lines.push('Install and use this design system package for consistent component usage.');
    const pkgRef = normalizeNpmPackage(npm.textValue || npm.urlValue || '');
    lines.push(`If no bundler is configured, reference the design system via CDN (e.g., \`https://unpkg.com/${pkgRef}\` or \`https://cdn.jsdelivr.net/npm/${pkgRef}\`) or use a relative \`<script>\` tag pointing to the UMD bundle under \`node_modules/${pkgRef}/dist/\` from your HTML files.`);
  }
  if (npm.additionalContext) lines.push(`> NPM context: ${npm.additionalContext}`);

  if (figma.urlValue) {
    lines.push(`**Design System Figma URL**: ${figma.urlValue}`);
    lines.push('Reference this Figma file for design tokens, component styles, and visual specifications.');
  }
  if (figma.additionalContext) lines.push(`> DS Figma context: ${figma.additionalContext}`);

  return lines.join('\n\n');
}
