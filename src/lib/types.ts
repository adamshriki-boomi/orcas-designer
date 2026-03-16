export type ProjectId = string;
export type SkillId = string;
export type MemoryId = string;
export type FieldType = 'url' | 'file' | 'text';
export type ImplementationMode = 'add-on-top' | 'redesign';
export type OutputType = 'static-only' | 'static-and-interactive';
export type InteractionLevel = 'static' | 'click-through' | 'full-prototype';
export type AccessibilityLevel = 'none' | 'wcag-aa' | 'wcag-aaa';
export type BrowserTarget = 'chrome' | 'firefox' | 'safari' | 'edge';
export type PromptMode = 'lite' | 'comprehensive';

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
  createdAt: string;
  updatedAt: string;
}

export interface CustomMemory {
  id: string;
  name: string;
  content: string;
}

export interface Project {
  id: ProjectId;
  name: string;
  createdAt: string;
  updatedAt: string;
  companyInfo: FormFieldData;
  productInfo: FormFieldData;
  featureInfo: FormFieldData;
  currentImplementation: CurrentImplementationData;
  figmaFileLink: FormFieldData;
  designSystemStorybook: FormFieldData;
  designSystemNpm: FormFieldData;
  designSystemFigma: FormFieldData;
  prototypeSketches: FormFieldData;
  outputType: OutputType;
  interactionLevel: InteractionLevel;
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

export const emptyProject = (id: string, name: string): Project => ({
  id,
  name,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  companyInfo: emptyFormField(),
  productInfo: emptyFormField(),
  featureInfo: emptyFormField(),
  currentImplementation: emptyCurrentImplementation(),
  figmaFileLink: emptyFormField(),
  designSystemStorybook: emptyFormField(),
  designSystemNpm: { ...emptyFormField(), inputType: 'text' },
  designSystemFigma: emptyFormField(),
  prototypeSketches: emptyFormField(),
  outputType: 'static-only',
  interactionLevel: 'static',
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
