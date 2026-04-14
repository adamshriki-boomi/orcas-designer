import type { Prompt, SharedSkill } from '../types';
import { getActiveSkillsForPrompt } from '../skill-filter';

export function buildSkillsSection(project: Prompt, sharedSkills: SharedSkill[]): string {
  const lines: string[] = ['## 8. SKILLS TO USE'];

  // Filtered recommended skills grouped by category
  const activeSkills = getActiveSkillsForPrompt(project);
  const categories = [...new Set(activeSkills.map(s => s.category))];
  lines.push('### Recommended Skills');
  for (const category of categories) {
    lines.push(`\n**${category}**:`);
    const skills = activeSkills.filter(s => s.category === category);
    for (const skill of skills) {
      lines.push(`- \`${skill.invocation}\` — ${skill.description}`);
    }
  }

  // Shared skills
  const selectedShared = sharedSkills.filter(s =>
    project.selectedSharedSkillIds.includes(s.id)
  );
  if (selectedShared.length > 0) {
    lines.push('\n### Shared Skills');
    for (const skill of selectedShared) {
      if (skill.type === 'url' && skill.urlValue) {
        lines.push(`- **${skill.name}**: ${skill.urlValue}`);
      } else if (skill.type === 'file' && skill.fileContent) {
        lines.push(`- **${skill.name}**: (file: ${skill.fileContent.name})`);
      }
      if (skill.description) {
        lines.push(`  ${skill.description}`);
      }
    }
  }

  // Custom skills
  if (project.customSkills.length > 0) {
    lines.push('\n### Custom Skills');
    for (const skill of project.customSkills) {
      if (skill.type === 'url' && skill.urlValue) {
        lines.push(`- **${skill.name}**: ${skill.urlValue}`);
      } else if (skill.type === 'file' && skill.fileContent) {
        lines.push(`- **${skill.name}**: (file: ${skill.fileContent.name})`);
      }
    }
  }

  return lines.join('\n');
}
