import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

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

  it('returns null when no settings exist', async () => {
    const { data } = await mockClient
      .from('user_settings')
      .select('*')
      .eq('user_id', 'nonexistent')
      .maybeSingle();

    expect(data).toBeNull();
  });
});
