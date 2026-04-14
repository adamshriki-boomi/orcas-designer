import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
});

describe('prompts Supabase operations', () => {
  it('can insert a prompt', async () => {
    await mockClient.from('prompts').insert({
      id: 'proj-1',
      user_id: 'user-1',
      name: 'New Project',
      data: {},
      output_type: 'static-only',
      interaction_level: 'static',
    });

    const { data } = await mockClient.from('prompts').select('*');
    expect(data).toHaveLength(1);
    expect(data![0].name).toBe('New Project');
  });

  it('can retrieve prompts ordered by updated_at descending', async () => {
    await mockClient.from('prompts').insert({
      id: 'p1', user_id: 'u1', name: 'First',
      updated_at: '2025-01-01T00:00:00.000Z',
    });
    await mockClient.from('prompts').insert({
      id: 'p2', user_id: 'u1', name: 'Second',
      updated_at: '2025-06-01T00:00:00.000Z',
    });
    await mockClient.from('prompts').insert({
      id: 'p3', user_id: 'u1', name: 'Third',
      updated_at: '2025-03-01T00:00:00.000Z',
    });

    const { data } = await mockClient
      .from('prompts')
      .select('*')
      .order('updated_at', { ascending: false });

    expect(data).toHaveLength(3);
    expect(data![0].name).toBe('Second');
    expect(data![1].name).toBe('Third');
    expect(data![2].name).toBe('First');
  });

  it('can delete a prompt', async () => {
    await mockClient.from('prompts').insert({
      id: 'del-1', user_id: 'u1', name: 'To Delete',
    });

    const { data: before } = await mockClient.from('prompts').select('*');
    expect(before).toHaveLength(1);

    await mockClient.from('prompts').delete().eq('id', 'del-1');

    const { data: after } = await mockClient.from('prompts').select('*');
    expect(after).toHaveLength(0);
  });

  it('can use nanoid-style string ids', async () => {
    const nanoidLike = 'V1StGXR8_Z5jdHi6B-myT';

    await mockClient.from('prompts').insert({
      id: nanoidLike,
      user_id: 'u1',
      name: 'Nanoid Project',
    });

    const { data, error } = await mockClient
      .from('prompts')
      .select('*')
      .eq('id', nanoidLike)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBe(nanoidLike);
    expect(data!.name).toBe('Nanoid Project');
  });
});
