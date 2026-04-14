import { buildPrerequisitesSection } from './prerequisites-section'
import { createTestPrompt, createPromptWithFigma, createPromptWithCurrentImpl, createPromptWithDesignSystem, createFullPrompt } from '@/test/helpers/prompt-fixtures'
import { emptyFormField, emptyCurrentImplementation } from '@/lib/types'

describe('buildPrerequisitesSection', () => {
  it('returns empty string for a minimal project with no MCP needs', () => {
    const project = createTestPrompt()
    expect(buildPrerequisitesSection(project)).toBe('')
  })

  it('lists Figma MCP when figma target is set', () => {
    const project = createPromptWithFigma()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Figma MCP plugin')
    expect(result).toContain('generate_figma_design')
  })

  it('lists Figma MCP for read when source figma links exist', () => {
    const project = createPromptWithCurrentImpl()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Figma MCP plugin')
    expect(result).toContain('get_design_context')
  })

  it('lists Playwright MCP when non-Figma current implementation URL exists', () => {
    const project = createTestPrompt({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
      },
    })
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Playwright MCP')
    expect(result).toContain('current implementation URL')
  })

  it('does not list Playwright for Figma current implementation URL', () => {
    const project = createTestPrompt({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://www.figma.com/design/abc/Current',
      },
    })
    const result = buildPrerequisitesSection(project)
    expect(result).not.toContain('Playwright MCP')
  })

  it('lists Playwright MCP when storybook URL exists', () => {
    const project = createPromptWithDesignSystem()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Playwright MCP')
    expect(result).toContain('Storybook')
  })

  it('lists Google Docs MCP when feature info is a Google Docs URL', () => {
    const project = createTestPrompt({
      featureInfo: {
        ...emptyFormField(),
        urlValue: 'https://docs.google.com/document/d/abc123/edit',
      },
    })
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Google Docs MCP')
  })

  it('lists all three MCP tools for a full project', () => {
    const project = createFullPrompt()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Figma MCP plugin')
    expect(result).toContain('Playwright MCP')
  })

  it('includes fallback note', () => {
    const project = createPromptWithFigma()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('fallback instructions')
  })

  it('lists Figma MCP read when prototype URL is Figma', () => {
    const project = createTestPrompt({
      prototypeSketches: {
        ...emptyFormField(),
        urlValue: 'https://www.figma.com/proto/abc123/Prototype',
      },
    })
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Figma MCP plugin')
    expect(result).toContain('read design specs')
  })
})
