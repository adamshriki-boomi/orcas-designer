import type { ResearcherProject } from './researcher-types';

/**
 * Convert a ResearcherProject to a Supabase row (snake_case, JSONB packing).
 * Only includes defined fields — safe for both insert and partial update.
 */
export function researcherProjectToRow(project: Partial<ResearcherProject>, userId?: string) {
  const row: Record<string, unknown> = {};

  if (userId !== undefined) row.user_id = userId;
  if (project.id !== undefined) row.id = project.id;
  if (project.name !== undefined) row.name = project.name;
  if (project.status !== undefined) row.status = project.status;
  if (project.researchType !== undefined) row.research_type = project.researchType;
  if (project.config !== undefined) row.config = project.config;
  if (project.selectedMethodIds !== undefined) row.selected_method_ids = project.selectedMethodIds;
  if (project.selectedSharedSkillIds !== undefined) row.selected_shared_skill_ids = project.selectedSharedSkillIds;
  if (project.customSkills !== undefined) row.custom_skills = project.customSkills;
  if (project.selectedSharedMemoryIds !== undefined) row.selected_shared_memory_ids = project.selectedSharedMemoryIds;
  if (project.customMemories !== undefined) row.custom_memories = project.customMemories;
  if (project.jobId !== undefined) row.job_id = project.jobId;
  if (project.startedAt !== undefined) row.started_at = project.startedAt;
  if (project.completedAt !== undefined) row.completed_at = project.completedAt;
  if (project.errorMessage !== undefined) row.error_message = project.errorMessage;
  if (project.progress !== undefined) row.progress = project.progress;
  if (project.framingDocument !== undefined) row.framing_document = project.framingDocument;
  if (project.executiveSummary !== undefined) row.executive_summary = project.executiveSummary;
  if (project.processBook !== undefined) row.process_book = project.processBook;
  if (project.methodResults !== undefined) row.method_results = project.methodResults;
  if (project.confluencePageId !== undefined) row.confluence_page_id = project.confluencePageId;
  if (project.confluencePageUrl !== undefined) row.confluence_page_url = project.confluencePageUrl;

  return row;
}

/**
 * Convert a Supabase row (snake_case) to a ResearcherProject (camelCase).
 */
export function toResearcherProject(row: Record<string, unknown>): ResearcherProject {
  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as ResearcherProject['status'],
    researchType: row.research_type as ResearcherProject['researchType'],
    config: (row.config ?? {}) as ResearcherProject['config'],
    selectedMethodIds: (row.selected_method_ids ?? []) as string[],
    selectedSharedSkillIds: (row.selected_shared_skill_ids ?? []) as string[],
    customSkills: (row.custom_skills ?? []) as ResearcherProject['customSkills'],
    selectedSharedMemoryIds: (row.selected_shared_memory_ids ?? []) as string[],
    customMemories: (row.custom_memories ?? []) as ResearcherProject['customMemories'],
    jobId: (row.job_id as string) ?? null,
    startedAt: (row.started_at as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
    errorMessage: (row.error_message as string) ?? null,
    progress: (row.progress as ResearcherProject['progress']) ?? null,
    framingDocument: (row.framing_document as string) ?? null,
    executiveSummary: (row.executive_summary as string) ?? null,
    processBook: (row.process_book as string) ?? null,
    methodResults: (row.method_results as ResearcherProject['methodResults']) ?? null,
    confluencePageId: (row.confluence_page_id as string) ?? null,
    confluencePageUrl: (row.confluence_page_url as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
