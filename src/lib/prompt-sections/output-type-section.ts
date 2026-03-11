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
    lines.push('HTML/CSS/JS files are the **primary, always-required output**. After all HTML files are complete, write designs to the Figma target file using the Figma MCP `generate_figma_design` tool.');
  } else {
    lines.push('Do NOT create Figma files.');
  }

  lines.push('');
  lines.push('- High-fidelity static HTML pages for all screens and states');
  lines.push('- Each screen/state as a separate HTML file');

  if (!isLite) {
    lines.push('- Responsive layouts (desktop, tablet, mobile) where applicable');
  }

  lines.push('- All UI states (default, hover, active, disabled, error, loading, empty)');
  lines.push('- Consistent use of the design system tokens and components');

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

  return lines.join('\n');
}
