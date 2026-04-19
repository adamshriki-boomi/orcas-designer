import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock';
import { researcherProjectToRow, toResearcherProject } from '@/lib/researcher-utils';
import {
  createTestResearcherProject,
  createRunningResearcherProject,
} from '@/test/helpers/researcher-fixtures';

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  clearAllTables();
});

describe('researcher_project single Supabase operations', () => {
  it('can fetch a single project by ID', async () => {
    const project = createTestResearcherProject({ name: 'Single Fetch' });
    const row = researcherProjectToRow(project, 'user-1');
    row.id = project.id;
    row.created_at = project.createdAt;
    row.updated_at = project.updatedAt;

    await mockClient.from('researcher_projects').insert(row);

    const { data, error } = await mockClient
      .from('researcher_projects')
      .select('*')
      .eq('id', project.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.name).toBe('Single Fetch');
  });

  it('returns null for non-existent project', async () => {
    const { data, error } = await mockClient
      .from('researcher_projects')
      .select('*')
      .eq('id', 'nonexistent')
      .single();

    expect(data).toBeNull();
    expect(error).toBeDefined();
  });

  it('can update a project (merge partial updates)', async () => {
    const project = createTestResearcherProject({ name: 'Original Name' });
    const row = researcherProjectToRow(project, 'user-1');
    row.id = project.id;
    row.created_at = project.createdAt;
    row.updated_at = project.updatedAt;

    await mockClient.from('researcher_projects').insert(row);

    // Update just the name
    const updates = researcherProjectToRow({ name: 'Updated Name' });
    delete updates.id;
    await mockClient
      .from('researcher_projects')
      .update(updates)
      .eq('id', project.id);

    const { data } = await mockClient
      .from('researcher_projects')
      .select('*')
      .eq('id', project.id)
      .single();

    expect(data!.name).toBe('Updated Name');
    // Other fields preserved
    expect(data!.status).toBe('draft');
  });

  it('can delete a project', async () => {
    const project = createTestResearcherProject();
    const row = researcherProjectToRow(project, 'user-1');
    row.id = project.id;
    row.created_at = project.createdAt;
    row.updated_at = project.updatedAt;

    await mockClient.from('researcher_projects').insert(row);

    await mockClient.from('researcher_projects').delete().eq('id', project.id);

    const { data } = await mockClient
      .from('researcher_projects')
      .select('*')
      .eq('id', project.id)
      .single();

    expect(data).toBeNull();
  });

  it('can update status from running to completed', async () => {
    const running = createRunningResearcherProject();
    const row = researcherProjectToRow(running, 'user-1');
    row.id = running.id;
    row.created_at = running.createdAt;
    row.updated_at = running.updatedAt;

    await mockClient.from('researcher_projects').insert(row);

    // Simulate completion
    await mockClient
      .from('researcher_projects')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', running.id);

    const { data } = await mockClient
      .from('researcher_projects')
      .select('*')
      .eq('id', running.id)
      .single();

    expect(data!.status).toBe('completed');
    expect(data!.completed_at).toBeDefined();
  });

  it('toResearcherProject correctly converts a row', () => {
    const project = createTestResearcherProject({
      name: 'Conversion Test',
      researchType: 'generative',
      status: 'running',
    });
    const row = researcherProjectToRow(project, 'user-1');
    row.id = project.id;
    row.created_at = project.createdAt;
    row.updated_at = project.updatedAt;

    const converted = toResearcherProject(row);

    expect(converted.id).toBe(project.id);
    expect(converted.name).toBe('Conversion Test');
    expect(converted.researchType).toBe('generative');
    expect(converted.status).toBe('running');
    expect(converted.selectedSharedMemoryIds).toEqual(['built-in-company-context']);
  });
});
