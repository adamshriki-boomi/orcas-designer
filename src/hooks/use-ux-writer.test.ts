import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';
import { toUxAnalysisEntry } from './use-ux-analyses';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
});

describe('ux_writer_analyses Supabase operations', () => {
  it('can save an analysis with name and include_ai_voice', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      user_id: 'user-1',
      name: 'Login Error States',
      description: 'Login dialog',
      focus_notes: 'error messages',
      screenshot_url: null,
      include_ai_voice: false,
      results: { name: 'Login Error States', suggestions: [], summary: 'No issues found' },
    });

    const { data } = await mockClient
      .from('ux_writer_analyses')
      .select('*')
      .eq('user_id', 'user-1');

    expect(data).toHaveLength(1);
    expect(data![0].name).toBe('Login Error States');
    expect(data![0].description).toBe('Login dialog');
    expect(data![0].include_ai_voice).toBe(false);
    expect(data![0].results).toEqual({
      name: 'Login Error States',
      suggestions: [],
      summary: 'No issues found',
    });
  });

  it('retrieves analyses ordered by created_at descending', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      id: 'a1', user_id: 'u1', name: 'First', description: 'First analysis',
      created_at: '2026-01-01T00:00:00Z',
    });
    await mockClient.from('ux_writer_analyses').insert({
      id: 'a2', user_id: 'u1', name: 'Second', description: 'Second analysis',
      created_at: '2026-06-01T00:00:00Z',
    });

    const { data } = await mockClient
      .from('ux_writer_analyses')
      .select('*')
      .order('created_at', { ascending: false });

    expect(data![0].description).toBe('Second analysis');
    expect(data![1].description).toBe('First analysis');
  });

  it('can delete an analysis', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      id: 'del-1', user_id: 'u1', name: 'To Delete', description: 'Delete me',
    });

    await mockClient.from('ux_writer_analyses').delete().eq('id', 'del-1');

    const { data } = await mockClient.from('ux_writer_analyses').select('*');
    expect(data).toHaveLength(0);
  });

  it('can update an analysis (re-analyze)', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      id: 'upd-1', user_id: 'u1', name: 'Original', description: 'Original desc',
      include_ai_voice: false,
      results: { name: 'Original', suggestions: [], summary: 'Original summary' },
    });

    await mockClient.from('ux_writer_analyses').update({
      name: 'Updated Name',
      description: 'Updated description',
      include_ai_voice: true,
      results: {
        name: 'Updated Name',
        suggestions: [{ elementType: 'Button Label', before: 'Submit', after: 'Save', explanation: 'Clearer', principle: 'Clarity' }],
        summary: 'Updated summary',
      },
    }).eq('id', 'upd-1');

    const { data } = await mockClient
      .from('ux_writer_analyses')
      .select('*')
      .eq('id', 'upd-1')
      .single();

    expect(data!.name).toBe('Updated Name');
    expect(data!.description).toBe('Updated description');
    expect(data!.include_ai_voice).toBe(true);
    expect((data!.results as { suggestions: unknown[] }).suggestions).toHaveLength(1);
  });

  it('user_id filter isolates analyses per user', async () => {
    await mockClient.from('ux_writer_analyses').insert({
      id: 'a-user1', user_id: 'user-1', name: 'User 1', description: 'User 1 analysis',
    });
    await mockClient.from('ux_writer_analyses').insert({
      id: 'a-user2', user_id: 'user-2', name: 'User 2', description: 'User 2 analysis',
    });

    const { data: user1Data } = await mockClient
      .from('ux_writer_analyses')
      .select('*')
      .eq('user_id', 'user-1');

    expect(user1Data).toHaveLength(1);
    expect(user1Data![0].description).toBe('User 1 analysis');
  });

  it('insert with .select("id").single() returns the new ID', async () => {
    const { data } = await mockClient
      .from('ux_writer_analyses')
      .insert({
        user_id: 'u1',
        name: 'Test',
        description: 'Test analysis',
      })
      .select('id')
      .single();

    expect(data).toBeDefined();
    expect(data!.id).toBeDefined();
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

describe('toUxAnalysisEntry', () => {
  it('maps a DB row to UxAnalysisEntry correctly', () => {
    const row = {
      id: 'abc-123',
      name: 'Login Errors',
      description: 'Login dialog with errors',
      focus_notes: 'error messages',
      screenshot_url: 'user-1/1234-image.png',
      include_ai_voice: true,
      results: {
        name: 'Login Errors',
        suggestions: [
          { elementType: 'Button Label', before: 'OK', after: 'Continue', explanation: 'Clearer', principle: 'Clarity' },
        ],
        summary: 'Improved button label',
      },
      created_at: '2026-04-14T10:00:00Z',
      updated_at: '2026-04-14T12:00:00Z',
    };

    const entry = toUxAnalysisEntry(row);

    expect(entry.id).toBe('abc-123');
    expect(entry.name).toBe('Login Errors');
    expect(entry.description).toBe('Login dialog with errors');
    expect(entry.focusNotes).toBe('error messages');
    expect(entry.screenshotUrl).toBe('user-1/1234-image.png');
    expect(entry.includeAiVoice).toBe(true);
    expect(entry.results?.suggestions).toHaveLength(1);
    expect(entry.results?.summary).toBe('Improved button label');
    expect(entry.createdAt).toBe('2026-04-14T10:00:00Z');
    expect(entry.updatedAt).toBe('2026-04-14T12:00:00Z');
  });

  it('handles null optional fields', () => {
    const row = {
      id: 'def-456',
      name: '',
      description: 'Simple test',
      focus_notes: null,
      screenshot_url: null,
      include_ai_voice: false,
      results: null,
      created_at: '2026-04-14T10:00:00Z',
      updated_at: '2026-04-14T10:00:00Z',
    };

    const entry = toUxAnalysisEntry(row);

    expect(entry.focusNotes).toBeNull();
    expect(entry.screenshotUrl).toBeNull();
    expect(entry.includeAiVoice).toBe(false);
    expect(entry.results).toBeNull();
  });
});
