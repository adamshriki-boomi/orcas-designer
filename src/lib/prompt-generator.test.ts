import { generatePrompt } from './prompt-generator'
import { emptyFormField } from './types'
import {
  createTestProject,
  createFullProject,
  createTestFileAttachment,
  createTestSharedMemory,
  createStorybookMemory,
  createProjectWithStorybookMemory,
} from '@/test/helpers/project-fixtures'

describe('generatePrompt', () => {
  describe('minimal project', () => {
    const project = createTestProject()
    const prompt = generatePrompt(project, [])

    it('contains the main header', () => {
      expect(prompt).toContain('# Design & Development Brief for Claude Code')
    })

    it('contains the project name in the subheader', () => {
      expect(prompt).toContain('## Project: Test Project')
    })

    it('contains the quick-reference XML tag', () => {
      expect(prompt).toContain('<quick-reference>')
      expect(prompt).toContain('</quick-reference>')
    })

    it('contains the output-requirements XML tag', () => {
      expect(prompt).toContain('<output-requirements>')
      expect(prompt).toContain('</output-requirements>')
    })

    it('does not contain the attached files callout', () => {
      expect(prompt).not.toContain('Attached Files')
    })
  })

  describe('full project', () => {
    const project = createFullProject()
    const prompt = generatePrompt(project, [])

    it('contains context section', () => {
      expect(prompt).toContain('<context>')
      expect(prompt).toContain('</context>')
    })

    it('contains ux-research section', () => {
      expect(prompt).toContain('<ux-research>')
      expect(prompt).toContain('</ux-research>')
    })

    it('contains current-implementation section', () => {
      expect(prompt).toContain('<current-implementation>')
      expect(prompt).toContain('</current-implementation>')
    })

    it('contains figma-target section', () => {
      expect(prompt).toContain('<figma-target>')
      expect(prompt).toContain('</figma-target>')
    })

    it('contains design-system section', () => {
      expect(prompt).toContain('<design-system>')
      expect(prompt).toContain('</design-system>')
    })

    it('contains design-direction section', () => {
      expect(prompt).toContain('<design-direction>')
      expect(prompt).toContain('</design-direction>')
    })

    it('contains execution-workflow section', () => {
      expect(prompt).toContain('<execution-workflow>')
      expect(prompt).toContain('</execution-workflow>')
    })
  })

  describe('project with file attachments', () => {
    it('includes the attached files callout', () => {
      const project = createTestProject({
        companyInfo: {
          ...emptyFormField(),
          files: [createTestFileAttachment()],
        },
      })
      const prompt = generatePrompt(project, [])
      expect(prompt).toContain('Attached Files')
    })
  })

  describe('project with shared memories', () => {
    it('includes the memories section', () => {
      const memory = createTestSharedMemory({ id: 'mem-1', name: 'My Memory', content: 'Some context' })
      const project = createTestProject({ selectedSharedMemoryIds: ['mem-1'] })
      const prompt = generatePrompt(project, [], [memory])
      expect(prompt).toContain('<memories>')
      expect(prompt).toContain('</memories>')
    })
  })

  describe('project with storybook memory', () => {
    it('includes storybook memory reference in quick-reference', () => {
      const storybookMem = createStorybookMemory()
      const project = createProjectWithStorybookMemory()
      const prompt = generatePrompt(project, [], [storybookMem])
      expect(prompt).toContain('Storybook: via memory')
    })

    it('includes both design-system and memories sections', () => {
      const storybookMem = createStorybookMemory()
      const project = createProjectWithStorybookMemory()
      const prompt = generatePrompt(project, [], [storybookMem])
      expect(prompt).toContain('<design-system>')
      expect(prompt).toContain('</design-system>')
      expect(prompt).toContain('<memories>')
      expect(prompt).toContain('</memories>')
    })

    it('includes design system line with storybook via memory in quick-reference', () => {
      const storybookMem = createStorybookMemory()
      const project = createProjectWithStorybookMemory()
      const prompt = generatePrompt(project, [], [storybookMem])
      expect(prompt).toContain('Design system:')
      expect(prompt).toContain('Storybook: via memory')
    })
  })

  describe('project with empty name', () => {
    it('still contains the header', () => {
      const project = createTestProject({ name: '' })
      const prompt = generatePrompt(project, [])
      expect(prompt).toContain('# Design & Development Brief for Claude Code')
      expect(prompt).toContain('## Project: ')
    })
  })

  describe('project with prerequisites', () => {
    it('includes prerequisites section for full project with Figma and URLs', () => {
      const project = createFullProject()
      const prompt = generatePrompt(project, [])
      expect(prompt).toContain('<prerequisites>')
      expect(prompt).toContain('</prerequisites>')
    })

    it('does not include prerequisites section for minimal project', () => {
      const project = createTestProject()
      const prompt = generatePrompt(project, [])
      expect(prompt).not.toContain('<prerequisites>')
    })
  })

  describe('quick reference design system details', () => {
    it('shows NPM package name in quick reference', () => {
      const project = createTestProject({
        designSystemNpm: {
          ...emptyFormField(),
          inputType: 'text',
          textValue: '@example/ds',
        },
      })
      const prompt = generatePrompt(project, [])
      expect(prompt).toContain('@example/ds')
    })

    it('shows storybook URL in quick reference', () => {
      const project = createTestProject({
        designSystemStorybook: {
          ...emptyFormField(),
          urlValue: 'https://storybook.example.com',
        },
      })
      const prompt = generatePrompt(project, [])
      expect(prompt).toContain('Storybook: https://storybook.example.com')
    })
  })

  describe('XML wrapping format', () => {
    it('wraps section content between opening and closing tags on separate lines', () => {
      const project = createTestProject()
      const prompt = generatePrompt(project, [])
      const match = prompt.match(/<quick-reference>\n[\s\S]+?\n<\/quick-reference>/)
      expect(match).not.toBeNull()
    })
  })
})
