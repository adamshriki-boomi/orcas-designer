import { buildUserStoriesSection } from './user-stories-section'
import { createTestPrompt, createPromptWithFigma } from '@/test/helpers/prompt-fixtures'

describe('buildUserStoriesSection', () => {
  it('returns empty string for lite mode', () => {
    const project = createTestPrompt({ promptMode: 'lite' })
    const result = buildUserStoriesSection(project)
    expect(result).toBe('')
  })

  it('includes USER STORIES header and format instructions for comprehensive mode', () => {
    const project = createTestPrompt({ promptMode: 'comprehensive' })
    const result = buildUserStoriesSection(project)
    expect(result).toContain('## USER STORIES')
    expect(result).toContain('As a [type of user], I want [goal] so that [benefit]')
    expect(result).toContain('acceptance criteria')
  })

  it('includes Figma frame reference note when figma target is set', () => {
    const project = createPromptWithFigma({ promptMode: 'comprehensive' })
    const result = buildUserStoriesSection(project)
    expect(result).toContain('Figma frame reference')
  })
})
