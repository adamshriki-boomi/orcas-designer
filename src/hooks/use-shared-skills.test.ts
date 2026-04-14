import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
});

describe('shared_skills Supabase operations', () => {
  it('can add a skill', async () => {
    await mockClient.from('shared_skills').insert({
      id: 'add-skill-1',
      name: 'Test Skill',
      description: 'A test skill',
      type: 'url',
      url_value: 'https://skill.example.com',
      file_content: null,
      created_by: 'user-1',
    });

    const { data } = await mockClient
      .from('shared_skills')
      .select('*')
      .eq('id', 'add-skill-1')
      .single();

    expect(data).toBeDefined();
    expect(data!.name).toBe('Test Skill');
    expect(data!.type).toBe('url');
  });

  it('can update a skill', async () => {
    await mockClient.from('shared_skills').insert({
      id: 'update-skill-1',
      name: 'Original Skill',
      description: 'Original description',
    });

    await mockClient.from('shared_skills').update({
      name: 'Updated Skill',
      description: 'Updated description',
    }).eq('id', 'update-skill-1');

    const { data } = await mockClient
      .from('shared_skills')
      .select('*')
      .eq('id', 'update-skill-1')
      .single();

    expect(data!.name).toBe('Updated Skill');
    expect(data!.description).toBe('Updated description');
  });

  it('can delete a skill', async () => {
    await mockClient.from('shared_skills').insert({
      id: 'del-skill-1',
      name: 'To Delete',
    });

    const { data: before } = await mockClient.from('shared_skills').select('*');
    expect(before).toHaveLength(1);

    await mockClient.from('shared_skills').delete().eq('id', 'del-skill-1');

    const { data: after } = await mockClient.from('shared_skills').select('*');
    expect(after).toHaveLength(0);
  });

  it('isSkillUsed: contains query finds projects using the skill', async () => {
    await mockClient.from('prompts').insert({
      id: 'proj-1',
      name: 'Project Alpha',
      user_id: 'user-1',
      selected_shared_skill_ids: ['skill-a', 'skill-b'],
    });
    await mockClient.from('prompts').insert({
      id: 'proj-2',
      name: 'Project Beta',
      user_id: 'user-1',
      selected_shared_skill_ids: ['skill-a'],
    });
    await mockClient.from('prompts').insert({
      id: 'proj-3',
      name: 'Project Gamma',
      user_id: 'user-1',
      selected_shared_skill_ids: ['skill-c'],
    });

    const { data } = await mockClient
      .from('prompts')
      .select('name')
      .contains('selected_shared_skill_ids', ['skill-a']);

    const names = data!.map((p: Record<string, unknown>) => p.name);
    expect(names).toHaveLength(2);
    expect(names).toContain('Project Alpha');
    expect(names).toContain('Project Beta');
    expect(names).not.toContain('Project Gamma');
  });
});
