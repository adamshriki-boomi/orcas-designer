import type { Project } from '../types';

export function buildFallbackSection(project: Project): string {
  const externalAccessible = project.externalResourcesAccessible ?? true;

  const lines: string[] = [
    'Resource fallback priority (apply at every step that references an external resource):',
    '1. URL is accessible → use it directly',
    '2. URL requires auth or is inaccessible → check ./assets/ for user-provided exported content (screenshots, design tokens, docs placed there before execution)',
    '3. ./assets/ is empty → use embedded context in this prompt',
    '4. No context available → use best judgment from company/product context',
    '',
    'IMPORTANT: Never block on an inaccessible URL or a failed install. Skip the step and continue with the best available context.',
  ];

  if (!externalAccessible) {
    lines.push('');
    lines.push('External URLs may require authentication. Prefer locally attached files and pasted text.');
  }

  return lines.join('\n');
}
