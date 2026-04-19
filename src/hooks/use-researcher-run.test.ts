import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
  vi.restoreAllMocks();
});

describe('researcher-run Supabase operations', () => {
  it('can check for API key existence', async () => {
    // Insert user settings with API key
    await mockClient.from('user_settings').insert({
      user_id: 'user-1',
      claude_api_key: 'sk-ant-test-key',
    });

    const { data } = await mockClient
      .from('user_settings')
      .select('claude_api_key')
      .eq('user_id', 'user-1')
      .maybeSingle();

    expect(data).toBeDefined();
    expect(data!.claude_api_key).toBe('sk-ant-test-key');
  });

  it('returns null when no API key is set', async () => {
    const { data } = await mockClient
      .from('user_settings')
      .select('claude_api_key')
      .eq('user_id', 'user-1')
      .maybeSingle();

    expect(data).toBeNull();
  });

  it('edge function invoke can be called', async () => {
    const result = await mockClient.functions.invoke('researcher-start', {
      body: { projectId: 'test-id' },
    });

    expect(result.error).toBeNull();
    expect(mockClient.functions.invoke).toHaveBeenCalledWith('researcher-start', {
      body: { projectId: 'test-id' },
    });
  });

  it('edge function invoke tracks call arguments', async () => {
    mockClient.functions.invoke.mockClear();

    await mockClient.functions.invoke('researcher-start', {
      body: { projectId: 'proj-abc' },
    });

    expect(mockClient.functions.invoke).toHaveBeenCalledTimes(1);
    expect(mockClient.functions.invoke).toHaveBeenCalledWith('researcher-start', {
      body: { projectId: 'proj-abc' },
    });
  });

  it('handles edge function error response', async () => {
    // Override invoke to return an error for this test
    mockClient.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Internal Server Error' },
    });

    const result = await mockClient.functions.invoke('researcher-start', {
      body: { projectId: 'test-id' },
    });

    expect(result.error).toBeDefined();
    expect(result.error!.message).toBe('Internal Server Error');
  });
});
