import type { Prompt, SharedSkill } from '../types';
import { getActiveSkillsForPrompt } from '../skill-filter';
import { MANDATORY_SKILLS, DESIGN_SYSTEM_MEMORY_IDS } from '../constants';
import { normalizeNpmPackage } from './npm-utils';
import { isFigmaUrl } from './url-utils';

/** Look up a mandatory skill's invocation by name. Falls back to `/name` if not found. */
function inv(name: string): string {
  return MANDATORY_SKILLS.find(s => s.name === name)?.invocation ?? `/${name}`;
}

function buildSkillsPreamble(project: Prompt, sharedSkills: SharedSkill[]): string {
  const activeSkills = getActiveSkillsForPrompt(project);
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

export function buildWorkflowSection(project: Prompt, sharedSkills: SharedSkill[] = []): string {
  const hasFigma = !!(project.figmaFileLink.urlValue || project.figmaFileLink.files.length > 0);
  const hasDesignFigma = !!(project.designSystemFigma.urlValue || project.designSystemFigma.files.length > 0);
  const protoUrl = project.prototypeSketches.urlValue;
  const hasPrototypeFigma = !!protoUrl && isFigmaUrl(protoUrl);
  const hasSourceFigma = !!(project.currentImplementation.figmaLinks.length > 0 || project.designSystemFigma.urlValue || project.designSystemFigma.files.length > 0) || hasPrototypeFigma;
  const hasImplContent = !!(
    project.currentImplementation.urlValue ||
    project.currentImplementation.files.length > 0 ||
    project.currentImplementation.textValue ||
    project.currentImplementation.figmaLinks.length > 0
  );
  const isAddOnTop = project.currentImplementation.implementationMode === 'add-on-top' && hasImplContent;
  const hasScreenshots = project.currentImplementation.files.length > 0 || !!project.currentImplementation.urlValue;
  const implUrl = project.currentImplementation.urlValue;
  const hasUrl = !!implUrl;
  const hasImplFigma = hasUrl && isFigmaUrl(implUrl);
  const hasStorybookUrl = !!project.designSystemStorybook.urlValue;
  const hasStorybookMemory = (project.selectedSharedMemoryIds ?? []).some(
    (id) => DESIGN_SYSTEM_MEMORY_IDS.includes(id),
  );
  const hasStorybook = hasStorybookUrl || hasStorybookMemory;
  const hasNpm = !!(project.designSystemNpm.textValue || project.designSystemNpm.urlValue);
  const npmPkg = normalizeNpmPackage(project.designSystemNpm.textValue || project.designSystemNpm.urlValue || '');
  const hasPrototypeUrl = !!protoUrl && !hasPrototypeFigma;
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
  lines.push(`${step++}. Initialize the repository: if already inside a git repo, create a new branch from current HEAD: \`git checkout -b feat/${slug}\`. If not in a git repo, run \`git init\` first. Only create \`.gitignore\` if one does not already exist — include: \`node_modules/\`, \`.DS_Store\`, \`*.log\`, \`dist/\``);
  lines.push(`${step++}. Run \`mkdir -p ./assets ./output ./output/assets\` to create the working and output directories.`);
  if (hasNpm) {
    lines.push(`${step++}. Run \`npm i ${npmPkg}\` to install the design system package. If installation fails (package not found or network error), skip and proceed — use the Storybook inventory or CDN references instead.`);
  }
  if (hasUrl) {
    if (hasImplFigma) {
      lines.push(`${step++}. Use Figma MCP tools (\`get_design_context\`, \`get_screenshot\`) to extract the current implementation from the Figma URL in <current-implementation>. Save screenshots to \`./assets/screenshots/\`. If Figma MCP is unavailable, proceed using the embedded context and descriptions in this prompt.`);
    } else {
      lines.push(`${step++}. Use Playwright MCP (preferred) or WebFetch to visit the URL listed in <current-implementation>. If Playwright MCP is available, capture full-page screenshots and save to \`./assets/screenshots/[screen-name].png\`. If the URL is inaccessible, proceed using the embedded context and descriptions in this prompt.`);
    }
  }
  if (hasStorybookUrl) {
    lines.push(`${step++}. Use Playwright MCP (preferred) or WebFetch to crawl the Storybook at the URL listed in <design-system>. Visit the sidebar navigation to enumerate all components, then visit each component's docs page. Extract component names, props, variants, and code examples. Save a complete design system inventory to \`./assets/design-system-inventory.md\`. If the URL is inaccessible, proceed using any NPM package documentation or embedded context.`);
  } else if (hasStorybookMemory) {
    lines.push(`${step++}. Read the design system component inventory provided in the \`<memories>\` section. Use it as the authoritative reference for available components, props, tokens, and usage patterns.`);
  }
  if (hasFigma) {
    lines.push(`${step++}. Verify the **Claude-to-Figma** MCP plugin is available: check that \`generate_figma_design\` exists in available tools. If unavailable, note Figma output will be skipped.`);
  }
  if (isAddOnTop && hasUrl) {
    lines.push(`${step++}. **Document the existing UI thoroughly**: Visit the reference URL in <current-implementation> and catalog every screen, layout section, navigation element, and interactive component. Save findings to \`./assets/existing-ui-analysis.md\`. This analysis is the baseline you MUST reconstruct before adding new features.`);
  }
  lines.push(`${step++}. Read all provided context (company, product, feature info)`);
  if (hasPrototypeUrl) {
    lines.push(`${step++}. Visit the prototype at \`${protoUrl}\` using Playwright MCP or WebFetch. Document all screens, states, and interactions found. Save findings to \`./assets/prototype-analysis.md\`. If inaccessible, use the wireframe descriptions in <prototypes>.`);
  }
  if (hasPrototypeFigma) {
    lines.push(`${step++}. Use Figma MCP tools (\`get_design_context\`, \`get_screenshot\`) to extract design specs from the Figma prototype at \`${protoUrl}\`. Document screens, interactions, and design patterns found. Save findings to \`./assets/prototype-analysis.md\`. If Figma MCP is unavailable, use the wireframe descriptions in <prototypes>.`);
  }
  // Figma extraction BEFORE brainstorming
  if (hasSourceFigma) {
    lines.push(`${step++}. If Figma MCP read tools are available, use ${inv('implement-design')} to extract design specs from the **Figma reference files** listed in \`<current-implementation>\` and \`<design-system>\`. If Figma URLs are inaccessible or the tool is unavailable, rely on the wireframe descriptions in <prototypes> and the design tokens in <design-direction>.`);
    lines.push(`${step++}. Use ${inv('create-design-system-rules')} to establish design system rules based on the extracted specs (or embedded context if Figma was unavailable)`);
  }
  lines.push(`${step++}. Use ${inv('brainstorming')} to explore approach and requirements`);

  // Checkpoint
  lines.push(`${step++}. **CHECKPOINT**: Present findings to user before continuing:`);
  lines.push('   - Screens/flows identified to build');
  lines.push('   - Inaccessible URLs (if any)');
  lines.push('   - Assumptions made');
  lines.push('   - Proposed approach');
  if (hasPrototypeUrl || hasPrototypeFigma) {
    lines.push('   - Prototype screens and interactions documented: [list key screens found]');
  }
  if (hasSourceFigma || hasPrototypeFigma) {
    lines.push('   - Figma access: [which URLs were accessible vs. inaccessible]');
    lines.push('   - Design patterns extracted: [key patterns, tokens, components found]');
  }
  lines.push('   Wait for user confirmation before proceeding to Phase 2.');

  // Phase 2: Planning
  lines.push('');
  lines.push('### Phase 2: Planning');
  if (!isLite) {
    lines.push(`${step++}. Analyze all context to generate comprehensive user stories`);
  }
  lines.push(`${step++}. Use ${inv('writing-plans')} to create a detailed implementation plan`);
  if (isAddOnTop && hasScreenshots) {
    lines.push(`${step++}. **REQUIRED**: Use ${inv('screenshot-overlay-positioning')} to analyze the existing UI screenshots. Extract exact pixel coordinates for: sidebar boundaries, header/toolbar positions, content area bounds, and all interactive element locations. Use these coordinates to position new elements precisely within the existing layout.`);
  }

  // Phase 3: Build
  lines.push('');
  lines.push('### Phase 3: Build');
  if (isAddOnTop) {
    lines.push(`${step++}. **FIRST — Recreate the existing UI**: Before building any new features, faithfully reconstruct every screen from the existing implementation reference. The output must visually match the current UI. Only proceed to new features after the existing UI is complete.`);
  }
  if (hasStorybook || hasNpm) {
    const inventoryRef = hasStorybookUrl
      ? '`./assets/design-system-inventory.md`'
      : hasStorybookMemory
        ? 'the component inventory in `<memories>`'
        : 'the NPM package documentation';
    lines.push(`${step++}. **Design system enforcement**: For EVERY UI element you are about to create, FIRST check ${inventoryRef} for a matching component. If a design system component exists, you MUST use it. Do NOT create custom HTML/CSS alternatives.`);
  }
  if (hasStorybookUrl) {
    lines.push(`${step++}. Use ${inv('executing-plans')} to implement the plan (static mockups as HTML/CSS/JS). FIRST check the design system inventory before writing any UI element — do NOT create custom alternatives when a component exists.`);
  } else if (hasStorybookMemory) {
    lines.push(`${step++}. Use ${inv('executing-plans')} to implement the plan (static mockups as HTML/CSS/JS). FIRST check the component inventory in \`<memories>\` before writing any UI element — do NOT create custom alternatives when a component exists.`);
  } else if (hasNpm) {
    lines.push(`${step++}. Use ${inv('executing-plans')} to implement the plan (static mockups as HTML/CSS/JS). FIRST check the NPM package documentation before writing any UI element — do NOT create custom alternatives when a component exists.`);
  } else {
    lines.push(`${step++}. Use ${inv('executing-plans')} to implement the plan (static mockups as HTML/CSS/JS).`);
  }
  if (interactionLevel === 'click-through') {
    lines.push(`${step++}. Build click-through flows with basic navigation between pages`);
  } else if (interactionLevel === 'full-prototype') {
    lines.push(`${step++}. Build interactive prototypes with flows, transitions, and micro-interactions`);
  }
  lines.push(`${step++}. Link user stories to their relevant HTML file/screen in the prototype output`);
  if (hasFigma) {
    lines.push(`${step++}. Use the **Claude-to-Figma** plugin (\`generate_figma_design\` tool) to write completed designs to the Figma target file. Do this ONLY after all HTML prototype files are done and verified. If Figma authentication failed in Phase 1, skip this step and inform the user.`);
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
  if (isAddOnTop) {
    lines.push('   - **Existing UI faithfully recreated** — every screen from the reference matches the original');
  }
  if (hasStorybook || hasNpm) {
    lines.push('   - **Design system components used for ALL matching UI elements** — no custom HTML/CSS recreations of components that exist in the design system');
  }
  lines.push('   - No placeholder content or lorem ipsum remains');
  if (interactionLevel === 'full-prototype') {
    lines.push('   - CSS transitions and micro-interactions work smoothly');
  }
  if (hasFigma) {
    lines.push('   - Figma target file populated with all design frames (via Claude-to-Figma plugin)');
  }
  if (!isLite) {
    lines.push('   - Responsive layouts verified: desktop (primary), tablet (required), mobile (stretch)');
  }
  if (accessibilityLevel !== 'none') {
    const wcagLabel = accessibilityLevel === 'wcag-aa' ? 'WCAG 2.1 AA' : 'WCAG 2.1 AAA';
    lines.push(`   - ${wcagLabel} compliance: ARIA labels, keyboard nav, color contrast, semantic HTML`);
  }
  if (browsers.length > 1) {
    lines.push(`   - Cross-browser compatible CSS/JS verified for: ${browsers.join(', ')}`);
  }
  lines.push('   - All files committed to git');

  if (hasDesignFigma) {
    lines.push(`${step++}. If the prototype uses a component framework and Figma MCP is available, use ${inv('code-connect-components')} to map components to their Figma counterparts for developer handoff. For vanilla HTML/JS prototypes, skip this step.`);
  }
  if (!isLite) {
    lines.push(`${step++}. Create \`CLAUDE.md\` in the repository root directory (same level as \`.git/\`) with: Project Context (requirements, design decisions), Design System (tokens, components used), Implementation Notes (tech decisions, dependencies, limitations)`);
  }
  lines.push(`${step++}. Use ${inv('finishing-a-development-branch')} to complete the work`);

  return lines.join('\n');
}
