import { getActiveSkillsForPrompt } from './skill-filter'
import { MANDATORY_SKILLS } from './constants'
import { emptyFormField, emptyCurrentImplementation } from './types'
import {
  createTestPrompt,
  createPromptWithCurrentImpl,
} from '@/test/helpers/prompt-fixtures'

const alwaysSkillNames = MANDATORY_SKILLS
  .filter(s => s.includeCondition === 'always')
  .map(s => s.name)

const neverSkillNames = MANDATORY_SKILLS
  .filter(s => s.includeCondition === 'never')
  .map(s => s.name)

describe('getActiveSkillsForPrompt', () => {
  it('includes all always-condition skills for an empty project', () => {
    const project = createTestPrompt()
    const result = getActiveSkillsForPrompt(project)
    const names = result.map(s => s.name)
    for (const name of alwaysSkillNames) {
      expect(names).toContain(name)
    }
  })

  it('always includes the exosphere Design System skill', () => {
    // The official Boomi Exosphere Claude skill replaces the former embedded
    // storybook memory and must be attached to every generated brief.
    const project = createTestPrompt()
    const result = getActiveSkillsForPrompt(project)
    const exosphere = result.find(s => s.name === 'exosphere')
    expect(exosphere).toBeDefined()
    expect(exosphere?.category).toBe('Design System')
    expect(exosphere?.includeCondition).toBe('always')
    expect(exosphere?.repoUrl).toBe('https://github.com/adamshriki-boomi/exosphere-claude-skill')
  })

  it('excludes all never-condition skills for an empty project', () => {
    const project = createTestPrompt()
    const result = getActiveSkillsForPrompt(project)
    const names = result.map(s => s.name)
    for (const name of neverSkillNames) {
      expect(names).not.toContain(name)
    }
  })

  it('code-connect-components is `never` since there is no design-system Figma source', () => {
    // After the Design System step was simplified to just the locked
    // Exosphere card, there's no designSystemFigma field and therefore no
    // hasDesignFigma trigger — so code-connect-components is unreachable.
    const project = createTestPrompt()
    const result = getActiveSkillsForPrompt(project)
    expect(result.map(s => s.name)).not.toContain('code-connect-components')
  })

  it('includes isAddOnTop skills when default implementationMode is add-on-top', () => {
    const project = createTestPrompt()
    const result = getActiveSkillsForPrompt(project)
    const names = result.map(s => s.name)
    expect(names).toContain('screenshot-overlay-positioning')
  })

  it('excludes isAddOnTop skills when implementationMode is redesign', () => {
    const project = createTestPrompt({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        implementationMode: 'redesign',
      },
    })
    const result = getActiveSkillsForPrompt(project)
    const names = result.map(s => s.name)
    expect(names).not.toContain('screenshot-overlay-positioning')
  })

  it('includes hasSourceFigma skills when currentImplementation has figmaLinks', () => {
    const project = createPromptWithCurrentImpl()
    const result = getActiveSkillsForPrompt(project)
    const names = result.map(s => s.name)
    expect(names).toContain('implement-design')
    expect(names).toContain('create-design-system-rules')
  })

  it('includes hasSourceFigma skills when prototypeSketches URL contains figma.com', () => {
    const project = createTestPrompt({
      prototypeSketches: {
        ...emptyFormField(),
        urlValue: 'https://www.figma.com/proto/xyz/Prototype',
      },
    })
    const result = getActiveSkillsForPrompt(project)
    const names = result.map(s => s.name)
    expect(names).toContain('implement-design')
    expect(names).toContain('create-design-system-rules')
  })

  it('does not include hasSourceFigma skills when prototypeSketches URL is non-Figma', () => {
    const project = createTestPrompt({
      prototypeSketches: {
        ...emptyFormField(),
        urlValue: 'https://prototype.example.com',
      },
    })
    const result = getActiveSkillsForPrompt(project)
    const names = result.map(s => s.name)
    expect(names).not.toContain('implement-design')
    expect(names).not.toContain('create-design-system-rules')
  })

  it('does not include hasSourceFigma skills when only designProducts.figmaDestinationUrl is set', () => {
    // figmaDestinationUrl is a WRITE target — it's not a readable source, so
    // implement-design / create-design-system-rules (which read FROM Figma)
    // should NOT fire just because the user wants to push to Figma.
    const project = createTestPrompt({
      designProducts: {
        products: ['mockup'],
        figmaDestinationUrl: 'https://www.figma.com/design/dest/Destination',
      },
    })
    const result = getActiveSkillsForPrompt(project)
    const names = result.map(s => s.name)
    expect(names).not.toContain('implement-design')
    expect(names).not.toContain('create-design-system-rules')
  })

  it('never includes never-condition skills even with full project data', () => {
    const project = createPromptWithCurrentImpl({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        figmaLinks: ['https://www.figma.com/design/x/Y'],
      },
    })
    const result = getActiveSkillsForPrompt(project)
    const names = result.map(s => s.name)
    for (const name of neverSkillNames) {
      expect(names).not.toContain(name)
    }
  })

  it('returns only skills whose conditions are met (count check)', () => {
    const project = createTestPrompt()
    const result = getActiveSkillsForPrompt(project)
    const expectedCount =
      MANDATORY_SKILLS.filter(s => s.includeCondition === 'always').length +
      MANDATORY_SKILLS.filter(s => s.includeCondition === 'isAddOnTop').length
    expect(result).toHaveLength(expectedCount)
  })
})
