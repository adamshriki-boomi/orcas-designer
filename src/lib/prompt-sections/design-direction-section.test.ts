import { buildDesignDirectionSection } from './design-direction-section'
import { createTestPrompt } from '@/test/helpers/prompt-fixtures'

describe('buildDesignDirectionSection', () => {
  it('returns empty string when designDirection is null', () => {
    const project = createTestPrompt({ designDirection: null })
    const result = buildDesignDirectionSection(project)
    expect(result).toBe('')
  })

  it('returns empty string when design direction has only default values', () => {
    const project = createTestPrompt({
      designDirection: {
        primaryColor: '',
        fontFamily: '',
        motionStyle: 'none',
        borderRadiusStyle: 'sharp',
      },
    })
    const result = buildDesignDirectionSection(project)
    expect(result).toBe('')
  })

  it('includes primary color and font family when provided', () => {
    const project = createTestPrompt({
      designDirection: {
        primaryColor: '#3B82F6',
        fontFamily: 'Inter',
        motionStyle: 'none',
        borderRadiusStyle: 'sharp',
      },
    })
    const result = buildDesignDirectionSection(project)
    expect(result).toContain('**Primary Brand Color**: #3B82F6')
    expect(result).toContain('**Font Family**: Inter')
  })

  it('includes motion and border radius descriptions for non-default values', () => {
    const project = createTestPrompt({
      designDirection: {
        primaryColor: '',
        fontFamily: '',
        motionStyle: 'expressive',
        borderRadiusStyle: 'pill',
      },
    })
    const result = buildDesignDirectionSection(project)
    expect(result).toContain('## DESIGN DIRECTION')
    expect(result).toContain('expressive')
    expect(result).toContain('Rich animations, playful transitions, micro-interactions')
    expect(result).toContain('pill')
    expect(result).toContain('999px fully rounded borders')
  })
})
