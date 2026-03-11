import type { Project, SharedSkill, SharedMemory } from './types';
import { buildContextSection } from './prompt-sections/context-section';
import { buildImplementationSection } from './prompt-sections/implementation-section';
import { buildFigmaSection } from './prompt-sections/figma-section';
import { buildDesignSystemSection } from './prompt-sections/design-system-section';
import { buildPrototypeSection } from './prompt-sections/prototype-section';
import { buildOutputTypeSection } from './prompt-sections/output-type-section';
import { buildUserStoriesSection } from './prompt-sections/user-stories-section';
import { buildMemorySection } from './prompt-sections/memory-section';
import { buildWorkflowSection } from './prompt-sections/workflow-section';
import { buildFallbackSection } from './prompt-sections/fallback-section';
import { buildDesignDirectionSection } from './prompt-sections/design-direction-section';
import { buildRequirementsSection } from './prompt-sections/requirements-section';

function wrapXml(tag: string, content: string): string {
  if (!content) return '';
  return `<${tag}>\n${content}\n</${tag}>`;
}

function hasAnyFileAttachments(project: Project): boolean {
  const fields = [
    project.companyInfo,
    project.productInfo,
    project.featureInfo,
    project.currentImplementation,
    project.figmaFileLink,
    project.designSystemStorybook,
    project.designSystemNpm,
    project.designSystemFigma,
    project.prototypeSketches,
  ];
  return fields.some(f => f.files.length > 0);
}

function buildQuickReference(project: Project): string {
  const hasFigma = !!(project.figmaFileLink.urlValue || project.figmaFileLink.files.length > 0);
  const interactionLevel = project.interactionLevel ?? 'static';
  const interactionLabels: Record<string, string> = {
    'static': 'Static Mockups',
    'click-through': 'Click-through Flows',
    'full-prototype': 'Full Interactive Prototype',
  };

  const hasDs = !!(
    project.designSystemStorybook.urlValue || project.designSystemStorybook.files.length > 0 ||
    project.designSystemNpm.urlValue || project.designSystemNpm.textValue ||
    project.designSystemFigma.urlValue || project.designSystemFigma.files.length > 0
  );

  const lines: string[] = [
    `- Project: ${project.name}`,
    `- Output: HTML/CSS/JS prototype${hasFigma ? ' + Figma' : ''}`,
    `- Output dir: ${project.outputDirectory || './output/'}`,
    `- Interaction: ${interactionLabels[interactionLevel] ?? interactionLevel}`,
  ];

  if (hasDs) {
    lines.push('- Design system: provided (see Design System section)');
  }

  const accessibility = project.accessibilityLevel ?? 'none';
  if (accessibility !== 'none') {
    lines.push(`- Accessibility: ${accessibility === 'wcag-aa' ? 'WCAG 2.1 AA' : 'WCAG 2.1 AAA'}`);
  }

  return lines.join('\n');
}

export function generatePrompt(project: Project, sharedSkills: SharedSkill[], sharedMemories: SharedMemory[] = []): string {
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
    wrapXml('current-implementation', buildImplementationSection(project)),
    wrapXml('figma-target', buildFigmaSection(project)),
    wrapXml('design-system', buildDesignSystemSection(project)),
    wrapXml('prototypes', buildPrototypeSection(project)),
    wrapXml('design-direction', buildDesignDirectionSection(project)),
    wrapXml('output-requirements', buildOutputTypeSection(project)),
    wrapXml('requirements', buildRequirementsSection(project)),
    wrapXml('user-stories', buildUserStoriesSection(project)),
    wrapXml('memories', buildMemorySection(project, sharedMemories)),
    wrapXml('execution-workflow', buildWorkflowSection(project, sharedSkills)),
  ].filter(Boolean);

  return sections.join('\n\n');
}
