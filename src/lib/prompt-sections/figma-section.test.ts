import { buildFigmaSection } from './figma-section'
import { createTestProject, createProjectWithFigma } from '@/test/helpers/project-fixtures'
import { emptyFormField } from '@/lib/types'

describe('buildFigmaSection', () => {
  it('returns empty string when there is no figma link', () => {
    const project = createTestProject()
    const result = buildFigmaSection(project)
    expect(result).toBe('')
  })

  it('includes the Figma URL and Claude-to-Figma plugin instructions', () => {
    const project = createProjectWithFigma()
    const result = buildFigmaSection(project)
    expect(result).toContain('https://www.figma.com/design/abc123/My-Design')
    expect(result).toContain('Claude-to-Figma')
    expect(result).toContain('generate_figma_design')
    expect(result).toContain('FIGMA TARGET (DESTINATION)')
  })

  it('includes additional context when provided', () => {
    const project = createProjectWithFigma({
      figmaFileLink: {
        ...emptyFormField(),
        urlValue: 'https://www.figma.com/design/abc123/My-Design',
        additionalContext: 'Use the "Designs" page in the file',
      },
    })
    const result = buildFigmaSection(project)
    expect(result).toContain('> Additional context: Use the "Designs" page in the file')
  })
})
