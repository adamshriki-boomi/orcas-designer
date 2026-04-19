import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';
import { researcherProjectToRow } from '@/lib/researcher-utils';
import { createTestResearcherProject } from '@/test/helpers/researcher-fixtures';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
});

describe('researcher_projects Supabase operations', () => {
  it('can insert and retrieve researcher projects', async () => {
    const project = createTestResearcherProject({ name: 'My Research' });
    const row = researcherProjectToRow(project, 'user-1');
    row.id = project.id;
    row.created_at = project.createdAt;
    row.updated_at = project.updatedAt;

    await mockClient.from('researcher_projects').insert(row);

    const { data } = await mockClient.from('researcher_projects').select('*');
    expect(data).toHaveLength(1);
    expect(data![0].name).toBe('My Research');
  });

  it('returns empty array when no projects exist', async () => {
    const { data } = await mockClient.from('researcher_projects').select('*');
    expect(data).toEqual([]);
  });

  it('retrieves projects ordered by updated_at descending', async () => {
    const p1 = createTestResearcherProject({ name: 'Oldest' });
    const row1 = researcherProjectToRow(p1, 'user-1');
    row1.id = 'p1';
    row1.updated_at = '2026-01-01T00:00:00.000Z';
    row1.created_at = '2026-01-01T00:00:00.000Z';

    const p2 = createTestResearcherProject({ name: 'Newest' });
    const row2 = researcherProjectToRow(p2, 'user-1');
    row2.id = 'p2';
    row2.updated_at = '2026-06-01T00:00:00.000Z';
    row2.created_at = '2026-06-01T00:00:00.000Z';

    const p3 = createTestResearcherProject({ name: 'Middle' });
    const row3 = researcherProjectToRow(p3, 'user-1');
    row3.id = 'p3';
    row3.updated_at = '2026-03-01T00:00:00.000Z';
    row3.created_at = '2026-03-01T00:00:00.000Z';

    await mockClient.from('researcher_projects').insert(row1);
    await mockClient.from('researcher_projects').insert(row2);
    await mockClient.from('researcher_projects').insert(row3);

    const { data } = await mockClient
      .from('researcher_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    expect(data).toHaveLength(3);
    expect(data![0].name).toBe('Newest');
    expect(data![1].name).toBe('Middle');
    expect(data![2].name).toBe('Oldest');
  });

  it('handles errors gracefully', async () => {
    // When no rows match a filter, data is empty but no error
    const { data, error } = await mockClient
      .from('researcher_projects')
      .select('*')
      .eq('id', 'nonexistent')
      .single();

    // single() returns error when not found
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  it('can delete a researcher project', async () => {
    const project = createTestResearcherProject();
    const row = researcherProjectToRow(project, 'user-1');
    row.id = project.id;
    row.created_at = project.createdAt;
    row.updated_at = project.updatedAt;

    await mockClient.from('researcher_projects').insert(row);

    const { data: before } = await mockClient.from('researcher_projects').select('*');
    expect(before).toHaveLength(1);

    await mockClient.from('researcher_projects').delete().eq('id', project.id);

    const { data: after } = await mockClient.from('researcher_projects').select('*');
    expect(after).toHaveLength(0);
  });
});
