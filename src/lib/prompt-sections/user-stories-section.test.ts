import { buildUserStoriesSection } from './user-stories-section'
import { createTestProject, createProjectWithFigma } from '@/test/helpers/project-fixtures'

describe('buildUserStoriesSection', () => {
  it('returns empty string for lite mode', () => {
    const project = createTestProject({ promptMode: 'lite' })
    const result = buildUserStoriesSection(project)
    expect(result).toBe('')
  })

  it('includes USER STORIES header and format instructions for comprehensive mode', () => {
    const project = createTestProject({ promptMode: 'comprehensive' })
    const result = buildUserStoriesSection(project)
    expect(result).toContain('## USER STORIES')
    expect(result).toContain('As a [type of user], I want [goal] so that [benefit]')
    expect(result).toContain('acceptance criteria')
  })

  it('includes Figma frame reference note when figma target is set', () => {
    const project = createProjectWithFigma({ promptMode: 'comprehensive' })
    const result = buildUserStoriesSection(project)
    expect(result).toContain('Figma frame reference')
  })
})
