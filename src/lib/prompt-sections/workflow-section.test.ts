import { buildWorkflowSection } from './workflow-section'
import { createTestProject, createProjectWithFigma, createProjectWithDesignSystem, createProjectWithCurrentImpl, createFullProject, createTestSharedSkill } from '@/test/helpers/project-fixtures'
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

  it('includes Claude-to-Figma install step when figma target is set', () => {
    const project = createProjectWithFigma()
    const result = buildWorkflowSection(project)
    expect(result).toContain('Claude-to-Figma')
    expect(result).toContain('OAuth authentication flow')
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

  it('slugifies the project name for the git branch name', () => {
    const project = createTestProject({ name: 'My Cool Design Project' })
    const result = buildWorkflowSection(project)
    expect(result).toContain('feat/my-cool-design-project')
  })
})
