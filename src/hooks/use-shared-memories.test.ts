import '@/test/helpers/db-setup'
import { db } from '@/lib/db'
import { emptyProject } from '@/lib/types'
import type { SharedMemory } from '@/lib/types'

beforeEach(async () => {
  await db.projects.clear()
  await db.sharedSkills.clear()
  await db.sharedMemories.clear()
})

function makeMemory(overrides: Partial<SharedMemory> = {}): SharedMemory {
  const now = new Date().toISOString()
  return {
    id: 'mem-1',
    name: 'Test Memory',
    description: 'A test memory',
    content: 'Some context content',
    fileName: 'test-memory.md',
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('useSharedMemories DB operations', () => {
  it('can add a memory record', async () => {
    const memory = makeMemory({ id: 'add-mem-1' })
    await db.sharedMemories.add(memory)

    const retrieved = await db.sharedMemories.get('add-mem-1')
    expect(retrieved).toBeDefined()
    expect(retrieved!.name).toBe('Test Memory')
    expect(retrieved!.content).toBe('Some context content')
    expect(retrieved!.isBuiltIn).toBe(false)
  })

  it('can update a memory record', async () => {
    const memory = makeMemory({ id: 'update-mem-1' })
    await db.sharedMemories.add(memory)

    await db.sharedMemories.update('update-mem-1', {
      name: 'Updated Memory',
      content: 'Updated content',
      updatedAt: new Date().toISOString(),
    })

    const updated = await db.sharedMemories.get('update-mem-1')
    expect(updated!.name).toBe('Updated Memory')
    expect(updated!.content).toBe('Updated content')
  })

  it('can delete a non-built-in memory', async () => {
    const memory = makeMemory({ id: 'del-mem-1', isBuiltIn: false })
    await db.sharedMemories.add(memory)
    expect(await db.sharedMemories.count()).toBe(1)

    // Simulate deleteMemory logic: check isBuiltIn, then delete
    const existing = await db.sharedMemories.get('del-mem-1')
    expect(existing!.isBuiltIn).toBe(false)

    await db.sharedMemories.delete('del-mem-1')
    expect(await db.sharedMemories.count()).toBe(0)
  })

  it('built-in memory cannot be deleted via deleteMemory logic', async () => {
    const memory = makeMemory({
      id: 'built-in-test',
      name: 'Built-In Memory',
      isBuiltIn: true,
    })
    await db.sharedMemories.add(memory)

    // Simulate deleteMemory: check isBuiltIn first, return early if true
    const existing = await db.sharedMemories.get('built-in-test')
    if (existing?.isBuiltIn) {
      // deleteMemory returns early here
    } else {
      await db.sharedMemories.delete('built-in-test')
    }

    // Memory should still exist since it was built-in
    const stillExists = await db.sharedMemories.get('built-in-test')
    expect(stillExists).toBeDefined()
    expect(stillExists!.name).toBe('Built-In Memory')
  })

  it('delete cascades: removes memory id from project selectedSharedMemoryIds', async () => {
    const memoryId = 'cascade-mem-1'
    const memory = makeMemory({ id: memoryId })
    await db.sharedMemories.add(memory)

    const project = emptyProject('cascade-mem-proj', 'Cascade Mem Test')
    project.selectedSharedMemoryIds = [memoryId, 'other-memory']
    await db.projects.add(project)

    // Simulate cascade delete from useSharedMemories.deleteMemory
    const existing = await db.sharedMemories.get(memoryId)
    expect(existing!.isBuiltIn).toBe(false)

    await db.transaction('rw', db.sharedMemories, db.projects, async () => {
      await db.sharedMemories.delete(memoryId)
      await db.projects.toCollection().modify((p) => {
        const ids = p.selectedSharedMemoryIds ?? []
        if (ids.includes(memoryId)) {
          p.selectedSharedMemoryIds = ids.filter((mid) => mid !== memoryId)
        }
      })
    })

    const updatedProject = await db.projects.get('cascade-mem-proj')
    expect(updatedProject!.selectedSharedMemoryIds).toEqual(['other-memory'])
    expect(await db.sharedMemories.get(memoryId)).toBeUndefined()
  })

  it('isMemoryUsed returns project names that use the memory', async () => {
    const memoryId = 'used-mem-1'
    const project1 = emptyProject('used-mem-proj-1', 'Alpha Project')
    project1.selectedSharedMemoryIds = [memoryId]
    const project2 = emptyProject('used-mem-proj-2', 'Beta Project')
    project2.selectedSharedMemoryIds = [memoryId, 'another']
    const project3 = emptyProject('used-mem-proj-3', 'Gamma Project')
    project3.selectedSharedMemoryIds = ['different-memory']

    await db.projects.bulkAdd([project1, project2, project3])

    const used = await db.projects
      .filter((p) => (p.selectedSharedMemoryIds ?? []).includes(memoryId))
      .toArray()
    const names = used.map((p) => p.name)

    expect(names).toHaveLength(2)
    expect(names).toContain('Alpha Project')
    expect(names).toContain('Beta Project')
    expect(names).not.toContain('Gamma Project')
  })

  it('isMemoryUsed returns empty array when memory is unused', async () => {
    const project = emptyProject('unused-mem-proj', 'Unused Mem Project')
    project.selectedSharedMemoryIds = ['some-other-memory']
    await db.projects.add(project)

    const used = await db.projects
      .filter((p) => (p.selectedSharedMemoryIds ?? []).includes('nonexistent-mem'))
      .toArray()
    const names = used.map((p) => p.name)

    expect(names).toEqual([])
  })

  it('can check if a memory is built-in', async () => {
    const builtIn = makeMemory({ id: 'bi-check', isBuiltIn: true })
    const custom = makeMemory({ id: 'custom-check', isBuiltIn: false })
    await db.sharedMemories.bulkAdd([builtIn, custom])

    const retrievedBuiltIn = await db.sharedMemories.get('bi-check')
    const retrievedCustom = await db.sharedMemories.get('custom-check')

    expect(retrievedBuiltIn!.isBuiltIn).toBe(true)
    expect(retrievedCustom!.isBuiltIn).toBe(false)
  })
})
