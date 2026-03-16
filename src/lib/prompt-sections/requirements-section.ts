import type { Project } from '../types';

export function buildRequirementsSection(project: Project): string {
  const accessibility = project.accessibilityLevel ?? 'none';
  const browsers = project.browserCompatibility ?? ['chrome'];

  const lines: string[] = ['## REQUIREMENTS'];

  if (accessibility === 'none') {
    lines.push('**Accessibility**: None — no specific requirements');
  } else {
    const wcagLabel = accessibility === 'wcag-aa' ? 'WCAG 2.1 AA' : 'WCAG 2.1 AAA';
    lines.push(`**Accessibility**: ${wcagLabel}. All elements need ARIA labels, keyboard nav, color contrast, semantic HTML.`);
  }

  if (browsers.length === 1) {
    lines.push(`**Browser Target**: ${browsers[0]} only`);
  } else {
    lines.push(`**Browser Compatibility**: ${browsers.join(', ')}. Use cross-browser compatible CSS and JS — avoid browser-specific features without fallbacks. Use standard web APIs supported by all listed browsers.`);
  }

  return lines.join('\n');
}
