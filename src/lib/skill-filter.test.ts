import { getActiveSkillsForProject } from './skill-filter'
import { MANDATORY_SKILLS } from './constants'
import { emptyFormField, emptyCurrentImplementation } from './types'
import {
  createTestProject,
  createProjectWithFigma,
  createProjectWithDesignSystem,
  createProjectWithCurrentImpl,
} from '@/test/helpers/project-fixtures'

const alwaysSkillNames = MANDATORY_SKILLS
  .filter(s => s.includeCondition === 'always')
  .map(s => s.name)

const neverSkillNames = MANDATORY_SKILLS
  .filter(s => s.includeCondition === 'never')
  .map(s => s.name)

describe('getActiveSkillsForProject', () => {
  it('includes all always-condition skills for an empty project', () => {
    const project = createTestProject()
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    for (const name of alwaysSkillNames) {
      expect(names).toContain(name)
    }
  })

  it('excludes all never-condition skills for an empty project', () => {
    const project = createTestProject()
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    for (const name of neverSkillNames) {
      expect(names).not.toContain(name)
    }
  })

  it('includes isAddOnTop skills when default implementationMode is add-on-top', () => {
    const project = createTestProject()
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    expect(names).toContain('screenshot-overlay-positioning')
  })

  it('excludes isAddOnTop skills when implementationMode is redesign', () => {
    const project = createTestProject({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        implementationMode: 'redesign',
      },
    })
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    expect(names).not.toContain('screenshot-overlay-positioning')
  })

  it('includes hasDesignFigma skills when designSystemFigma has a URL', () => {
    const project = createProjectWithDesignSystem()
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    expect(names).toContain('code-connect-components')
  })

  it('includes hasSourceFigma skills when designSystemFigma has a URL', () => {
    const project = createProjectWithDesignSystem()
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    expect(names).toContain('implement-design')
    expect(names).toContain('create-design-system-rules')
  })

  it('includes hasSourceFigma skills when currentImplementation has figmaLinks', () => {
    const project = createProjectWithCurrentImpl()
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    expect(names).toContain('implement-design')
    expect(names).toContain('create-design-system-rules')
  })

  it('includes hasSourceFigma skills when prototypeSketches URL contains figma.com', () => {
    const project = createTestProject({
      prototypeSketches: {
        ...emptyFormField(),
        urlValue: 'https://www.figma.com/proto/xyz/Prototype',
      },
    })
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    expect(names).toContain('implement-design')
    expect(names).toContain('create-design-system-rules')
  })

  it('does not include hasSourceFigma skills when prototypeSketches URL is non-Figma', () => {
    const project = createTestProject({
      prototypeSketches: {
        ...emptyFormField(),
        urlValue: 'https://prototype.example.com',
      },
    })
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    expect(names).not.toContain('implement-design')
    expect(names).not.toContain('create-design-system-rules')
  })

  it('does not include hasDesignFigma skills for a project with only figmaFileLink', () => {
    const project = createProjectWithFigma()
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    expect(names).not.toContain('code-connect-components')
  })

  it('never includes never-condition skills even with full project data', () => {
    const project = createProjectWithDesignSystem({
      currentImplementation: {
        ...emptyCurrentImplementation(),
        figmaLinks: ['https://www.figma.com/design/x/Y'],
      },
      figmaFileLink: {
        ...emptyFormField(),
        urlValue: 'https://www.figma.com/design/a/B',
      },
    })
    const result = getActiveSkillsForProject(project)
    const names = result.map(s => s.name)
    for (const name of neverSkillNames) {
      expect(names).not.toContain(name)
    }
  })

  it('returns only skills whose conditions are met (count check)', () => {
    const project = createTestProject()
    const result = getActiveSkillsForProject(project)
    const expectedCount =
      MANDATORY_SKILLS.filter(s => s.includeCondition === 'always').length +
      MANDATORY_SKILLS.filter(s => s.includeCondition === 'isAddOnTop').length
    expect(result).toHaveLength(expectedCount)
  })
})
