import { buildMemorySection } from './memory-section'
import { createTestProject, createTestSharedMemory, createStorybookMemory, createProjectWithStorybookMemory } from '@/test/helpers/project-fixtures'

describe('buildMemorySection', () => {
  it('returns empty string when no memories are selected', () => {
    const project = createTestProject({
      selectedSharedMemoryIds: [],
      customMemories: [],
    })
    const result = buildMemorySection(project, [])
    expect(result).toBe('')
  })

  it('includes shared memory names and content when selected', () => {
    const memory1 = createTestSharedMemory({
      id: 'mem-1',
      name: 'Company Standards',
      fileName: 'company-standards.md',
      content: 'Always use blue as the primary color.',
    })
    const memory2 = createTestSharedMemory({
      id: 'mem-2',
      name: 'Brand Guidelines',
      fileName: 'brand-guidelines.md',
      content: 'Use Inter font for all headings.',
    })
    const project = createTestProject({
      selectedSharedMemoryIds: ['mem-1', 'mem-2'],
      customMemories: [],
    })
    const result = buildMemorySection(project, [memory1, memory2])
    expect(result).toContain('### Company Standards (company-standards.md)')
    expect(result).toContain('Always use blue as the primary color.')
    expect(result).toContain('### Brand Guidelines (brand-guidelines.md)')
    expect(result).toContain('Use Inter font for all headings.')
  })

  it('includes custom memory names and content', () => {
    const project = createTestProject({
      selectedSharedMemoryIds: [],
      customMemories: [
        { id: 'cust-1', name: 'Project Notes', content: 'Focus on mobile-first design' },
      ],
    })
    const result = buildMemorySection(project, [])
    expect(result).toContain('### Project Notes (custom)')
    expect(result).toContain('Focus on mobile-first design')
  })

  it('includes built-in storybook memory when selected', () => {
    const storybookMem = createStorybookMemory()
    const project = createProjectWithStorybookMemory()
    const result = buildMemorySection(project, [storybookMem])
    expect(result).toContain('### Exosphere Storybook (exosphere-storybook.md)')
    expect(result).toContain('Component Inventory')
  })

  it('includes both shared and custom memories together', () => {
    const sharedMemory = createTestSharedMemory({
      id: 'mem-1',
      name: 'Shared Context',
      fileName: 'shared.md',
      content: 'Shared content here.',
    })
    const project = createTestProject({
      selectedSharedMemoryIds: ['mem-1'],
      customMemories: [
        { id: 'cust-1', name: 'Custom Notes', content: 'Custom content here.' },
      ],
    })
    const result = buildMemorySection(project, [sharedMemory])
    expect(result).toContain('## MEMORIES')
    expect(result).toContain('### Shared Context (shared.md)')
    expect(result).toContain('Shared content here.')
    expect(result).toContain('### Custom Notes (custom)')
    expect(result).toContain('Custom content here.')
  })
})
