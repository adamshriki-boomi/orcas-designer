import type { Project } from '../types';

export function buildUserStoriesSection(project: Project): string {
  if (project.promptMode === 'lite') return '';

  const hasFigma = !!(project.figmaFileLink.urlValue || project.figmaFileLink.files.length > 0);

  const lines: string[] = [
    '## USER STORIES',
    '',
    'Derive user stories from the context available in this prompt and any accessible URLs. If feature documentation is inaccessible, base stories on the prototype interactions and embedded company context. Aim for 10-20 stories covering all feature requirements, each with 2-4 acceptance criteria:',
    '',
    '- Format each story as: "As a [type of user], I want [goal] so that [benefit]"',
    '- Group stories by feature area or user journey',
    '- Include acceptance criteria for each story',
    '- Create an organized user stories document/page',
    '- Link each user story to its relevant HTML file/screen in the prototype output',
    '- Prioritize stories based on the feature requirements provided',
    '- Save as `./output/user-stories.html` as a standalone HTML page linked from the prototype navigation. Also save `./assets/user-stories.md` as a machine-readable reference for future sprint planning.',
  ];

  if (hasFigma) {
    lines.push('- If Figma output is also produced, additionally note the Figma frame reference');
  }

  return lines.join('\n');
}
