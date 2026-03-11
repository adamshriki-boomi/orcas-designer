import type { Project } from '../types';

const MOTION_DESCRIPTIONS: Record<string, string> = {
  'none': 'No animations or transitions',
  'subtle': 'Minimal, functional animations (fades, subtle slides)',
  'expressive': 'Rich animations, playful transitions, micro-interactions',
};

const RADIUS_DESCRIPTIONS: Record<string, string> = {
  'sharp': '0-2px border radius',
  'rounded': '4-8px border radius',
  'pill': '999px fully rounded borders',
};

export function buildDesignDirectionSection(project: Project): string {
  const dd = project.designDirection;
  if (!dd) return '';

  const hasAnyValue = dd.primaryColor || dd.fontFamily || dd.motionStyle !== 'none' || dd.borderRadiusStyle !== 'sharp';
  if (!hasAnyValue) return '';

  const lines: string[] = ['## DESIGN DIRECTION'];

  if (dd.primaryColor) {
    lines.push(`- **Primary Brand Color**: ${dd.primaryColor}`);
  }
  if (dd.fontFamily) {
    lines.push(`- **Font Family**: ${dd.fontFamily}`);
  }
  lines.push(`- **Motion Style**: ${dd.motionStyle} — ${MOTION_DESCRIPTIONS[dd.motionStyle]}`);
  lines.push(`- **Border Radius**: ${dd.borderRadiusStyle} — ${RADIUS_DESCRIPTIONS[dd.borderRadiusStyle]}`);

  return lines.join('\n');
}
