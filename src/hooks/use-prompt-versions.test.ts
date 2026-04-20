import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
  vi.restoreAllMocks();
});

describe('prompt_versions Supabase operations', () => {
  it('inserts and retrieves a version row', async () => {
    await mockClient.from('prompt_versions').insert({
      id: 'v-1',
      prompt_id: 'p-1',
      user_id: 'user-1',
      version_number: 1,
      status: 'running',
      wizard_snapshot: { Feature: 'Build an onboarding flow' },
      model: 'claude-opus-4-7',
      thinking_enabled: true,
    });

    const { data } = await mockClient
      .from('prompt_versions')
      .select('*')
      .eq('id', 'v-1')
      .maybeSingle();

    expect(data).toBeDefined();
    expect(data!.status).toBe('running');
    expect(data!.version_number).toBe(1);
  });

  it('filters versions by prompt_id and returns all matching rows', async () => {
    await mockClient.from('prompt_versions').insert({
      id: 'v-1',
      prompt_id: 'p-1',
      user_id: 'user-1',
      version_number: 1,
      status: 'completed',
      wizard_snapshot: {},
      model: 'claude-opus-4-7',
      thinking_enabled: true,
    });
    await mockClient.from('prompt_versions').insert({
      id: 'v-2',
      prompt_id: 'p-1',
      user_id: 'user-1',
      version_number: 2,
      status: 'completed',
      wizard_snapshot: {},
      model: 'claude-opus-4-7',
      thinking_enabled: true,
    });
    await mockClient.from('prompt_versions').insert({
      id: 'v-3',
      prompt_id: 'other-prompt',
      user_id: 'user-1',
      version_number: 1,
      status: 'completed',
      wizard_snapshot: {},
      model: 'claude-opus-4-7',
      thinking_enabled: true,
    });

    const { data } = await mockClient
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', 'p-1');

    expect(data).toHaveLength(2);
    const ids = (data ?? []).map((r) => r!.id).sort();
    expect(ids).toEqual(['v-1', 'v-2']);
  });

  it('updates a version with completed content and tokens', async () => {
    await mockClient.from('prompt_versions').insert({
      id: 'v-1',
      prompt_id: 'p-1',
      user_id: 'user-1',
      version_number: 1,
      status: 'running',
      wizard_snapshot: {},
      model: 'claude-opus-4-7',
      thinking_enabled: true,
    });

    await mockClient
      .from('prompt_versions')
      .update({
        status: 'completed',
        content: '# Generated Brief\n\n...',
        input_tokens: 2100,
        output_tokens: 12400,
        completed_at: '2026-04-20T10:05:00.000Z',
      })
      .eq('id', 'v-1');

    const { data } = await mockClient
      .from('prompt_versions')
      .select('*')
      .eq('id', 'v-1')
      .maybeSingle();

    expect(data!.status).toBe('completed');
    expect(data!.content).toContain('Generated Brief');
    expect(data!.output_tokens).toBe(12400);
    expect(data!.completed_at).toBe('2026-04-20T10:05:00.000Z');
  });

  it('updates the label field independently', async () => {
    await mockClient.from('prompt_versions').insert({
      id: 'v-1',
      prompt_id: 'p-1',
      user_id: 'user-1',
      version_number: 1,
      status: 'completed',
      wizard_snapshot: {},
      model: 'claude-opus-4-7',
      thinking_enabled: true,
    });

    await mockClient
      .from('prompt_versions')
      .update({ label: 'Tightened phase 2' })
      .eq('id', 'v-1');

    const { data } = await mockClient
      .from('prompt_versions')
      .select('label')
      .eq('id', 'v-1')
      .maybeSingle();

    expect(data!.label).toBe('Tightened phase 2');
  });

  it('deletes a version row', async () => {
    await mockClient.from('prompt_versions').insert({
      id: 'v-1',
      prompt_id: 'p-1',
      user_id: 'user-1',
      version_number: 1,
      status: 'completed',
      wizard_snapshot: {},
      model: 'claude-opus-4-7',
      thinking_enabled: true,
    });

    await mockClient.from('prompt_versions').delete().eq('id', 'v-1');

    const { data } = await mockClient
      .from('prompt_versions')
      .select('*')
      .eq('id', 'v-1')
      .maybeSingle();

    expect(data).toBeNull();
  });

  it('records a failed status with error_message', async () => {
    await mockClient.from('prompt_versions').insert({
      id: 'v-1',
      prompt_id: 'p-1',
      user_id: 'user-1',
      version_number: 1,
      status: 'failed',
      error_message: 'Invalid Claude API key. Update your key in Settings.',
      wizard_snapshot: {},
      model: 'claude-opus-4-7',
      thinking_enabled: true,
    });

    const { data } = await mockClient
      .from('prompt_versions')
      .select('status, error_message')
      .eq('id', 'v-1')
      .maybeSingle();

    expect(data!.status).toBe('failed');
    expect(data!.error_message).toContain('API key');
  });
});

describe('prompt-generator-start edge function invocation', () => {
  it('invokes with the expected body shape', async () => {
    mockClient.functions.invoke.mockClear();
    const result = await mockClient.functions.invoke('prompt-generator-start', {
      body: {
        promptId: 'p-1',
        wizardSnapshot: { Feature: 'Onboarding' },
        contextSnapshot: { mandatorySkills: [], sharedSkills: [], customSkills: [], sharedMemories: [], customMemories: [] },
      },
    });

    expect(result.error).toBeNull();
    expect(mockClient.functions.invoke).toHaveBeenCalledWith(
      'prompt-generator-start',
      expect.objectContaining({
        body: expect.objectContaining({ promptId: 'p-1' }),
      }),
    );
  });

  it('surfaces a 429 rate-limit error', async () => {
    mockClient.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Rate limit: 5 generations per prompt per hour.' },
    });

    const result = await mockClient.functions.invoke('prompt-generator-start', {
      body: { promptId: 'p-1', wizardSnapshot: {}, contextSnapshot: {} },
    });

    expect(result.error).toBeDefined();
    expect(result.error!.message).toContain('Rate limit');
  });

  it('surfaces a 409 already-running error', async () => {
    mockClient.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'A generation is already running for this prompt.' },
    });

    const result = await mockClient.functions.invoke('prompt-generator-start', {
      body: { promptId: 'p-1', wizardSnapshot: {}, contextSnapshot: {} },
    });

    expect(result.error!.message).toContain('already running');
  });
});
