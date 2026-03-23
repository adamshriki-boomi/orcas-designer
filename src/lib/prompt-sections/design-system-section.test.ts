import { buildDesignSystemSection } from './design-system-section'
import { createTestProject, createProjectWithDesignSystem, createProjectWithStorybookMemory } from '@/test/helpers/project-fixtures'
import { emptyFormField } from '@/lib/types'

describe('buildDesignSystemSection', () => {
  it('returns empty string when there is no design system content', () => {
    const project = createTestProject()
    const result = buildDesignSystemSection(project)
    expect(result).toBe('')
  })

  it('includes storybook URL and discovery instructions', () => {
    const project = createTestProject({
      designSystemStorybook: {
        ...emptyFormField(),
        urlValue: 'https://storybook.example.com',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).toContain('**Storybook URL**: https://storybook.example.com')
    expect(result).toContain('Storybook Discovery')
    expect(result).toContain('design-system-inventory.md')
  })

  it('includes NPM package and install command for text-based npm input', () => {
    const project = createTestProject({
      designSystemNpm: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: '@example/design-system',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).toContain('**Package**: `@example/design-system`')
    expect(result).toContain('**Install**: `npm i @example/design-system`')
    expect(result).not.toContain('NPM Install Command')
  })

  it('includes design system Figma URL', () => {
    const project = createTestProject({
      designSystemFigma: {
        ...emptyFormField(),
        urlValue: 'https://www.figma.com/design/ds123/Design-System',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).toContain('**Design System Figma URL**: https://www.figma.com/design/ds123/Design-System')
    expect(result).toContain('design tokens, component styles')
  })

  it('renders section when only storybook memory is selected (no URL)', () => {
    const project = createProjectWithStorybookMemory()
    const result = buildDesignSystemSection(project)
    expect(result).toContain('## DESIGN SYSTEM')
    expect(result).toContain('component inventory')
    expect(result).toContain('`<memories>` section')
  })

  it('prefers storybook URL over memory reference when both are present', () => {
    const project = createProjectWithStorybookMemory({
      designSystemStorybook: {
        ...emptyFormField(),
        urlValue: 'https://storybook.example.com',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).toContain('**Storybook URL**: https://storybook.example.com')
    expect(result).not.toContain('component inventory provided in the `<memories>` section')
  })

  it('normalizes NPM package with install prefix in CDN URLs', () => {
    const project = createTestProject({
      designSystemNpm: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: 'npm install @boomi/exosphere',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).toContain('`@boomi/exosphere`')
    expect(result).not.toContain('npm install @boomi/exosphere`')
    expect(result).toContain('unpkg.com/@boomi/exosphere')
    expect(result).not.toContain('unpkg.com/npm install')
  })

  it('includes React-to-web-component bridging note when using storybook memory', () => {
    const project = createProjectWithStorybookMemory()
    const result = buildDesignSystemSection(project)
    expect(result).toContain('PascalCase')
    expect(result).toContain('kebab-case')
    expect(result).toContain('web component')
  })

  it('does not include bridging note when storybook URL is present', () => {
    const project = createProjectWithStorybookMemory({
      designSystemStorybook: {
        ...emptyFormField(),
        urlValue: 'https://storybook.example.com',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).not.toContain('PascalCase')
  })

  it('includes additional context for each sub-section', () => {
    const project = createProjectWithDesignSystem({
      designSystemStorybook: {
        ...emptyFormField(),
        urlValue: 'https://storybook.example.com',
        additionalContext: 'Use v3 components only',
      },
      designSystemNpm: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: '@example/ds',
        additionalContext: 'Version 3.x required',
      },
      designSystemFigma: {
        ...emptyFormField(),
        urlValue: 'https://www.figma.com/design/ds123/DS',
        additionalContext: 'Focus on the "Core" page',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).toContain('> Storybook context: Use v3 components only')
    expect(result).toContain('> NPM context: Version 3.x required')
    expect(result).toContain('> DS Figma context: Focus on the "Core" page')
  })
})
