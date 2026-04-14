import type { Prompt, SharedSkill, SharedMemory } from './types';
import { DESIGN_SYSTEM_MEMORY_IDS } from './constants';
import { buildContextSection } from './prompt-sections/context-section';
import { buildImplementationSection } from './prompt-sections/implementation-section';
import { buildFigmaSection } from './prompt-sections/figma-section';
import { buildDesignSystemSection } from './prompt-sections/design-system-section';
import { buildUxResearchSection } from './prompt-sections/ux-research-section';
import { buildUxWritingSection } from './prompt-sections/ux-writing-section';
import { buildPrototypeSection } from './prompt-sections/prototype-section';
import { buildOutputTypeSection } from './prompt-sections/output-type-section';
import { buildUserStoriesSection } from './prompt-sections/user-stories-section';
import { buildMemorySection } from './prompt-sections/memory-section';
import { buildWorkflowSection } from './prompt-sections/workflow-section';
import { buildFallbackSection } from './prompt-sections/fallback-section';
import { buildDesignDirectionSection } from './prompt-sections/design-direction-section';
import { buildRequirementsSection } from './prompt-sections/requirements-section';
import { buildPrerequisitesSection } from './prompt-sections/prerequisites-section';
import { normalizeNpmPackage } from './prompt-sections/npm-utils';

function wrapXml(tag: string, content: string): string {
  if (!content) return '';
  return `<${tag}>\n${content}\n</${tag}>`;
}

function hasAnyFileAttachments(project: Prompt): boolean {
  const fields = [
    project.companyInfo,
    project.productInfo,
    project.featureInfo,
    project.currentImplementation,
    project.uxResearch,
    project.uxWriting,
    project.figmaFileLink,
    project.designSystemStorybook,
    project.designSystemNpm,
    project.designSystemFigma,
    project.prototypeSketches,
  ];
  return fields.some(f => f.files.length > 0);
}

function buildQuickReference(project: Prompt): string {
  const hasFigma = !!(project.figmaFileLink.urlValue || project.figmaFileLink.files.length > 0);
  const interactionLevel = project.interactionLevel ?? 'static';
  const interactionLabels: Record<string, string> = {
    'static': 'Static Mockups',
    'click-through': 'Click-through Flows',
    'full-prototype': 'Full Interactive Prototype',
  };

  const hasStorybookMemory = (project.selectedSharedMemoryIds ?? []).some(
    (id) => DESIGN_SYSTEM_MEMORY_IDS.includes(id),
  );

  const hasDs = !!(
    project.designSystemStorybook.urlValue || project.designSystemStorybook.files.length > 0 ||
    project.designSystemNpm.urlValue || project.designSystemNpm.textValue ||
    project.designSystemFigma.urlValue || project.designSystemFigma.files.length > 0 ||
    hasStorybookMemory
  );

  const lines: string[] = [
    `- Project: ${project.name}`,
    `- Output: HTML/CSS/JS prototype (primary)${hasFigma ? ' + Figma (via Claude-to-Figma plugin)' : ''}`,
    `- Output dir: ${project.outputDirectory || './output/'}`,
    `- Interaction: ${interactionLabels[interactionLevel] ?? interactionLevel}`,
  ];

  if (hasDs) {
    const dsDetails: string[] = [];
    const npmVal = project.designSystemNpm.textValue || project.designSystemNpm.urlValue;
    if (npmVal) dsDetails.push(normalizeNpmPackage(npmVal));
    if (project.designSystemStorybook.urlValue) {
      dsDetails.push(`Storybook: ${project.designSystemStorybook.urlValue}`);
    } else if (hasStorybookMemory) {
      dsDetails.push('Storybook: via memory');
    }
    if (project.designSystemFigma.urlValue) dsDetails.push('Figma reference');
    lines.push(`- Design system: ${dsDetails.length > 0 ? dsDetails.join(' | ') : 'provided (see Design System section)'}`);
  }

  const accessibility = project.accessibilityLevel ?? 'none';
  if (accessibility !== 'none') {
    lines.push(`- Accessibility: ${accessibility === 'wcag-aa' ? 'WCAG 2.1 AA' : 'WCAG 2.1 AAA'}`);
  }

  return lines.join('\n');
}

export function generatePrompt(project: Prompt, sharedSkills: SharedSkill[], sharedMemories: SharedMemory[] = []): string {
  const fileCallout = hasAnyFileAttachments(project)
    ? '> **Attached Files**: This brief references files by name.\n> Place all referenced files in a `./assets/` folder in your working directory before running.'
    : '';

  const sections = [
    `# Design & Development Brief for Claude Code`,
    `## Project: ${project.name}`,
    '',
    '---',
    fileCallout,
    wrapXml('quick-reference', buildQuickReference(project)),
    wrapXml('fallback-strategy', buildFallbackSection(project)),
    wrapXml('context', buildContextSection(project)),
    wrapXml('ux-research', buildUxResearchSection(project)),
    wrapXml('ux-writing-guidelines', buildUxWritingSection(project, sharedMemories)),
    wrapXml('current-implementation', buildImplementationSection(project)),
    wrapXml('figma-target', buildFigmaSection(project)),
    wrapXml('design-system', buildDesignSystemSection(project)),
    wrapXml('prototypes', buildPrototypeSection(project)),
    wrapXml('design-direction', buildDesignDirectionSection(project)),
    wrapXml('output-requirements', buildOutputTypeSection(project)),
    wrapXml('requirements', buildRequirementsSection(project)),
    wrapXml('user-stories', buildUserStoriesSection(project)),
    wrapXml('memories', buildMemorySection(project, sharedMemories)),
    wrapXml('prerequisites', buildPrerequisitesSection(project)),
    wrapXml('execution-workflow', buildWorkflowSection(project, sharedSkills)),
  ].filter(Boolean);

  return sections.join('\n\n');
}
