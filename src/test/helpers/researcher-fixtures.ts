import { emptyResearcherProject, emptyResearcherConfig } from '@/lib/researcher-types';
import type {
  ResearcherProject,
  ResearcherConfig,
  MethodResult,
  ResearchProgress,
  ResearchProjectType,
} from '@/lib/researcher-types';

export function createTestResearcherProject(overrides: Partial<ResearcherProject> = {}): ResearcherProject {
  return {
    ...emptyResearcherProject('test-research-id', 'Test Research Project'),
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createTestResearcherConfig(overrides: Partial<ResearcherConfig> = {}): ResearcherConfig {
  const base = emptyResearcherConfig();
  return {
    ...base,
    productContext: {
      companyAdditionalContext: 'Boomi is an integration platform company.',
      productInfo: { inputType: 'text', urlValue: '', textValue: 'Boomi Data Integration is an ELT/CDC data pipeline service.', files: [], additionalContext: '' },
      featureInfo: { inputType: 'text', urlValue: '', textValue: 'The pipeline builder allows users to create data transformation workflows.', files: [], additionalContext: 'Recently acquired from Rivery.' },
      additionalContext: { inputType: 'url', urlValue: '', textValue: '', files: [], additionalContext: '' },
    },
    researchPurpose: {
      title: 'Pipeline Builder Usability',
      description: 'Evaluate the usability of the new pipeline builder interface.',
      goals: ['Identify key pain points', 'Measure task completion rates', 'Compare with previous version'],
    },
    targetAudience: {
      description: 'Data engineers and analysts who build data pipelines.',
      segments: ['data-engineers', 'data-analysts', 'platform-admins'],
      existingPersonas: 'Dana the Data Engineer, Alex the Analyst',
    },
    successCriteria: [
      { metric: 'Task completion rate', target: '> 85%' },
      { metric: 'Time on task', target: '< 5 minutes for basic pipeline' },
      { metric: 'SUS score', target: '> 72' },
    ],
    ...overrides,
  };
}

export function createResearcherProjectWithMethods(
  methodIds: string[] = ['heuristic-evaluation', 'persona-development', 'task-analysis'],
  overrides: Partial<ResearcherProject> = {},
): ResearcherProject {
  return createTestResearcherProject({
    config: createTestResearcherConfig(),
    selectedMethodIds: methodIds,
    ...overrides,
  });
}

export function createTestMethodResult(overrides: Partial<MethodResult> = {}): MethodResult {
  return {
    methodId: 'heuristic-evaluation',
    title: 'Heuristic Evaluation',
    content: '# Heuristic Evaluation Results\n\n## Summary\n3 critical violations found.\n\n## Findings\n| Heuristic | Violation | Severity |\n|---|---|---|\n| Visibility of system status | No loading indicator | Major |',
    thinkingTokensUsed: 5000,
    completedAt: '2026-04-01T01:00:00.000Z',
    error: null,
    ...overrides,
  };
}

export function createResearcherProjectWithResults(
  overrides: Partial<ResearcherProject> = {},
): ResearcherProject {
  return createTestResearcherProject({
    status: 'completed',
    researchType: 'evaluative',
    config: createTestResearcherConfig(),
    selectedMethodIds: ['heuristic-evaluation', 'task-analysis'],
    startedAt: '2026-04-01T00:30:00.000Z',
    completedAt: '2026-04-01T01:15:00.000Z',
    framingDocument: '# Framing Document\n\n## Research Purpose\nEvaluate pipeline builder usability.',
    executiveSummary: '# Executive Summary\n\nThe pipeline builder has 3 critical usability issues.',
    processBook: '# Process Book\n\n## Project Overview\nThis research project evaluated the pipeline builder.',
    methodResults: {
      'heuristic-evaluation': createTestMethodResult(),
      'task-analysis': createTestMethodResult({
        methodId: 'task-analysis',
        title: 'Task Analysis',
        content: '# Task Analysis Results\n\n## Task Hierarchy\n1. Create pipeline\n  1.1 Select source\n  1.2 Configure mapping',
      }),
    },
    ...overrides,
  });
}

export function createRunningResearcherProject(overrides: Partial<ResearcherProject> = {}): ResearcherProject {
  return createTestResearcherProject({
    status: 'running',
    config: createTestResearcherConfig(),
    selectedMethodIds: ['heuristic-evaluation', 'persona-development', 'task-analysis'],
    jobId: 'job-123',
    startedAt: '2026-04-01T00:30:00.000Z',
    progress: {
      currentMethod: 'persona-development',
      completedMethods: ['heuristic-evaluation'],
      totalMethods: 3,
    } satisfies ResearchProgress,
    methodResults: {
      'heuristic-evaluation': createTestMethodResult(),
    },
    ...overrides,
  });
}
