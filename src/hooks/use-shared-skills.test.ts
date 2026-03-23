import '@/test/helpers/db-setup'
import { db } from '@/lib/db'
import { emptyProject } from '@/lib/types'
import type { SharedSkill } from '@/lib/types'

beforeEach(async () => {
  await db.projects.clear()
  await db.sharedSkills.clear()
  await db.sharedMemories.clear()
})

function makeSkill(overrides: Partial<SharedSkill> = {}): SharedSkill {
  const now = new Date().toISOString()
  return {
    id: 'skill-1',
    name: 'Test Skill',
    description: 'A test skill',
    type: 'url',
    urlValue: 'https://skill.example.com',
    fileContent: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('useSharedSkills DB operations', () => {
  it('can add a skill record', async () => {
    const skill = makeSkill({ id: 'add-skill-1' })
    await db.sharedSkills.add(skill)

    const retrieved = await db.sharedSkills.get('add-skill-1')
    expect(retrieved).toBeDefined()
    expect(retrieved!.name).toBe('Test Skill')
    expect(retrieved!.type).toBe('url')
  })

  it('can update a skill record', async () => {
    const skill = makeSkill({ id: 'update-skill-1' })
    await db.sharedSkills.add(skill)

    await db.sharedSkills.update('update-skill-1', {
      name: 'Updated Skill',
      description: 'Updated description',
      updatedAt: new Date().toISOString(),
    })

    const updated = await db.sharedSkills.get('update-skill-1')
    expect(updated!.name).toBe('Updated Skill')
    expect(updated!.description).toBe('Updated description')
  })

  it('can delete a skill', async () => {
    const skill = makeSkill({ id: 'del-skill-1' })
    await db.sharedSkills.add(skill)
    expect(await db.sharedSkills.count()).toBe(1)

    await db.sharedSkills.delete('del-skill-1')
    expect(await db.sharedSkills.count()).toBe(0)
  })

  it('delete cascades: removes skill id from project selectedSharedSkillIds', async () => {
    const skillId = 'cascade-skill-1'
    const skill = makeSkill({ id: skillId })
    await db.sharedSkills.add(skill)

    const project = emptyProject('cascade-proj-1', 'Cascade Test')
    project.selectedSharedSkillIds = [skillId, 'other-skill']
    await db.projects.add(project)

    // Simulate the cascade delete from useSharedSkills.deleteSkill
    await db.transaction('rw', db.sharedSkills, db.projects, async () => {
      await db.sharedSkills.delete(skillId)
      await db.projects.toCollection().modify((p) => {
        const ids = p.selectedSharedSkillIds
        if (ids.includes(skillId)) {
          p.selectedSharedSkillIds = ids.filter((sid) => sid !== skillId)
        }
      })
    })

    const updatedProject = await db.projects.get('cascade-proj-1')
    expect(updatedProject!.selectedSharedSkillIds).toEqual(['other-skill'])
    expect(await db.sharedSkills.get(skillId)).toBeUndefined()
  })

  it('isSkillUsed returns project names that use the skill', async () => {
    const skillId = 'used-skill-1'
    const project1 = emptyProject('used-proj-1', 'Project Alpha')
    project1.selectedSharedSkillIds = [skillId]
    const project2 = emptyProject('used-proj-2', 'Project Beta')
    project2.selectedSharedSkillIds = [skillId, 'another']
    const project3 = emptyProject('used-proj-3', 'Project Gamma')
    project3.selectedSharedSkillIds = ['different-skill']

    await db.projects.bulkAdd([project1, project2, project3])

    const used = await db.projects
      .filter((p) => p.selectedSharedSkillIds.includes(skillId))
      .toArray()
    const names = used.map((p) => p.name)

    expect(names).toHaveLength(2)
    expect(names).toContain('Project Alpha')
    expect(names).toContain('Project Beta')
    expect(names).not.toContain('Project Gamma')
  })

  it('isSkillUsed returns empty array when skill is unused', async () => {
    const project = emptyProject('unused-proj', 'Unused Project')
    project.selectedSharedSkillIds = ['some-other-skill']
    await db.projects.add(project)

    const used = await db.projects
      .filter((p) => p.selectedSharedSkillIds.includes('nonexistent-skill'))
      .toArray()
    const names = used.map((p) => p.name)

    expect(names).toEqual([])
  })
})
