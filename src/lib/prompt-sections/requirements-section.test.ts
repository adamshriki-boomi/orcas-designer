import { buildRequirementsSection } from './requirements-section'
import { createTestPrompt } from '@/test/helpers/prompt-fixtures'

describe('buildRequirementsSection', () => {
  it('includes "None" for accessibility and single browser target for defaults', () => {
    const project = createTestPrompt({
      accessibilityLevel: 'none',
      browserCompatibility: ['chrome'],
    })
    const result = buildRequirementsSection(project)
    expect(result).toContain('**Accessibility**: None')
    expect(result).toContain('chrome only')
  })

  it('includes WCAG 2.1 AA for wcag-aa accessibility level', () => {
    const project = createTestPrompt({ accessibilityLevel: 'wcag-aa' })
    const result = buildRequirementsSection(project)
    expect(result).toContain('WCAG 2.1 AA')
    expect(result).toContain('ARIA labels')
    expect(result).toContain('keyboard nav')
  })

  it('includes WCAG 2.1 AAA for wcag-aaa accessibility level', () => {
    const project = createTestPrompt({ accessibilityLevel: 'wcag-aaa' })
    const result = buildRequirementsSection(project)
    expect(result).toContain('WCAG 2.1 AAA')
  })

  it('includes all browser names and cross-browser note for multiple browsers', () => {
    const project = createTestPrompt({
      browserCompatibility: ['chrome', 'firefox', 'safari', 'edge'],
    })
    const result = buildRequirementsSection(project)
    expect(result).toContain('chrome, firefox, safari, edge')
    expect(result).toContain('cross-browser compatible CSS and JS')
  })
})
