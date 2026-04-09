import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
});

describe('ux_writer_analyses Supabase operations', () => {
  it('can save an analysis', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      user_id: 'user-1',
      description: 'Login dialog',
      focus_notes: 'error messages',
      screenshot_url: null,
      results: { suggestions: [], summary: 'No issues found' },
    });

    const { data } = await mockClient
      .from('ux_writer_analyses')
      .select('*')
      .eq('user_id', 'user-1');

    expect(data).toHaveLength(1);
    expect(data![0].description).toBe('Login dialog');
    expect(data![0].results).toEqual({ suggestions: [], summary: 'No issues found' });
  });

  it('retrieves analyses ordered by created_at descending', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      id: 'a1', user_id: 'u1', description: 'First',
      created_at: '2026-01-01T00:00:00Z',
    });
    await mockClient.from('ux_writer_analyses').insert({
      id: 'a2', user_id: 'u1', description: 'Second',
      created_at: '2026-06-01T00:00:00Z',
    });

    const { data } = await mockClient
      .from('ux_writer_analyses')
      .select('*')
      .order('created_at', { ascending: false });

    expect(data![0].description).toBe('Second');
    expect(data![1].description).toBe('First');
  });

  it('can delete an analysis', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      id: 'del-1', user_id: 'u1', description: 'To Delete',
    });

    await mockClient.from('ux_writer_analyses').delete().eq('id', 'del-1');

    const { data } = await mockClient.from('ux_writer_analyses').select('*');
    expect(data).toHaveLength(0);
  });
});
