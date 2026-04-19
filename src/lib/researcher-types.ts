import type { SkillId, MemoryId, CustomSkill, CustomMemory, FileAttachment, FormFieldData } from './types';

// ── Research Project Types ──────────────────────────────────────

export type ResearchProjectType = 'exploratory' | 'generative' | 'evaluative';

export type ResearchProjectStatus = 'draft' | 'pending' | 'running' | 'completed' | 'failed';

export interface ResearcherConfig {
  productContext: {
    companyAdditionalContext: string;        // Extra context beyond built-in company memory
    productInfo: FormFieldData;              // URL/file/text for product info (or use built-in memory)
    featureInfo: FormFieldData;              // URL/file/text for feature description
    additionalContext: FormFieldData;        // URL/file/text for any extra context
  };
  researchPurpose: {
    title: string;
    description: string;
    goals: string[];
  };
  targetAudience: {
    description: string;
    segments: string[];
    existingPersonas: string;
  };
  successCriteria: {
    metric: string;
    target: string;
  }[];
  dataUpload: {
    files: FileAttachment[];
    textData: string;
  };
}

export interface ResearchProgress {
  currentMethod: string;
  completedMethods: string[];
  totalMethods: number;
}

export interface MethodResult {
  methodId: string;
  title: string;
  content: string;
  thinkingTokensUsed: number;
  completedAt: string;
  error: string | null;
}

export interface ResearcherProject {
  id: string;
  name: string;
  status: ResearchProjectStatus;
  researchType: ResearchProjectType;
  config: ResearcherConfig;
  selectedMethodIds: string[];
  selectedSharedSkillIds: SkillId[];
  customSkills: CustomSkill[];
  selectedSharedMemoryIds: MemoryId[];
  customMemories: CustomMemory[];
  jobId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  progress: ResearchProgress | null;
  framingDocument: string | null;
  executiveSummary: string | null;
  processBook: string | null;
  methodResults: Record<string, MethodResult> | null;
  confluencePageId: string | null;
  confluencePageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Built-in Research Method Types ──────────────────────────────

export type ResearchMethodMode = 'generative' | 'analytical';

export type ResearchMethodInput = 'productContext' | 'targetAudience' | 'dataUpload';

export interface BuiltInResearchMethod {
  id: string;
  name: string;
  mode: ResearchMethodMode;
  projectTypes: ResearchProjectType[];
  description: string;
  shortDescription: string;
  requiredInputs: ResearchMethodInput[];
  outputFormat: string;
  icon: string;
}

// ── Empty/Default Factories ─────────────────────────────────────

const emptyField = (): FormFieldData => ({
  inputType: 'url',
  urlValue: '',
  textValue: '',
  files: [],
  additionalContext: '',
});

export const emptyResearcherConfig = (): ResearcherConfig => ({
  productContext: {
    companyAdditionalContext: '',
    productInfo: emptyField(),
    featureInfo: emptyField(),
    additionalContext: emptyField(),
  },
  researchPurpose: {
    title: '',
    description: '',
    goals: [],
  },
  targetAudience: {
    description: '',
    segments: [],
    existingPersonas: '',
  },
  successCriteria: [],
  dataUpload: {
    files: [],
    textData: '',
  },
});

export const emptyResearcherProject = (id: string, name: string): ResearcherProject => ({
  id,
  name,
  status: 'draft',
  researchType: 'evaluative',
  config: emptyResearcherConfig(),
  selectedMethodIds: [],
  selectedSharedSkillIds: [],
  customSkills: [],
  selectedSharedMemoryIds: ['built-in-company-context'],
  customMemories: [],
  jobId: null,
  startedAt: null,
  completedAt: null,
  errorMessage: null,
  progress: null,
  framingDocument: null,
  executiveSummary: null,
  processBook: null,
  methodResults: null,
  confluencePageId: null,
  confluencePageUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
