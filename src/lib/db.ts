import Dexie, { type EntityTable } from 'dexie';
import type { Project, SharedSkill, SharedMemory, InteractionLevel } from './types';

const db = new Dexie('OrcasDesignerDB') as Dexie & {
  projects: EntityTable<Project, 'id'>;
  sharedSkills: EntityTable<SharedSkill, 'id'>;
  sharedMemories: EntityTable<SharedMemory, 'id'>;
};

db.version(1).stores({
  projects: 'id, name, updatedAt',
  sharedSkills: 'id, name',
});

db.version(2).stores({
  sharedMemories: 'id, name',
});

db.version(3).stores({}).upgrade((tx) => {
  // Cast to Record<string, unknown> because the schema at migration time may not
  // match the current Project type — old rows lack new fields being added here.
  return tx.table('projects').toCollection().modify((project: Record<string, unknown>) => {
    // Map old outputType to new interactionLevel
    const outputType = project.outputType as string;
    let interactionLevel: InteractionLevel = 'static';
    if (outputType === 'static-and-interactive') {
      interactionLevel = 'full-prototype';
    }
    project.interactionLevel = interactionLevel;
    project.outputDirectory = './output/';
    project.accessibilityLevel = 'none';
    project.externalResourcesAccessible = true;
    project.browserCompatibility = ['chrome'];
    project.promptMode = 'comprehensive';
    project.designDirection = null;
  });
});

db.version(4).stores({}).upgrade((tx) => {
  return tx.table('projects').toCollection().modify((project: Record<string, unknown>) => {
    if (project.regenerationCount === undefined) {
      project.regenerationCount = 0;
    }
  });
});

db.version(5).stores({}).upgrade((tx) => {
  return tx.table('projects').toCollection().modify((project: Record<string, unknown>) => {
    if (project.uxResearch === undefined) {
      project.uxResearch = { inputType: 'url', urlValue: '', textValue: '', files: [], additionalContext: '' };
    }
  });
});

db.version(6).stores({}).upgrade((tx) => {
  return tx.table('projects').toCollection().modify((project: Record<string, unknown>) => {
    if (project.uxWriting === undefined) {
      project.uxWriting = { inputType: 'url', urlValue: '', textValue: '', files: [], additionalContext: '' };
    }
  });
});

export { db };
