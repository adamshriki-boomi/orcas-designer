import { buildPrototypeSection } from './prototype-section'
import { createTestProject, createTestFileAttachment } from '@/test/helpers/project-fixtures'
import { emptyFormField } from '@/lib/types'

describe('buildPrototypeSection', () => {
  it('returns empty string when there is no content', () => {
    const project = createTestProject()
    const result = buildPrototypeSection(project)
    expect(result).toBe('')
  })

  it('includes the URL when a prototype URL is provided', () => {
    const project = createTestProject({
      prototypeSketches: {
        ...emptyFormField(),
        urlValue: 'https://prototype.example.com',
      },
    })
    const result = buildPrototypeSection(project)
    expect(result).toContain('**Prototype URL**: https://prototype.example.com')
  })

  it('includes /implement-design reference for figma.com URLs', () => {
    const project = createTestProject({
      prototypeSketches: {
        ...emptyFormField(),
        urlValue: 'https://www.figma.com/design/proto123/Wireframes',
      },
    })
    const result = buildPrototypeSection(project)
    expect(result).toContain('/implement-design')
    expect(result).toContain('https://www.figma.com/design/proto123/Wireframes')
  })

  it('includes text description when text input type is used', () => {
    const project = createTestProject({
      prototypeSketches: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: 'A sidebar navigation with collapsible sections',
      },
    })
    const result = buildPrototypeSection(project)
    expect(result).toContain('**Description**:')
    expect(result).toContain('A sidebar navigation with collapsible sections')
  })

  it('includes file names for sketch file attachments', () => {
    const file1 = createTestFileAttachment({ name: 'sketch-home.png' })
    const file2 = createTestFileAttachment({ id: 'file-2', name: 'sketch-detail.jpg' })
    const project = createTestProject({
      prototypeSketches: {
        ...emptyFormField(),
        inputType: 'file',
        files: [file1, file2],
      },
    })
    const result = buildPrototypeSection(project)
    expect(result).toContain('`./assets/sketch-home.png`')
    expect(result).toContain('`./assets/sketch-detail.jpg`')
  })
})
