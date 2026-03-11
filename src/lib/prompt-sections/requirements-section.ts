import type { Project } from '../types';

export function buildRequirementsSection(project: Project): string {
  const accessibility = project.accessibilityLevel ?? 'none';
  const browsers = project.browserCompatibility ?? ['chrome'];

  const hasAccessibility = accessibility !== 'none';
  const hasMultipleBrowsers = browsers.length > 1;

  if (!hasAccessibility && !hasMultipleBrowsers) return '';

  const lines: string[] = ['## REQUIREMENTS'];

  if (hasAccessibility) {
    const wcagLabel = accessibility === 'wcag-aa' ? 'WCAG 2.1 AA' : 'WCAG 2.1 AAA';
    lines.push(`**Accessibility**: ${wcagLabel}. All elements need ARIA labels, keyboard nav, color contrast, semantic HTML.`);
  }

  if (hasMultipleBrowsers) {
    lines.push(`**Browser Compatibility**: ${browsers.join(', ')}. Test in all listed browsers.`);
  }

  return lines.join('\n');
}
