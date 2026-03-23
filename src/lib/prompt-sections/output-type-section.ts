import type { Project } from '../types';

export function buildOutputTypeSection(project: Project): string {
  const hasFigma = !!(project.figmaFileLink.urlValue || project.figmaFileLink.files.length > 0);
  const interactionLevel = project.interactionLevel ?? 'static';
  const outputDir = project.outputDirectory || './output/';
  const isLite = project.promptMode === 'lite';

  const lines: string[] = ['## OUTPUT REQUIREMENTS'];

  if (interactionLevel === 'static') {
    lines.push('**Mode**: Static Mockups Only');
    lines.push('Create static design mockups as **HTML + CSS files**. No JavaScript interactions.');
  } else if (interactionLevel === 'click-through') {
    lines.push('**Mode**: Click-through Flows');
    lines.push('Create static design mockups as **HTML + CSS + JS files** with basic page-to-page navigation.');
  } else {
    lines.push('**Mode**: Full Interactive Prototype');
    lines.push('Create a fully interactive prototype as **HTML + CSS + JS files** with animations, transitions, and micro-interactions.');
  }

  if (hasFigma) {
    lines.push('HTML/CSS/JS files are the **primary, always-required output**. After all HTML files are complete, use the **Claude-to-Figma** plugin (`generate_figma_design` tool) to write designs to the Figma target file. If Figma authentication fails, skip Figma output and inform the user.');
  } else {
    lines.push('Do NOT create Figma files.');
  }

  lines.push('');
  lines.push('- High-fidelity static HTML pages for all screens and states');
  lines.push('- Each screen/state as a separate HTML file');

  if (!isLite) {
    lines.push('- Responsive layouts: desktop is primary, tablet required for all screens, mobile phone layouts are optional/stretch');
  }

  lines.push('- All UI states (default, hover, active, disabled, error, loading, empty)');
  lines.push('- Consistent use of the design system tokens and components');
  lines.push('');
  lines.push('**Tech approach**: This is a standalone HTML/CSS/JS prototype — not a React/Vue/Angular application. Use vanilla JavaScript or lightweight standalone libraries. If project memories mention framework-specific libraries (e.g., React components), implement equivalent behavior with vanilla JS for the prototype. For complex interactions like drag-and-drop and virtualized lists, use lightweight standalone libraries (e.g., SortableJS) or simulate the interaction with mock data and CSS transitions. Full data virtualization is not required for the prototype.');
  lines.push('');
  lines.push('**Mock data**: Create a shared `./output/assets/mock-data.js` with realistic sample data used across all views. Include variety in status, priority, assignee, project, and dates (some overdue). Use realistic names and content appropriate for demos. Derive mock data entities and fields from the feature description in `<context>` — the mock data should reflect the actual domain being prototyped.');

  if (!isLite) {
    lines.push('');
    lines.push('**Responsive breakpoints**: Desktop: 1280px+, Tablet: 768-1279px, Mobile (stretch goal): <768px.');
  }

  if (interactionLevel === 'click-through') {
    lines.push('- Basic navigation JavaScript for page-to-page flows');
    lines.push('- Clickable prototype openable in a browser');
  } else if (interactionLevel === 'full-prototype') {
    lines.push('- Interactive prototype flows via JavaScript');
    lines.push('- CSS transitions and animations between states');
    lines.push('- Clickable prototype openable in a browser');
  }

  lines.push('');
  lines.push(`**Output directory**: \`${outputDir}\``);
  lines.push('**File naming**: `[screen-name].html`');
  lines.push(`**Shared assets**: \`${outputDir}assets/\``);
  lines.push('');
  lines.push('`./assets/` = research and working files (screenshots, inventories, analysis docs). `./output/assets/` = delivered prototype assets (shared images, CSS, JS referenced by HTML output files).');

  return lines.join('\n');
}
