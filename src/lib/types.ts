export type PromptId = string;
export type SkillId = string;
export type MemoryId = string;
export type FieldType = 'url' | 'file' | 'text';
export type ImplementationMode = 'add-on-top' | 'redesign';
export type AccessibilityLevel = 'none' | 'wcag-aa' | 'wcag-aaa';
export type BrowserTarget = 'chrome' | 'firefox' | 'safari' | 'edge';
export type PromptMode = 'lite' | 'comprehensive';
export type PromptVersionStatus = 'running' | 'completed' | 'failed';

export interface DesignDirection {
  primaryColor: string;
  fontFamily: string;
  motionStyle: 'none' | 'subtle' | 'expressive';
  borderRadiusStyle: 'sharp' | 'rounded' | 'pill';
}

export interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  base64Data: string;
  createdAt: string;
}

export interface FormFieldData {
  inputType: FieldType;
  urlValue: string;
  textValue: string;
  files: FileAttachment[];
  additionalContext: string;
}

export interface CurrentImplementationData extends FormFieldData {
  figmaLinks: string[];
  implementationMode: ImplementationMode;
}

export interface SharedSkill {
  id: SkillId;
  name: string;
  description: string;
  type: 'url' | 'file';
  urlValue: string;
  fileContent: FileAttachment | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomSkill {
  id: string;
  name: string;
  type: 'url' | 'file';
  urlValue: string;
  fileContent: FileAttachment | null;
}

export interface SharedMemory {
  id: MemoryId;
  name: string;
  description: string;
  content: string;
  fileName: string;
  isBuiltIn: boolean;
  category: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomMemory {
  id: string;
  name: string;
  content: string;
}

export interface Prompt {
  id: PromptId;
  name: string;
  createdAt: string;
  updatedAt: string;
  companyInfo: FormFieldData;
  productInfo: FormFieldData;
  featureInfo: FormFieldData;
  currentImplementation: CurrentImplementationData;
  uxResearch: FormFieldData;
  uxWriting: FormFieldData;
  figmaFileLink: FormFieldData;
  designSystemStorybook: FormFieldData;
  designSystemNpm: FormFieldData;
  designSystemFigma: FormFieldData;
  prototypeSketches: FormFieldData;
  outputDirectory: string;
  accessibilityLevel: AccessibilityLevel;
  externalResourcesAccessible: boolean;
  browserCompatibility: BrowserTarget[];
  promptMode: PromptMode;
  designDirection: DesignDirection | null;
  selectedSharedSkillIds: SkillId[];
  customSkills: CustomSkill[];
  selectedSharedMemoryIds: MemoryId[];
  customMemories: CustomMemory[];
  regenerationCount: number;
  generatedPrompt: string;
}

/**
 * A single AI-authored generation of a prompt. Multiple versions per Prompt;
 * history is immutable except for label edits and soft-deletes.
 */
export interface PromptVersion {
  id: string;
  promptId: PromptId;
  userId: string;
  versionNumber: number;
  status: PromptVersionStatus;
  content: string | null;
  wizardSnapshot: Record<string, unknown>;
  contextSnapshot: Record<string, unknown> | null;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  thinkingEnabled: boolean;
  label: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

// ── UX Writer Types ──────────────────────────────────────────────

export interface UxSuggestion {
  elementType: string;
  before: string;
  after: string;
  explanation: string;
  principle: string;
}

export interface UxAnalysisResult {
  name: string;
  suggestions: UxSuggestion[];
  summary: string;
}

export interface UxAnalysisEntry {
  id: string;
  name: string;
  description: string;
  focusNotes: string | null;
  screenshotUrl: string | null;
  includeAiVoice: boolean;
  results: UxAnalysisResult | null;
  createdAt: string;
  updatedAt: string;
}

// ── Prompt Types ─────────────────────────────────────────────────

export const emptyFormField = (): FormFieldData => ({
  inputType: 'url',
  urlValue: '',
  textValue: '',
  files: [],
  additionalContext: '',
});

export const emptyCurrentImplementation = (): CurrentImplementationData => ({
  ...emptyFormField(),
  figmaLinks: [],
  implementationMode: 'add-on-top',
});

export const emptyPrompt = (id: string, name: string): Prompt => ({
  id,
  name,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  companyInfo: emptyFormField(),
  productInfo: emptyFormField(),
  featureInfo: emptyFormField(),
  currentImplementation: emptyCurrentImplementation(),
  uxResearch: emptyFormField(),
  uxWriting: emptyFormField(),
  figmaFileLink: emptyFormField(),
  designSystemStorybook: emptyFormField(),
  designSystemNpm: { ...emptyFormField(), inputType: 'text' },
  designSystemFigma: emptyFormField(),
  prototypeSketches: emptyFormField(),
  outputDirectory: './output/',
  accessibilityLevel: 'none',
  externalResourcesAccessible: true,
  browserCompatibility: ['chrome'],
  promptMode: 'comprehensive',
  designDirection: null,
  selectedSharedSkillIds: [],
  customSkills: [],
  selectedSharedMemoryIds: ['built-in-company-context'],
  customMemories: [],
  regenerationCount: 0,
  generatedPrompt: '',
});
