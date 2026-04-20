import {
  hasRunningVersion,
  getLatestCompleted,
  totalTokens,
  formatTokens,
  elapsedSeconds,
  versionLabel,
  statusText,
} from './prompt-version-utils';
import type { PromptVersion } from './types';

function makeVersion(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: 'v-1',
    promptId: 'p-1',
    userId: 'u-1',
    versionNumber: 1,
    status: 'completed',
    content: 'body',
    wizardSnapshot: {},
    contextSnapshot: null,
    model: 'claude-opus-4-7',
    inputTokens: 1000,
    outputTokens: 2000,
    thinkingEnabled: true,
    label: null,
    errorMessage: null,
    createdAt: '2026-04-20T10:00:00.000Z',
    completedAt: '2026-04-20T10:01:00.000Z',
    ...overrides,
  };
}

describe('hasRunningVersion', () => {
  it('is false for an empty list', () => {
    expect(hasRunningVersion([])).toBe(false);
  });

  it('is false when all versions completed', () => {
    expect(hasRunningVersion([makeVersion(), makeVersion({ id: 'v-2', versionNumber: 2 })])).toBe(false);
  });

  it('is true when any version is running', () => {
    expect(
      hasRunningVersion([
        makeVersion(),
        makeVersion({ id: 'v-2', versionNumber: 2, status: 'running', completedAt: null, content: null }),
      ]),
    ).toBe(true);
  });
});

describe('getLatestCompleted', () => {
  it('returns null when no completed versions exist', () => {
    expect(getLatestCompleted([makeVersion({ status: 'running', completedAt: null, content: null })])).toBeNull();
  });

  it('returns the highest version_number among completed', () => {
    const v1 = makeVersion({ id: 'v-1', versionNumber: 1 });
    const v2 = makeVersion({ id: 'v-2', versionNumber: 2 });
    const v3Failed = makeVersion({ id: 'v-3', versionNumber: 3, status: 'failed', content: null });

    expect(getLatestCompleted([v1, v2, v3Failed])?.id).toBe('v-2');
  });
});

describe('totalTokens', () => {
  it('sums input and output tokens', () => {
    expect(totalTokens(makeVersion({ inputTokens: 100, outputTokens: 250 }))).toBe(350);
  });

  it('treats nulls as zero', () => {
    expect(totalTokens(makeVersion({ inputTokens: null, outputTokens: null }))).toBe(0);
    expect(totalTokens(makeVersion({ inputTokens: 500, outputTokens: null }))).toBe(500);
  });
});

describe('formatTokens', () => {
  it('shows raw integer under 1000', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(999)).toBe('999');
  });

  it('shows one decimal for 1k-99k', () => {
    expect(formatTokens(1000)).toBe('1.0k');
    expect(formatTokens(14_200)).toBe('14.2k');
    expect(formatTokens(99_940)).toBe('99.9k');
  });

  it('shows integer k from 100k up', () => {
    expect(formatTokens(100_000)).toBe('100k');
    expect(formatTokens(142_400)).toBe('142k');
  });

  it('renders em-dash for null/undefined', () => {
    expect(formatTokens(null)).toBe('—');
    expect(formatTokens(undefined)).toBe('—');
  });
});

describe('elapsedSeconds', () => {
  it('computes wall-clock seconds between createdAt and completedAt', () => {
    expect(elapsedSeconds(makeVersion())).toBe(60);
  });

  it('returns null for a running version', () => {
    expect(
      elapsedSeconds(makeVersion({ status: 'running', completedAt: null, content: null })),
    ).toBeNull();
  });

  it('floors negative values at 0 rather than surfacing clock skew', () => {
    const v = makeVersion({
      createdAt: '2026-04-20T10:01:00.000Z',
      completedAt: '2026-04-20T10:00:00.000Z',
    });
    expect(elapsedSeconds(v)).toBe(0);
  });
});

describe('versionLabel', () => {
  it('returns "v<N>" when no user label', () => {
    expect(versionLabel(makeVersion({ versionNumber: 3 }))).toBe('v3');
  });

  it('prefers user label when set', () => {
    expect(versionLabel(makeVersion({ label: 'Tightened phase 2' }))).toBe('Tightened phase 2');
  });

  it('ignores whitespace-only labels', () => {
    expect(versionLabel(makeVersion({ versionNumber: 5, label: '   ' }))).toBe('v5');
  });
});

describe('statusText', () => {
  it('covers every status', () => {
    expect(statusText('running')).toBe('Generating...');
    expect(statusText('completed')).toBe('Complete');
    expect(statusText('failed')).toBe('Failed');
  });
});
