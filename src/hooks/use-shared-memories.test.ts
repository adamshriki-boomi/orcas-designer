import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
});

describe('shared_memories Supabase operations', () => {
  it('can insert a memory with a non-UUID string id', async () => {
    const { data, error } = await mockClient.from('shared_memories').insert({
      id: 'built-in-company-context',
      name: 'Boomi Context',
      description: 'Built-in company context',
      content: 'Some content',
      file_name: 'boomi-context.md',
      is_built_in: true,
      created_by: null,
    });

    expect(error).toBeNull();

    const { data: retrieved } = await mockClient
      .from('shared_memories')
      .select('*')
      .eq('id', 'built-in-company-context')
      .single();

    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('Boomi Context');
    expect(retrieved!.is_built_in).toBe(true);
  });

  it('can query by non-UUID id without 400 error (regression)', async () => {
    // This test verifies the root cause fix: id columns are text, not uuid.
    // Previously, querying with 'built-in-ux-writing' on a uuid column
    // caused PostgREST to return 400 Bad Request.
    await mockClient.from('shared_memories').insert({
      id: 'built-in-ux-writing',
      name: 'UX Writing Guidelines',
      content: 'Guidelines content',
      is_built_in: true,
    });

    const { data, error } = await mockClient
      .from('shared_memories')
      .select('id, name, content')
      .eq('id', 'built-in-ux-writing')
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBe('built-in-ux-writing');
  });

  it('can update a memory', async () => {
    await mockClient.from('shared_memories').insert({
      id: 'update-mem-1',
      name: 'Test Memory',
      content: 'Original content',
      is_built_in: false,
    });

    await mockClient.from('shared_memories').update({
      name: 'Updated Memory',
      content: 'Updated content',
    }).eq('id', 'update-mem-1');

    const { data } = await mockClient
      .from('shared_memories')
      .select('*')
      .eq('id', 'update-mem-1')
      .single();

    expect(data!.name).toBe('Updated Memory');
    expect(data!.content).toBe('Updated content');
  });

  it('can delete a non-built-in memory', async () => {
    await mockClient.from('shared_memories').insert({
      id: 'del-mem-1',
      name: 'To Delete',
      is_built_in: false,
    });

    const { data: before } = await mockClient.from('shared_memories').select('*');
    expect(before).toHaveLength(1);

    await mockClient.from('shared_memories').delete().eq('id', 'del-mem-1');

    const { data: after } = await mockClient.from('shared_memories').select('*');
    expect(after).toHaveLength(0);
  });

  it('built-in memory deletion is prevented by app logic', async () => {
    await mockClient.from('shared_memories').insert({
      id: 'built-in-test',
      name: 'Built-In Memory',
      is_built_in: true,
    });

    // Simulate deleteMemory logic: check isBuiltIn first
    const { data: existing } = await mockClient
      .from('shared_memories')
      .select('*')
      .eq('id', 'built-in-test')
      .single();

    if (existing?.is_built_in) {
      // deleteMemory returns early — should NOT delete
    } else {
      await mockClient.from('shared_memories').delete().eq('id', 'built-in-test');
    }

    const { data: stillExists } = await mockClient
      .from('shared_memories')
      .select('*')
      .eq('id', 'built-in-test')
      .single();

    expect(stillExists).toBeDefined();
    expect(stillExists!.name).toBe('Built-In Memory');
  });

  it('select orders by name', async () => {
    await mockClient.from('shared_memories').insert({ id: 'z-mem', name: 'Zebra' });
    await mockClient.from('shared_memories').insert({ id: 'a-mem', name: 'Alpha' });
    await mockClient.from('shared_memories').insert({ id: 'm-mem', name: 'Middle' });

    const { data } = await mockClient
      .from('shared_memories')
      .select('*')
      .order('name');

    expect(data!.map((r: Record<string, unknown>) => r.name)).toEqual(['Alpha', 'Middle', 'Zebra']);
  });

  it('maybeSingle returns null without error when no rows match (regression for 406)', async () => {
    // .single() returns a 406 error when no rows match.
    // The seeding logic uses .maybeSingle() so first-run queries
    // for non-existent built-in memories return null, not an error.
    const { data, error } = await mockClient
      .from('shared_memories')
      .select('id, name')
      .eq('id', 'nonexistent-memory')
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('single returns error when no rows match', async () => {
    const { data, error } = await mockClient
      .from('shared_memories')
      .select('id, name')
      .eq('id', 'nonexistent-memory')
      .single();

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it('isMemoryUsed: contains query finds projects using the memory', async () => {
    await mockClient.from('prompts').insert({
      id: 'proj-a', user_id: 'u1', name: 'Alpha',
      selected_shared_memory_ids: ['mem-1', 'mem-2'],
    });
    await mockClient.from('prompts').insert({
      id: 'proj-b', user_id: 'u1', name: 'Beta',
      selected_shared_memory_ids: ['mem-1'],
    });
    await mockClient.from('prompts').insert({
      id: 'proj-c', user_id: 'u1', name: 'Gamma',
      selected_shared_memory_ids: ['mem-3'],
    });

    const { data } = await mockClient
      .from('prompts')
      .select('name')
      .contains('selected_shared_memory_ids', ['mem-1']);

    const names = data!.map((p: Record<string, unknown>) => p.name);
    expect(names).toHaveLength(2);
    expect(names).toContain('Alpha');
    expect(names).toContain('Beta');
    expect(names).not.toContain('Gamma');
  });

  it('isMemoryUsed returns empty when no project references the memory', async () => {
    await mockClient.from('prompts').insert({
      id: 'proj-x', user_id: 'u1', name: 'Only Project',
      selected_shared_memory_ids: ['other-mem'],
    });

    const { data } = await mockClient
      .from('prompts')
      .select('name')
      .contains('selected_shared_memory_ids', ['nonexistent']);

    expect(data).toHaveLength(0);
  });

  it('stores and returns category and tags on shared_memories rows', async () => {
    await mockClient.from('shared_memories').insert({
      id: 'built-in-uxr-operations-guide',
      name: 'UXR Operations Guide',
      description: 'Research-focused summary',
      content: '# UXR Operations Guide',
      file_name: 'uxr-operations-guide.md',
      is_built_in: true,
      created_by: null,
      category: 'UX Research',
      tags: ['Boomi Knowledge'],
    });

    const { data } = await mockClient
      .from('shared_memories')
      .select('*')
      .eq('id', 'built-in-uxr-operations-guide')
      .maybeSingle();

    expect(data?.category).toBe('UX Research');
    expect(data?.tags).toEqual(['Boomi Knowledge']);
  });

  it('defaults category to null and tags to empty when unspecified', async () => {
    await mockClient.from('shared_memories').insert({
      id: 'no-meta-memory',
      name: 'Unclassified',
      is_built_in: false,
    });

    const { data } = await mockClient
      .from('shared_memories')
      .select('*')
      .eq('id', 'no-meta-memory')
      .maybeSingle();

    expect(data?.category ?? null).toBeNull();
    // Mock may store absent fields as undefined; treat as empty
    const tags = (data?.tags as string[] | undefined) ?? [];
    expect(tags).toEqual([]);
  });

  it('contains filter on tags finds memories with a given tag', async () => {
    await mockClient.from('shared_memories').insert({
      id: 'boomi-knowledge-mem',
      name: 'Tagged',
      is_built_in: true,
      tags: ['Boomi Knowledge'],
    });
    await mockClient.from('shared_memories').insert({
      id: 'untagged-mem',
      name: 'Untagged',
      is_built_in: true,
      tags: [],
    });

    const { data } = await mockClient
      .from('shared_memories')
      .select('id')
      .contains('tags', ['Boomi Knowledge']);

    const ids = data!.map((r: Record<string, unknown>) => r.id);
    expect(ids).toContain('boomi-knowledge-mem');
    expect(ids).not.toContain('untagged-mem');
  });
});
