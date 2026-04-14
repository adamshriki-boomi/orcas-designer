import { buildImplementationSection } from './implementation-section'
import { createTestPrompt, createPromptWithCurrentImpl, createTestFileAttachment } from '@/test/helpers/prompt-fixtures'
import { emptyCurrentImplementation } from '@/lib/types'

describe('buildImplementationSection', () => {
  it('returns empty string when there is no content', () => {
    const project = createTestPrompt()
    const result = buildImplementationSection(project)
    expect(result).toBe('')
  })

  it('includes "Add on top" mode and screenshot-overlay-positioning reference for add-on-top with URL', () => {
    const project = createPromptWithCurrentImpl({
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
    const project = createTestPrompt({
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
    const project = createPromptWithCurrentImpl()
    const result = buildImplementationSection(project)
    expect(result).toContain('https://www.figma.com/design/impl123/Current')
    expect(result).toContain('Current Figma references')
  })

  it('includes file names for file attachments', () => {
    const file = createTestFileAttachment({ name: 'current-ui.png' })
    const project = createTestPrompt({
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
    const project = createTestPrompt({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        additionalContext: 'The header needs a refresh',
      },
    })
    const result = buildImplementationSection(project)
    expect(result).toContain('> Additional context: The header needs a refresh')
  })

  it('includes CRITICAL BUILD ON TOP mandate for add-on-top mode', () => {
    const project = createTestPrompt({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'add-on-top',
      },
    })
    const result = buildImplementationSection(project)
    expect(result).toContain('CRITICAL')
    expect(result).toContain('BUILD ON TOP, DO NOT REPLACE')
    expect(result).toContain('FIRST')
    expect(result).toContain('Faithfully reconstruct the existing UI')
    expect(result).toContain('THEN')
    expect(result).toContain('Do NOT start from a blank canvas')
    expect(result).toContain('Do NOT redesign existing screens')
  })

  it('includes REQUIRED screenshot-overlay-positioning instruction for add-on-top with URL', () => {
    const project = createTestPrompt({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'add-on-top',
      },
    })
    const result = buildImplementationSection(project)
    expect(result).toContain('REQUIRED')
    expect(result).toContain('screenshot-overlay-positioning')
    expect(result).toContain('not optional')
  })

  it('includes two-step process (reconstruct then add) for add-on-top', () => {
    const project = createTestPrompt({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        urlValue: 'https://app.example.com',
        implementationMode: 'add-on-top',
      },
    })
    const result = buildImplementationSection(project)
    const firstIdx = result.indexOf('FIRST')
    const thenIdx = result.indexOf('THEN')
    expect(firstIdx).toBeLessThan(thenIdx)
  })
})
