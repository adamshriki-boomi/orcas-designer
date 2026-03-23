import { buildWorkflowSection } from './workflow-section'
import { createTestProject, createProjectWithFigma, createProjectWithDesignSystem, createProjectWithCurrentImpl, createFullProject, createTestSharedSkill, createProjectWithStorybookMemory, createProjectWithPrototypeFigma } from '@/test/helpers/project-fixtures'
import { emptyFormField, emptyCurrentImplementation } from '@/lib/types'

describe('buildWorkflowSection', () => {
  it('includes all four phase headers and brainstorming invocation for a minimal project', () => {
    const project = createTestProject()
    const result = buildWorkflowSection(project)
    expect(result).toContain('### Phase 1: Research & Discovery')
    expect(result).toContain('### Phase 2: Planning')
    expect(result).toContain('### Phase 3: Build')
    expect(result).toContain('### Phase 4: Verify & Wrap Up')
    expect(result).toContain('/brainstorming')
  })

  it('includes storybook crawl step when storybook URL is set', () => {
    const project = createProjectWithDesignSystem()
    const result = buildWorkflowSection(project)
    expect(result).toContain('crawl the Storybook')
    expect(result).toContain('design-system-inventory.md')
  })

  it('includes Claude-to-Figma verify step when figma target is set', () => {
    const project = createProjectWithFigma()
    const result = buildWorkflowSection(project)
    expect(result).toContain('Claude-to-Figma')
    expect(result).toContain('generate_figma_design')
    expect(result).toContain('Verify')
    expect(result).not.toContain('Install and authenticate')
  })

  it('includes implement-design skill step when source figma is present', () => {
    const project = createProjectWithCurrentImpl()
    const result = buildWorkflowSection(project)
    expect(result).toContain('/implement-design')
    expect(result).toContain('/create-design-system-rules')
  })

  it('includes click-through flows step for click-through interaction level', () => {
    const project = createTestProject({ interactionLevel: 'click-through' })
    const result = buildWorkflowSection(project)
    expect(result).toContain('click-through flows')
  })

  it('includes interactive prototypes step for full-prototype interaction level', () => {
    const project = createTestProject({ interactionLevel: 'full-prototype' })
    const result = buildWorkflowSection(project)
    expect(result).toContain('interactive prototypes')
  })

  it('does not include user stories step in Phase 2 for lite mode', () => {
    const project = createTestProject({ promptMode: 'lite' })
    const result = buildWorkflowSection(project)
    expect(result).not.toContain('comprehensive user stories')
    expect(result).not.toContain('CLAUDE.md')
  })

  it('includes WCAG verification checklist item when accessibility is set', () => {
    const project = createTestProject({ accessibilityLevel: 'wcag-aa' })
    const result = buildWorkflowSection(project)
    expect(result).toContain('WCAG 2.1 AA compliance')
  })

  it('includes cross-browser verification for multiple browsers', () => {
    const project = createTestProject({ browserCompatibility: ['chrome', 'firefox', 'safari'] })
    const result = buildWorkflowSection(project)
    expect(result).toContain('Cross-browser compatible CSS/JS')
    expect(result).toContain('chrome, firefox, safari')
  })

  it('includes memory read step when only storybook memory is selected (no URL)', () => {
    const project = createProjectWithStorybookMemory()
    const result = buildWorkflowSection(project)
    expect(result).toContain('design system component inventory')
    expect(result).toContain('`<memories>` section')
    expect(result).not.toContain('crawl the Storybook')
  })

  it('prefers URL crawl over memory when storybook URL is present with memory', () => {
    const project = createProjectWithStorybookMemory({
      designSystemStorybook: {
        ...emptyFormField(),
        urlValue: 'https://storybook.example.com',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('crawl the Storybook')
    expect(result).not.toContain('Read the design system component inventory provided in the `<memories>` section')
  })

  it('normalizes NPM package name in install command', () => {
    const project = createTestProject({
      designSystemNpm: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: 'npm install @boomi/exosphere',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('npm i @boomi/exosphere')
    expect(result).not.toContain('npm i npm install')
  })

  it('slugifies the project name for the git branch name', () => {
    const project = createTestProject({ name: 'My Cool Design Project' })
    const result = buildWorkflowSection(project)
    expect(result).toContain('feat/my-cool-design-project')
  })

  it('uses Figma MCP instead of Playwright when current implementation URL is a Figma URL', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://www.figma.com/design/abc/Current',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('Figma MCP tools')
    expect(result).toContain('get_design_context')
    expect(result).not.toContain('Use Playwright MCP (preferred) or WebFetch to visit the URL')
  })

  it('uses Playwright for non-Figma current implementation URL', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('Use Playwright MCP (preferred) or WebFetch to visit the URL')
    expect(result).not.toContain('Figma MCP tools (`get_design_context`')
  })

  it('adds Figma extraction step when prototype URL is a Figma URL', () => {
    const project = createProjectWithPrototypeFigma()
    const result = buildWorkflowSection(project)
    expect(result).toContain('Figma MCP tools')
    expect(result).toContain('proto123')
    expect(result).toContain('prototype-analysis.md')
  })

  it('does not add Figma extraction step for non-Figma prototype URL', () => {
    const project = createTestProject({
      prototypeSketches: {
        ...emptyFormField(),
        urlValue: 'https://prototype.example.com',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('Visit the prototype')
    expect(result).not.toContain('Figma MCP tools (`get_design_context`, `get_screenshot`) to extract design specs from the Figma prototype')
  })

  it('includes Figma access status in checkpoint when source Figma is present', () => {
    const project = createProjectWithCurrentImpl()
    const result = buildWorkflowSection(project)
    expect(result).toContain('Figma access:')
    expect(result).toContain('Design patterns extracted:')
  })

  it('includes Figma access status in checkpoint when prototype Figma is present', () => {
    const project = createProjectWithPrototypeFigma()
    const result = buildWorkflowSection(project)
    expect(result).toContain('Figma access:')
    expect(result).toContain('Design patterns extracted:')
  })

  it('does not include Figma checkpoint bullets when no Figma sources', () => {
    const project = createTestProject()
    const result = buildWorkflowSection(project)
    expect(result).not.toContain('Figma access:')
    expect(result).not.toContain('Design patterns extracted:')
  })

  it('references <memories> instead of inventory file when using storybook memory in build step', () => {
    const project = createProjectWithStorybookMemory()
    const result = buildWorkflowSection(project)
    expect(result).toContain('component inventory in `<memories>`')
    expect(result).not.toContain('design-system-inventory.md')
  })

  it('references design-system-inventory.md when storybook URL is present in build step', () => {
    const project = createProjectWithDesignSystem()
    const result = buildWorkflowSection(project)
    expect(result).toContain('design-system-inventory.md')
  })

  it('omits component reference when no storybook at all in build step', () => {
    const project = createTestProject()
    const result = buildWorkflowSection(project)
    expect(result).not.toContain('design-system-inventory.md')
    expect(result).not.toContain('Reference the component inventory in `<memories>`')
  })

  it('includes existing UI reconstruction step in Phase 3 for add-on-top mode', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'add-on-top',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('FIRST — Recreate the existing UI')
    expect(result).toContain('faithfully reconstruct every screen')
  })

  it('includes design system enforcement step when storybook memory is present', () => {
    const project = createProjectWithStorybookMemory()
    const result = buildWorkflowSection(project)
    expect(result).toContain('Design system enforcement')
    expect(result).toContain('FIRST check')
    expect(result).toContain('MUST use it')
  })

  it('includes add-on-top verification item in Phase 4', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'add-on-top',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('Existing UI faithfully recreated')
  })

  it('includes design system verification item in Phase 4 when storybook is present', () => {
    const project = createProjectWithStorybookMemory()
    const result = buildWorkflowSection(project)
    expect(result).toContain('Design system components used for ALL matching UI elements')
  })

  it('does not include add-on-top steps for redesign mode', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'redesign',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).not.toContain('FIRST — Recreate the existing UI')
    expect(result).not.toContain('Existing UI faithfully recreated')
  })

  it('uses stronger build step language with design system inventory', () => {
    const project = createProjectWithDesignSystem()
    const result = buildWorkflowSection(project)
    expect(result).toContain('FIRST check the design system inventory')
    expect(result).toContain('do NOT create custom alternatives')
  })

  it('includes existing-ui-analysis.md step in Phase 1 for add-on-top with URL', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'add-on-top',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('Document the existing UI thoroughly')
    expect(result).toContain('existing-ui-analysis.md')
  })

  it('includes design system reminder in executing-plans step for NPM-only scenario', () => {
    const project = createTestProject({
      designSystemNpm: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: '@example/design-system',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('FIRST check the NPM package documentation')
    expect(result).toContain('do NOT create custom alternatives')
  })

  it('uses REQUIRED language for screenshot-overlay-positioning in Phase 2', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'add-on-top',
      },
    })
    const result = buildWorkflowSection(project)
    expect(result).toContain('REQUIRED')
    expect(result).toContain('screenshot-overlay-positioning')
    expect(result).toContain('exact pixel coordinates')
  })
})
