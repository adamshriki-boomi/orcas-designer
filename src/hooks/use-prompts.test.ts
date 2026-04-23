import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

// useAuth is wrapped in an app-level context — mock it so the hook can read
// the current user without an AuthProvider in the test tree.
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

import { usePrompts, promptToRow, toPrompt } from './use-prompts';

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

describe('usePrompts hook', () => {
  it('loads prompts on mount and returns them sorted by updated_at desc', async () => {
    await mockClient.from('prompts').insert({
      id: 'p-old', user_id: 'user-1', name: 'Older',
      updated_at: '2025-01-01T00:00:00.000Z',
      selected_shared_skill_ids: [],
      selected_shared_memory_ids: [],
      data: {},
    });
    await mockClient.from('prompts').insert({
      id: 'p-new', user_id: 'user-1', name: 'Newer',
      updated_at: '2025-06-01T00:00:00.000Z',
      selected_shared_skill_ids: [],
      selected_shared_memory_ids: [],
      data: {},
    });

    const { result } = renderHook(() => usePrompts());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.projects.map((p) => p.name)).toEqual(['Newer', 'Older']);
  });

  it('createPrompt inserts a new row and refreshes the list', async () => {
    const { result } = renderHook(() => usePrompts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newId = await result.current.createPrompt('Brand new prompt');

    expect(newId).toBeTruthy();
    await waitFor(() => expect(result.current.projects.length).toBeGreaterThan(0), { timeout: 2000 });
    expect(result.current.projects[0].name).toBe('Brand new prompt');
  });

  it('deletePrompt removes the row and refreshes the list', async () => {
    await mockClient.from('prompts').insert({
      id: 'kill-me', user_id: 'user-1', name: 'Soon-deleted',
      updated_at: '2025-06-01T00:00:00.000Z',
      selected_shared_skill_ids: [],
      selected_shared_memory_ids: [],
      data: {},
    });

    const { result } = renderHook(() => usePrompts());
    await waitFor(() => expect(result.current.projects).toHaveLength(1));

    await result.current.deletePrompt('kill-me');

    await waitFor(() => expect(result.current.projects).toHaveLength(0), { timeout: 2000 });
  });
});

describe('toPrompt / promptToRow', () => {
  it('promptToRow packs form fields into the data JSONB column', () => {
    const row = promptToRow({
      id: 'p-1',
      name: 'Test',
      featureDefinition: { mode: 'new', name: 'X', briefDescription: 'Y' },
      designProducts: { products: ['wireframe'], figmaDestinationUrl: '' },
    }, 'user-1');
    expect(row.user_id).toBe('user-1');
    expect(row.id).toBe('p-1');
    expect(row.name).toBe('Test');
    const data = row.data as Record<string, unknown>;
    expect(data.featureDefinition).toEqual({ mode: 'new', name: 'X', briefDescription: 'Y' });
    expect(data.designProducts).toEqual({ products: ['wireframe'], figmaDestinationUrl: '' });
  });

  it('promptToRow omits data when no form fields are present', () => {
    const row = promptToRow({ id: 'p-1', name: 'Test' }, 'user-1');
    expect(row.data).toBeUndefined();
  });

  it('toPrompt backfills missing featureDefinition / designProducts with empty shapes', () => {
    const prompt = toPrompt({
      id: 'p-1', name: 'Legacy row', created_at: 'x', updated_at: 'y',
      prompt_mode: 'comprehensive',
      selected_shared_skill_ids: [],
      custom_skills: [],
      selected_shared_memory_ids: [],
      custom_memories: [],
      regeneration_count: 0,
      generated_prompt: '',
      data: {},
    });
    expect(prompt.featureDefinition).toEqual({ mode: 'new', name: '', briefDescription: '' });
    expect(prompt.designProducts).toEqual({ products: ['wireframe'], figmaDestinationUrl: '' });
  });
});
