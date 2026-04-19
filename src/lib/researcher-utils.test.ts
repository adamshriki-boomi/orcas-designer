import { researcherProjectToRow, toResearcherProject } from './researcher-utils';
import {
  createTestResearcherProject,
  createResearcherProjectWithResults,
  createResearcherProjectWithMethods,
} from '@/test/helpers/researcher-fixtures';

describe('researcherProjectToRow', () => {
  it('converts camelCase fields to snake_case', () => {
    const project = createTestResearcherProject();
    const row = researcherProjectToRow(project, 'user-123');

    expect(row.user_id).toBe('user-123');
    expect(row.id).toBe(project.id);
    expect(row.name).toBe(project.name);
    expect(row.status).toBe(project.status);
    expect(row.research_type).toBe(project.researchType);
    expect(row.selected_method_ids).toEqual(project.selectedMethodIds);
    expect(row.selected_shared_skill_ids).toEqual(project.selectedSharedSkillIds);
    expect(row.custom_skills).toEqual(project.customSkills);
    expect(row.selected_shared_memory_ids).toEqual(project.selectedSharedMemoryIds);
    expect(row.custom_memories).toEqual(project.customMemories);
  });

  it('packs config as JSONB', () => {
    const project = createResearcherProjectWithMethods();
    const row = researcherProjectToRow(project);
    expect(row.config).toEqual(project.config);
    expect(typeof row.config).toBe('object');
  });

  it('includes nullable fields when defined', () => {
    const project = createResearcherProjectWithResults();
    const row = researcherProjectToRow(project);

    expect(row.job_id).toBe(project.jobId);
    expect(row.started_at).toBe(project.startedAt);
    expect(row.completed_at).toBe(project.completedAt);
    expect(row.framing_document).toBe(project.framingDocument);
    expect(row.executive_summary).toBe(project.executiveSummary);
    expect(row.process_book).toBe(project.processBook);
    expect(row.method_results).toEqual(project.methodResults);
    expect(row.confluence_page_id).toBe(project.confluencePageId);
    expect(row.confluence_page_url).toBe(project.confluencePageUrl);
  });

  it('only includes defined fields for partial updates', () => {
    const row = researcherProjectToRow({ name: 'Updated Name', status: 'running' });
    expect(row.name).toBe('Updated Name');
    expect(row.status).toBe('running');
    expect(row.id).toBeUndefined();
    expect(row.config).toBeUndefined();
    expect(row.selected_method_ids).toBeUndefined();
  });

  it('handles empty arrays correctly', () => {
    const project = createTestResearcherProject({
      selectedMethodIds: [],
      selectedSharedSkillIds: [],
      customSkills: [],
      selectedSharedMemoryIds: [],
      customMemories: [],
    });
    const row = researcherProjectToRow(project);
    expect(row.selected_method_ids).toEqual([]);
    expect(row.selected_shared_skill_ids).toEqual([]);
    expect(row.custom_skills).toEqual([]);
    expect(row.selected_shared_memory_ids).toEqual([]);
    expect(row.custom_memories).toEqual([]);
  });
});

describe('toResearcherProject', () => {
  it('converts snake_case row to camelCase interface', () => {
    const row = {
      id: 'proj-1',
      name: 'My Research',
      status: 'draft',
      research_type: 'evaluative',
      config: { productContext: { companyInfo: 'test' } },
      selected_method_ids: ['heuristic-evaluation'],
      selected_shared_skill_ids: [],
      custom_skills: [],
      selected_shared_memory_ids: ['built-in-company-context'],
      custom_memories: [],
      job_id: null,
      started_at: null,
      completed_at: null,
      error_message: null,
      progress: null,
      framing_document: null,
      executive_summary: null,
      process_book: null,
      method_results: null,
      confluence_page_id: null,
      confluence_page_url: null,
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-01T00:00:00.000Z',
    };

    const project = toResearcherProject(row);
    expect(project.id).toBe('proj-1');
    expect(project.name).toBe('My Research');
    expect(project.status).toBe('draft');
    expect(project.researchType).toBe('evaluative');
    expect(project.selectedMethodIds).toEqual(['heuristic-evaluation']);
    expect(project.selectedSharedMemoryIds).toEqual(['built-in-company-context']);
    expect(project.jobId).toBeNull();
    expect(project.framingDocument).toBeNull();
    expect(project.executiveSummary).toBeNull();
    expect(project.processBook).toBeNull();
    expect(project.methodResults).toBeNull();
    expect(project.createdAt).toBe('2026-04-01T00:00:00.000Z');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalRow = {
      id: 'proj-2',
      name: 'Minimal',
      status: 'draft',
      research_type: 'exploratory',
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-01T00:00:00.000Z',
    };

    const project = toResearcherProject(minimalRow);
    expect(project.config).toEqual({});
    expect(project.selectedMethodIds).toEqual([]);
    expect(project.selectedSharedSkillIds).toEqual([]);
    expect(project.customSkills).toEqual([]);
    expect(project.selectedSharedMemoryIds).toEqual([]);
    expect(project.customMemories).toEqual([]);
    expect(project.jobId).toBeNull();
    expect(project.progress).toBeNull();
    expect(project.methodResults).toBeNull();
  });

  it('round-trip: toResearcherProject(researcherProjectToRow(project)) preserves data', () => {
    const original = createResearcherProjectWithResults();
    const row = researcherProjectToRow(original);

    // Add timestamp fields that researcherProjectToRow doesn't include
    (row as Record<string, unknown>).created_at = original.createdAt;
    (row as Record<string, unknown>).updated_at = original.updatedAt;

    const roundTripped = toResearcherProject(row);

    expect(roundTripped.id).toBe(original.id);
    expect(roundTripped.name).toBe(original.name);
    expect(roundTripped.status).toBe(original.status);
    expect(roundTripped.researchType).toBe(original.researchType);
    expect(roundTripped.config).toEqual(original.config);
    expect(roundTripped.selectedMethodIds).toEqual(original.selectedMethodIds);
    expect(roundTripped.selectedSharedSkillIds).toEqual(original.selectedSharedSkillIds);
    expect(roundTripped.selectedSharedMemoryIds).toEqual(original.selectedSharedMemoryIds);
    expect(roundTripped.framingDocument).toBe(original.framingDocument);
    expect(roundTripped.executiveSummary).toBe(original.executiveSummary);
    expect(roundTripped.processBook).toBe(original.processBook);
    expect(roundTripped.methodResults).toEqual(original.methodResults);
  });
});
