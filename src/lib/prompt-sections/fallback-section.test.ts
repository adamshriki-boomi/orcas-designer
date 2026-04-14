import { buildFallbackSection } from './fallback-section'
import { createTestPrompt } from '@/test/helpers/prompt-fixtures'

describe('buildFallbackSection', () => {
  it('includes fallback priority and does not include external URLs warning when accessible is true', () => {
    const project = createTestPrompt({ externalResourcesAccessible: true })
    const result = buildFallbackSection(project)
    expect(result).toContain('Resource fallback priority')
    expect(result).toContain('URL is accessible')
    expect(result).not.toContain('External URLs may require authentication')
  })

  it('includes external URLs warning when externalResourcesAccessible is false', () => {
    const project = createTestPrompt({ externalResourcesAccessible: false })
    const result = buildFallbackSection(project)
    expect(result).toContain('External URLs may require authentication')
    expect(result).toContain('Prefer locally attached files and pasted text')
  })

  it('always includes the never-block instruction', () => {
    const project = createTestPrompt()
    const result = buildFallbackSection(project)
    expect(result).toContain('Never block on an inaccessible URL')
  })
})
