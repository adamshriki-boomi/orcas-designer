import { buildImplementationSection } from './implementation-section'
import { createTestProject, createProjectWithCurrentImpl, createTestFileAttachment } from '@/test/helpers/project-fixtures'
import { emptyCurrentImplementation } from '@/lib/types'

describe('buildImplementationSection', () => {
  it('returns empty string when there is no content', () => {
    const project = createTestProject()
    const result = buildImplementationSection(project)
    expect(result).toBe('')
  })

  it('includes "Add on top" mode and screenshot-overlay-positioning reference for add-on-top with URL', () => {
    const project = createProjectWithCurrentImpl({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'add-on-top',
      },
    })
    const result = buildImplementationSection(project)
    expect(result).toContain('Add on top of existing implementation')
    expect(result).toContain('screenshot-overlay-positioning')
    expect(result).toContain('https://app.example.com')
  })

  it('includes "Redesign from scratch" for redesign mode', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'redesign',
      },
    })
    const result = buildImplementationSection(project)
    expect(result).toContain('Redesign from scratch')
    expect(result).not.toContain('Add on top')
  })

  it('includes figma links when provided', () => {
    const project = createProjectWithCurrentImpl()
    const result = buildImplementationSection(project)
    expect(result).toContain('https://www.figma.com/design/impl123/Current')
    expect(result).toContain('Current Figma references')
  })

  it('includes file names for file attachments', () => {
    const file = createTestFileAttachment({ name: 'current-ui.png' })
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        inputType: 'file',
        files: [file],
        implementationMode: 'add-on-top',
      },
    })
    const result = buildImplementationSection(project)
    expect(result).toContain('`./assets/current-ui.png`')
  })

  it('includes additional context when provided', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        additionalContext: 'The header needs a refresh',
      },
    })
    const result = buildImplementationSection(project)
    expect(result).toContain('> Additional context: The header needs a refresh')
  })
})
