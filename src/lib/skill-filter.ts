import type { Project } from './types';
import type { MandatorySkill } from './constants';
import { MANDATORY_SKILLS } from './constants';
import { isFigmaUrl } from './prompt-sections/url-utils';

export function getActiveSkillsForProject(project: Project): MandatorySkill[] {
  const hasFigma = !!(project.figmaFileLink.urlValue || project.figmaFileLink.files.length > 0);
  const hasDesignFigma = !!(project.designSystemFigma.urlValue || project.designSystemFigma.files.length > 0);
  const hasSourceFigma = !!(
    project.currentImplementation.figmaLinks.length > 0 ||
    project.designSystemFigma.urlValue ||
    project.designSystemFigma.files.length > 0 ||
    (project.prototypeSketches.urlValue && isFigmaUrl(project.prototypeSketches.urlValue))
  );
  const isAddOnTop = project.currentImplementation.implementationMode === 'add-on-top';
  return MANDATORY_SKILLS.filter(skill => {
    switch (skill.includeCondition) {
      case 'always': return true;
      case 'hasFigma': return hasFigma;
      case 'hasSourceFigma': return hasSourceFigma;
      case 'hasDesignFigma': return hasDesignFigma;
      case 'isAddOnTop': return isAddOnTop;
      case 'never': return false;
    }
  });
}
