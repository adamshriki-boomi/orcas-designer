import { buildSkillsSection } from './skills-section'
import { createTestProject, createTestSharedSkill } from '@/test/helpers/project-fixtures'

describe('buildSkillsSection', () => {
  it('includes "Recommended Skills" header and always-included skills for an empty project', () => {
    const project = createTestProject()
    const result = buildSkillsSection(project, [])
    expect(result).toContain('Recommended Skills')
    expect(result).toContain('/brainstorming')
    expect(result).toContain('/writing-plans')
    expect(result).toContain('/executing-plans')
    expect(result).toContain('/verification-before-completion')
  })

  it('includes shared skill names when selected', () => {
    const skill1 = createTestSharedSkill({
      id: 'shared-1',
      name: 'Accessibility Checker',
      description: 'Runs a11y audits',
      urlValue: 'https://a11y-checker.example.com',
    })
    const skill2 = createTestSharedSkill({
      id: 'shared-2',
      name: 'Performance Profiler',
      description: 'Profiles rendering performance',
      urlValue: 'https://perf.example.com',
    })
    const project = createTestProject({
      selectedSharedSkillIds: ['shared-1', 'shared-2'],
    })
    const result = buildSkillsSection(project, [skill1, skill2])
    expect(result).toContain('### Shared Skills')
    expect(result).toContain('**Accessibility Checker**')
    expect(result).toContain('**Performance Profiler**')
  })

  it('includes custom skill names when added', () => {
    const project = createTestProject({
      customSkills: [
        {
          id: 'custom-1',
          name: 'My Custom Linter',
          type: 'url',
          urlValue: 'https://linter.example.com',
          fileContent: null,
        },
      ],
    })
    const result = buildSkillsSection(project, [])
    expect(result).toContain('### Custom Skills')
    expect(result).toContain('**My Custom Linter**')
    expect(result).toContain('https://linter.example.com')
  })
})
