import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

import { useSharedSkills } from './use-shared-skills';

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

describe('useSharedSkills hook', () => {
  it('loads shared skills on mount', async () => {
    await mockClient.from('shared_skills').insert({
      id: 's-1', name: 'Alpha', description: 'First', type: 'url',
      url_value: 'https://a.example', file_content: null, created_by: 'user-1',
    });
    await mockClient.from('shared_skills').insert({
      id: 's-2', name: 'Beta', description: 'Second', type: 'url',
      url_value: 'https://b.example', file_content: null, created_by: 'user-1',
    });

    const { result } = renderHook(() => useSharedSkills());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.sharedSkills).toHaveLength(2);
    expect(result.current.sharedSkills.map((s) => s.name).sort()).toEqual(['Alpha', 'Beta']);
  });

  it('addSkill inserts a row and refreshes', async () => {
    const { result } = renderHook(() => useSharedSkills());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const id = await result.current.addSkill({
      name: 'New Skill',
      description: 'Added at runtime',
      type: 'url',
      urlValue: 'https://new.example',
      fileContent: null,
    });

    expect(id).toBeTruthy();
    await waitFor(() => expect(result.current.sharedSkills).toHaveLength(1), { timeout: 2000 });
    expect(result.current.sharedSkills[0].name).toBe('New Skill');
    expect(result.current.sharedSkills[0].urlValue).toBe('https://new.example');
  });

  it('updateSkill mutates the row and refreshes', async () => {
    await mockClient.from('shared_skills').insert({
      id: 's-upd', name: 'Before', description: 'old', type: 'url',
      url_value: 'https://old.example', file_content: null, created_by: 'user-1',
    });

    const { result } = renderHook(() => useSharedSkills());
    await waitFor(() => expect(result.current.sharedSkills).toHaveLength(1));

    await result.current.updateSkill('s-upd', { name: 'After', urlValue: 'https://new.example' });

    await waitFor(() => {
      expect(result.current.sharedSkills[0].name).toBe('After');
    }, { timeout: 2000 });
    expect(result.current.sharedSkills[0].urlValue).toBe('https://new.example');
  });

  it('deleteSkill removes the row and refreshes', async () => {
    await mockClient.from('shared_skills').insert({
      id: 's-del', name: 'ToDelete', description: '', type: 'url',
      url_value: '', file_content: null, created_by: 'user-1',
    });

    const { result } = renderHook(() => useSharedSkills());
    await waitFor(() => expect(result.current.sharedSkills).toHaveLength(1));

    await result.current.deleteSkill('s-del');

    await waitFor(() => expect(result.current.sharedSkills).toHaveLength(0), { timeout: 2000 });
  });

  it('isSkillUsed returns names of prompts that reference the skill', async () => {
    await mockClient.from('prompts').insert({
      id: 'p-1', name: 'Alpha prompt', user_id: 'user-1',
      selected_shared_skill_ids: ['target-skill'],
    });
    await mockClient.from('prompts').insert({
      id: 'p-2', name: 'Gamma prompt', user_id: 'user-1',
      selected_shared_skill_ids: ['other-skill'],
    });

    const { result } = renderHook(() => useSharedSkills());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const users = await result.current.isSkillUsed('target-skill');
    expect(users).toEqual(['Alpha prompt']);
  });
});
