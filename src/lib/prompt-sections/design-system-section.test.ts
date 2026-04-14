import { buildDesignSystemSection } from './design-system-section'
import { createTestPrompt, createPromptWithDesignSystem, createPromptWithStorybookMemory } from '@/test/helpers/prompt-fixtures'
import { emptyFormField } from '@/lib/types'

describe('buildDesignSystemSection', () => {
  it('returns empty string when there is no design system content', () => {
    const project = createTestPrompt()
    const result = buildDesignSystemSection(project)
    expect(result).toBe('')
  })

  it('includes storybook URL and discovery instructions', () => {
    const project = createTestPrompt({
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
    const project = createTestPrompt({
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
    const project = createTestPrompt({
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
    const project = createPromptWithStorybookMemory()
    const result = buildDesignSystemSection(project)
    expect(result).toContain('## DESIGN SYSTEM')
    expect(result).toContain('component inventory')
    expect(result).toContain('`<memories>` section')
  })

  it('prefers storybook URL over memory reference when both are present', () => {
    const project = createPromptWithStorybookMemory({
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
    const project = createTestPrompt({
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
    const project = createPromptWithStorybookMemory()
    const result = buildDesignSystemSection(project)
    expect(result).toContain('PascalCase')
    expect(result).toContain('kebab-case')
    expect(result).toContain('web component')
  })

  it('does not include bridging note when storybook URL is present', () => {
    const project = createPromptWithStorybookMemory({
      designSystemStorybook: {
        ...emptyFormField(),
        urlValue: 'https://storybook.example.com',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).not.toContain('PascalCase')
  })

  it('includes CRITICAL RULE block when any design system content is present', () => {
    const project = createPromptWithStorybookMemory()
    const result = buildDesignSystemSection(project)
    expect(result).toContain('CRITICAL RULE')
    expect(result).toContain('MUST use design system components for ALL UI elements')
  })

  it('includes AUTHORITATIVE language for storybook memory', () => {
    const project = createPromptWithStorybookMemory()
    const result = buildDesignSystemSection(project)
    expect(result).toContain('AUTHORITATIVE')
    expect(result).toContain('MUST use these components')
    expect(result).toContain('Do NOT create custom HTML/CSS alternatives')
  })

  it('includes INTEGRATION block when both storybook memory and NPM are present', () => {
    const project = createPromptWithStorybookMemory({
      designSystemNpm: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: '@boomi/exosphere',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).toContain('INTEGRATION')
    expect(result).toContain('Loading Web Components in HTML')
    expect(result).toContain('NOT framework-specific')
    expect(result).toContain('unpkg.com/@boomi/exosphere')
  })

  it('includes MUST language for NPM package', () => {
    const project = createTestPrompt({
      designSystemNpm: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: '@example/design-system',
      },
    })
    const result = buildDesignSystemSection(project)
    expect(result).toContain('MUST install and use')
    expect(result).toContain('Do NOT recreate components')
  })

  it('includes additional context for each sub-section', () => {
    const project = createPromptWithDesignSystem({
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
