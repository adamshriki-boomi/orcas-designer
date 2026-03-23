import '@/test/helpers/db-setup'
import { db } from '@/lib/db'
import { emptyProject } from '@/lib/types'
import { generateId } from '@/lib/id'

beforeEach(async () => {
  await db.projects.clear()
  await db.sharedSkills.clear()
  await db.sharedMemories.clear()
})

describe('useProjects DB operations', () => {
  it('can add a project to db.projects', async () => {
    const id = generateId()
    const project = emptyProject(id, 'New Project')
    await db.projects.add(project)

    const count = await db.projects.count()
    expect(count).toBe(1)
  })

  it('can retrieve projects ordered by updatedAt', async () => {
    const project1 = emptyProject('p1', 'First')
    project1.updatedAt = '2025-01-01T00:00:00.000Z'
    const project2 = emptyProject('p2', 'Second')
    project2.updatedAt = '2025-06-01T00:00:00.000Z'
    const project3 = emptyProject('p3', 'Third')
    project3.updatedAt = '2025-03-01T00:00:00.000Z'

    await db.projects.bulkAdd([project1, project2, project3])

    const ordered = await db.projects.orderBy('updatedAt').reverse().toArray()
    expect(ordered).toHaveLength(3)
    expect(ordered[0].name).toBe('Second')
    expect(ordered[1].name).toBe('Third')
    expect(ordered[2].name).toBe('First')
  })

  it('can delete a project', async () => {
    const project = emptyProject('del-1', 'To Delete')
    await db.projects.add(project)
    expect(await db.projects.count()).toBe(1)

    await db.projects.delete('del-1')
    expect(await db.projects.count()).toBe(0)
  })

  it('deleting a non-existent project does not throw', async () => {
    await expect(db.projects.delete('nonexistent-id')).resolves.not.toThrow()
  })

  it('project has correct default fields from emptyProject', async () => {
    const project = emptyProject('defaults-1', 'Defaults Check')
    await db.projects.add(project)

    const retrieved = await db.projects.get('defaults-1')
    expect(retrieved).toBeDefined()
    expect(retrieved!.interactionLevel).toBe('static')
    expect(retrieved!.outputDirectory).toBe('./output/')
    expect(retrieved!.accessibilityLevel).toBe('none')
    expect(retrieved!.externalResourcesAccessible).toBe(true)
    expect(retrieved!.browserCompatibility).toEqual(['chrome'])
    expect(retrieved!.promptMode).toBe('comprehensive')
    expect(retrieved!.designDirection).toBeNull()
    expect(retrieved!.customSkills).toEqual([])
    expect(retrieved!.customMemories).toEqual([])
    expect(retrieved!.regenerationCount).toBe(0)
    expect(retrieved!.generatedPrompt).toBe('')
  })
})
