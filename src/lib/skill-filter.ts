import type { Prompt } from './types';
import type { MandatorySkill } from './constants';
import { MANDATORY_SKILLS } from './constants';
import { isFigmaUrl } from './url-utils';

export function getActiveSkillsForPrompt(project: Prompt): MandatorySkill[] {
  // Figma source = anywhere Claude can READ an existing Figma file from. The
  // user's Feature Information step is the only place that carries read-source
  // references now: existing-state Figma links or a Figma-hosted prototype URL.
  // (The Design Products step's `figmaDestinationUrl` is a WRITE target — not
  // a source — so it doesn't satisfy this condition.)
  const hasSourceFigma = !!(
    project.currentImplementation.figmaLinks.length > 0 ||
    (project.prototypeSketches.urlValue && isFigmaUrl(project.prototypeSketches.urlValue))
  );
  const isAddOnTop = project.currentImplementation.implementationMode === 'add-on-top';
  return MANDATORY_SKILLS.filter(skill => {
    switch (skill.includeCondition) {
      case 'always': return true;
      case 'hasSourceFigma': return hasSourceFigma;
      case 'isAddOnTop': return isAddOnTop;
      case 'never': return false;
    }
  });
}
