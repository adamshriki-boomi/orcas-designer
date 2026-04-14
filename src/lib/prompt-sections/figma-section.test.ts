import { buildFigmaSection } from './figma-section'
import { createTestPrompt, createPromptWithFigma } from '@/test/helpers/prompt-fixtures'
import { emptyFormField } from '@/lib/types'

describe('buildFigmaSection', () => {
  it('returns empty string when there is no figma link', () => {
    const project = createTestPrompt()
    const result = buildFigmaSection(project)
    expect(result).toBe('')
  })

  it('includes the Figma URL and Claude-to-Figma plugin instructions', () => {
    const project = createPromptWithFigma()
    const result = buildFigmaSection(project)
    expect(result).toContain('https://www.figma.com/design/abc123/My-Design')
    expect(result).toContain('Claude-to-Figma')
    expect(result).toContain('generate_figma_design')
    expect(result).toContain('FIGMA TARGET (DESTINATION)')
  })

  it('scopes write-only restriction to "this URL" and allows reading other Figma URLs', () => {
    const project = createPromptWithFigma()
    const result = buildFigmaSection(project)
    expect(result).toContain('this URL')
    expect(result).toContain('You MAY read from other Figma URLs')
    expect(result).not.toContain('this file')
  })

  it('uses "Prerequisite" heading instead of "Setup"', () => {
    const project = createPromptWithFigma()
    const result = buildFigmaSection(project)
    expect(result).toContain('Prerequisite: Claude-to-Figma Plugin')
    expect(result).not.toContain('Setup: Claude-to-Figma Plugin')
  })

  it('includes additional context when provided', () => {
    const project = createPromptWithFigma({
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
