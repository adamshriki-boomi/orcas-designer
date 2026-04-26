import { renderHook, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

// Stable references — useUserSettings has `user` in a useCallback dep list,
// so a fresh object literal per call would churn the effect and starve the
// `waitFor` polling.
vi.mock('@/contexts/auth-context', () => {
  const auth = { user: { id: 'user-1' } };
  return { useAuth: () => auth };
});

import { useUserSettings } from './use-user-settings';

beforeEach(() => {
  clearAllTables();
});

describe('user_settings Supabase operations', () => {
  it('can save and retrieve an API key', async () => {
    await mockClient.from('user_settings').insert({
      user_id: 'user-1',
      claude_api_key: 'sk-ant-test-key-123',
    });

    const { data } = await mockClient
      .from('user_settings')
      .select('*')
      .eq('user_id', 'user-1')
      .maybeSingle();

    expect(data).toBeDefined();
    expect(data!.claude_api_key).toBe('sk-ant-test-key-123');
  });

  it('can update an existing API key', async () => {
    await mockClient.from('user_settings').insert({
      id: 'settings-1',
      user_id: 'user-1',
      claude_api_key: 'old-key',
    });

    await mockClient.from('user_settings')
      .update({ claude_api_key: 'new-key' })
      .eq('user_id', 'user-1');

    const { data } = await mockClient
      .from('user_settings')
      .select('*')
      .eq('user_id', 'user-1')
      .maybeSingle();

    expect(data!.claude_api_key).toBe('new-key');
  });

  it('can delete an API key', async () => {
    await mockClient.from('user_settings').insert({
      id: 'settings-1',
      user_id: 'user-1',
      claude_api_key: 'sk-ant-test-key',
    });

    await mockClient.from('user_settings').delete().eq('user_id', 'user-1');

    const { data } = await mockClient
      .from('user_settings')
      .select('*')
      .eq('user_id', 'user-1')
      .maybeSingle();

    expect(data).toBeNull();
  });

  it('returns null when no settings exist', async () => {
    const { data } = await mockClient
      .from('user_settings')
      .select('*')
      .eq('user_id', 'nonexistent')
      .maybeSingle();

    expect(data).toBeNull();
  });
});

describe('useUserSettings hook', () => {
  it('saveApiKey trims leading and trailing whitespace before storing', async () => {
    const { result } = renderHook(() => useUserSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Common copy-paste failure mode: a trailing newline. Anthropic's bearer-
    // token check rejects any non-exact match with a 401.
    await act(async () => {
      await result.current.saveApiKey('  sk-ant-test-key-123\n');
    });

    const { data } = await mockClient
      .from('user_settings')
      .select('*')
      .eq('user_id', 'user-1')
      .maybeSingle();

    expect(data!.claude_api_key).toBe('sk-ant-test-key-123');
    await waitFor(() => expect(result.current.maskedKey).not.toBe(''));
    expect(result.current.maskedKey.startsWith('sk-ant-tes')).toBe(true);
    // Masked key = first 10 + '...' + last 4 chars. 'sk-ant-test-key-123' has
    // 19 chars, so the last 4 are '-123' — if any whitespace slipped through,
    // the last 4 would differ.
    expect(result.current.maskedKey.endsWith('-123')).toBe(true);
  });

  it('saveFigmaToken trims and stores the Figma access token; hasFigmaToken reflects it', async () => {
    const { result } = renderHook(() => useUserSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasFigmaToken).toBe(false);

    await act(async () => {
      await result.current.saveFigmaToken('  figd_abc123  ');
    });

    const { data } = await mockClient
      .from('user_settings')
      .select('*')
      .eq('user_id', 'user-1')
      .maybeSingle();
    expect(data!.figma_access_token).toBe('figd_abc123');
    await waitFor(() => expect(result.current.hasFigmaToken).toBe(true));
  });

  it('deleteFigmaToken clears the stored Figma token', async () => {
    await mockClient.from('user_settings').insert({
      user_id: 'user-1',
      claude_api_key: 'sk-ant-test',
      figma_access_token: 'figd_abc123',
    });

    const { result } = renderHook(() => useUserSettings());
    await waitFor(() => expect(result.current.hasFigmaToken).toBe(true));

    await act(async () => {
      await result.current.deleteFigmaToken();
    });

    const { data } = await mockClient
      .from('user_settings')
      .select('*')
      .eq('user_id', 'user-1')
      .maybeSingle();
    expect(data!.figma_access_token).toBe('');
    await waitFor(() => expect(result.current.hasFigmaToken).toBe(false));
  });

  it('saveApiKey overwrites an existing key (keeping it trimmed)', async () => {
    await mockClient.from('user_settings').insert({
      user_id: 'user-1',
      claude_api_key: 'sk-ant-old',
    });

    const { result } = renderHook(() => useUserSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasApiKey).toBe(true);

    await act(async () => {
      await result.current.saveApiKey('  sk-ant-new-key  ');
    });

    const { data } = await mockClient
      .from('user_settings')
      .select('*')
      .eq('user_id', 'user-1')
      .maybeSingle();

    expect(data!.claude_api_key).toBe('sk-ant-new-key');
  });
});
