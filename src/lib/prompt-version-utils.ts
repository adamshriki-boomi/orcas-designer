import type { PromptVersion } from './types';

/**
 * Returns true if a prompt already has an in-flight generation. Used to
 * disable the "Regenerate" button without hitting the server.
 */
export function hasRunningVersion(versions: PromptVersion[]): boolean {
  return versions.some((v) => v.status === 'running');
}

/**
 * Returns the most recent completed version, or null if none. Used as the
 * "current" version shown by default on the detail page.
 */
export function getLatestCompleted(versions: PromptVersion[]): PromptVersion | null {
  const completed = versions
    .filter((v) => v.status === 'completed')
    .sort((a, b) => b.versionNumber - a.versionNumber);
  return completed[0] ?? null;
}

/**
 * Total completed tokens for a prompt version. Used in the regenerate dialog
 * so the user can see how much the last run cost before committing again.
 */
export function totalTokens(version: PromptVersion): number {
  return (version.inputTokens ?? 0) + (version.outputTokens ?? 0);
}

/**
 * Compact human-readable token count, e.g. 14_200 → "14.2k".
 * Matches what users see in Anthropic's usage dashboards.
 */
export function formatTokens(count: number | null | undefined): string {
  if (count === null || count === undefined) return '—';
  if (count < 1000) return String(count);
  const k = count / 1000;
  // Keep one decimal up to 100k, then integer only — "14.2k" but "142k".
  return k >= 100 ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
}

/**
 * Seconds elapsed between created_at and completed_at. Null when the version
 * is still running.
 */
export function elapsedSeconds(version: PromptVersion): number | null {
  if (!version.completedAt) return null;
  const start = new Date(version.createdAt).getTime();
  const end = new Date(version.completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, Math.round((end - start) / 1000));
}

/**
 * Human label for a version tab. Prefers the user label if set, otherwise
 * falls back to the version number.
 */
export function versionLabel(version: PromptVersion): string {
  if (version.label && version.label.trim().length > 0) return version.label;
  return `v${version.versionNumber}`;
}

/**
 * Status → user-facing text. Kept here so the detail page and the list page
 * render identical wording.
 */
export function statusText(status: PromptVersion['status']): string {
  switch (status) {
    case 'running':
      return 'Generating...';
    case 'completed':
      return 'Complete';
    case 'failed':
      return 'Failed';
  }
}
