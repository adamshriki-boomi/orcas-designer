import type { Project, SharedSkill } from '../types';
import { getActiveSkillsForProject } from '../skill-filter';
import { MANDATORY_SKILLS } from '../constants';

/** Look up a mandatory skill's invocation by name. Falls back to `/name` if not found. */
function inv(name: string): string {
  return MANDATORY_SKILLS.find(s => s.name === name)?.invocation ?? `/${name}`;
}

function buildSkillsPreamble(project: Project, sharedSkills: SharedSkill[]): string {
  const activeSkills = getActiveSkillsForProject(project);
  const categories = [...new Set(activeSkills.map(s => s.category))];

  const lines: string[] = ['**Available skills for this project:**'];

  for (const category of categories) {
    const skills = activeSkills.filter(s => s.category === category);
    for (const skill of skills) {
      lines.push(`[${category}]: \`${skill.invocation}\` — ${skill.description}`);
    }
  }

  // Shared skills
  const selectedShared = sharedSkills.filter(s =>
    project.selectedSharedSkillIds.includes(s.id)
  );
  if (selectedShared.length > 0) {
    for (const skill of selectedShared) {
      const ref = skill.type === 'url' && skill.urlValue
        ? skill.urlValue
        : skill.type === 'file' && skill.fileContent
          ? `(file: ${skill.fileContent.name})`
          : '';
      lines.push(`[Shared]: **${skill.name}** — ${skill.description || ref}`);
    }
  }

  // Custom skills
  if (project.customSkills.length > 0) {
    for (const skill of project.customSkills) {
      const ref = skill.type === 'url' && skill.urlValue
        ? skill.urlValue
        : skill.type === 'file' && skill.fileContent
          ? `(file: ${skill.fileContent.name})`
          : '';
      lines.push(`[Custom]: **${skill.name}** — ${ref}`);
    }
  }

  return lines.join('\n');
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function buildWorkflowSection(project: Project, sharedSkills: SharedSkill[] = []): string {
  const hasFigma = !!(project.figmaFileLink.urlValue || project.figmaFileLink.files.length > 0);
  const hasSourceFigma = !!(project.currentImplementation.figmaLinks.length > 0 || project.designSystemFigma.urlValue || project.designSystemFigma.files.length > 0);
  const isAddOnTop = project.currentImplementation.implementationMode === 'add-on-top';
  const hasScreenshots = project.currentImplementation.files.length > 0 || !!project.currentImplementation.urlValue;
  const hasUrl = !!project.currentImplementation.urlValue;
  const hasStorybook = !!project.designSystemStorybook.urlValue;
  const interactionLevel = project.interactionLevel ?? 'static';
  const isLite = project.promptMode === 'lite';
  const accessibilityLevel = project.accessibilityLevel ?? 'none';
  const browsers = project.browserCompatibility ?? ['chrome'];

  const lines: string[] = [
    '## EXECUTION WORKFLOW',
    '',
  ];

  // Skills preamble
  lines.push(buildSkillsPreamble(project, sharedSkills));
  lines.push('');
  lines.push('Follow these phases in order:');

  // Phase 1: Research & Discovery
  let step = 1;
  lines.push('');
  lines.push('### Phase 1: Research & Discovery');
  const slug = slugify(project.name);
  lines.push(`${step++}. Run \`git init\` and \`git checkout -b feat/${slug}\` to initialize a git repository on a feature branch. Create a \`.gitignore\` with: \`node_modules/\`, \`.DS_Store\`, \`*.log\`, \`dist/\``);
  if (hasUrl) {
    lines.push(`${step++}. Use Playwright MCP to visit the URL listed in <current-implementation>, capture full-page screenshots of all key screens and states, and save each to \`./assets/screenshots/[screen-name].png\`. These files will be used by ${inv('screenshot-overlay-positioning')} in Phase 2.`);
  }
  if (hasStorybook) {
    lines.push(`${step++}. Use Playwright MCP to crawl the Storybook at the URL listed in <design-system>. Visit the sidebar navigation to enumerate all components, then visit each component's docs page. Extract component names, props, variants, and code examples. Save a complete design system inventory to \`./assets/design-system-inventory.md\`.`);
  }
  lines.push(`${step++}. Read all provided context (company, product, feature info)`);
  lines.push(`${step++}. Use ${inv('brainstorming')} to explore approach and requirements`);
  if (hasSourceFigma) {
    lines.push(`${step++}. Use ${inv('implement-design')} to extract design specs from the **Figma reference files** listed in \`<current-implementation>\` and \`<design-system>\``);
    lines.push(`${step++}. Use ${inv('create-design-system-rules')} to establish design system rules based on the design`);
  }

  // Checkpoint
  lines.push(`${step++}. **CHECKPOINT**: Present findings to user before continuing:`);
  lines.push('   - Screens/flows identified to build');
  lines.push('   - Inaccessible URLs (if any)');
  lines.push('   - Assumptions made');
  lines.push('   - Proposed approach');
  lines.push('   Wait for user confirmation before proceeding to Phase 2.');

  // Phase 2: Planning
  lines.push('');
  lines.push('### Phase 2: Planning');
  if (!isLite) {
    lines.push(`${step++}. Analyze all context to generate comprehensive user stories`);
  }
  lines.push(`${step++}. Use ${inv('writing-plans')} to create a detailed implementation plan`);
  if (isAddOnTop && hasScreenshots) {
    lines.push(`${step++}. Use ${inv('screenshot-overlay-positioning')} to analyze current UI and position new elements`);
  }

  // Phase 3: Build
  lines.push('');
  lines.push('### Phase 3: Build');
  lines.push(`${step++}. Use ${inv('executing-plans')} to implement the plan (static mockups as HTML/CSS/JS)`);
  if (interactionLevel === 'click-through') {
    lines.push(`${step++}. Build click-through flows with basic navigation between pages`);
  } else if (interactionLevel === 'full-prototype') {
    lines.push(`${step++}. Build interactive prototypes with flows, transitions, and micro-interactions`);
  }
  lines.push(`${step++}. Link user stories to their relevant HTML file/screen in the prototype output`);
  if (hasFigma) {
    lines.push(`${step++}. Use the Figma MCP \`generate_figma_design\` tool to write completed designs to the Figma target file. Do this ONLY after all HTML prototype files are done and verified.`);
  }

  // Phase 4: Verify & Wrap Up
  lines.push('');
  lines.push('### Phase 4: Verify & Wrap Up');
  lines.push(`${step++}. Use ${inv('verification-before-completion')} to verify all work`);
  lines.push('   Verify against this checklist:');
  lines.push('   - All HTML files open in browser with no broken layouts');
  lines.push('   - All interactive flows work — no broken links or JS errors');
  lines.push('   - All UI states present: default, hover, active, disabled, error, loading, empty');
  lines.push('   - Design system tokens and components used consistently');
  lines.push('   - No placeholder content or lorem ipsum remains');
  if (interactionLevel === 'full-prototype') {
    lines.push('   - CSS transitions and micro-interactions work smoothly');
  }
  if (hasFigma) {
    lines.push('   - Figma target file populated with all design frames');
  }
  if (!isLite) {
    lines.push('   - Responsive layouts verified at desktop, tablet, and mobile widths');
  }
  if (accessibilityLevel !== 'none') {
    const wcagLabel = accessibilityLevel === 'wcag-aa' ? 'WCAG 2.1 AA' : 'WCAG 2.1 AAA';
    lines.push(`   - ${wcagLabel} compliance: ARIA labels, keyboard nav, color contrast, semantic HTML`);
  }
  if (browsers.length > 1) {
    lines.push(`   - Tested in all target browsers: ${browsers.join(', ')}`);
  }
  lines.push('   - All files committed to git');

  if (!isLite) {
    lines.push(`${step++}. Create \`./CLAUDE.md\` in the **git root** (the directory where \`git init\` was run) with: Project Context (requirements, design decisions), Design System (tokens, components used), Implementation Notes (tech decisions, dependencies, limitations)`);
  }
  lines.push(`${step++}. Use ${inv('finishing-a-development-branch')} to complete the work`);

  return lines.join('\n');
}
