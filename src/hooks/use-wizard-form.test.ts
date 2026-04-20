import { renderHook, act } from '@testing-library/react'
import { useWizardForm } from './use-wizard-form'
import { emptyPrompt } from '@/lib/types'
import { createTestPrompt } from '@/test/helpers/prompt-fixtures'
import type { FormFieldData, CustomSkill, CustomMemory } from '@/lib/types'

describe('useWizardForm', () => {
  it('returns initial state matching emptyProject defaults', () => {
    const { result } = renderHook(() => useWizardForm())
    const defaults = result.current.formData

    expect(defaults.name).toBe('New Prompt')
    expect(defaults.id).toBe('')
    expect(defaults.outputDirectory).toBe('./output/')
    expect(defaults.promptMode).toBe('comprehensive')
    expect(defaults.accessibilityLevel).toBe('none')
    expect(defaults.externalResourcesAccessible).toBe(true)
    expect(defaults.browserCompatibility).toEqual(['chrome'])
    expect(defaults.designDirection).toBeNull()
    expect(defaults.selectedSharedSkillIds).toEqual([])
    expect(defaults.customSkills).toEqual([])
    expect(defaults.selectedSharedMemoryIds).toEqual(['built-in-company-context'])
    expect(defaults.customMemories).toEqual([])
    expect(defaults.regenerationCount).toBe(0)
  })

  it('initial state does NOT include outputType or interactionLevel (removed)', () => {
    const { result } = renderHook(() => useWizardForm())
    const defaults = result.current.formData as unknown as Record<string, unknown>
    expect(defaults.outputType).toBeUndefined()
    expect(defaults.interactionLevel).toBeUndefined()
  })

  it('accepts a custom initialProject parameter', () => {
    const custom = createTestPrompt({ name: 'Custom Project', accessibilityLevel: 'wcag-aa' })
    const { result } = renderHook(() => useWizardForm(custom))

    expect(result.current.formData.name).toBe('Custom Project')
    expect(result.current.formData.accessibilityLevel).toBe('wcag-aa')
    expect(result.current.formData.id).toBe('test-id')
  })

  it('setName updates name', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setName('My New Name')
    })

    expect(result.current.formData.name).toBe('My New Name')
  })

  it('setField updates a form field', () => {
    const { result } = renderHook(() => useWizardForm())
    const fieldData: FormFieldData = {
      inputType: 'text',
      urlValue: '',
      textValue: 'We are a SaaS company',
      files: [],
      additionalContext: 'Extra info',
    }

    act(() => {
      result.current.setField('companyInfo', fieldData)
    })

    expect(result.current.formData.companyInfo).toEqual(fieldData)
  })

  it('setField updates productInfo field', () => {
    const { result } = renderHook(() => useWizardForm())
    const fieldData: FormFieldData = {
      inputType: 'url',
      urlValue: 'https://product.example.com',
      textValue: '',
      files: [],
      additionalContext: '',
    }

    act(() => {
      result.current.setField('productInfo', fieldData)
    })

    expect(result.current.formData.productInfo.urlValue).toBe('https://product.example.com')
  })

  it('setCurrentImpl updates currentImplementation', () => {
    const { result } = renderHook(() => useWizardForm())
    const implData = {
      inputType: 'url' as const,
      urlValue: 'https://app.example.com',
      textValue: '',
      files: [],
      additionalContext: '',
      figmaLinks: ['https://figma.com/design/abc/File'],
      implementationMode: 'redesign' as const,
    }

    act(() => {
      result.current.setCurrentImpl(implData)
    })

    expect(result.current.formData.currentImplementation).toEqual(implData)
    expect(result.current.formData.currentImplementation.implementationMode).toBe('redesign')
    expect(result.current.formData.currentImplementation.figmaLinks).toHaveLength(1)
  })

  it('setOutputDirectory updates outputDirectory', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setOutputDirectory('/custom/path/')
    })

    expect(result.current.formData.outputDirectory).toBe('/custom/path/')
  })

  it('setPromptMode updates promptMode', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setPromptMode('lite')
    })

    expect(result.current.formData.promptMode).toBe('lite')
  })

  it('setAccessibilityLevel updates accessibilityLevel', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setAccessibilityLevel('wcag-aa')
    })

    expect(result.current.formData.accessibilityLevel).toBe('wcag-aa')
  })

  it('setBrowserCompat updates browserCompatibility', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setBrowserCompat(['chrome', 'firefox', 'safari'])
    })

    expect(result.current.formData.browserCompatibility).toEqual(['chrome', 'firefox', 'safari'])
  })

  it('setExternalResources updates externalResourcesAccessible', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setExternalResources(false)
    })

    expect(result.current.formData.externalResourcesAccessible).toBe(false)
  })

  it('setDesignDirection updates designDirection', () => {
    const { result } = renderHook(() => useWizardForm())
    const dd = {
      primaryColor: '#FF5733',
      fontFamily: 'Inter',
      motionStyle: 'subtle' as const,
      borderRadiusStyle: 'rounded' as const,
    }

    act(() => {
      result.current.setDesignDirection(dd)
    })

    expect(result.current.formData.designDirection).toEqual(dd)
  })

  it('setDesignDirection can be set to null', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setDesignDirection({
        primaryColor: '#000',
        fontFamily: 'Arial',
        motionStyle: 'none',
        borderRadiusStyle: 'sharp',
      })
    })
    expect(result.current.formData.designDirection).not.toBeNull()

    act(() => {
      result.current.setDesignDirection(null)
    })
    expect(result.current.formData.designDirection).toBeNull()
  })

  it('setSharedSkills updates selectedSharedSkillIds', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setSharedSkills(['skill-1', 'skill-2'])
    })

    expect(result.current.formData.selectedSharedSkillIds).toEqual(['skill-1', 'skill-2'])
  })

  it('setCustomSkills updates customSkills', () => {
    const { result } = renderHook(() => useWizardForm())
    const skills: CustomSkill[] = [
      { id: 'cs-1', name: 'My Skill', type: 'url', urlValue: 'https://example.com', fileContent: null },
    ]

    act(() => {
      result.current.setCustomSkills(skills)
    })

    expect(result.current.formData.customSkills).toEqual(skills)
    expect(result.current.formData.customSkills).toHaveLength(1)
  })

  it('setSharedMemories updates selectedSharedMemoryIds', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setSharedMemories(['mem-1', 'mem-2', 'mem-3'])
    })

    expect(result.current.formData.selectedSharedMemoryIds).toEqual(['mem-1', 'mem-2', 'mem-3'])
  })

  it('setCustomMemories updates customMemories', () => {
    const { result } = renderHook(() => useWizardForm())
    const memories: CustomMemory[] = [
      { id: 'cm-1', name: 'Custom Context', content: 'Important context here' },
    ]

    act(() => {
      result.current.setCustomMemories(memories)
    })

    expect(result.current.formData.customMemories).toEqual(memories)
  })

  it('loadProject replaces entire state', () => {
    const { result } = renderHook(() => useWizardForm())
    const project = createTestPrompt({
      name: 'Loaded Project',
      accessibilityLevel: 'wcag-aaa',
      promptMode: 'lite',
    })

    act(() => {
      result.current.loadPrompt(project)
    })

    expect(result.current.formData.name).toBe('Loaded Project')
    expect(result.current.formData.accessibilityLevel).toBe('wcag-aaa')
    expect(result.current.formData.promptMode).toBe('lite')
    expect(result.current.formData.id).toBe('test-id')
  })

  it('multiple sequential updates accumulate correctly', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setName('Updated Project')
    })
    act(() => {
      result.current.setAccessibilityLevel('wcag-aa')
    })
    act(() => {
      result.current.setBrowserCompat(['chrome', 'edge'])
    })

    expect(result.current.formData.name).toBe('Updated Project')
    expect(result.current.formData.accessibilityLevel).toBe('wcag-aa')
    expect(result.current.formData.browserCompatibility).toEqual(['chrome', 'edge'])
    // unchanged fields remain at defaults
    expect(result.current.formData.outputDirectory).toBe('./output/')
    expect(result.current.formData.promptMode).toBe('comprehensive')
  })
})
