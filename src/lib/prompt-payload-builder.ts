import type {
  Prompt,
  SharedSkill,
  SharedMemory,
  FormFieldData,
  CurrentImplementationData,
} from './types';
import { MANDATORY_SKILLS } from './constants';
import { getActiveSkillsForPrompt } from './skill-filter';

export interface WizardSnapshot {
  'Company & Product': string;
  Feature: string;
  'Current State': string;
  'Design System': string;
  'Voice & Writing': string;
  'Deliverables & Constraints': string;
}

export interface ContextSnapshot {
  mandatorySkills: Array<{ name: string; invocation: string; description: string }>;
  sharedSkills: Array<{ id: string; name: string; description: string; content: string }>;
  customSkills: Array<{ id: string; name: string; content: string }>;
  sharedMemories: Array<{ id: string; name: string; description: string; content: string }>;
  customMemories: Array<{ id: string; name: string; content: string }>;
}

export interface PromptGenerationPayload {
  wizardSnapshot: WizardSnapshot;
  contextSnapshot: ContextSnapshot;
}

/**
 * Pick the user-meaningful text out of a FormFieldData. The wizard stores URLs,
 * pasted text, and file references in one shape; Claude only needs the text.
 */
function fieldToText(field: FormFieldData): string {
  const parts: string[] = [];
  if (field.urlValue) parts.push(`Reference URL: ${field.urlValue}`);
  if (field.textValue) parts.push(field.textValue);
  if (field.files && field.files.length > 0) {
    parts.push(
      `Attached files: ${field.files.map((f) => f.name).join(', ')}`,
    );
  }
  if (field.additionalContext) parts.push(field.additionalContext);
  return parts.join('\n\n');
}

function currentImplementationToText(data: CurrentImplementationData): string {
  const parts: string[] = [];
  const base = fieldToText(data);
  if (base) parts.push(base);
  if (data.figmaLinks && data.figmaLinks.length > 0) {
    parts.push(`Figma links:\n${data.figmaLinks.map((l) => `- ${l}`).join('\n')}`);
  }
  parts.push(
    `Implementation mode: ${data.implementationMode === 'add-on-top' ? 'Add on top of existing app' : 'Full redesign'}`,
  );
  return parts.join('\n\n');
}

function joinSections(sections: Array<[string, string]>): string {
  return sections
    .filter(([, body]) => body.trim().length > 0)
    .map(([label, body]) => `## ${label}\n${body}`)
    .join('\n\n');
}

/**
 * Build the payload that the `prompt-generator-start` edge function expects.
 *
 * Shape choices:
 * - `wizardSnapshot` maps directly to the 8-step wizard. The server renders
 *   each key as a top-level `# <section>` markdown heading in the user
 *   message. Keeping this flat means reshuffling wizard steps doesn't
 *   require an edge-function change.
 * - `contextSnapshot` carries resolved memory/skill content so the server
 *   never has to re-query the DB for what the user already selected.
 */
export function buildPromptGenerationPayload(
  prompt: Prompt,
  sharedSkills: SharedSkill[],
  sharedMemories: SharedMemory[],
): PromptGenerationPayload {
  const wizardSnapshot: WizardSnapshot = {
    'Company & Product': joinSections([
      ['Company', fieldToText(prompt.companyInfo)],
      ['Product', fieldToText(prompt.productInfo)],
    ]),
    Feature: fieldToText(prompt.featureInfo),
    'Current State': joinSections([
      ['Existing app / redesign', currentImplementationToText(prompt.currentImplementation)],
      ['UX research findings', fieldToText(prompt.uxResearch)],
      ['Prior prototypes or wireframes', fieldToText(prompt.prototypeSketches)],
    ]),
    'Design System': joinSections([
      ['Target Figma file (write destination)', fieldToText(prompt.figmaFileLink)],
      ['Storybook', fieldToText(prompt.designSystemStorybook)],
      ['NPM package', fieldToText(prompt.designSystemNpm)],
      ['Reference Figma (read-only)', fieldToText(prompt.designSystemFigma)],
    ]),
    'Voice & Writing': fieldToText(prompt.uxWriting),
    'Deliverables & Constraints': [
      `Accessibility level: ${prompt.accessibilityLevel}`,
      `Browser compatibility: ${prompt.browserCompatibility.join(', ') || 'none specified'}`,
      `Output directory: ${prompt.outputDirectory}`,
      prompt.externalResourcesAccessible
        ? 'External resources (URLs, Figma, Storybook) are accessible in the execution environment.'
        : 'External resources may NOT be accessible — plan for a fallback.',
    ].join('\n'),
  };

  const activeMandatoryNames = new Set(
    getActiveSkillsForPrompt(prompt).map((s) => s.name),
  );
  const mandatorySkills = MANDATORY_SKILLS
    .filter((s) => activeMandatoryNames.has(s.name))
    .map((s) => ({
      name: s.name,
      invocation: s.invocation,
      description: s.description,
    }));

  const sharedSkillContent = prompt.selectedSharedSkillIds
    .map((id) => sharedSkills.find((s) => s.id === id))
    .filter((s): s is SharedSkill => s !== undefined)
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      content: s.urlValue || (s.fileContent ? `File: ${s.fileContent.name}` : ''),
    }));

  const customSkillPayload = prompt.customSkills.map((s) => ({
    id: s.id,
    name: s.name,
    content: s.urlValue || (s.fileContent ? `File: ${s.fileContent.name}` : ''),
  }));

  const sharedMemoryContent = prompt.selectedSharedMemoryIds
    .map((id) => sharedMemories.find((m) => m.id === id))
    .filter((m): m is SharedMemory => m !== undefined)
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      content: m.content,
    }));

  const customMemoryPayload = prompt.customMemories.map((m) => ({
    id: m.id,
    name: m.name,
    content: m.content,
  }));

  const contextSnapshot: ContextSnapshot = {
    mandatorySkills,
    sharedSkills: sharedSkillContent,
    customSkills: customSkillPayload,
    sharedMemories: sharedMemoryContent,
    customMemories: customMemoryPayload,
  };

  return { wizardSnapshot, contextSnapshot };
}
