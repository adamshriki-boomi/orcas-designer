import '@/test/helpers/db-setup'
import { db } from './db'
import { emptyProject } from './types'
import { createTestSharedMemory } from '@/test/helpers/project-fixtures'

beforeEach(async () => {
  await db.projects.clear()
  await db.sharedSkills.clear()
  await db.sharedMemories.clear()
})

describe('db tables', () => {
  it('projects table exists and is writable', async () => {
    const project = emptyProject('db-test-1', 'DB Test')
    const id = await db.projects.add(project)
    expect(id).toBe('db-test-1')
  })

  it('sharedSkills table exists and is writable', async () => {
    const now = new Date().toISOString()
    const id = await db.sharedSkills.add({
      id: 'skill-db-1',
      name: 'Test Skill',
      description: 'A skill for testing',
      type: 'url',
      urlValue: 'https://example.com',
      fileContent: null,
      createdAt: now,
      updatedAt: now,
    })
    expect(id).toBe('skill-db-1')
  })

  it('sharedMemories table exists and is writable', async () => {
    const memory = createTestSharedMemory({ id: 'mem-db-1' })
    const id = await db.sharedMemories.add(memory)
    expect(id).toBe('mem-db-1')
  })

  it('can add and retrieve a project', async () => {
    const project = emptyProject('proj-retrieve', 'Retrieve Test')
    await db.projects.add(project)

    const retrieved = await db.projects.get('proj-retrieve')
    expect(retrieved).toBeDefined()
    expect(retrieved!.name).toBe('Retrieve Test')
    expect(retrieved!.outputType).toBe('static-only')
    expect(retrieved!.selectedSharedSkillIds).toEqual([])
  })

  it('can add and retrieve a shared memory', async () => {
    const memory = createTestSharedMemory({
      id: 'mem-retrieve',
      name: 'Retrieved Memory',
      content: 'Memory content here',
    })
    await db.sharedMemories.add(memory)

    const retrieved = await db.sharedMemories.get('mem-retrieve')
    expect(retrieved).toBeDefined()
    expect(retrieved!.name).toBe('Retrieved Memory')
    expect(retrieved!.content).toBe('Memory content here')
    expect(retrieved!.isBuiltIn).toBe(false)
  })
})
