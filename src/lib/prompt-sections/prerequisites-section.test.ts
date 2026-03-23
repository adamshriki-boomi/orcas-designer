import { buildPrerequisitesSection } from './prerequisites-section'
import { createTestProject, createProjectWithFigma, createProjectWithCurrentImpl, createProjectWithDesignSystem, createFullProject } from '@/test/helpers/project-fixtures'
import { emptyFormField, emptyCurrentImplementation } from '@/lib/types'

describe('buildPrerequisitesSection', () => {
  it('returns empty string for a minimal project with no MCP needs', () => {
    const project = createTestProject()
    expect(buildPrerequisitesSection(project)).toBe('')
  })

  it('lists Figma MCP when figma target is set', () => {
    const project = createProjectWithFigma()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Figma MCP plugin')
    expect(result).toContain('generate_figma_design')
  })

  it('lists Figma MCP for read when source figma links exist', () => {
    const project = createProjectWithCurrentImpl()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Figma MCP plugin')
    expect(result).toContain('get_design_context')
  })

  it('lists Playwright MCP when non-Figma current implementation URL exists', () => {
    const project = createTestProject({
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
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://www.figma.com/design/abc/Current',
      },
    })
    const result = buildPrerequisitesSection(project)
    expect(result).not.toContain('Playwright MCP')
  })

  it('lists Playwright MCP when storybook URL exists', () => {
    const project = createProjectWithDesignSystem()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Playwright MCP')
    expect(result).toContain('Storybook')
  })

  it('lists Google Docs MCP when feature info is a Google Docs URL', () => {
    const project = createTestProject({
      featureInfo: {
        ...emptyFormField(),
        urlValue: 'https://docs.google.com/document/d/abc123/edit',
      },
    })
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Google Docs MCP')
  })

  it('lists all three MCP tools for a full project', () => {
    const project = createFullProject()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('Figma MCP plugin')
    expect(result).toContain('Playwright MCP')
  })

  it('includes fallback note', () => {
    const project = createProjectWithFigma()
    const result = buildPrerequisitesSection(project)
    expect(result).toContain('fallback instructions')
  })

  it('lists Figma MCP read when prototype URL is Figma', () => {
    const project = createTestProject({
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
