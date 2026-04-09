import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
});

describe('Supabase client operations', () => {
  it('can insert and retrieve a project', async () => {
    await mockClient.from('projects').insert({
      id: 'proj-retrieve',
      user_id: 'user-1',
      name: 'Retrieve Test',
      output_type: 'static-only',
      selected_shared_skill_ids: [],
    });

    const { data } = await mockClient
      .from('projects')
      .select('*')
      .eq('id', 'proj-retrieve')
      .single();

    expect(data).toBeDefined();
    expect(data!.name).toBe('Retrieve Test');
    expect(data!.output_type).toBe('static-only');
    expect(data!.selected_shared_skill_ids).toEqual([]);
  });

  it('can insert and retrieve a shared memory', async () => {
    await mockClient.from('shared_memories').insert({
      id: 'mem-retrieve',
      name: 'Retrieved Memory',
      content: 'Memory content here',
      is_built_in: false,
    });

    const { data } = await mockClient
      .from('shared_memories')
      .select('*')
      .eq('id', 'mem-retrieve')
      .single();

    expect(data).toBeDefined();
    expect(data!.name).toBe('Retrieved Memory');
    expect(data!.content).toBe('Memory content here');
    expect(data!.is_built_in).toBe(false);
  });

  it('can insert and retrieve a shared skill', async () => {
    await mockClient.from('shared_skills').insert({
      id: 'skill-db-1',
      name: 'Test Skill',
      description: 'A skill for testing',
      type: 'url',
      url_value: 'https://example.com',
      file_content: null,
    });

    const { data } = await mockClient
      .from('shared_skills')
      .select('*')
      .eq('id', 'skill-db-1')
      .single();

    expect(data).toBeDefined();
    expect(data!.name).toBe('Test Skill');
    expect(data!.type).toBe('url');
  });

  it('non-UUID string IDs work correctly (regression for 400 error)', async () => {
    // These are the actual built-in memory IDs used in production
    const builtInIds = [
      'built-in-company-context',
      'built-in-rivery-context',
      'built-in-exosphere-storybook',
      'built-in-ux-writing',
      'built-in-ai-voice',
    ];

    for (const id of builtInIds) {
      await mockClient.from('shared_memories').insert({
        id,
        name: `Memory ${id}`,
        is_built_in: true,
      });
    }

    // Verify each can be queried by its string ID
    for (const id of builtInIds) {
      const { data, error } = await mockClient
        .from('shared_memories')
        .select('id, name')
        .eq('id', id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.id).toBe(id);
    }
  });
});
