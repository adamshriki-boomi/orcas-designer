import type { Project } from '../types';

export function buildFallbackSection(project: Project): string {
  const externalAccessible = project.externalResourcesAccessible ?? true;

  const lines: string[] = [
    'Resource fallback priority:',
    '1. URL is accessible → use it directly',
    '2. URL requires auth → check ./assets/ for exported content',
    '3. ./assets/ is empty → use embedded context in this prompt',
    '4. No context available → use best judgment from company/product context',
  ];

  if (!externalAccessible) {
    lines.push('');
    lines.push('External URLs may require authentication. Prefer locally attached files and pasted text.');
  }

  return lines.join('\n');
}
