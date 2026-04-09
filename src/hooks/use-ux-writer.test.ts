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

  it('user_id filter isolates analyses per user', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      id: 'a-user1', user_id: 'user-1', description: 'User 1 analysis',
    });
    await mockClient.from('ux_writer_analyses').insert({
      id: 'a-user2', user_id: 'user-2', description: 'User 2 analysis',
    });

    const { data: user1Data } = await mockClient
      .from('ux_writer_analyses')
      .select('*')
      .eq('user_id', 'user-1');

    expect(user1Data).toHaveLength(1);
    expect(user1Data![0].description).toBe('User 1 analysis');
  });

  it('delete with user_id filter only deletes own entries', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      id: 'owned', user_id: 'user-1', description: 'My analysis',
    });
    await mockClient.from('ux_writer_analyses').insert({
      id: 'other', user_id: 'user-2', description: 'Their analysis',
    });

    // Delete with user_id filter — should only delete user-1's entry
    await mockClient.from('ux_writer_analyses').delete()
      .eq('id', 'owned')
      .eq('user_id', 'user-1');

    const { data } = await mockClient.from('ux_writer_analyses').select('*');
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe('other');
  });

  it('mock supports functions.invoke()', async () => {
    const { data, error } = await mockClient.functions.invoke('ux-writer-analyze', {
      body: { description: 'test' },
    });
    expect(error).toBeNull();
  });

  it('mock supports storage operations', async () => {
    const bucket = mockClient.storage.from('ux-writer-screenshots');
    const { error: uploadError } = await bucket.upload('test/image.png', new Blob());
    expect(uploadError).toBeNull();

    const { data } = await bucket.createSignedUrl('test/image.png', 3600);
    expect(data?.signedUrl).toBeDefined();
  });
});
