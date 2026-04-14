import { renderHook } from '@testing-library/react'
import { usePromptGenerator } from './use-prompt-generator'
import { createTestPrompt, createTestSharedSkill, createTestSharedMemory } from '@/test/helpers/prompt-fixtures'

describe('usePromptGenerator', () => {
  it('returns empty string when project is null', () => {
    const { result } = renderHook(() => usePromptGenerator(null, []))

    expect(result.current.prompt).toBe('')
  })

  it('returns non-empty prompt containing project name for a valid project', () => {
    const project = createTestPrompt({ name: 'Dashboard Redesign' })
    const { result } = renderHook(() => usePromptGenerator(project, []))

    expect(result.current.prompt).not.toBe('')
    expect(result.current.prompt).toContain('Dashboard Redesign')
  })

  it('includes memory content in prompt when shared memories are provided', () => {
    const project = createTestPrompt({
      name: 'Memory Test',
      selectedSharedMemoryIds: ['memory-1'],
    })
    const memory = createTestSharedMemory({
      id: 'memory-1',
      name: 'Company Standards',
      content: 'We follow strict accessibility guidelines for all products.',
    })

    const { result } = renderHook(() =>
      usePromptGenerator(project, [], [memory])
    )

    expect(result.current.prompt).toContain('We follow strict accessibility guidelines for all products.')
  })
})
