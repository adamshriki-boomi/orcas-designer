import { renderHook, act } from '@testing-library/react'
import { useManagerState } from './use-manager-state'

interface TestForm {
  name: string
  value: string
}

const emptyForm: TestForm = { name: '', value: '' }

describe('useManagerState', () => {
  it('returns correct initial state', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))

    expect(result.current.dialogOpen).toBe(false)
    expect(result.current.editingId).toBeNull()
    expect(result.current.form).toEqual(emptyForm)
    expect(result.current.isSaving).toBe(false)
    expect(result.current.deleteDialogOpen).toBe(false)
    expect(result.current.deletingId).toBeNull()
    expect(result.current.usedInPrompts).toEqual([])
    expect(result.current.isDeleting).toBe(false)
    expect(result.current.viewDialogOpen).toBe(false)
  })

  it('openAdd sets dialogOpen true, editingId null, and resets form', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))

    act(() => {
      result.current.openAdd()
    })

    expect(result.current.dialogOpen).toBe(true)
    expect(result.current.editingId).toBeNull()
    expect(result.current.form).toEqual(emptyForm)
  })

  it('openEdit sets dialogOpen true, editingId, and form data', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))
    const editForm: TestForm = { name: 'Existing', value: 'data' }

    act(() => {
      result.current.openEdit('edit-123', editForm)
    })

    expect(result.current.dialogOpen).toBe(true)
    expect(result.current.editingId).toBe('edit-123')
    expect(result.current.form).toEqual(editForm)
  })

  it('openDelete sets deleteDialogOpen true, deletingId, and usedInPrompts', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))
    const projectNames = ['Project A', 'Project B']

    act(() => {
      result.current.openDelete('del-456', projectNames)
    })

    expect(result.current.deleteDialogOpen).toBe(true)
    expect(result.current.deletingId).toBe('del-456')
    expect(result.current.usedInPrompts).toEqual(projectNames)
  })

  it('closeDialog resets dialogOpen, editingId, and form', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))

    act(() => {
      result.current.openEdit('edit-123', { name: 'Test', value: 'val' })
    })
    expect(result.current.dialogOpen).toBe(true)

    act(() => {
      result.current.closeDialog()
    })

    expect(result.current.dialogOpen).toBe(false)
    expect(result.current.editingId).toBeNull()
    expect(result.current.form).toEqual(emptyForm)
  })

  it('closeDelete resets deleteDialogOpen, deletingId, and usedInPrompts', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))

    act(() => {
      result.current.openDelete('del-789', ['Project X'])
    })
    expect(result.current.deleteDialogOpen).toBe(true)

    act(() => {
      result.current.closeDelete()
    })

    expect(result.current.deleteDialogOpen).toBe(false)
    expect(result.current.deletingId).toBeNull()
    expect(result.current.usedInPrompts).toEqual([])
  })

  it('openView sets viewDialogOpen to true', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))

    act(() => {
      result.current.openView()
    })

    expect(result.current.viewDialogOpen).toBe(true)
  })

  it('closeView sets viewDialogOpen to false', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))

    act(() => {
      result.current.openView()
    })
    expect(result.current.viewDialogOpen).toBe(true)

    act(() => {
      result.current.closeView()
    })

    expect(result.current.viewDialogOpen).toBe(false)
  })

  it('setIsSaving updates isSaving state', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))

    act(() => {
      result.current.setIsSaving(true)
    })
    expect(result.current.isSaving).toBe(true)

    act(() => {
      result.current.setIsSaving(false)
    })
    expect(result.current.isSaving).toBe(false)
  })

  it('setIsDeleting updates isDeleting state', () => {
    const { result } = renderHook(() => useManagerState(emptyForm))

    act(() => {
      result.current.setIsDeleting(true)
    })
    expect(result.current.isDeleting).toBe(true)

    act(() => {
      result.current.setIsDeleting(false)
    })
    expect(result.current.isDeleting).toBe(false)
  })
})
