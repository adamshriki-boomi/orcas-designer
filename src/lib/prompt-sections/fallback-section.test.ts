import { buildFallbackSection } from './fallback-section'
import { createTestProject } from '@/test/helpers/project-fixtures'

describe('buildFallbackSection', () => {
  it('includes fallback priority and does not include external URLs warning when accessible is true', () => {
    const project = createTestProject({ externalResourcesAccessible: true })
    const result = buildFallbackSection(project)
    expect(result).toContain('Resource fallback priority')
    expect(result).toContain('URL is accessible')
    expect(result).not.toContain('External URLs may require authentication')
  })

  it('includes external URLs warning when externalResourcesAccessible is false', () => {
    const project = createTestProject({ externalResourcesAccessible: false })
    const result = buildFallbackSection(project)
    expect(result).toContain('External URLs may require authentication')
    expect(result).toContain('Prefer locally attached files and pasted text')
  })

  it('always includes the never-block instruction', () => {
    const project = createTestProject()
    const result = buildFallbackSection(project)
    expect(result).toContain('Never block on an inaccessible URL')
  })
})
