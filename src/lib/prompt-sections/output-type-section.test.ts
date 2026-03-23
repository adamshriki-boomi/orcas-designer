import { buildOutputTypeSection } from './output-type-section'
import { createTestProject, createProjectWithFigma, createProjectWithStorybookMemory } from '@/test/helpers/project-fixtures'
import { emptyCurrentImplementation } from '@/lib/types'

describe('buildOutputTypeSection', () => {
  it('includes "Static Mockups Only" for static interaction level', () => {
    const project = createTestProject({ interactionLevel: 'static' })
    const result = buildOutputTypeSection(project)
    expect(result).toContain('Static Mockups Only')
    expect(result).toContain('No JavaScript interactions')
  })

  it('includes "Click-through Flows" and navigation JS for click-through level', () => {
    const project = createTestProject({ interactionLevel: 'click-through' })
    const result = buildOutputTypeSection(project)
    expect(result).toContain('Click-through Flows')
    expect(result).toContain('Basic navigation JavaScript')
  })

  it('includes "Full Interactive Prototype" and animations for full-prototype level', () => {
    const project = createTestProject({ interactionLevel: 'full-prototype' })
    const result = buildOutputTypeSection(project)
    expect(result).toContain('Full Interactive Prototype')
    expect(result).toContain('animations')
    expect(result).toContain('CSS transitions')
  })

  it('includes Claude-to-Figma reference when figma target is set', () => {
    const project = createProjectWithFigma({ interactionLevel: 'static' })
    const result = buildOutputTypeSection(project)
    expect(result).toContain('Claude-to-Figma')
    expect(result).not.toContain('Do NOT create Figma files')
  })

  it('includes "Do NOT create Figma files" when no figma target', () => {
    const project = createTestProject({ interactionLevel: 'static' })
    const result = buildOutputTypeSection(project)
    expect(result).toContain('Do NOT create Figma files')
  })

  it('does not include responsive breakpoints line in lite mode', () => {
    const project = createTestProject({ promptMode: 'lite' })
    const result = buildOutputTypeSection(project)
    expect(result).not.toContain('Responsive breakpoints')
    expect(result).not.toContain('tablet required')
  })

  it('includes responsive breakpoints in comprehensive mode', () => {
    const project = createTestProject({ promptMode: 'comprehensive' })
    const result = buildOutputTypeSection(project)
    expect(result).toContain('Responsive breakpoints')
    expect(result).toContain('tablet')
  })

  it('includes mock data guidance referencing <context> for domain-specific data', () => {
    const project = createTestProject()
    const result = buildOutputTypeSection(project)
    expect(result).toContain('Derive mock data entities and fields from the feature description in `<context>`')
    expect(result).toContain('actual domain being prototyped')
  })

  it('clarifies web components are not framework-specific when design system is present', () => {
    const project = createProjectWithStorybookMemory()
    const result = buildOutputTypeSection(project)
    expect(result).toContain('NOT framework-specific libraries')
    expect(result).toContain('MUST import and use these web components')
  })

  it('includes EXISTING UI PRESERVATION bullet for add-on-top mode', () => {
    const project = createProjectWithStorybookMemory({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'add-on-top',
      },
    })
    const result = buildOutputTypeSection(project)
    expect(result).toContain('EXISTING UI PRESERVATION')
    expect(result).toContain('MUST be faithfully recreated as the base')
    expect(result).toContain('Do NOT start from a blank canvas')
  })

  it('does not include preservation bullet for redesign mode', () => {
    const project = createProjectWithStorybookMemory({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'redesign',
      },
    })
    const result = buildOutputTypeSection(project)
    expect(result).not.toContain('EXISTING UI PRESERVATION')
  })

  it('uses standard tech approach when no design system is present', () => {
    const project = createTestProject()
    const result = buildOutputTypeSection(project)
    expect(result).toContain('implement equivalent behavior with vanilla JS')
    expect(result).not.toContain('NOT framework-specific libraries')
  })
})
